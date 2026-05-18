/**
 * Creates a Vercel production deployment from the connected GitHub repo.
 * Use when deploy hooks return 200 but production stays on an old commit.
 *
 * Env: VERCEL_TOKEN, VERCEL_PROJECT_ID, GITHUB_REF_NAME (e.g. master)
 * Optional: VERCEL_TEAM_ID (auto via resolve-vercel-scope if run first)
 */

import { appendFileSync } from "node:fs";

const token = process.env.VERCEL_TOKEN?.trim();
const projectId = process.env.VERCEL_PROJECT_ID?.trim();
const ref = process.env.GITHUB_REF_NAME?.trim() || "master";
const orgId = process.env.VERCEL_TEAM_ID?.trim() || "";

const GITHUB_ORG = "diazitesai-dotcom";
const GITHUB_REPO = "Diazites";

if (!token || !projectId) {
  console.error("Need VERCEL_TOKEN and VERCEL_PROJECT_ID");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

async function resolveScope() {
  if (orgId) return orgId;
  const personal = await fetch(`https://api.vercel.com/v9/projects/${projectId}`, {
    headers,
  });
  if (personal.ok) {
    const p = await personal.json();
    return p.accountId || "";
  }
  const teamsRes = await fetch("https://api.vercel.com/v2/teams", { headers });
  const teams = (await teamsRes.json()).teams ?? [];
  for (const team of teams) {
    const r = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}?teamId=${team.id}`,
      { headers },
    );
    if (r.ok) return team.id;
  }
  throw new Error("Could not resolve Vercel team/account for project");
}

async function main() {
  const teamId = await resolveScope();
  const projectRes = await fetch(
    `https://api.vercel.com/v9/projects/${projectId}${teamId ? `?teamId=${teamId}` : ""}`,
    { headers },
  );
  if (!projectRes.ok) {
    throw new Error(`Project lookup failed: ${projectRes.status}`);
  }
  const project = await projectRes.json();

  const body = {
    name: project.name,
    project: projectId,
    target: "production",
    gitSource: {
      type: "github",
      org: GITHUB_ORG,
      repo: GITHUB_REPO,
      ref,
    },
  };

  const url = teamId
    ? `https://api.vercel.com/v13/deployments?teamId=${teamId}`
    : "https://api.vercel.com/v13/deployments";

  console.log("Creating production deployment from GitHub:", `${GITHUB_ORG}/${GITHUB_REPO}@${ref}`);

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(JSON.stringify(data, null, 2));
    throw new Error(
      data.error?.message ||
        `Deploy API failed (${res.status}). Connect GitHub in Vercel → Settings → Git.`,
    );
  }

  const deploymentUrl = data.url || data.alias?.[0] || "(see Vercel dashboard)";
  console.log("Deployment created:", data.id);
  console.log("URL:", deploymentUrl);
  console.log("Status:", data.readyState || data.status);

  const out = process.env.GITHUB_OUTPUT;
  if (out) {
    appendFileSync(out, `deployment_id=${data.id}\n`);
    appendFileSync(out, `deployment_url=${deploymentUrl}\n`);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

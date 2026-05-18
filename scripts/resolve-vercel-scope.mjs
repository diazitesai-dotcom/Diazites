/**
 * Finds which Vercel account/team owns a project. Used in CI so you don't need
 * to guess VERCEL_ORG_ID.
 *
 * Usage:
 *   VERCEL_TOKEN=... VERCEL_PROJECT_ID=prj_... node scripts/resolve-vercel-scope.mjs
 *
 * Writes GitHub Actions outputs when GITHUB_OUTPUT is set.
 */

const token = process.env.VERCEL_TOKEN?.trim();
const projectId = process.env.VERCEL_PROJECT_ID?.trim();

if (!token || !projectId) {
  console.error("Need VERCEL_TOKEN and VERCEL_PROJECT_ID");
  process.exit(1);
}

const headers = { Authorization: `Bearer ${token}` };

async function getJson(url) {
  const res = await fetch(url, { headers });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

async function findProject() {
  const personal = await getJson(
    `https://api.vercel.com/v9/projects/${projectId}`,
  );
  if (personal.ok) {
    const accountId = personal.body.accountId;
    if (!accountId) {
      throw new Error("Project found on personal account but accountId missing");
    }
    return {
      orgId: accountId,
      scopeMode: "personal",
      teamSlug: null,
      projectName: personal.body.name,
    };
  }

  const teamsRes = await getJson("https://api.vercel.com/v2/teams");
  const teams = teamsRes.body?.teams ?? [];

  for (const team of teams) {
    const scoped = await getJson(
      `https://api.vercel.com/v9/projects/${projectId}?teamId=${team.id}`,
    );
    if (scoped.ok) {
      return {
        orgId: team.id,
        scopeMode: "team",
        teamSlug: team.slug ?? null,
        projectName: scoped.body.name,
      };
    }
  }

  console.error("Project not found. Teams checked:", teams.length);
  console.error("Personal lookup HTTP:", personal.status, JSON.stringify(personal.body));
  throw new Error(
    `Project ${projectId} not found. Check VERCEL_PROJECT_ID and that the token has access.`,
  );
}

async function main() {
  const info = await findProject();
  console.log("Resolved Vercel scope:");
  console.log(JSON.stringify(info, null, 2));

  const out = process.env.GITHUB_OUTPUT;
  if (out) {
    const { appendFileSync } = await import("node:fs");
    appendFileSync(out, `org_id=${info.orgId}\n`);
    appendFileSync(out, `scope_mode=${info.scopeMode}\n`);
    appendFileSync(out, `team_slug=${info.teamSlug ?? ""}\n`);
    appendFileSync(out, `project_name=${info.projectName ?? ""}\n`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

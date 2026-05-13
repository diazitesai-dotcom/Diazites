import { formatDistanceToNow } from "date-fns";

import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createAuditLogRepository, type AuditLogRow } from "@/repositories/cross-cutting.repository";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const { supabase } = await requireAdmin();

  const repo = createAuditLogRepository(supabase);
  const { data } = await repo.listAll(300);
  const rows = (data ?? []) as AuditLogRow[];

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-6 py-10">
      <PageHeader
        eyebrow="Admin"
        title="Audit log"
        description="Every meaningful mutation across the platform, newest first."
      />

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">Action</th>
              <th className="px-3 py-2 font-medium">Target</th>
              <th className="px-3 py-2 font-medium">Actor</th>
              <th className="px-3 py-2 font-medium">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No audit events recorded yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-border/40 align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{r.action}</td>
                  <td className="px-3 py-2 text-xs">
                    {r.target_kind ? (
                      <>
                        <span className="font-mono">{r.target_kind}</span>
                        {r.target_id ? (
                          <span className="ml-2 text-muted-foreground">
                            {r.target_id.slice(0, 12)}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {r.actor_user_id ? r.actor_user_id.slice(0, 8) : "system"}
                  </td>
                  <td className="px-3 py-2 max-w-md">
                    {Object.keys(r.metadata ?? {}).length > 0 ? (
                      <pre className="overflow-x-auto rounded-md bg-muted/30 p-2 font-mono text-[11px] text-muted-foreground">
                        {JSON.stringify(r.metadata, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

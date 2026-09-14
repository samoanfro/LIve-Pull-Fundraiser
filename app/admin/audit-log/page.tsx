import { getCurrentOrgContext } from "@/lib/auth/current-org";
import { isAdminRole } from "@/lib/permissions/roles";

export default async function AuditLogPage() {
  const context = await getCurrentOrgContext();
  if (!context || !isAdminRole(context.role)) return null;

  const { data: entries } = await context.supabase
    .from("audit_logs")
    .select(
      "id, action, entity_type, entity_id, previous_value, new_value, reason, created_at, actor_user_id, profiles(email)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Audit History
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Append-only record of sensitive actions. Most recent 200 entries.
      </p>

      <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800">
        {entries?.map((entry) => {
          const actor = entry.profiles as unknown as {
            email: string;
          } | null;
          return (
            <li key={entry.id} className="py-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {entry.action.replaceAll("_", " ")}
                </p>
                <p className="text-sm text-zinc-500">
                  {new Date(entry.created_at).toLocaleString()}
                </p>
              </div>
              <p className="text-sm text-zinc-500">
                {entry.entity_type} &middot; {entry.entity_id.slice(0, 8)}{" "}
                &middot; {actor?.email ?? "system"}
              </p>
              {entry.reason && (
                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                  Reason: {entry.reason}
                </p>
              )}
              {(entry.previous_value || entry.new_value) && (
                <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                  {entry.previous_value && (
                    <pre className="overflow-x-auto rounded-md bg-zinc-100 p-2 dark:bg-zinc-900">
                      before: {JSON.stringify(entry.previous_value, null, 2)}
                    </pre>
                  )}
                  {entry.new_value && (
                    <pre className="overflow-x-auto rounded-md bg-zinc-100 p-2 dark:bg-zinc-900">
                      after: {JSON.stringify(entry.new_value, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </li>
          );
        })}
        {entries?.length === 0 && (
          <li className="py-3 text-sm text-zinc-500">
            No audit history yet.
          </li>
        )}
      </ul>
    </div>
  );
}

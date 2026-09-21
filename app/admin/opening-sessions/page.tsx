import Link from "next/link";
import { getCurrentOrgContext } from "@/lib/auth/current-org";
import { SessionForm } from "./session-form";
import { LIVE_HOSTS } from "@/lib/live-hosts";

export default async function OpeningSessionsPage() {
  const context = await getCurrentOrgContext();
  if (!context) return null;

  const { data: sessions } = await context.supabase
    .from("opening_sessions")
    .select("id, status, host_key, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Opening Sessions
      </h1>

      <div className="mt-6">
        <SessionForm />
      </div>

      <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        {sessions?.map((session) => (
          <li key={session.id} className="py-3">
            <Link
              href={`/admin/opening-sessions/${session.id}`}
              className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50"
            >
              Session {session.id.slice(0, 8)}
            </Link>
            <p className="text-sm text-zinc-500">
              {LIVE_HOSTS.find((host) => host.key === session.host_key)?.name ?? "Live Pull"} · {session.status}
            </p>
          </li>
        ))}
        {sessions?.length === 0 && (
          <li className="py-3 text-sm text-zinc-500">
            No opening sessions yet.
          </li>
        )}
      </ul>
    </div>
  );
}

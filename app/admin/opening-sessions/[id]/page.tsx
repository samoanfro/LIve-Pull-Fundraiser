import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentOrgContext } from "@/lib/auth/current-org";
import { getEligibleOrderItems } from "../actions";
import { AddToQueue } from "./add-to-queue";

export default async function OpeningSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await getCurrentOrgContext();
  if (!context) return null;

  const { data: session } = await context.supabase
    .from("opening_sessions")
    .select("id, status, livestream_url")
    .eq("id", id)
    .maybeSingle();

  if (!session) {
    notFound();
  }

  const { data: queue } = await context.supabase
    .from("opening_queue")
    .select(
      "id, sequence_number, queue_status, inventory_units(pack_id), order_id",
    )
    .eq("opening_session_id", id)
    .order("sequence_number");

  const eligibleItems = await getEligibleOrderItems();

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Opening Session {id.slice(0, 8)}
      </h1>
      <p className="text-sm text-zinc-500">{session.status}</p>

      <Link
        href={`/admin/opening-sessions/${id}/host`}
        className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
      >
        Open Host Console
      </Link>

      <h2 className="mt-8 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Add to Queue
      </h2>
      <div className="mt-2">
        <AddToQueue sessionId={id} eligibleItems={eligibleItems} />
      </div>

      <h2 className="mt-8 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Queue
      </h2>
      <ul className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800">
        {queue?.map((entry) => {
          const unit = entry.inventory_units as unknown as {
            pack_id: string;
          } | null;
          return (
            <li key={entry.id} className="flex justify-between py-3">
              <span className="font-mono text-sm">{unit?.pack_id}</span>
              <span className="text-sm text-zinc-500">
                {entry.queue_status}
              </span>
            </li>
          );
        })}
        {queue?.length === 0 && (
          <li className="py-3 text-sm text-zinc-500">
            Queue is empty. Add an order above.
          </li>
        )}
      </ul>
    </div>
  );
}

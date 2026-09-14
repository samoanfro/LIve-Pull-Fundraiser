"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addOrderItemToQueueAction, type EligibleOrderItem } from "../actions";

export function AddToQueue({
  sessionId,
  eligibleItems,
}: {
  sessionId: string;
  eligibleItems: EligibleOrderItem[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (eligibleItems.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No paid, pack-assigned orders are waiting to be queued.
      </p>
    );
  }

  function handleAdd() {
    if (!selected) return;
    setError("");
    startTransition(async () => {
      const result = await addOrderItemToQueueAction(sessionId, selected);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSelected("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">Select an order to queue</option>
        {eligibleItems.map((item) => (
          <option key={item.id} value={item.id}>
            {item.pack_id} — {item.product_name} — {item.customer_email}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleAdd}
        disabled={!selected || pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? "Adding..." : "Add to Queue"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

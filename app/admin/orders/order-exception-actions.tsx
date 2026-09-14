"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordRefundAction, markOrderDisputedAction } from "./actions";

export function OrderExceptionActions({
  orderId,
  totalCents,
}: {
  orderId: string;
  totalCents: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<"refund" | "dispute" | null>(null);
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState((totalCents / 100).toFixed(2));
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submitRefund() {
    setError("");
    startTransition(async () => {
      const result = await recordRefundAction(orderId, {
        amountCents: Math.round(Number(amount) * 100),
        finalStatus: "REFUNDED",
        reason,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(null);
      router.refresh();
    });
  }

  function submitDispute() {
    setError("");
    startTransition(async () => {
      const result = await markOrderDisputedAction(orderId, reason);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(null);
      router.refresh();
    });
  }

  if (open === "refund") {
    return (
      <div className="flex flex-col gap-2">
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-28 rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          placeholder="Reason (required)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-56 rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={submitRefund}
            disabled={pending}
            className="rounded-md bg-zinc-900 px-3 py-1 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            Confirm Refund
          </button>
          <button
            type="button"
            onClick={() => setOpen(null)}
            className="rounded-md border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (open === "dispute") {
    return (
      <div className="flex flex-col gap-2">
        <input
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-56 rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={submitDispute}
            disabled={pending}
            className="rounded-md bg-zinc-900 px-3 py-1 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            Confirm Dispute
          </button>
          <button
            type="button"
            onClick={() => setOpen(null)}
            className="rounded-md border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen("refund");
        }}
        className="text-sm font-medium text-zinc-700 underline underline-offset-2 dark:text-zinc-300"
      >
        Record Refund
      </button>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen("dispute");
        }}
        className="text-sm font-medium text-zinc-700 underline underline-offset-2 dark:text-zinc-300"
      >
        Mark Disputed
      </button>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateShippingFulfillmentAction } from "./actions";

const STATUSES = [
  "REQUESTED",
  "ADDRESS_CONFIRMED",
  "LABEL_CREATED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "EXCEPTION",
];

export function ShippingRow({
  id,
  customerEmail,
  status,
  carrier,
  trackingNumber,
}: {
  id: string;
  customerEmail: string;
  status: string;
  carrier: string | null;
  trackingNumber: string | null;
}) {
  const router = useRouter();
  const [newStatus, setNewStatus] = useState(status);
  const [carrierInput, setCarrierInput] = useState(carrier ?? "");
  const [trackingInput, setTrackingInput] = useState(trackingNumber ?? "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleUpdate() {
    setError("");
    startTransition(async () => {
      const result = await updateShippingFulfillmentAction(id, {
        status: newStatus,
        carrier: carrierInput,
        trackingNumber: trackingInput,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-zinc-900 dark:text-zinc-50">
          {customerEmail}
        </p>
        <p className="text-sm text-zinc-500">{status}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          className="rounded-md border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          placeholder="Carrier"
          value={carrierInput}
          onChange={(e) => setCarrierInput(e.target.value)}
          className="w-28 rounded-md border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          placeholder="Tracking #"
          value={trackingInput}
          onChange={(e) => setTrackingInput(e.target.value)}
          className="w-36 rounded-md border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="button"
          onClick={handleUpdate}
          disabled={pending}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {pending ? "Saving..." : "Update"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </li>
  );
}

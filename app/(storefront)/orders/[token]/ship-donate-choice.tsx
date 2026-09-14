"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { chooseShipOrDonateAction } from "./actions";

export function ShipDonateChoice({
  token,
  orderId,
  status,
}: {
  token: string;
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function choose(choice: "ship" | "donate") {
    setError("");
    startTransition(async () => {
      const result = await chooseShipOrDonateAction(token, orderId, choice);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (status === "SHIP_REQUESTED") {
    return (
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        You chose to ship these items. Fulfillment isn&apos;t built yet, but
        you can still change your mind below.
      </p>
    );
  }
  if (status === "DONATE_BACK_SELECTED") {
    return (
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        You chose to donate these items back. Thank you! You can still change
        your mind below.
      </p>
    );
  }

  return (
    <div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        This decision applies to the physical items shown above.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => choose("ship")}
          disabled={pending}
          className="w-full rounded-md bg-zinc-900 px-4 py-3 text-base font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          Ship My Items
        </button>
        <button
          type="button"
          onClick={() => choose("donate")}
          disabled={pending}
          className="w-full rounded-md border border-zinc-300 px-4 py-3 text-base font-medium disabled:opacity-50 dark:border-zinc-700"
        >
          Donate Back
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

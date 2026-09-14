"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  confirmPackAction,
  addPulledItemAction,
  completeOpeningAction,
  type HostQueueEntry,
} from "../../actions";

export function HostConsole({
  sessionId,
  entries,
}: {
  sessionId: string;
  entries: HostQueueEntry[];
}) {
  const router = useRouter();
  const [enteredPackId, setEnteredPackId] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const [itemTitle, setItemTitle] = useState("");
  const [itemCategory, setItemCategory] = useState("");

  if (entries.length === 0) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        Nothing left in the queue. Add more orders from the session page.
      </p>
    );
  }

  const current = entries[0];
  const inConfirmedState =
    current.queueStatus === "in_progress" && current.openedPackId;

  async function handleConfirm() {
    setError("");
    setMismatch(false);
    setPending(true);
    const result = await confirmPackAction(current.queueId, enteredPackId);
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    if (!result.matched) {
      setMismatch(true);
      return;
    }
    setEnteredPackId("");
    router.refresh();
  }

  async function handleAddPulledItem() {
    if (!current.openedPackId) return;
    setError("");
    setPending(true);
    const result = await addPulledItemAction(current.openedPackId, {
      title: itemTitle,
      category: itemCategory || undefined,
    });
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setItemTitle("");
    setItemCategory("");
    router.refresh();
  }

  async function handleCompleteOpening() {
    if (!current.openedPackId) return;
    setError("");
    setPending(true);
    const result = await completeOpeningAction(
      current.openedPackId,
      sessionId,
    );
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm">
      <p className="text-sm text-zinc-500">
        Task {current.sequenceNumber} &middot; {entries.length} remaining
      </p>
      <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {current.productName}
      </p>
      <p className="text-sm text-zinc-500">{current.customerEmail}</p>

      {!inConfirmedState ? (
        <div className="mt-6 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">Expected Pack ID</p>
          <p className="mt-1 font-mono text-2xl text-zinc-900 dark:text-zinc-50">
            {current.expectedPackId}
          </p>

          <label className="mt-4 flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Confirm the physical Pack ID
            <input
              value={enteredPackId}
              onChange={(e) => setEnteredPackId(e.target.value)}
              placeholder="Enter or scan Pack ID"
              className="rounded-md border border-zinc-300 px-3 py-3 text-base font-mono dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>

          {mismatch && (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              Pack mismatch. Do not open this pack — verify you have the
              correct physical pack before trying again.
            </p>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending || !enteredPackId}
            className="mt-4 w-full rounded-md bg-zinc-900 px-4 py-3 text-base font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {pending ? "Confirming..." : "Confirm & Start Opening"}
          </button>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
          <p className="font-mono text-lg text-zinc-900 dark:text-zinc-50">
            {current.expectedPackId} — Opening
          </p>

          <ul className="mt-3 flex flex-col gap-1 text-sm">
            {current.pulledItems.map((item) => (
              <li key={item.id}>
                {item.title}
                {item.category ? ` (${item.category})` : ""}
              </li>
            ))}
            {current.pulledItems.length === 0 && (
              <li className="text-zinc-500">No pulls recorded yet.</li>
            )}
          </ul>

          <div className="mt-4 flex flex-col gap-2">
            <input
              value={itemTitle}
              onChange={(e) => setItemTitle(e.target.value)}
              placeholder="Item name"
              className="rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              value={itemCategory}
              onChange={(e) => setItemCategory(e.target.value)}
              placeholder="Category (optional)"
              className="rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              type="button"
              onClick={handleAddPulledItem}
              disabled={pending || !itemTitle.trim()}
              className="w-full rounded-md border border-zinc-300 px-4 py-3 text-base font-medium disabled:opacity-50 dark:border-zinc-700"
            >
              Add Pulled Item
            </button>
          </div>

          <button
            type="button"
            onClick={handleCompleteOpening}
            disabled={pending}
            className="mt-4 w-full rounded-md bg-zinc-900 px-4 py-3 text-base font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            Complete Opening
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

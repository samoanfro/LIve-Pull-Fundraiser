"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setDonationDispositionAction } from "./actions";

const DISPOSITIONS = [
  "RECEIVED_RETAINED",
  "STORED",
  "REUSED_IN_FUNDRAISER",
  "SOLD_SEPARATELY_WHERE_ALLOWED",
  "DONATED_EXTERNALLY",
  "DISPOSED",
  "OTHER_WITH_NOTE",
];

export function DonationRow({
  id,
  customerEmail,
  dispositionStatus,
}: {
  id: string;
  customerEmail: string;
  dispositionStatus: string | null;
}) {
  const router = useRouter();
  const [disposition, setDisposition] = useState(
    dispositionStatus ?? DISPOSITIONS[0],
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleUpdate() {
    setError("");
    startTransition(async () => {
      const result = await setDonationDispositionAction(
        id,
        disposition,
        note,
      );
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
        <p className="text-sm text-zinc-500">
          {dispositionStatus ?? "Pending disposition"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={disposition}
          onChange={(e) => setDisposition(e.target.value)}
          className="rounded-md border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {DISPOSITIONS.map((d) => (
            <option key={d} value={d}>
              {d.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <input
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-40 rounded-md border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
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

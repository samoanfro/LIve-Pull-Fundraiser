"use client";

import { useActionState } from "react";
import { createStorageLocationAction, type ActionState } from "./actions";

const initialState: ActionState = {};

export function StorageLocationForm() {
  const [state, formAction, pending] = useActionState(
    createStorageLocationAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 max-w-md">
      <input
        name="name"
        required
        placeholder="Name (e.g. Warehouse A, Shelf 3)"
        className="rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
      />
      <select
        name="type"
        required
        defaultValue=""
        className="rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="" disabled>
          Select type
        </option>
        <option value="warehouse">Warehouse</option>
        <option value="room">Room</option>
        <option value="shelf">Shelf</option>
        <option value="bin">Bin</option>
        <option value="case">Case</option>
      </select>
      <textarea
        name="notes"
        placeholder="Notes (optional)"
        rows={2}
        className="rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-3 text-base font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? "Creating..." : "Create Storage Location"}
      </button>
      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-green-700 dark:text-green-400">
          Storage location created.
        </p>
      )}
    </form>
  );
}

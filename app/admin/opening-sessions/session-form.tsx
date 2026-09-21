"use client";

import { useActionState } from "react";
import { createOpeningSessionAction, type ActionState } from "./actions";

const initialState: ActionState = {};

export function SessionForm() {
  const [state, formAction, pending] = useActionState(
    createOpeningSessionAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-3">
      <input
        name="livestream_url"
        type="url"
        inputMode="url"
        placeholder="YouTube live URL (optional)"
        className="rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-3 text-base font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? "Creating..." : "Create Opening Session"}
      </button>
      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}

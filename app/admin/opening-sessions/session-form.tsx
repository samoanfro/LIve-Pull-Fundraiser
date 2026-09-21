"use client";

import { useActionState } from "react";
import { createOpeningSessionAction, type ActionState } from "./actions";
import { LIVE_HOSTS } from "@/lib/live-hosts";

const initialState: ActionState = {};

export function SessionForm() {
  const [state, formAction, pending] = useActionState(
    createOpeningSessionAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-3">
      <label className="text-sm font-medium" htmlFor="host_key">Stream host</label>
      <select
        id="host_key"
        name="host_key"
        className="rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
      >
        {LIVE_HOSTS.map((host) => (
          <option key={host.key} value={host.key}>{host.name}</option>
        ))}
      </select>
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

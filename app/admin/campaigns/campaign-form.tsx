"use client";

import { useActionState } from "react";
import { createCampaignAction, type ActionState } from "./actions";

const initialState: ActionState = {};

export function CampaignForm() {
  const [state, formAction, pending] = useActionState(
    createCampaignAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 max-w-md">
      <input
        name="title"
        required
        placeholder="Campaign title"
        className="rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
      />
      <textarea
        name="description"
        placeholder="Description (optional)"
        rows={3}
        className="rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-3 text-base font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? "Creating..." : "Create Campaign"}
      </button>
      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-green-700 dark:text-green-400">
          Campaign created.
        </p>
      )}
    </form>
  );
}

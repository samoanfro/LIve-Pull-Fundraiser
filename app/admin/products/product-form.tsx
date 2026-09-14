"use client";

import { useActionState } from "react";
import { createProductAction, type ActionState } from "./actions";

const initialState: ActionState = {};

interface Campaign {
  id: string;
  title: string;
}

export function ProductForm({ campaigns }: { campaigns: Campaign[] }) {
  const [state, formAction, pending] = useActionState(
    createProductAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 max-w-md">
      <input
        name="name"
        required
        placeholder="Product name"
        className="rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
      />
      <input
        name="price"
        required
        type="number"
        min="0"
        step="0.01"
        placeholder="Price (USD, e.g. 29.00)"
        className="rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
      />
      <select
        name="campaign_id"
        defaultValue=""
        className="rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">No campaign</option>
        {campaigns.map((campaign) => (
          <option key={campaign.id} value={campaign.id}>
            {campaign.title}
          </option>
        ))}
      </select>
      <textarea
        name="description"
        placeholder="Description (optional)"
        rows={3}
        className="rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
      />
      <textarea
        name="disclosure_text"
        placeholder="Required disclosures shown on the product page (contents vary, opening method, shipping terms, refund policy, etc.)"
        rows={4}
        className="rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-3 text-base font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? "Creating..." : "Create Product"}
      </button>
      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-green-700 dark:text-green-400">
          Product created.
        </p>
      )}
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { setCampaignStatusAction } from "./actions";

export function CampaignStatusToggle({
  campaignId,
  status,
}: {
  campaignId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function toggle() {
    const next = status === "published" ? "draft" : "published";
    startTransition(async () => {
      const result = await setCampaignStatusAction(campaignId, next);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className="text-sm font-medium text-zinc-700 underline underline-offset-2 disabled:opacity-50 dark:text-zinc-300"
      >
        {status === "published" ? "Unpublish" : "Publish"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

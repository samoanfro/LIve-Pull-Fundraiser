import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CampaignsPage() {
  const supabase = await createClient();
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, slug, title, description")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Campaigns
      </h1>

      <ul className="mt-8 grid gap-6 sm:grid-cols-2">
        {campaigns?.map((campaign) => (
          <li key={campaign.id}>
            <Link
              href={`/campaigns/${campaign.slug}`}
              className="block rounded-lg border border-zinc-200 p-5 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
            >
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {campaign.title}
              </p>
              {campaign.description && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {campaign.description}
                </p>
              )}
            </Link>
          </li>
        ))}
        {campaigns?.length === 0 && (
          <li className="text-sm text-zinc-500">
            No campaigns are live yet — check back soon.
          </li>
        )}
      </ul>
    </div>
  );
}

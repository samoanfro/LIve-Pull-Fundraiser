import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { heading } from "@/lib/ui";

export default async function CampaignsPage() {
  const supabase = await createClient();
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, slug, title, description")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className={`${heading} text-2xl`}>Campaigns</h1>

      <ul className="mt-8 grid gap-6 sm:grid-cols-2">
        {campaigns?.map((campaign) => (
          <li key={campaign.id}>
            <Link
              href={`/campaigns/${campaign.slug}`}
              className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent"
            >
              <p className="font-semibold text-foreground">
                {campaign.title}
              </p>
              {campaign.description && (
                <p className="mt-1 text-sm text-muted">
                  {campaign.description}
                </p>
              )}
            </Link>
          </li>
        ))}
        {campaigns?.length === 0 && (
          <li className="text-sm text-muted">
            No campaigns are live yet — check back soon.
          </li>
        )}
      </ul>
    </div>
  );
}

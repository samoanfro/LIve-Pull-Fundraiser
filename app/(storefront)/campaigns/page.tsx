import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { heading } from "@/lib/ui";
import { ProductVisual } from "../product-visual";

export default async function CampaignsPage() {
  const supabase = await createClient();
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, slug, title, description")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="max-w-2xl">
        <p className="text-sm font-bold text-brand uppercase">Support a mission</p>
        <h1 className={`${heading} mt-2 text-3xl sm:text-4xl`}>Live campaigns</h1>
        <p className="mt-3 text-lg leading-8 text-muted">
          Choose a fundraiser, purchase a real collectible product, and follow
          your assigned pack from checkout through opening and fulfillment.
        </p>
      </div>

      <ul className="mt-10 grid gap-6 md:grid-cols-2">
        {campaigns?.map((campaign) => (
          <li key={campaign.id}>
            <Link
              href={`/campaigns/${campaign.slug}`}
              className="group block h-full overflow-hidden rounded-lg border border-border bg-surface transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg"
            >
              <ProductVisual name={campaign.title} compact />
              <div className="p-5 sm:p-6">
                <p className="text-xs font-bold text-success uppercase">Active campaign</p>
                <div className="mt-2 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {campaign.title}
                    </h2>
                    {campaign.description && (
                      <p className="mt-2 leading-7 text-muted">
                        {campaign.description}
                      </p>
                    )}
                  </div>
                  <span className="mt-1 text-xl text-brand transition group-hover:translate-x-1" aria-hidden="true">
                    →
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
        {campaigns?.length === 0 && (
          <li className="rounded-lg border border-dashed border-border px-6 py-10 text-center text-sm text-muted md:col-span-2">
            No campaigns are live yet. Check back soon.
          </li>
        )}
      </ul>
    </div>
  );
}

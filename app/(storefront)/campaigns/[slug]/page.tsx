import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { heading } from "@/lib/ui";
import { ProductVisual } from "../../product-visual";

// NOTE: campaign slugs are unique per-organization, not globally. With a
// single organization this is fine; multi-org public storefronts will need
// an org-scoped path (e.g. /o/[orgSlug]/campaigns/[slug]) before that
// matters in practice.
export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, title, description, beneficiary_statement")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!campaign) {
    notFound();
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, slug, name, price_cents, description")
    .eq("campaign_id", campaign.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return (
    <div>
      <Link href="/campaigns" className="text-sm font-semibold text-brand hover:underline">
        ← All campaigns
      </Link>
      <section className="mt-6 grid overflow-hidden rounded-lg bg-brand text-white lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
          <p className="text-sm font-bold text-[#8dd7dc] uppercase">Active fundraiser</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-5xl">{campaign.title}</h1>
          {campaign.description && (
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/80">
              {campaign.description}
            </p>
          )}
          {campaign.beneficiary_statement && (
            <p className="mt-5 border-t border-white/15 pt-5 text-sm leading-6 text-white/70">
              {campaign.beneficiary_statement}
            </p>
          )}
        </div>
        <ProductVisual name={campaign.title} />
      </section>

      <div className="mt-12 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-brand uppercase">Available now</p>
          <h2 className={`${heading} mt-2 text-2xl`}>Choose your product</h2>
        </div>
        <p className="hidden text-sm text-muted sm:block">Every purchase receives a permanent Pack ID.</p>
      </div>
      <ul className="mt-6 grid gap-6 sm:grid-cols-2">
        {products?.map((product) => (
          <li key={product.id}>
            <Link
              href={`/products/${product.slug}`}
              className="group block h-full overflow-hidden rounded-lg border border-border bg-surface transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg"
            >
              <ProductVisual name={product.name} compact />
              <div className="p-5">
                <p className="font-bold text-foreground">{product.name}</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-bold text-accent-text">
                    ${(product.price_cents / 100).toFixed(2)}
                  </p>
                  <span className="text-sm font-semibold text-brand transition group-hover:translate-x-1">
                    View product →
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
        {products?.length === 0 && (
          <li className="text-sm text-muted">
            No products are live in this campaign yet.
          </li>
        )}
      </ul>
    </div>
  );
}

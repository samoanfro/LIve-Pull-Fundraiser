import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { heading } from "@/lib/ui";

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
      <h1 className={`${heading} text-2xl`}>{campaign.title}</h1>
      {campaign.description && (
        <p className="mt-2 max-w-2xl text-muted">{campaign.description}</p>
      )}
      {campaign.beneficiary_statement && (
        <p className="mt-2 max-w-2xl text-sm text-muted">
          {campaign.beneficiary_statement}
        </p>
      )}

      <h2 className={`${heading} mt-10 text-lg`}>Products</h2>
      <ul className="mt-4 grid gap-6 sm:grid-cols-2">
        {products?.map((product) => (
          <li key={product.id}>
            <Link
              href={`/products/${product.slug}`}
              className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent"
            >
              <p className="font-semibold text-foreground">{product.name}</p>
              <p className="mt-1 text-sm font-medium text-accent">
                ${(product.price_cents / 100).toFixed(2)}
              </p>
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

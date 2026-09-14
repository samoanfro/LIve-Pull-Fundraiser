import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {campaign.title}
      </h1>
      {campaign.description && (
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          {campaign.description}
        </p>
      )}
      {campaign.beneficiary_statement && (
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          {campaign.beneficiary_statement}
        </p>
      )}

      <h2 className="mt-10 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Products
      </h2>
      <ul className="mt-4 grid gap-6 sm:grid-cols-2">
        {products?.map((product) => (
          <li key={product.id}>
            <Link
              href={`/products/${product.slug}`}
              className="block rounded-lg border border-zinc-200 p-5 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
            >
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {product.name}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                ${(product.price_cents / 100).toFixed(2)}
              </p>
            </Link>
          </li>
        ))}
        {products?.length === 0 && (
          <li className="text-sm text-zinc-500">
            No products are live in this campaign yet.
          </li>
        )}
      </ul>
    </div>
  );
}

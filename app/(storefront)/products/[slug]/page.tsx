import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddToCart } from "./add-to-cart";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      "id, organization_id, name, description, price_cents, contents_vary, disclosure_text",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!product) {
    notFound();
  }

  const { data: availableCount } = await supabase.rpc(
    "available_inventory_count",
    { target_product_id: product.id },
  );

  const soldOut = (availableCount ?? 0) <= 0;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {product.name}
      </h1>
      <p className="mt-2 text-xl text-zinc-900 dark:text-zinc-50">
        ${(product.price_cents / 100).toFixed(2)}
      </p>

      {product.description && (
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          {product.description}
        </p>
      )}

      <div className="mt-6">
        <AddToCart
          productId={product.id}
          organizationId={product.organization_id}
          name={product.name}
          priceCents={product.price_cents}
          soldOut={soldOut}
        />
      </div>

      {/* Required disclosures — PRODUCT_BUILD_SPEC.md §33 */}
      <div className="mt-10 rounded-lg border border-zinc-200 p-5 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
          What you&apos;re buying
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          <li>
            You are purchasing a real physical product for $
            {(product.price_cents / 100).toFixed(2)}.
          </li>
          <li>
            {product.contents_vary
              ? "Contents vary. You will receive the actual contents of the specific physical pack assigned to your order."
              : "This is a fixed-contents product."}
          </li>
          <li>
            Your assigned pack will be opened live or on recorded video, and
            the exact items pulled are attributed to you.
          </li>
          <li>
            After opening, you may choose to have your items shipped to you
            or donate them back to support the nonprofit.
          </li>
          <li>
            This is standard e-commerce, not a raffle, sweepstakes, or
            chance-based prize drawing.
          </li>
        </ul>
        {product.disclosure_text && (
          <p className="mt-4 whitespace-pre-wrap border-t border-zinc-200 pt-4 dark:border-zinc-800">
            {product.disclosure_text}
          </p>
        )}
      </div>
    </div>
  );
}

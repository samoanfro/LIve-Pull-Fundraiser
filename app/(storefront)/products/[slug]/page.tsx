import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddToCart } from "./add-to-cart";
import { heading, card } from "@/lib/ui";
import { ProductVisual } from "../../product-visual";

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
    <div className="mx-auto max-w-5xl">
      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="overflow-hidden rounded-lg">
          <ProductVisual name={product.name} />
        </div>

        <div className="lg:py-4">
          <p className={`text-sm font-bold uppercase ${soldOut ? "text-danger" : "text-success"}`}>
            {soldOut ? "Currently sold out" : `${availableCount} available`}
          </p>
          <h1 className={`${heading} mt-3 text-3xl sm:text-4xl`}>{product.name}</h1>
          <p className="mt-4 text-3xl font-bold text-accent-text">
            ${(product.price_cents / 100).toFixed(2)}
          </p>

          {product.description && (
            <p className="mt-5 text-lg leading-8 text-muted">{product.description}</p>
          )}

          <div className="mt-8">
            <AddToCart
              productId={product.id}
              organizationId={product.organization_id}
              name={product.name}
              priceCents={product.price_cents}
              soldOut={soldOut}
            />
          </div>

          <ul className="mt-6 grid gap-2 text-sm text-muted sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <li className="flex items-center gap-2"><span className="text-success">●</span> Permanent Pack ID</li>
            <li className="flex items-center gap-2"><span className="text-success">●</span> Recorded opening</li>
            <li className="flex items-center gap-2"><span className="text-success">●</span> Exact pulls tracked</li>
            <li className="flex items-center gap-2"><span className="text-success">●</span> Ship or donate back</li>
          </ul>
        </div>
      </div>

      {/* Required disclosures — PRODUCT_BUILD_SPEC.md §33 */}
      <div className={`${card} mt-12 text-sm text-muted`}>
        <h2 className="text-lg font-bold text-foreground">
          What you&apos;re buying
        </h2>
        <ul className="mt-4 grid gap-3 leading-6 md:grid-cols-2">
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
          <p className="mt-4 whitespace-pre-wrap border-t border-border pt-4">
            {product.disclosure_text}
          </p>
        )}
      </div>
    </div>
  );
}

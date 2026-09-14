import { getCurrentOrgContext } from "@/lib/auth/current-org";
import { ProductForm } from "./product-form";

export default async function ProductsPage() {
  const context = await getCurrentOrgContext();
  if (!context) return null;

  const [{ data: products }, { data: campaigns }] = await Promise.all([
    context.supabase
      .from("products")
      .select("id, name, price_cents, status")
      .order("created_at", { ascending: false }),
    context.supabase
      .from("campaigns")
      .select("id, title")
      .order("title"),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Products
      </h1>

      <div className="mt-6">
        <ProductForm campaigns={campaigns ?? []} />
      </div>

      <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        {products?.map((product) => (
          <li key={product.id} className="py-3">
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {product.name}
            </p>
            <p className="text-sm text-zinc-500">
              ${(product.price_cents / 100).toFixed(2)} &middot;{" "}
              {product.status}
            </p>
          </li>
        ))}
        {products?.length === 0 && (
          <li className="py-3 text-sm text-zinc-500">No products yet.</li>
        )}
      </ul>
    </div>
  );
}

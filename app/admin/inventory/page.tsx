import Link from "next/link";
import { getCurrentOrgContext } from "@/lib/auth/current-org";

export default async function InventoryPage() {
  const context = await getCurrentOrgContext();
  if (!context) return null;

  const { data: units } = await context.supabase
    .from("inventory_units")
    .select("id, pack_id, status, condition, products(name), storage_locations(name)")
    .order("received_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Inventory
        </h1>
        <Link
          href="/admin/inventory/receive"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
        >
          Receive Inventory
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
              <th className="py-2 pr-4">Pack ID</th>
              <th className="py-2 pr-4">Product</th>
              <th className="py-2 pr-4">Location</th>
              <th className="py-2 pr-4">Condition</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {units?.map((unit) => {
              const product = unit.products as unknown as {
                name: string;
              } | null;
              const location = unit.storage_locations as unknown as {
                name: string;
              } | null;
              return (
                <tr key={unit.id}>
                  <td className="py-2 pr-4 font-mono">{unit.pack_id}</td>
                  <td className="py-2 pr-4">{product?.name}</td>
                  <td className="py-2 pr-4">{location?.name}</td>
                  <td className="py-2 pr-4">{unit.condition}</td>
                  <td className="py-2 pr-4">{unit.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {units?.length === 0 && (
          <p className="py-3 text-sm text-zinc-500">
            No inventory received yet.
          </p>
        )}
      </div>
    </div>
  );
}

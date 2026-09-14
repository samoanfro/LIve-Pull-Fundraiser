import { getCurrentOrgContext } from "@/lib/auth/current-org";
import { OrderExceptionActions } from "./order-exception-actions";

export default async function OrdersPage() {
  const context = await getCurrentOrgContext();
  if (!context) return null;

  const { data: orders } = await context.supabase
    .from("orders")
    .select("id, status, total_cents, created_at, customers(email)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Orders
      </h1>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
              <th className="py-2 pr-4">Order</th>
              <th className="py-2 pr-4">Customer</th>
              <th className="py-2 pr-4">Total</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {orders?.map((order) => {
              const customer = order.customers as unknown as {
                email: string;
              } | null;
              return (
                <tr key={order.id}>
                  <td className="py-2 pr-4 font-mono">
                    {order.id.slice(0, 8)}
                  </td>
                  <td className="py-2 pr-4">{customer?.email}</td>
                  <td className="py-2 pr-4">
                    ${(order.total_cents / 100).toFixed(2)}
                  </td>
                  <td className="py-2 pr-4">{order.status}</td>
                  <td className="py-2 pr-4">
                    <OrderExceptionActions
                      orderId={order.id}
                      totalCents={order.total_cents}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {orders?.length === 0 && (
          <p className="py-3 text-sm text-zinc-500">No orders yet.</p>
        )}
      </div>
    </div>
  );
}

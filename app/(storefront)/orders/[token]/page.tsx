import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { ShipDonateChoice } from "./ship-donate-choice";

const DECISION_STATUSES = [
  "AWAITING_CUSTOMER_DECISION",
  "SHIP_REQUESTED",
  "DONATE_BACK_SELECTED",
];

export default async function MyPullsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createServiceRoleClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, email")
    .eq("guest_access_token", token)
    .gt("guest_token_expires_at", new Date().toISOString())
    .maybeSingle();

  if (!customer) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Link invalid or expired
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          This order link is no longer valid. If you completed a purchase
          recently, check the confirmation you received at checkout.
        </p>
      </div>
    );
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, total_cents, created_at")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  if (!orders || orders.length === 0) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          My Pulls
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          No orders found yet.
        </p>
      </div>
    );
  }

  const orderIds = orders.map((o) => o.id);

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("id, order_id, products(name)")
    .in("order_id", orderIds);

  const orderItemIds = (orderItems ?? []).map((oi) => oi.id);

  const [{ data: assignments }, { data: openedPacks }] = await Promise.all([
    orderItemIds.length
      ? supabase
          .from("order_inventory_assignments")
          .select("order_item_id, inventory_units(pack_id)")
          .in("order_item_id", orderItemIds)
      : Promise.resolve({ data: [] }),
    orderItemIds.length
      ? supabase
          .from("opened_packs")
          .select("id, order_item_id, status, opened_at")
          .in("order_item_id", orderItemIds)
      : Promise.resolve({ data: [] }),
  ]);

  const openedPackIds = (openedPacks ?? []).map((op) => op.id);

  const { data: pulledItems } = openedPackIds.length
    ? await supabase
        .from("pulled_items")
        .select("id, opened_pack_id, title, category, description")
        .in("opened_pack_id", openedPackIds)
    : { data: [] };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        My Pulls
      </h1>
      <p className="mt-1 text-sm text-zinc-500">{customer.email}</p>

      <div className="mt-8 flex flex-col gap-8">
        {orders.map((order) => {
          const items = (orderItems ?? []).filter(
            (oi) => oi.order_id === order.id,
          );

          return (
            <div
              key={order.id}
              className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  Order {order.id.slice(0, 8)}
                </p>
                <p className="text-sm text-zinc-500">{order.status}</p>
              </div>

              {items.map((item) => {
                const product = item.products as unknown as {
                  name: string;
                } | null;
                const assignment = assignments?.find(
                  (a) => a.order_item_id === item.id,
                );
                const unit = assignment?.inventory_units as unknown as {
                  pack_id: string;
                } | null;
                const openedPack = openedPacks?.find(
                  (op) => op.order_item_id === item.id,
                );
                const pulls = openedPack
                  ? (pulledItems ?? []).filter(
                      (p) => p.opened_pack_id === openedPack.id,
                    )
                  : [];

                return (
                  <div
                    key={item.id}
                    className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800"
                  >
                    <p className="text-sm text-zinc-500">
                      {product?.name} &middot;{" "}
                      <span className="font-mono">{unit?.pack_id}</span>
                    </p>

                    {openedPack ? (
                      <>
                        <p className="mt-2 text-sm text-zinc-500">
                          Opened{" "}
                          {openedPack.opened_at
                            ? new Date(
                                openedPack.opened_at,
                              ).toLocaleDateString()
                            : ""}
                        </p>
                        <ul className="mt-2 flex flex-col gap-1">
                          {pulls.map((pull) => (
                            <li
                              key={pull.id}
                              className="text-zinc-900 dark:text-zinc-50"
                            >
                              {pull.title}
                              {pull.category ? ` (${pull.category})` : ""}
                            </li>
                          ))}
                          {pulls.length === 0 && (
                            <li className="text-sm text-zinc-500">
                              No pulls recorded yet.
                            </li>
                          )}
                        </ul>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-zinc-500">
                        Not opened yet — check back after your opening
                        session.
                      </p>
                    )}
                  </div>
                );
              })}

              {DECISION_STATUSES.includes(order.status) && (
                <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  <ShipDonateChoice
                    token={token}
                    orderId={order.id}
                    status={order.status}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

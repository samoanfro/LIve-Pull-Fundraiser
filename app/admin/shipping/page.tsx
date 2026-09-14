import { getCurrentOrgContext } from "@/lib/auth/current-org";
import { ShippingRow } from "./shipping-row";

export default async function ShippingPage() {
  const context = await getCurrentOrgContext();
  if (!context) return null;

  const { data: requests } = await context.supabase
    .from("shipping_requests")
    .select("id, status, carrier, tracking_number, customers(email)")
    .order("requested_at", { ascending: false });

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Shipping Queue
      </h1>

      <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800">
        {requests?.map((request) => {
          const customer = request.customers as unknown as {
            email: string;
          } | null;
          return (
            <ShippingRow
              key={request.id}
              id={request.id}
              customerEmail={customer?.email ?? ""}
              status={request.status}
              carrier={request.carrier}
              trackingNumber={request.tracking_number}
            />
          );
        })}
        {requests?.length === 0 && (
          <li className="py-3 text-sm text-zinc-500">
            No shipping requests yet.
          </li>
        )}
      </ul>
    </div>
  );
}

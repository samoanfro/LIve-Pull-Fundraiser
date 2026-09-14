import { getCurrentOrgContext } from "@/lib/auth/current-org";
import { DonationRow } from "./donation-row";

export default async function DonationsPage() {
  const context = await getCurrentOrgContext();
  if (!context) return null;

  const { data: donations } = await context.supabase
    .from("donation_backs")
    .select("id, disposition_status, customers(email)")
    .order("confirmed_at", { ascending: false });

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Donation Back Queue
      </h1>

      <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800">
        {donations?.map((donation) => {
          const customer = donation.customers as unknown as {
            email: string;
          } | null;
          return (
            <DonationRow
              key={donation.id}
              id={donation.id}
              customerEmail={customer?.email ?? ""}
              dispositionStatus={donation.disposition_status}
            />
          );
        })}
        {donations?.length === 0 && (
          <li className="py-3 text-sm text-zinc-500">
            No donation-back records yet.
          </li>
        )}
      </ul>
    </div>
  );
}

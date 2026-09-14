import { getCurrentOrgContext } from "@/lib/auth/current-org";
import { isAdminRole } from "@/lib/permissions/roles";
import { getFinancialReport, getOperationsReport, getInventoryReport } from "./data";
import { CsvExportButton } from "./csv-export-button";

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function ReportsPage() {
  const context = await getCurrentOrgContext();
  if (!context || !isAdminRole(context.role)) return null;

  const [financial, operations, inventory] = await Promise.all([
    getFinancialReport(),
    getOperationsReport(),
    getInventoryReport(),
  ]);

  if (!financial || !operations || !inventory) return null;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Reports
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Gross sales is not the same as net funds raised — see the estimate
          below, which subtracts refunds and product cost. Payment
          processing fees and shipping cost are not tracked yet, so the net
          estimate is still approximate.
        </p>
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Campaign / Financial
          </h2>
          <CsvExportButton
            filename="financial-report.csv"
            rows={[
              ["Gross Sales", dollars(financial.grossSalesCents)],
              ["Orders", financial.orderCount],
              ["Packs Sold", financial.packsSoldCount],
              ["Average Order Value", dollars(financial.averageOrderValueCents)],
              ["Refunds", dollars(financial.refundsCents)],
              ["Product Cost", dollars(financial.productCostCents)],
              [
                "Estimated Net Funds Raised",
                dollars(financial.estimatedNetFundsRaisedCents),
              ],
            ]}
          />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Gross Sales" value={dollars(financial.grossSalesCents)} />
          <Stat label="Orders" value={financial.orderCount} />
          <Stat label="Packs Sold" value={financial.packsSoldCount} />
          <Stat
            label="Avg Order Value"
            value={dollars(financial.averageOrderValueCents)}
          />
          <Stat label="Refunds" value={dollars(financial.refundsCents)} />
          <Stat label="Product Cost" value={dollars(financial.productCostCents)} />
          <Stat
            label="Est. Net Funds Raised"
            value={dollars(financial.estimatedNetFundsRaisedCents)}
          />
        </dl>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Operations
          </h2>
          <CsvExportButton
            filename="operations-report.csv"
            rows={[
              ["Waiting for Opening", operations.waitingForOpening],
              ["Packs Opened", operations.packsOpened],
              [
                "Awaiting Customer Decision",
                operations.awaitingCustomerDecision,
              ],
              ["Shipping Pending", operations.shippingPending],
              ["Shipped", operations.shipped],
              ["Donation Backs", operations.donationBackCount],
              ["Donation Back Items", operations.donationBackItemCount],
              ["Unresolved Exceptions", operations.unresolvedExceptions],
            ]}
          />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Waiting for Opening" value={operations.waitingForOpening} />
          <Stat label="Packs Opened" value={operations.packsOpened} />
          <Stat
            label="Awaiting Decision"
            value={operations.awaitingCustomerDecision}
          />
          <Stat label="Shipping Pending" value={operations.shippingPending} />
          <Stat label="Shipped" value={operations.shipped} />
          <Stat label="Donation Backs" value={operations.donationBackCount} />
          <Stat
            label="Donation Back Items"
            value={operations.donationBackItemCount}
          />
          <Stat
            label="Unresolved Exceptions"
            value={operations.unresolvedExceptions}
          />
        </dl>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Inventory
          </h2>
          <CsvExportButton
            filename="inventory-report.csv"
            rows={[
              ["Received", inventory.totalReceived],
              ["Available", inventory.available],
              ["Reserved", inventory.reserved],
              ["Sold / Assigned", inventory.soldOrAssigned],
              ["Opened", inventory.opened],
              ["Damaged", inventory.damaged],
              ["Missing", inventory.missing],
              ["Adjusted", inventory.adjusted],
            ]}
          />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Received" value={inventory.totalReceived} />
          <Stat label="Available" value={inventory.available} />
          <Stat label="Reserved" value={inventory.reserved} />
          <Stat label="Sold / Assigned" value={inventory.soldOrAssigned} />
          <Stat label="Opened" value={inventory.opened} />
          <Stat label="Damaged" value={inventory.damaged} />
          <Stat label="Missing" value={inventory.missing} />
          <Stat label="Adjusted" value={inventory.adjusted} />
        </dl>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}

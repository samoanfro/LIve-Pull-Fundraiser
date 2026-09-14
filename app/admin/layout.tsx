import Link from "next/link";
import { getCurrentOrgContext } from "@/lib/auth/current-org";
import { isAdminRole, canManageOpeningQueue, canManageShipping } from "@/lib/permissions/roles";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getCurrentOrgContext();

  if (!context) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 text-center dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">
          Your account isn&apos;t a staff member of any organization yet.
        </p>
      </div>
    );
  }

  const { user, role, organizationName } = context;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              {organizationName || "Signed in as"}
            </p>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {user.email}
            </p>
          </div>
          <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white dark:bg-zinc-50 dark:text-zinc-900">
            {role}
          </span>
        </div>
        <nav className="mt-4 flex flex-wrap gap-4 text-sm">
          {isAdminRole(role) && (
            <>
              <Link
                href="/admin/campaigns"
                className="text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
              >
                Campaigns
              </Link>
              <Link
                href="/admin/products"
                className="text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
              >
                Products
              </Link>
              <Link
                href="/admin/storage-locations"
                className="text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
              >
                Storage Locations
              </Link>
              <Link
                href="/admin/inventory/receive"
                className="text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
              >
                Receive Inventory
              </Link>
            </>
          )}
          {canManageOpeningQueue(role) && (
            <Link
              href="/admin/opening-sessions"
              className="text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
            >
              Opening Sessions
            </Link>
          )}
          {canManageShipping(role) && (
            <Link
              href="/admin/shipping"
              className="text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
            >
              Shipping
            </Link>
          )}
          {isAdminRole(role) && (
            <Link
              href="/admin/donations"
              className="text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
            >
              Donations
            </Link>
          )}
        </nav>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}

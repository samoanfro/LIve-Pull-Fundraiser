import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole, canManageOpeningQueue, canManageShipping } from "@/lib/permissions/roles";
import type { OrgRole } from "@/lib/permissions/roles";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("role, organization_id, organizations(name)")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (!memberships || memberships.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 text-center dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">
          Your account isn&apos;t a staff member of any organization yet.
        </p>
      </div>
    );
  }

  // MVP: a staff account belongs to one organization at a time.
  const membership = memberships[0];
  const role = membership.role as OrgRole;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">Signed in as</p>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {user.email}
            </p>
          </div>
          <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white dark:bg-zinc-50 dark:text-zinc-900">
            {role}
          </span>
        </div>
        <nav className="mt-4 flex gap-4 text-sm">
          {isAdminRole(role) && (
            <span className="text-zinc-700 dark:text-zinc-300">
              Campaigns &middot; Products &middot; Inventory
            </span>
          )}
          {canManageOpeningQueue(role) && (
            <span className="text-zinc-700 dark:text-zinc-300">
              Opening Queue
            </span>
          )}
          {canManageShipping(role) && (
            <span className="text-zinc-700 dark:text-zinc-300">
              Shipping
            </span>
          )}
        </nav>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}

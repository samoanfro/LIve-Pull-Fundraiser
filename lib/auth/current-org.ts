import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OrgRole } from "@/lib/permissions/roles";
import type { User } from "@supabase/supabase-js";

export interface CurrentOrgContext {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
  organizationId: string;
  organizationName: string;
  role: OrgRole;
}

/**
 * Resolves the signed-in user's organization membership. Redirects to
 * /login if unauthenticated. Returns null if authenticated but not a staff
 * member of any organization (MVP: a staff account belongs to one org).
 */
export async function getCurrentOrgContext(): Promise<CurrentOrgContext | null> {
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
    return null;
  }

  const membership = memberships[0];
  const organization = membership.organizations as unknown as {
    name: string;
  } | null;

  return {
    supabase,
    user,
    organizationId: membership.organization_id,
    organizationName: organization?.name ?? "",
    role: membership.role as OrgRole,
  };
}

export type OrgRole =
  | "supporter"
  | "event_host"
  | "fulfillment_staff"
  | "support_staff"
  | "admin"
  | "org_owner";

const ADMIN_ROLES: readonly OrgRole[] = ["admin", "org_owner"];

export function isAdminRole(role: OrgRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export function canManageOpeningQueue(role: OrgRole): boolean {
  return role === "event_host" || isAdminRole(role);
}

export function canManageShipping(role: OrgRole): boolean {
  return role === "fulfillment_staff" || isAdminRole(role);
}

export function canManagePulls(role: OrgRole): boolean {
  // Per spec §6: only Event Host (during opening) and Admin/Org Owner may
  // create or correct pulls. Fulfillment and Support staff must not.
  return role === "event_host" || isAdminRole(role);
}

export function canManageStaffRoles(role: OrgRole): boolean {
  return isAdminRole(role);
}

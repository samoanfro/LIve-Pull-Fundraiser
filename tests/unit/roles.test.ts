import { describe, expect, it } from "vitest";
import {
  canManageOpeningQueue,
  canManagePulls,
  canManageShipping,
  canManageStaffRoles,
  isAdminRole,
  type OrgRole,
} from "@/lib/permissions/roles";

const allRoles: OrgRole[] = [
  "supporter",
  "event_host",
  "fulfillment_staff",
  "support_staff",
  "admin",
  "org_owner",
];

describe("isAdminRole", () => {
  it("is true only for admin and org_owner", () => {
    for (const role of allRoles) {
      expect(isAdminRole(role)).toBe(role === "admin" || role === "org_owner");
    }
  });
});

describe("canManageOpeningQueue", () => {
  it("allows event_host and admins, blocks everyone else", () => {
    for (const role of allRoles) {
      const expected =
        role === "event_host" || role === "admin" || role === "org_owner";
      expect(canManageOpeningQueue(role)).toBe(expected);
    }
  });
});

describe("canManageShipping", () => {
  it("allows fulfillment_staff and admins only", () => {
    expect(canManageShipping("fulfillment_staff")).toBe(true);
    expect(canManageShipping("admin")).toBe(true);
    expect(canManageShipping("org_owner")).toBe(true);
    expect(canManageShipping("event_host")).toBe(false);
    expect(canManageShipping("support_staff")).toBe(false);
    expect(canManageShipping("supporter")).toBe(false);
  });
});

describe("canManagePulls", () => {
  it("blocks fulfillment_staff and support_staff from touching pulls", () => {
    expect(canManagePulls("fulfillment_staff")).toBe(false);
    expect(canManagePulls("support_staff")).toBe(false);
    expect(canManagePulls("event_host")).toBe(true);
    expect(canManagePulls("admin")).toBe(true);
  });
});

describe("canManageStaffRoles", () => {
  it("is restricted to admin and org_owner", () => {
    expect(canManageStaffRoles("admin")).toBe(true);
    expect(canManageStaffRoles("org_owner")).toBe(true);
    expect(canManageStaffRoles("event_host")).toBe(false);
    expect(canManageStaffRoles("fulfillment_staff")).toBe(false);
    expect(canManageStaffRoles("support_staff")).toBe(false);
    expect(canManageStaffRoles("supporter")).toBe(false);
  });
});

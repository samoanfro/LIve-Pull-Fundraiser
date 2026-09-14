"use server";

import { getCurrentOrgContext } from "@/lib/auth/current-org";
import { isAdminRole } from "@/lib/permissions/roles";
import {
  validateReceiveInventoryInput,
  type ReceiveInventoryInput,
} from "@/lib/inventory/receive-validation";

export interface GeneratePackIdResult {
  packId?: string;
  error?: string;
}

export async function generatePackIdAction(): Promise<GeneratePackIdResult> {
  const context = await getCurrentOrgContext();
  if (!context || !isAdminRole(context.role)) {
    return { error: "Not authorized." };
  }

  const { data, error } = await context.supabase.rpc("generate_pack_id", {
    target_org_id: context.organizationId,
  });

  if (error) {
    return { error: error.message };
  }

  return { packId: data as string };
}

export interface ReceiveInventoryResult {
  error?: string;
  success?: boolean;
}

export async function receiveInventoryUnitAction(
  input: ReceiveInventoryInput & { photoPath?: string | null },
): Promise<ReceiveInventoryResult> {
  const context = await getCurrentOrgContext();
  if (!context || !isAdminRole(context.role)) {
    return { error: "Not authorized." };
  }

  const errors = validateReceiveInventoryInput(input);
  if (errors.length > 0) {
    return { error: errors.join(" ") };
  }

  const { error } = await context.supabase.from("inventory_units").insert({
    organization_id: context.organizationId,
    product_id: input.productId,
    storage_location_id: input.storageLocationId,
    pack_id: input.packId.trim(),
    supplier_source: input.supplierSource?.trim() || null,
    lot_case_reference: input.lotCaseReference?.trim() || null,
    condition: input.condition,
    unit_cost_cents: input.unitCostDollars
      ? Math.round(Number(input.unitCostDollars) * 100)
      : null,
    photo_url: input.photoPath || null,
    notes: input.notes?.trim() || null,
    received_by: context.user.id,
  });

  if (error) {
    // Postgres unique_violation on inventory_units_org_pack_id_unique.
    if (error.code === "23505") {
      return {
        error: "That Pack ID already exists. Enter a different Pack ID.",
      };
    }
    return { error: error.message };
  }

  return { success: true };
}

export interface ReceiveInventoryFormData {
  products: { id: string; name: string }[];
  storageLocations: { id: string; name: string }[];
  organizationId: string;
}

export async function getReceiveInventoryFormData(): Promise<ReceiveInventoryFormData | null> {
  const context = await getCurrentOrgContext();
  if (!context || !isAdminRole(context.role)) {
    return null;
  }

  const [{ data: products }, { data: storageLocations }] = await Promise.all([
    context.supabase
      .from("products")
      .select("id, name")
      .order("name"),
    context.supabase
      .from("storage_locations")
      .select("id, name")
      .order("name"),
  ]);

  return {
    products: products ?? [],
    storageLocations: storageLocations ?? [],
    organizationId: context.organizationId,
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { getCurrentOrgContext } from "@/lib/auth/current-org";
import { isAdminRole } from "@/lib/permissions/roles";

export interface ActionState {
  error?: string;
  success?: boolean;
}

const VALID_TYPES = ["warehouse", "room", "shelf", "bin", "case"] as const;

export async function createStorageLocationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await getCurrentOrgContext();
  if (!context || !isAdminRole(context.role)) {
    return { error: "Not authorized." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");

  if (!name) {
    return { error: "Name is required." };
  }
  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return { error: "Choose a valid location type." };
  }

  const { error } = await context.supabase.from("storage_locations").insert({
    organization_id: context.organizationId,
    name,
    type,
    notes: String(formData.get("notes") ?? "") || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "A storage location with that name already exists." };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/storage-locations");
  return { success: true };
}

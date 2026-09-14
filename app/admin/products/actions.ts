"use server";

import { revalidatePath } from "next/cache";
import { getCurrentOrgContext } from "@/lib/auth/current-org";
import { isAdminRole } from "@/lib/permissions/roles";

export interface ActionState {
  error?: string;
  success?: boolean;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createProductAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await getCurrentOrgContext();
  if (!context || !isAdminRole(context.role)) {
    return { error: "Not authorized." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const priceDollars = Number(formData.get("price") ?? "");
  const campaignId = String(formData.get("campaign_id") ?? "") || null;

  if (!name) {
    return { error: "Name is required." };
  }
  if (!Number.isFinite(priceDollars) || priceDollars < 0) {
    return { error: "Enter a valid, non-negative price." };
  }

  const { error } = await context.supabase.from("products").insert({
    organization_id: context.organizationId,
    campaign_id: campaignId,
    name,
    slug: slugify(name),
    price_cents: Math.round(priceDollars * 100),
    description: String(formData.get("description") ?? "") || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/products");
  return { success: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { getCurrentOrgContext } from "@/lib/auth/current-org";
import { isAdminRole } from "@/lib/permissions/roles";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function createCampaignAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await getCurrentOrgContext();
  if (!context || !isAdminRole(context.role)) {
    return { error: "Not authorized." };
  }

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return { error: "Title is required." };
  }

  const { error } = await context.supabase.from("campaigns").insert({
    organization_id: context.organizationId,
    title,
    slug: slugify(title),
    description: String(formData.get("description") ?? "") || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/campaigns");
  return { success: true };
}

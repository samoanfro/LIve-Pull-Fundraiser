"use server";

import { revalidatePath } from "next/cache";
import { getCurrentOrgContext } from "@/lib/auth/current-org";
import { isAdminRole } from "@/lib/permissions/roles";

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function setDonationDispositionAction(
  donationBackId: string,
  disposition: string,
  note?: string,
): Promise<ActionState> {
  const context = await getCurrentOrgContext();
  if (!context || !isAdminRole(context.role)) {
    return { error: "Not authorized." };
  }

  const { error } = await context.supabase.rpc("set_donation_disposition", {
    target_donation_back_id: donationBackId,
    new_disposition: disposition,
    note: note || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/donations");
  return { success: true };
}

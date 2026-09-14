"use server";

import { revalidatePath } from "next/cache";
import { getCurrentOrgContext } from "@/lib/auth/current-org";
import { canManageShipping } from "@/lib/permissions/roles";

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function updateShippingFulfillmentAction(
  shippingRequestId: string,
  input: {
    status: string;
    carrier?: string;
    service?: string;
    trackingNumber?: string;
    labelReference?: string;
  },
): Promise<ActionState> {
  const context = await getCurrentOrgContext();
  if (!context || !canManageShipping(context.role)) {
    return { error: "Not authorized." };
  }

  const { error } = await context.supabase.rpc(
    "update_shipping_fulfillment",
    {
      target_shipping_request_id: shippingRequestId,
      new_status: input.status,
      new_carrier: input.carrier || null,
      new_service: input.service || null,
      new_tracking_number: input.trackingNumber || null,
      new_label_reference: input.labelReference || null,
    },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/shipping");
  return { success: true };
}

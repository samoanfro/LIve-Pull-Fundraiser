"use server";

import { revalidatePath } from "next/cache";
import { getCurrentOrgContext } from "@/lib/auth/current-org";
import { isAdminRole } from "@/lib/permissions/roles";

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function recordRefundAction(
  orderId: string,
  input: {
    stripeRefundId?: string;
    amountCents: number;
    finalStatus: "REFUND_PENDING" | "REFUNDED";
    reason: string;
  },
): Promise<ActionState> {
  const context = await getCurrentOrgContext();
  if (!context || !isAdminRole(context.role)) {
    return { error: "Not authorized." };
  }

  if (!input.reason.trim()) {
    return { error: "A reason is required to record a refund." };
  }

  const { error } = await context.supabase.rpc("record_refund", {
    target_order_id: orderId,
    stripe_refund_id: input.stripeRefundId || null,
    amount_cents: input.amountCents,
    final_status: input.finalStatus,
    reason: input.reason,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/orders");
  return { success: true };
}

export async function markOrderDisputedAction(
  orderId: string,
  reason: string,
): Promise<ActionState> {
  const context = await getCurrentOrgContext();
  if (!context || !isAdminRole(context.role)) {
    return { error: "Not authorized." };
  }

  const { error } = await context.supabase.rpc("mark_order_disputed", {
    target_order_id: orderId,
    reason: reason || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/orders");
  return { success: true };
}

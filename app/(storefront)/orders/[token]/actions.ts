"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function chooseShipOrDonateAction(
  token: string,
  orderId: string,
  choice: "ship" | "donate",
): Promise<ActionState> {
  const supabase = createServiceRoleClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("guest_access_token", token)
    .gt("guest_token_expires_at", new Date().toISOString())
    .maybeSingle();

  if (!customer) {
    return { error: "This link is invalid or has expired." };
  }

  // Ownership check: this token must belong to the customer on this order.
  // select_ship_or_donate() does not check ownership itself (it's called
  // from other contexts too), so the caller -- here -- must verify it.
  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.customer_id !== customer.id) {
    return { error: "Order not found." };
  }

  const { error } = await supabase.rpc("select_ship_or_donate", {
    target_order_id: orderId,
    choice,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/orders/${token}`);
  return { success: true };
}

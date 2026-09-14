"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export interface ActionState {
  error?: string;
  success?: boolean;
}

async function getOwnedCustomerOrOrder(
  token: string,
  orderId: string,
): Promise<
  | { ok: true; customerId: string }
  | { ok: false; error: string }
> {
  const supabase = createServiceRoleClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("guest_access_token", token)
    .gt("guest_token_expires_at", new Date().toISOString())
    .maybeSingle();

  if (!customer) {
    return { ok: false, error: "This link is invalid or has expired." };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.customer_id !== customer.id) {
    return { ok: false, error: "Order not found." };
  }

  return { ok: true, customerId: customer.id };
}

export async function chooseShipOrDonateAction(
  token: string,
  orderId: string,
  choice: "ship" | "donate",
): Promise<ActionState> {
  const owned = await getOwnedCustomerOrOrder(token, orderId);
  if (!owned.ok) return { error: owned.error };

  const supabase = createServiceRoleClient();
  const { error } = await supabase.rpc("select_ship_or_donate", {
    target_order_id: orderId,
    choice,
  });

  if (error) return { error: error.message };

  revalidatePath(`/orders/${token}`);
  return { success: true };
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export async function submitShippingAddressAction(
  token: string,
  orderId: string,
  address: ShippingAddress,
): Promise<ActionState> {
  const owned = await getOwnedCustomerOrOrder(token, orderId);
  if (!owned.ok) return { error: owned.error };

  if (
    !address.name.trim() ||
    !address.line1.trim() ||
    !address.city.trim() ||
    !address.state.trim() ||
    !address.postalCode.trim() ||
    !address.country.trim()
  ) {
    return { error: "Please fill in all required address fields." };
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.rpc("submit_shipping_address", {
    target_order_id: orderId,
    address,
  });

  if (error) return { error: error.message };

  revalidatePath(`/orders/${token}`);
  return { success: true };
}

export async function confirmDonationBackAction(
  token: string,
  orderId: string,
): Promise<ActionState> {
  const owned = await getOwnedCustomerOrOrder(token, orderId);
  if (!owned.ok) return { error: owned.error };

  const supabase = createServiceRoleClient();
  const { error } = await supabase.rpc("confirm_donation_back", {
    target_order_id: orderId,
    policy_version: "v1",
  });

  if (error) return { error: error.message };

  revalidatePath(`/orders/${token}`);
  return { success: true };
}

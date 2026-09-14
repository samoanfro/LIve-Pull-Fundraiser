"use server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getStripeClient } from "@/lib/stripe/client";
import type Stripe from "stripe";

export interface CheckoutCartItem {
  productId: string;
  organizationId: string;
  quantity: number;
}

export interface CheckoutResult {
  error?: string;
  url?: string;
}

export async function createCheckoutSessionAction(
  items: CheckoutCartItem[],
  guestEmail: string,
): Promise<CheckoutResult> {
  if (items.length === 0) {
    return { error: "Your cart is empty." };
  }
  if (!guestEmail || !guestEmail.includes("@")) {
    return { error: "A valid email is required." };
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return {
      error: "Payments are not configured yet. Please check back soon.",
    };
  }

  const supabase = createServiceRoleClient();

  // MVP assumption: a single checkout only contains products from one
  // organization (the storefront doesn't currently mix orgs in one cart).
  const organizationId = items[0].organizationId;

  // Fetch authoritative product data server-side. Never trust price or
  // availability from the client-side cart.
  const productIds = items.map((item) => item.productId);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price_cents, status, organization_id")
    .in("id", productIds);

  if (productsError || !products) {
    return { error: "Could not load products." };
  }

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (
      !product ||
      product.status !== "published" ||
      product.organization_id !== organizationId
    ) {
      return { error: "One or more items are no longer available." };
    }
  }

  const subtotalCents = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId)!;
    return sum + product.price_cents * item.quantity;
  }, 0);

  // Reuse an existing guest customer row for this email within this org,
  // rather than creating a duplicate on every checkout attempt.
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("email", guestEmail)
    .is("profile_id", null)
    .maybeSingle();

  let customerId = existingCustomer?.id as string | undefined;
  if (!customerId) {
    const { data: newCustomer, error: customerError } = await supabase
      .from("customers")
      .insert({ organization_id: organizationId, email: guestEmail })
      .select("id")
      .single();
    if (customerError || !newCustomer) {
      return { error: "Could not create customer record." };
    }
    customerId = newCustomer.id;
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      organization_id: organizationId,
      customer_id: customerId,
      subtotal_cents: subtotalCents,
      total_cents: subtotalCents,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { error: "Could not create order." };
  }

  const orderItemsPayload = items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    return {
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price_cents: product.price_cents,
    };
  });

  const { data: orderItems, error: orderItemsError } = await supabase
    .from("order_items")
    .insert(orderItemsPayload)
    .select("id, product_id, quantity");

  if (orderItemsError || !orderItems) {
    return { error: "Could not create order items." };
  }

  // Reserve one physical inventory unit per unit of quantity. If any item
  // can't be fully reserved (sold out mid-checkout), release everything
  // already reserved on this order and cancel it rather than leaving a
  // partially reserved order behind.
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (const orderItem of orderItems) {
    const product = products.find((p) => p.id === orderItem.product_id)!;

    for (let i = 0; i < orderItem.quantity; i++) {
      const { data: claimedUnitId, error: reserveError } =
        await supabase.rpc("reserve_inventory_for_order_item", {
          target_product_id: orderItem.product_id,
          target_order_id: order.id,
          target_order_item_id: orderItem.id,
          ttl_minutes: 15,
        });

      if (reserveError || !claimedUnitId) {
        await supabase.rpc("release_order_reservations", {
          target_order_id: order.id,
        });
        await supabase
          .from("orders")
          .update({ status: "CANCELLED" })
          .eq("id", order.id);
        return {
          error: `${product.name} just sold out. Please update your cart.`,
        };
      }
    }

    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: product.name },
        unit_amount: product.price_cents,
      },
      quantity: orderItem.quantity,
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    customer_email: guestEmail,
    success_url: `${appUrl}/checkout/success?order_id=${order.id}`,
    cancel_url: `${appUrl}/checkout`,
    metadata: { order_id: order.id },
  });

  await supabase
    .from("orders")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", order.id);

  if (!session.url) {
    return { error: "Could not start checkout." };
  }

  return { url: session.url };
}

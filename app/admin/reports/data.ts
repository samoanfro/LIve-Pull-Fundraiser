import { getCurrentOrgContext } from "@/lib/auth/current-org";

export interface FinancialReport {
  grossSalesCents: number;
  orderCount: number;
  packsSoldCount: number;
  averageOrderValueCents: number;
  refundsCents: number;
  productCostCents: number;
  estimatedNetFundsRaisedCents: number;
}

export interface OperationsReport {
  waitingForOpening: number;
  packsOpened: number;
  awaitingCustomerDecision: number;
  shippingPending: number;
  shipped: number;
  donationBackCount: number;
  donationBackItemCount: number;
  unresolvedExceptions: number;
}

export interface InventoryReport {
  totalReceived: number;
  available: number;
  reserved: number;
  soldOrAssigned: number;
  opened: number;
  damaged: number;
  missing: number;
  adjusted: number;
}

const PAID_ORDER_STATUSES = [
  "PAID",
  "PACK_ASSIGNED",
  "QUEUED_FOR_OPENING",
  "OPENING_IN_PROGRESS",
  "OPENED",
  "AWAITING_CUSTOMER_DECISION",
  "SHIP_REQUESTED",
  "DONATE_BACK_SELECTED",
  "FULFILLMENT_IN_PROGRESS",
  "SHIPPED",
  "COMPLETED",
  "REFUND_PENDING",
  "REFUNDED",
  "DISPUTED",
];

export async function getFinancialReport(): Promise<FinancialReport | null> {
  const context = await getCurrentOrgContext();
  if (!context) return null;
  const orgId = context.organizationId;

  const { data: paidOrders } = await context.supabase
    .from("orders")
    .select("id, total_cents")
    .eq("organization_id", orgId)
    .in("status", PAID_ORDER_STATUSES);

  const orderIds = (paidOrders ?? []).map((o) => o.id);
  const grossSalesCents = (paidOrders ?? []).reduce(
    (sum, o) => sum + o.total_cents,
    0,
  );
  const orderCount = paidOrders?.length ?? 0;

  const { data: orderItems } = orderIds.length
    ? await context.supabase
        .from("order_items")
        .select("id")
        .in("order_id", orderIds)
    : { data: [] };

  const orderItemIds = (orderItems ?? []).map((oi) => oi.id);

  const { count: packsSoldCount } = orderItemIds.length
    ? await context.supabase
        .from("order_inventory_assignments")
        .select("id", { count: "exact", head: true })
        .in("order_item_id", orderItemIds)
    : { count: 0 };

  const { data: refunds } = orderIds.length
    ? await context.supabase
        .from("refunds")
        .select("amount_cents")
        .in("order_id", orderIds)
    : { data: [] };

  const refundsCents = (refunds ?? []).reduce(
    (sum, r) => sum + r.amount_cents,
    0,
  );

  const { data: soldUnits } = await context.supabase
    .from("inventory_units")
    .select("unit_cost_cents")
    .eq("organization_id", orgId)
    .in("status", [
      "SOLD",
      "ASSIGNED",
      "OPENING",
      "OPENED",
      "SHIPPED",
      "DONATED_BACK",
    ]);

  const productCostCents = (soldUnits ?? []).reduce(
    (sum, u) => sum + (u.unit_cost_cents ?? 0),
    0,
  );

  return {
    grossSalesCents,
    orderCount,
    packsSoldCount: packsSoldCount ?? 0,
    averageOrderValueCents:
      orderCount > 0 ? Math.round(grossSalesCents / orderCount) : 0,
    refundsCents,
    productCostCents,
    estimatedNetFundsRaisedCents:
      grossSalesCents - refundsCents - productCostCents,
  };
}

export async function getOperationsReport(): Promise<OperationsReport | null> {
  const context = await getCurrentOrgContext();
  if (!context) return null;
  const orgId = context.organizationId;

  const countOrders = async (statuses: string[]) => {
    const { count } = await context.supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .in("status", statuses);
    return count ?? 0;
  };

  const { data: orgOrders } = await context.supabase
    .from("orders")
    .select("id")
    .eq("organization_id", orgId);
  const orgOrderIds = (orgOrders ?? []).map((o) => o.id);

  const { data: orgSessions } = await context.supabase
    .from("opening_sessions")
    .select("id")
    .eq("organization_id", orgId);
  const orgSessionIds = (orgSessions ?? []).map((s) => s.id);

  const countShippingByStatuses = async (statuses: string[]) => {
    if (orgOrderIds.length === 0) return 0;
    const { count } = await context.supabase
      .from("shipping_requests")
      .select("id", { count: "exact", head: true })
      .in("order_id", orgOrderIds)
      .in("status", statuses);
    return count ?? 0;
  };

  const [
    waitingForOpening,
    awaitingCustomerDecision,
    packsOpened,
    shippingPending,
    shipped,
    donationBackCount,
    unresolvedExceptions,
  ] = await Promise.all([
    countOrders(["PACK_ASSIGNED", "QUEUED_FOR_OPENING", "OPENING_IN_PROGRESS"]),
    countOrders(["AWAITING_CUSTOMER_DECISION"]),
    orgOrderIds.length
      ? context.supabase
          .from("opened_packs")
          .select("id", { count: "exact", head: true })
          .in("order_id", orgOrderIds)
          .eq("status", "locked")
          .then((r) => r.count ?? 0)
      : 0,
    countShippingByStatuses([
      "REQUESTED",
      "ADDRESS_CONFIRMED",
      "LABEL_CREATED",
      "PACKED",
      "EXCEPTION",
    ]),
    countShippingByStatuses(["SHIPPED", "DELIVERED"]),
    orgOrderIds.length
      ? context.supabase
          .from("donation_backs")
          .select("id", { count: "exact", head: true })
          .in("order_id", orgOrderIds)
          .then((r) => r.count ?? 0)
      : 0,
    orgSessionIds.length
      ? context.supabase
          .from("opening_queue")
          .select("id", { count: "exact", head: true })
          .in("opening_session_id", orgSessionIds)
          .eq("queue_status", "exception")
          .then((r) => r.count ?? 0)
      : 0,
  ]);

  const { data: orgDonationBacks } = orgOrderIds.length
    ? await context.supabase
        .from("donation_backs")
        .select("id")
        .in("order_id", orgOrderIds)
    : { data: [] };
  const donationBackIds = (orgDonationBacks ?? []).map((db) => db.id);

  const { count: donationBackItemCount } = donationBackIds.length
    ? await context.supabase
        .from("donation_back_items")
        .select("id", { count: "exact", head: true })
        .in("donation_back_id", donationBackIds)
    : { count: 0 };

  return {
    waitingForOpening,
    packsOpened,
    awaitingCustomerDecision,
    shippingPending,
    shipped,
    donationBackCount,
    donationBackItemCount: donationBackItemCount ?? 0,
    unresolvedExceptions,
  };
}

export async function getInventoryReport(): Promise<InventoryReport | null> {
  const context = await getCurrentOrgContext();
  if (!context) return null;
  const orgId = context.organizationId;

  const countByStatus = async (statuses: string[]) => {
    const { count } = await context.supabase
      .from("inventory_units")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .in("status", statuses);
    return count ?? 0;
  };

  const { count: totalReceived } = await context.supabase
    .from("inventory_units")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId);

  const { count: adjusted } = await context.supabase
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("action", "inventory_status_adjusted");

  const [available, reserved, soldOrAssigned, opened, damaged, missing] =
    await Promise.all([
      countByStatus(["AVAILABLE"]),
      countByStatus(["CHECKOUT_RESERVED"]),
      countByStatus(["SOLD", "ASSIGNED"]),
      countByStatus(["OPENING", "OPENED"]),
      countByStatus(["DAMAGED"]),
      countByStatus(["MISSING"]),
    ]);

  return {
    totalReceived: totalReceived ?? 0,
    available,
    reserved,
    soldOrAssigned,
    opened,
    damaged,
    missing,
    adjusted: adjusted ?? 0,
  };
}

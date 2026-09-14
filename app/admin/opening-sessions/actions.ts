"use server";

import { revalidatePath } from "next/cache";
import { getCurrentOrgContext } from "@/lib/auth/current-org";
import { isAdminRole, canManageOpeningQueue } from "@/lib/permissions/roles";

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function createOpeningSessionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await getCurrentOrgContext();
  if (!context || !isAdminRole(context.role)) {
    return { error: "Not authorized." };
  }

  const { error } = await context.supabase.from("opening_sessions").insert({
    organization_id: context.organizationId,
    livestream_url: String(formData.get("livestream_url") ?? "") || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/opening-sessions");
  return { success: true };
}

export interface EligibleOrderItem {
  id: string;
  order_id: string;
  product_name: string;
  customer_email: string;
  pack_id: string;
}

export async function getEligibleOrderItems(): Promise<EligibleOrderItem[]> {
  const context = await getCurrentOrgContext();
  if (!context || !isAdminRole(context.role)) return [];

  // Order items belonging to PACK_ASSIGNED orders that have not already
  // been queued for an opening session (opening_queue.order_item_id is
  // unique, so an item queued once won't be offered again).
  const { data: orders } = await context.supabase
    .from("orders")
    .select("id, customers(email)")
    .eq("organization_id", context.organizationId)
    .eq("status", "PACK_ASSIGNED");

  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map((o) => o.id);

  const { data: orderItems } = await context.supabase
    .from("order_items")
    .select("id, order_id, products(name)")
    .in("order_id", orderIds);

  if (!orderItems || orderItems.length === 0) return [];

  const orderItemIds = orderItems.map((oi) => oi.id);

  const [{ data: assignments }, { data: queued }] = await Promise.all([
    context.supabase
      .from("order_inventory_assignments")
      .select("order_item_id, inventory_units(pack_id)")
      .in("order_item_id", orderItemIds),
    context.supabase
      .from("opening_queue")
      .select("order_item_id")
      .in("order_item_id", orderItemIds),
  ]);

  const queuedItemIds = new Set((queued ?? []).map((q) => q.order_item_id));

  return orderItems
    .filter((item) => !queuedItemIds.has(item.id))
    .map((item) => {
      const order = orders.find((o) => o.id === item.order_id);
      const customer = order?.customers as unknown as {
        email: string;
      } | null;
      const product = item.products as unknown as { name: string } | null;
      const assignment = assignments?.find(
        (a) => a.order_item_id === item.id,
      );
      const inventoryUnit = assignment?.inventory_units as unknown as {
        pack_id: string;
      } | null;

      return {
        id: item.id,
        order_id: item.order_id,
        product_name: product?.name ?? "",
        customer_email: customer?.email ?? "",
        pack_id: inventoryUnit?.pack_id ?? "",
      };
    })
    .filter((item) => item.pack_id);
}

export async function addOrderItemToQueueAction(
  sessionId: string,
  orderItemId: string,
): Promise<ActionState> {
  const context = await getCurrentOrgContext();
  if (!context || !isAdminRole(context.role)) {
    return { error: "Not authorized." };
  }

  const { error } = await context.supabase.rpc(
    "add_order_item_to_opening_queue",
    {
      target_opening_session_id: sessionId,
      target_order_item_id: orderItemId,
    },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/opening-sessions/${sessionId}`);
  return { success: true };
}

export interface ConfirmPackResult {
  matched?: boolean;
  openedPackId?: string;
  error?: string;
}

export async function confirmPackAction(
  queueId: string,
  enteredPackId: string,
): Promise<ConfirmPackResult> {
  const context = await getCurrentOrgContext();
  if (!context || !canManageOpeningQueue(context.role)) {
    return { error: "Not authorized." };
  }

  const { data: matched, error } = await context.supabase.rpc(
    "confirm_opening_queue_pack",
    { target_queue_id: queueId, entered_pack_id: enteredPackId.trim() },
  );

  if (error) {
    return { error: error.message };
  }

  if (!matched) {
    return { matched: false };
  }

  const { data: queueRow } = await context.supabase
    .from("opening_queue")
    .select("inventory_unit_id, opening_session_id")
    .eq("id", queueId)
    .maybeSingle();

  if (!queueRow) {
    return { matched: true };
  }

  const { data: openedPack } = await context.supabase
    .from("opened_packs")
    .select("id")
    .eq("inventory_unit_id", queueRow.inventory_unit_id)
    .eq("opening_session_id", queueRow.opening_session_id)
    .maybeSingle();

  return { matched: true, openedPackId: openedPack?.id };
}

export async function addPulledItemAction(
  openedPackId: string,
  input: {
    title: string;
    category?: string;
    description?: string;
    quantity?: number;
  },
): Promise<ActionState> {
  const context = await getCurrentOrgContext();
  if (!context || !canManageOpeningQueue(context.role)) {
    return { error: "Not authorized." };
  }

  if (!input.title.trim()) {
    return { error: "Item title is required." };
  }

  const { error } = await context.supabase.rpc("add_pulled_item", {
    target_opened_pack_id: openedPackId,
    item_title: input.title.trim(),
    item_category: input.category?.trim() || null,
    item_description: input.description?.trim() || null,
    item_quantity: input.quantity ?? 1,
    item_image_url: null,
    item_external_reference: null,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function completeOpeningAction(
  openedPackId: string,
  sessionId: string,
): Promise<ActionState> {
  const context = await getCurrentOrgContext();
  if (!context || !canManageOpeningQueue(context.role)) {
    return { error: "Not authorized." };
  }

  const { error } = await context.supabase.rpc("complete_opening", {
    target_opened_pack_id: openedPackId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/opening-sessions/${sessionId}`);
  return { success: true };
}

export interface HostQueueEntry {
  queueId: string;
  sequenceNumber: number;
  queueStatus: string;
  expectedPackId: string;
  productName: string;
  customerEmail: string;
  openedPackId: string | null;
  pulledItems: { id: string; title: string; category: string | null }[];
}

export async function getHostConsoleData(
  sessionId: string,
): Promise<HostQueueEntry[]> {
  const context = await getCurrentOrgContext();
  if (!context || !canManageOpeningQueue(context.role)) return [];

  const { data: queue } = await context.supabase
    .from("opening_queue")
    .select(
      "id, sequence_number, queue_status, order_item_id, inventory_unit_id, inventory_units(pack_id)",
    )
    .eq("opening_session_id", sessionId)
    .neq("queue_status", "completed")
    .order("sequence_number");

  if (!queue || queue.length === 0) return [];

  const orderItemIds = queue.map((q) => q.order_item_id);
  const unitIds = queue.map((q) => q.inventory_unit_id);

  const [{ data: orderItems }, { data: openedPacks }] = await Promise.all([
    context.supabase
      .from("order_items")
      .select("id, products(name), orders(customers(email))")
      .in("id", orderItemIds),
    context.supabase
      .from("opened_packs")
      .select("id, inventory_unit_id, status, pulled_items(id, title, category)")
      .in("inventory_unit_id", unitIds)
      .eq("opening_session_id", sessionId),
  ]);

  return queue.map((entry) => {
    const orderItem = orderItems?.find((oi) => oi.id === entry.order_item_id);
    const product = orderItem?.products as unknown as {
      name: string;
    } | null;
    const order = orderItem?.orders as unknown as {
      customers: { email: string } | null;
    } | null;
    const unit = entry.inventory_units as unknown as {
      pack_id: string;
    } | null;
    const openedPack = openedPacks?.find(
      (op) => op.inventory_unit_id === entry.inventory_unit_id,
    );

    return {
      queueId: entry.id,
      sequenceNumber: entry.sequence_number,
      queueStatus: entry.queue_status,
      expectedPackId: unit?.pack_id ?? "",
      productName: product?.name ?? "",
      customerEmail: order?.customers?.email ?? "",
      openedPackId: openedPack?.id ?? null,
      pulledItems: (openedPack?.pulled_items ?? []) as {
        id: string;
        title: string;
        category: string | null;
      }[],
    };
  });
}

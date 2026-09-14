-- Phase 6: Supporter Pull Results
-- No new tables -- this phase adds the guest-order-access-token lookup path
-- (PRODUCT_BUILD_SPEC.md §24: "guest purchasers can use secure order-access
-- links") and the Ship/Donate decision capture on top of Phase 4/5 tables.
--
-- Guest customers have no Supabase Auth session, so RLS (which keys off
-- auth.uid()) cannot authorize them directly. The application looks up a
-- customer by guest_access_token using the service-role key (server-only,
-- never exposed to the browser) rather than widening RLS to anon.

-- ---------------------------------------------------------------------------
-- select_ship_or_donate: capture the supporter's fulfillment choice.
-- Called by server code that has already validated the caller owns this
-- order via a valid, unexpired guest_access_token (or, for signed-in
-- customers, via RLS-checked ownership) -- this function does not re-check
-- the token itself, only that the order is in a state where the choice is
-- legal to make.
-- ---------------------------------------------------------------------------
create function public.select_ship_or_donate(
  target_order_id uuid,
  choice text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.order_status;
begin
  if choice not in ('ship', 'donate') then
    raise exception 'Invalid choice: %', choice;
  end if;

  select status into v_status from public.orders where id = target_order_id for update;

  if v_status is null then
    raise exception 'Order not found';
  end if;

  if v_status not in ('AWAITING_CUSTOMER_DECISION', 'SHIP_REQUESTED', 'DONATE_BACK_SELECTED') then
    raise exception 'This order is not ready for a Ship/Donate decision (status: %)', v_status;
  end if;

  update public.orders
  set
    status = case when choice = 'ship' then 'SHIP_REQUESTED' else 'DONATE_BACK_SELECTED' end,
    updated_at = now()
  where id = target_order_id;
end;
$$;

comment on function public.select_ship_or_donate is
  'Records the supporter''s Ship vs Donate Back decision on the order. Idempotent/re-selectable while the order remains in AWAITING_CUSTOMER_DECISION, SHIP_REQUESTED, or DONATE_BACK_SELECTED -- switching choice before fulfillment actually starts is allowed. Actual shipping_requests/donation_backs records are created in Phase 7.';

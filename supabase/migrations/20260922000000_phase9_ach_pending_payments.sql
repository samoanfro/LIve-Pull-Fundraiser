-- Support ACH (us_bank_account) as a Checkout payment method alongside
-- cards. ACH settles over several business days rather than instantly, so:
--   1. payments.status needs a 'processing' state for the pending window
--      between checkout.session.completed (payment_status: 'unpaid') and
--      the later async_payment_succeeded/failed webhook.
--   2. the inventory reservation taken at checkout must be extended past
--      its normal 15-minute checkout-page TTL once we know payment is an
--      async method in flight, so the pack isn't released back to
--      available inventory while the bank transfer is still clearing.

alter table public.payments
  drop constraint payments_status_check;

alter table public.payments
  add constraint payments_status_check
  check (status = any (array['processing', 'succeeded', 'failed', 'refunded', 'partially_refunded']));

create or replace function public.extend_order_reservations(target_order_id uuid, ttl_minutes integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.inventory_reservations
  set expires_at = now() + make_interval(mins => ttl_minutes)
  where order_id = target_order_id
    and status = 'active';
end;
$$;

revoke execute on function public.extend_order_reservations(uuid, integer) from anon, authenticated;

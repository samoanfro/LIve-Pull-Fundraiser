-- Fix: select_ship_or_donate failed with "column status is of type
-- order_status but expression is of type text" -- a CASE expression's
-- result type isn't implicitly cast to an enum column, even when both
-- branches are valid enum labels. Caught by live testing in-browser.
create or replace function public.select_ship_or_donate(
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
    status = (case when choice = 'ship' then 'SHIP_REQUESTED' else 'DONATE_BACK_SELECTED' end)::public.order_status,
    updated_at = now()
  where id = target_order_id;
end;
$$;

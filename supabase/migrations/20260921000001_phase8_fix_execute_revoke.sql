-- Fix: the previous migration's "REVOKE ... FROM PUBLIC" did not actually
-- restrict access, because Supabase grants EXECUTE to anon/authenticated
-- explicitly (not merely via PUBLIC membership). Verified by querying
-- information_schema.role_routine_grants after the first migration --
-- anon and authenticated still had EXECUTE on finalize_paid_order. Revoke
-- from the actual grantees.
revoke execute on function public.reserve_inventory_for_order_item(uuid, uuid, uuid, integer) from anon, authenticated;
revoke execute on function public.release_order_reservations(uuid) from anon, authenticated;
revoke execute on function public.release_expired_reservations() from anon, authenticated;
revoke execute on function public.finalize_paid_order(uuid) from anon, authenticated;
revoke execute on function public.select_ship_or_donate(uuid, text) from anon, authenticated;
revoke execute on function public.confirm_donation_back(uuid, text) from anon, authenticated;
revoke execute on function public.submit_shipping_address(uuid, jsonb) from anon, authenticated;

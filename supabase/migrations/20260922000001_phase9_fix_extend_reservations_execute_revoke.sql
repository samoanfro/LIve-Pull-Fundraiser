-- New functions get EXECUTE granted to PUBLIC by default on creation, which
-- covers anon/authenticated even without an explicit grant to those roles
-- (see 20260921000001's revoke fix for the same lesson). Revoke from PUBLIC
-- directly rather than relying on per-role revokes.
revoke execute on function public.extend_order_reservations(uuid, integer) from public;

import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Bypasses Row Level Security. Never import this into client code, and
 * never expose SUPABASE_SECRET_KEY to the browser. Use only for
 * server-side operations that must run with elevated privileges:
 * checkout/order creation (guests have no auth session to satisfy RLS) and
 * Stripe webhook processing (no user session at all).
 */
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

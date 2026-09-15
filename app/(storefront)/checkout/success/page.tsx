import Link from "next/link";
import { heading, card, btnPrimary } from "@/lib/ui";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string; token?: string }>;
}) {
  const { order_id: orderId, token } = await searchParams;

  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className={`${heading} text-2xl`}>Thank you!</h1>
      <p className="mt-4 text-muted">
        Your payment is being processed. We&apos;ll email you a confirmation
        once it&apos;s finalized.
      </p>
      {orderId && (
        <p className="mt-2 text-sm text-muted">Order reference: {orderId}</p>
      )}

      {token && (
        <div className={`${card} mt-6 text-left`}>
          <p className="text-sm text-muted">
            Bookmark this link to check your order and pull results later —
            email confirmations aren&apos;t set up yet, so this page won&apos;t
            resend it to you.
          </p>
          <Link
            href={`/orders/${token}`}
            className={`${btnPrimary} mt-3 block w-full`}
          >
            View My Pulls
          </Link>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string; token?: string }>;
}) {
  const { order_id: orderId, token } = await searchParams;

  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Thank you!
      </h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Your payment is being processed. We&apos;ll email you a confirmation
        once it&apos;s finalized.
      </p>
      {orderId && (
        <p className="mt-2 text-sm text-zinc-500">Order reference: {orderId}</p>
      )}

      {token && (
        <div className="mt-6 rounded-lg border border-zinc-200 p-4 text-left dark:border-zinc-800">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Bookmark this link to check your order and pull results later —
            email confirmations aren&apos;t set up yet, so this page won&apos;t
            resend it to you.
          </p>
          <Link
            href={`/orders/${token}`}
            className="mt-3 block w-full rounded-md bg-zinc-900 px-4 py-3 text-center text-base font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
          >
            View My Pulls
          </Link>
        </div>
      )}
    </div>
  );
}

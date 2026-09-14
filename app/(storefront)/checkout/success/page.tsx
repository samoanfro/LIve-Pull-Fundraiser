export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id: orderId } = await searchParams;

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
      <p className="mt-6 text-sm text-zinc-500">
        Order status pages and order history are not built yet — that lands
        in a later phase.
      </p>
    </div>
  );
}

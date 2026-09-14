import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-center dark:bg-black">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Live Pull Fundraising Platform
      </h1>
      <p className="mt-2 max-w-md text-zinc-600 dark:text-zinc-400">
        Purchase a real pack. Watch us open your assigned pack. Receive
        exactly what is pulled, or donate those items back to support the
        nonprofit.
      </p>
      <Link
        href="/campaigns"
        className="mt-6 rounded-md bg-zinc-900 px-5 py-3 text-base font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
      >
        Browse Campaigns
      </Link>
    </div>
  );
}

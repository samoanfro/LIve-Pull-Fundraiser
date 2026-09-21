import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import { LIVE_HOSTS, isLiveHostKey } from "@/lib/live-hosts";

export const dynamic = "force-dynamic";

interface OpeningSession {
  id: string;
  status: string;
  scheduled_at: string | null;
  livestream_url: string | null;
  recording_url: string | null;
  started_at: string | null;
  ended_at: string | null;
  host_key: string;
}

function chooseSession(sessions: OpeningSession[]): OpeningSession | null {
  const live = sessions.find(
    (session) => session.status === "in_progress" && session.livestream_url,
  );
  if (live) return live;

  const upcoming = sessions
    .filter((session) => session.status === "scheduled" && session.livestream_url)
    .sort((a, b) =>
      (a.scheduled_at ?? "9999").localeCompare(b.scheduled_at ?? "9999"),
    )[0];
  if (upcoming) return upcoming;

  return (
    sessions
      .filter((session) => session.recording_url || session.livestream_url)
      .sort((a, b) =>
        (b.ended_at ?? b.started_at ?? "").localeCompare(
          a.ended_at ?? a.started_at ?? "",
        ),
      )[0] ?? null
  );
}

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ host?: string }>;
}) {
  const { host: requestedHost } = await searchParams;
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("opening_sessions")
    .select(
      "id, status, scheduled_at, livestream_url, recording_url, started_at, ended_at, host_key",
    )
    .or("livestream_url.not.is.null,recording_url.not.is.null")
    .order("created_at", { ascending: false })
    .limit(20);

  const sessions = (data ?? []) as OpeningSession[];
  const hostSessions = LIVE_HOSTS.map((host) => ({
    ...host,
    session: chooseSession(sessions.filter((session) => session.host_key === host.key)),
  }));
  const selectedHost = isLiveHostKey(requestedHost ?? "")
    ? requestedHost
    : hostSessions.find((host) => host.session?.status === "in_progress")?.key ?? "live-pull";
  const activeHost = hostSessions.find((host) => host.key === selectedHost)!;
  const session = activeHost.session;
  const sourceUrl =
    session?.status === "completed"
      ? session.recording_url || session.livestream_url
      : session?.livestream_url || session?.recording_url;
  const embedUrl = getYouTubeEmbedUrl(sourceUrl);
  const isLive = session?.status === "in_progress";
  const isUpcoming = session?.status === "scheduled";

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-sm font-bold text-brand uppercase">
            <span
              className={`h-2.5 w-2.5 rounded-full ${isLive ? "animate-pulse bg-danger" : "bg-success"}`}
            />
            {isLive ? "Live now" : isUpcoming ? "Next opening" : "Opening room"}
          </div>
          <h1 className="mt-3 text-3xl font-black text-foreground sm:text-5xl">
            Watch the packs open
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted">
            Follow each verified Pack ID from sealed product to recorded pulls.
            Opening operations continue safely even if the video feed drops.
          </p>
        </div>
        <Link
          href="/campaigns"
          className="text-sm font-semibold text-brand hover:underline"
        >
          Browse campaigns →
        </Link>
      </div>

      <nav aria-label="Stream hosts" className="mt-8 flex flex-wrap gap-2 border-b border-border pb-3">
        {hostSessions.map((host) => {
          const active = host.key === selectedHost;
          const live = host.session?.status === "in_progress";
          return (
            <Link
              key={host.key}
              href={`/live?host=${host.key}`}
              aria-current={active ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${active ? "border-brand bg-brand text-white" : "border-border text-foreground hover:border-brand"}`}
            >
              {live && <span className="h-2 w-2 rounded-full bg-danger" aria-label="Live" />}
              {host.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-foreground">{activeHost.name}</h2>
        <span className="text-sm font-medium text-muted">
          {isLive ? "Live now" : isUpcoming ? "Upcoming" : session ? "Replay" : "Offline"}
        </span>
      </div>

      <section className="mt-4 overflow-hidden rounded-lg bg-[#071a22] shadow-xl">
        {embedUrl ? (
          <div className="aspect-video">
            <iframe
              src={embedUrl}
              title={`${activeHost.name} ${isLive ? "live pack opening" : "pack opening video"}`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center px-6 text-center text-white">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-2xl">
              ▶
            </span>
            <h3 className="mt-5 text-2xl font-bold">{activeHost.name} is offline</h3>
            <p className="mt-2 max-w-md text-white/65">
              This host&apos;s YouTube opening will appear here when a session is scheduled.
            </p>
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-4 border-y border-border py-6 sm:grid-cols-3">
        <div>
          <p className="text-sm font-bold text-foreground">Verified pack</p>
          <p className="mt-1 text-sm leading-6 text-muted">The host confirms the assigned Pack ID before opening.</p>
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Recorded pulls</p>
          <p className="mt-1 text-sm leading-6 text-muted">Every item is recorded against its physical pack and order.</p>
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Your choice</p>
          <p className="mt-1 text-sm leading-6 text-muted">After opening, choose shipping or donate the contents back.</p>
        </div>
      </div>
    </div>
  );
}

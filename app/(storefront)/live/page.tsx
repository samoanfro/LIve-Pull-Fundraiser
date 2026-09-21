import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

export const dynamic = "force-dynamic";

interface OpeningSession {
  id: string;
  status: string;
  scheduled_at: string | null;
  livestream_url: string | null;
  recording_url: string | null;
  started_at: string | null;
  ended_at: string | null;
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

export default async function LivePage() {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("opening_sessions")
    .select(
      "id, status, scheduled_at, livestream_url, recording_url, started_at, ended_at",
    )
    .or("livestream_url.not.is.null,recording_url.not.is.null")
    .order("created_at", { ascending: false })
    .limit(20);

  const session = chooseSession((data ?? []) as OpeningSession[]);
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

      <section className="mt-8 overflow-hidden rounded-lg bg-[#071a22] shadow-xl">
        {embedUrl ? (
          <div className="aspect-video">
            <iframe
              src={embedUrl}
              title={isLive ? "Live pack opening" : "Pack opening video"}
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
            <h2 className="mt-5 text-2xl font-bold">The opening room is offline</h2>
            <p className="mt-2 max-w-md text-white/65">
              The next YouTube opening will appear here when a session is scheduled.
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

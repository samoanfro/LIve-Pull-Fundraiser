const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const CHANNEL_ID_PATTERN = /^UC[A-Za-z0-9_-]{20,}$/;

export function getYouTubeEmbedUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  let videoId: string | null = null;

  if (host === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtube-nocookie.com"
  ) {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    } else {
      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed", "live", "shorts"].includes(parts[0] ?? "")) {
        videoId = parts[1] ?? null;
      }

      if (parts[0] === "channel" && CHANNEL_ID_PATTERN.test(parts[1] ?? "")) {
        return `https://www.youtube-nocookie.com/embed/live_stream?channel=${parts[1]}`;
      }
    }
  }

  return videoId && VIDEO_ID_PATTERN.test(videoId)
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`
    : null;
}

export function isSupportedYouTubeUrl(value: string): boolean {
  return getYouTubeEmbedUrl(value) !== null;
}

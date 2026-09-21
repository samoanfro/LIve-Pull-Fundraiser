import { describe, expect, it } from "vitest";
import { getYouTubeEmbedUrl, isSupportedYouTubeUrl } from "@/lib/youtube";

describe("YouTube URL support", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0"],
    ["https://youtu.be/dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0"],
    ["https://www.youtube.com/live/dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0"],
  ])("converts %s to a privacy-enhanced embed", (url, expected) => {
    expect(getYouTubeEmbedUrl(url)).toBe(expected);
  });

  it("supports a YouTube channel live endpoint", () => {
    expect(
      getYouTubeEmbedUrl(
        "https://www.youtube.com/channel/UC1234567890123456789012/live",
      ),
    ).toBe(
      "https://www.youtube-nocookie.com/embed/live_stream?channel=UC1234567890123456789012",
    );
  });

  it("rejects unsupported and malformed URLs", () => {
    expect(isSupportedYouTubeUrl("https://example.com/live")).toBe(false);
    expect(isSupportedYouTubeUrl("not-a-url")).toBe(false);
  });
});

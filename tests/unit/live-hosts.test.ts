import { describe, expect, it } from "vitest";
import { LIVE_HOSTS, isLiveHostKey } from "@/lib/live-hosts";

describe("live hosts", () => {
  it("lists all three selectable hosts", () => {
    expect(LIVE_HOSTS.map((host) => host.name)).toEqual([
      "Live Pull",
      "PokePigLT",
      "Beard Dad Cardz",
    ]);
  });

  it("rejects unknown host keys", () => {
    expect(isLiveHostKey("pokepiglt")).toBe(true);
    expect(isLiveHostKey("unknown-host")).toBe(false);
  });
});

export const LIVE_HOSTS = [
  { key: "live-pull", name: "Live Pull" },
  { key: "pokepiglt", name: "PokePigLT" },
  { key: "beard-dad-cardz", name: "Beard Dad Cardz" },
] as const;

export type LiveHostKey = (typeof LIVE_HOSTS)[number]["key"];

export function isLiveHostKey(value: string): value is LiveHostKey {
  return LIVE_HOSTS.some((host) => host.key === value);
}

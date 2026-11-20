/**
 * Privacy rule: an event may say what happened and for which job, never what someone earns.
 * Events go to Umami when NEXT_PUBLIC_UMAMI_ID is set and nowhere otherwise.
 */
type EventName = "check" | "share" | "waitlist" | "country";

type UmamiWindow = Window & { umami?: { track: (name: string, data?: Record<string, string>) => void } };

export function track(name: EventName, data?: Record<string, string>) {
  if (typeof window === "undefined") return;
  (window as UmamiWindow).umami?.track(name, data);
}

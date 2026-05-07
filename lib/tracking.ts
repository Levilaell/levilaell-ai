/**
 * Tracking client-side. Fire-and-forget via sendBeacon.
 *
 * Privacidade:
 *   • Respeita navigator.doNotTrack
 *   • Session ID é UUID local em sessionStorage (some ao fechar a aba)
 *   • Não captura IP em texto puro (server registra apenas via Supabase)
 *   • Não usa cookies de terceiros
 */

const SESSION_KEY = "tracking:session_id:v1";

export type TrackInput = {
  type: string;
  data?: Record<string, unknown>;
};

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

function isDoNotTrack(): boolean {
  if (typeof navigator === "undefined") return false;
  // Standard property
  if (navigator.doNotTrack === "1") return true;
  // Legacy IE
  type LegacyDNT = { msDoNotTrack?: string };
  const legacy = (navigator as unknown as LegacyDNT).msDoNotTrack;
  if (legacy === "1") return true;
  return false;
}

export function track(input: TrackInput): void {
  if (typeof window === "undefined") return;
  if (isDoNotTrack()) return;

  const sessionId = getOrCreateSessionId();
  const payload = {
    type: input.type,
    data: input.data ?? {},
    sessionId,
    referrer: document.referrer || "",
    pagePath: window.location.pathname,
  };

  try {
    if (typeof navigator.sendBeacon === "function") {
      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });
      navigator.sendBeacon("/api/tracking", blob);
      return;
    }
    void fetch("/api/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // silent
  }
}

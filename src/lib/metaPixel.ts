/**
 * Tiny safe wrapper around the Meta Pixel (fbq).
 * Never throws if Meta scripts are blocked or not yet loaded.
 */

type PixelParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const clean = (params?: PixelParams) => {
  if (!params) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
};

export const trackPixel = (event: string, params?: PixelParams) => {
  try {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;
    const payload = clean(params);
    if (payload) window.fbq("track", event, payload);
    else window.fbq("track", event);
  } catch (err) {
    console.warn("Meta Pixel event failed:", err);
  }
};

export const trackLead = (contentName: string, location?: string) =>
  trackPixel("Lead", { content_name: contentName, content_category: location });

export const trackCompleteRegistration = (
  location?: string,
  status?: string,
) =>
  trackPixel("CompleteRegistration", {
    content_name: "Fall 2026 Registration",
    content_category: location,
    status,
  });

export const trackViewContent = (contentName: string, location?: string) =>
  trackPixel("ViewContent", { content_name: contentName, content_category: location });

/**
 * First-touch marketing attribution.
 *
 * Captures UTM parameters (and referrer / landing page) the first time a visitor
 * arrives, stores them in localStorage, and re-uses them on every later form
 * submission in the same browser for up to 30 days.
 *
 * Link conventions
 * ----------------
 * Facebook / Meta Ads — paste into "URL parameters" on the ad:
 *   utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign=fall_2026_registration&utm_content={{ad.name}}&utm_term={{adset.name}}
 *
 * Email links:
 *   /register?utm_source=email&utm_medium=owned_email&utm_campaign=fall_2026_registration&utm_content=still_considering_v1
 *   /register?utm_source=email&utm_medium=owned_email&utm_campaign=fall_2026_registration&utm_content=payment_outstanding_v1
 *   /events?utm_source=email&utm_medium=owned_email&utm_campaign=hudson_open_house_aug18&utm_content=invite_v1&utm_term=hudson
 */

export type Attribution = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  landing_page: string | null;
  referrer: string | null;
  attribution_captured_at: string | null;
};

const STORAGE_KEY = "cc_attribution_v1";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

const clean = (v: string | null | undefined): string | null => {
  if (!v) return null;
  const s = String(v).trim().slice(0, 300);
  return s.length ? s : null;
};

const safeGet = (): Attribution | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution;
    if (!parsed || typeof parsed !== "object") return null;
    const ts = parsed.attribution_captured_at ? Date.parse(parsed.attribution_captured_at) : NaN;
    if (!Number.isNaN(ts) && Date.now() - ts > MAX_AGE_MS) return null; // stale → allow re-capture
    return parsed;
  } catch {
    return null;
  }
};

const safeSet = (value: Attribution) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode) — attribution is best-effort */
  }
};

/**
 * Called on every route change. First-touch: never overwrites a stored,
 * non-stale attribution record.
 */
export const captureAttribution = (): void => {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const utms: Partial<Attribution> = {};
  let hasUtm = false;
  for (const key of UTM_KEYS) {
    const v = clean(params.get(key));
    if (v) hasUtm = true;
    utms[key] = v;
  }

  const referrer = clean(
    typeof document !== "undefined" && document.referrer && !document.referrer.includes(window.location.host)
      ? document.referrer
      : null,
  );

  // Nothing worth recording
  if (!hasUtm && !referrer) return;

  const existing = safeGet();
  // First-touch: keep the original unless it's missing or expired.
  if (existing) {
    const hasExistingSignal =
      UTM_KEYS.some((k) => existing[k]) || existing.referrer || existing.landing_page;
    if (hasExistingSignal) return;
  }

  safeSet({
    utm_source: utms.utm_source ?? null,
    utm_medium: utms.utm_medium ?? null,
    utm_campaign: utms.utm_campaign ?? null,
    utm_content: utms.utm_content ?? null,
    utm_term: utms.utm_term ?? null,
    landing_page: clean(window.location.pathname + window.location.search),
    referrer,
    attribution_captured_at: new Date().toISOString(),
  });
};

/** Returns stored attribution, or all-null fields when none exists. */
export const getAttribution = (): Attribution => {
  const stored = safeGet();
  return {
    utm_source: stored?.utm_source ?? null,
    utm_medium: stored?.utm_medium ?? null,
    utm_campaign: stored?.utm_campaign ?? null,
    utm_content: stored?.utm_content ?? null,
    utm_term: stored?.utm_term ?? null,
    landing_page: stored?.landing_page ?? null,
    referrer: stored?.referrer ?? null,
    attribution_captured_at: stored?.attribution_captured_at ?? null,
  };
};

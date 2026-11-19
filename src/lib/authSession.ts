import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** How long we keep trying to restore a saved sign-in before showing "signed out". */
export const SESSION_RECOVERY_WINDOW_MS = 30_000;
const RETRY_EVERY_MS = 3_000;
const FIRST_ANSWER_MS = 5_000;

/** True when this device still holds a saved sign-in (with a renewal token). */
export function hasSavedSession(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !/^sb-.+-auth-token$/.test(key)) continue;
      const parsed = JSON.parse(localStorage.getItem(key) || "null");
      if (parsed && typeof parsed.refresh_token === "string" && parsed.refresh_token) return true;
    }
  } catch {
    /* storage blocked or unreadable */
  }
  return false;
}

/**
 * Reports the signed-in user to `onChange`.
 * A missing session only counts as signed out when the member actually signed
 * out, or this device has no saved sign-in. While a saved sign-in exists we keep
 * retrying (device waking up, slow network, token renewal in progress) instead
 * of showing the "please sign in" screen.
 */
export function watchSessionUser(onChange: (user: User | null) => void): () => void {
  let active = true;
  let state: "unknown" | "in" | "out" = "unknown";
  let retry: ReturnType<typeof setInterval> | undefined;
  const startedAt = Date.now();

  const stopRetry = () => {
    if (retry) clearInterval(retry);
    retry = undefined;
  };
  const setIn = (user: User) => {
    if (!active) return;
    state = "in";
    stopRetry();
    onChange(user);
  };
  const setOut = () => {
    if (!active) return;
    state = "out";
    stopRetry();
    onChange(null);
  };

  const noSessionFound = () => {
    if (!active || state !== "unknown") return;
    if (!hasSavedSession() || Date.now() - startedAt >= SESSION_RECOVERY_WINDOW_MS) {
      setOut();
    } else if (!retry) {
      retry = setInterval(tick, RETRY_EVERY_MS);
    }
  };

  const check = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session?.user) {
        setIn(data.session.user);
        return;
      }
    } catch {
      /* network blip — handled below */
    }
    noSessionFound();
  };

  function tick() {
    if (!active || state !== "unknown") return stopRetry();
    if (Date.now() - startedAt >= SESSION_RECOVERY_WINDOW_MS) return setOut();
    void check();
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (!active) return;
    // Defer out of the auth callback to avoid auth-lock deadlocks.
    if (session?.user) {
      const user = session.user;
      setTimeout(() => setIn(user), 0);
    } else if (event === "SIGNED_OUT") {
      setTimeout(setOut, 0);
    }
  });

  void check();
  const firstAnswer = setTimeout(() => {
    if (state === "unknown") noSessionFound();
  }, FIRST_ANSWER_MS);

  // Coming back online / to the tab: try again if we're not showing a member yet.
  const recheck = () => {
    if (state !== "in" && hasSavedSession()) void check();
  };
  const onVisible = () => {
    if (document.visibilityState === "visible") recheck();
  };
  window.addEventListener("online", recheck);
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    active = false;
    stopRetry();
    clearTimeout(firstAnswer);
    subscription.unsubscribe();
    window.removeEventListener("online", recheck);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

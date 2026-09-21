import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Keeps a signed-in member signed in until they explicitly sign out.
 * The Supabase client auto-refreshes tokens while a tab is active, but a tab
 * that was backgrounded / a device that was asleep can come back with an
 * expired access token. Here we proactively refresh whenever the app becomes
 * visible again, regains focus, or reconnects to the network.
 */
const SessionKeepAlive = () => {
  useEffect(() => {
    let refreshing = false;
    let lastCheck = 0;

    // IMPORTANT: never call supabase.auth.refreshSession() manually here.
    // Refresh tokens are single-use: a manual refresh racing with the client's
    // own auto-refresh (or with another open tab) makes the server reject the
    // second call with "refresh_token_already_used", which signs the member out.
    // getSession() uses the client's internal lock and refreshes only if needed.
    const ensureSession = async () => {
      if (refreshing) return;
      if (Date.now() - lastCheck < 30 * 1000) return; // debounce event storms
      refreshing = true;
      lastCheck = Date.now();
      try {
        await supabase.auth.getSession();
      } catch (err) {
        // Network blip — keep the existing session, try again on next event.
        console.warn("Session check skipped:", err);
      } finally {
        refreshing = false;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") ensureSession();
    };

    ensureSession();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", ensureSession);
    window.addEventListener("online", ensureSession);

    // Safety net for long-lived open tabs.
    const interval = setInterval(ensureSession, 10 * 60 * 1000);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", ensureSession);
      window.removeEventListener("online", ensureSession);
      clearInterval(interval);
    };
  }, []);

  return null;
};

export default SessionKeepAlive;

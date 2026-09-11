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

    const ensureSession = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (!session) return;

        const expiresAt = (session.expires_at ?? 0) * 1000;
        const nearExpiry = expiresAt - Date.now() < 5 * 60 * 1000; // < 5 min left
        if (nearExpiry) {
          await supabase.auth.refreshSession();
        }
      } catch (err) {
        // Network blip — keep the existing session, try again on next event.
        console.warn("Session refresh skipped:", err);
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

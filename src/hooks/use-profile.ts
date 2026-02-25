import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useProfile() {
  const [location, setLocation] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const lastKnownRef = useRef<{ location: string | null; status: string | null }>({ location: null, status: null });

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("location, status")
          .eq("user_id", userId)
          .maybeSingle();
        if (!isMounted) return;
        if (!error && data) {
          lastKnownRef.current = { location: data.location, status: data.status };
          setLocation(data.location ?? null);
          setStatus(data.status ?? null);
        }
        // On error or no data, preserve last known state (don't reset to null)
      } catch (err) {
        console.error("Profile fetch error:", err);
      }
      if (isMounted) setLoading(false);
    };

    // Initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Auth state changes (token refresh, login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          lastKnownRef.current = { location: null, status: null };
          setLocation(null);
          setStatus(null);
        }
      }
    );

    // Safety timeout
    const timeout = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 5000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return { location, status, loading, isActive: status === "active" };
}

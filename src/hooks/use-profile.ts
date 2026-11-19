import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { watchSessionUser } from "@/lib/authSession";

export function useProfile() {
  const [location, setLocation] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const lastKnownRef = useRef<{ location: string | null; status: string | null }>({ location: null, status: null });

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async (userId: string) => {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("location, status")
            .eq("user_id", userId)
            .abortSignal(AbortSignal.timeout(8000))
            .maybeSingle();
          if (!isMounted) return;
          if (!error) {
            if (data) {
              lastKnownRef.current = { location: data.location, status: data.status };
              setLocation(data.location ?? null);
              setStatus(data.status ?? null);
            }
            break;
          }
        } catch (err) {
          console.error("Profile fetch error:", err);
        }
        // On error, keep the last known state and try again shortly
        if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
      }
      if (isMounted) setLoading(false);
    };

    // Only a real sign-out (or no saved sign-in on this device) reports null.
    const stop = watchSessionUser((user) => {
      if (!isMounted) return;
      if (user) {
        fetchProfile(user.id);
      } else {
        lastKnownRef.current = { location: null, status: null };
        setLocation(null);
        setStatus(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      stop();
    };
  }, []);

  return { location, status, loading, isActive: status === "active" };
}

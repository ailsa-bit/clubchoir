import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useProfile() {
  const [location, setLocation] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (session?.user) {
          const { data } = await supabase
            .from("profiles")
            .select("location, status")
            .eq("user_id", session.user.id)
            .maybeSingle();
          if (!isMounted) return;
          setLocation(data?.location ?? null);
          setStatus(data?.status ?? null);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      }
      if (isMounted) setLoading(false);
    };

    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;
        if (session?.user) {
          const { data } = await supabase
            .from("profiles")
            .select("location, status")
            .eq("user_id", session.user.id)
            .maybeSingle();
          if (!isMounted) return;
          setLocation(data?.location ?? null);
          setStatus(data?.status ?? null);
        } else {
          setLocation(null);
          setStatus(null);
        }
      }
    );

    // Safety timeout — don't stay on loading forever
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

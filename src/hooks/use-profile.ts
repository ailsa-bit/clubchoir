import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useProfile() {
  const [location, setLocation] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("location, status")
          .eq("user_id", session.user.id)
          .maybeSingle();
        setLocation(data?.location ?? null);
        setStatus(data?.status ?? null);
      }
      setLoading(false);
    };

    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const { data } = await supabase
            .from("profiles")
            .select("location, status")
            .eq("user_id", session.user.id)
            .maybeSingle();
          setLocation(data?.location ?? null);
          setStatus(data?.status ?? null);
        } else {
          setLocation(null);
          setStatus(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { location, status, loading, isActive: status === "active" };
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useProfile() {
  const [location, setLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("location")
          .eq("user_id", session.user.id)
          .maybeSingle();
        setLocation(data?.location ?? null);
      }
      setLoading(false);
    };

    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const { data } = await supabase
            .from("profiles")
            .select("location")
            .eq("user_id", session.user.id)
            .maybeSingle();
          setLocation(data?.location ?? null);
        } else {
          setLocation(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { location, loading };
}

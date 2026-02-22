import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        if (isMounted) {
          setIsAdmin(!error && !!data);
        }
      } catch {
        if (isMounted) {
          setIsAdmin(false);
        }
      }
    };

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await checkAdmin(currentUser.id);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Set up listener BEFORE init (per Supabase best practices)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          setTimeout(() => {
            if (isMounted) checkAdmin(currentUser.id);
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    init();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, loading, user };
}

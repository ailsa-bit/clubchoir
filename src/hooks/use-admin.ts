import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const loadingSetRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const setLoadingFalse = () => {
      if (isMounted && !loadingSetRef.current) {
        loadingSetRef.current = true;
        setLoading(false);
      }
    };

    const checkAdmin = async (userId: string): Promise<boolean> => {
      try {
        const queryPromise = supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: { message: "timeout" } }), 3000)
        );
        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
        return !error && !!data;
      } catch {
        return false;
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          const admin = await checkAdmin(currentUser.id);
          if (isMounted) setIsAdmin(admin);
        } else {
          setIsAdmin(false);
        }
        setLoadingFalse();
      }
    );

    // Safety timeout - always resolve loading
    const timeout = setTimeout(setLoadingFalse, 5000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return { isAdmin, loading, user };
}

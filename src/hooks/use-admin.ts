import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async (userId: string): Promise<boolean> => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        return !error && !!data;
      } catch {
        return false;
      }
    };

    const handleUser = async (currentUser: any) => {
      if (!isMounted) return;
      setUser(currentUser);
      if (currentUser) {
        const admin = await checkAdmin(currentUser.id);
        if (isMounted) setIsAdmin(admin);
      } else {
        setIsAdmin(false);
      }
      if (isMounted) setLoading(false);
    };

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted || initializedRef.current) return;
      initializedRef.current = true;
      handleUser(session?.user ?? null);
    });

    // 2. Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        if (!initializedRef.current) {
          initializedRef.current = true;
        }
        handleUser(session?.user ?? null);
      }
    );

    // 3. Safety timeout
    const timeout = setTimeout(() => {
      if (isMounted && !initializedRef.current) {
        initializedRef.current = true;
        setLoading(false);
      }
    }, 5000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return { isAdmin, loading, user };
}

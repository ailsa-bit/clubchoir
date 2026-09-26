import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const initializedRef = useRef(false);
  const lastKnownAdminRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async (userId: string): Promise<boolean> => {
      const maxRetries = 2;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const { data, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .eq("role", "admin")
            .maybeSingle();
          if (!error) return !!data;
          // On error, retry after a short delay
          if (attempt < maxRetries) await new Promise(r => setTimeout(r, 500));
        } catch {
          if (attempt < maxRetries) await new Promise(r => setTimeout(r, 500));
        }
      }
      // All retries failed — preserve last known admin state to avoid flashing "pending"
      return lastKnownAdminRef.current;
    };

    const handleUser = async (currentUser: any) => {
      if (!isMounted) return;
      setUser(currentUser);
      if (currentUser) {
        const admin = await checkAdmin(currentUser.id);
        if (isMounted) {
          lastKnownAdminRef.current = admin;
          setIsAdmin(admin);
        }
      } else {
        lastKnownAdminRef.current = false;
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

    // 2. Listen for auth changes (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        if (!initializedRef.current) {
          initializedRef.current = true;
        }
        // Only an explicit sign-out clears the user; ignore transient null sessions.
        if (!session?.user && event !== "SIGNED_OUT") return;
        // Defer DB calls out of the auth callback to avoid auth-lock deadlocks.
        setTimeout(() => handleUser(session?.user ?? null), 0);
      }
    );

    // 3. Safety timeout
    const timeout = setTimeout(() => {
      if (isMounted) {
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

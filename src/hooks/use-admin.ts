import { useState, useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { watchSessionUser } from "@/lib/authSession";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
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
        } catch {
          /* retry below */
        }
        if (attempt < maxRetries) await new Promise((r) => setTimeout(r, 500));
      }
      // All retries failed — preserve last known admin state to avoid flashing "pending"
      return lastKnownAdminRef.current;
    };

    // Only a real sign-out (or no saved sign-in on this device) reports null.
    const stop = watchSessionUser(async (currentUser) => {
      if (!isMounted) return;
      setUser(currentUser);
      if (currentUser) {
        const admin = await checkAdmin(currentUser.id);
        if (!isMounted) return;
        lastKnownAdminRef.current = admin;
        setIsAdmin(admin);
      } else {
        lastKnownAdminRef.current = false;
        setIsAdmin(false);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      stop();
    };
  }, []);

  return { isAdmin, loading, user };
}

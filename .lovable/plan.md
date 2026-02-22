
# Fix: Restore useAdmin Hook With Reliable Session Check

## Problem
The `useAdmin` hook was refactored multiple times and ended up broken. It currently:
1. Only uses `onAuthStateChange` (no initial session fetch)
2. Has a 5-second safety timeout that fires before auth resolves, setting `user = null`
3. This makes the app think you're logged out, hiding admin features and non-active members

## Solution
Rewrite `useAdmin` with a simple, proven pattern:

1. Call `supabase.auth.getSession()` on mount to get the current session immediately
2. Check admin role, then set loading to false
3. Listen to `onAuthStateChange` for future login/logout events
4. Keep a small safety timeout (5s) as a last resort

## Single File Change

**`src/hooks/use-admin.ts`** - Replace entirely with:

```typescript
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
        // If this fires before getSession, use it as init
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
```

## What This Fixes
- Community page: Admin sees all member statuses (active, inactive, prospect, trial)
- Community page: Payment filter appears for admin
- Chat page: Recognizes logged-in user, no more "Members Only" block
- No more 5-second loading delay

## Why This Will Work
The previous RLS fix (permissive policies) already solved the database access issue. This fix ensures the frontend correctly reads the auth session on page load, rather than waiting for an event that may never come.

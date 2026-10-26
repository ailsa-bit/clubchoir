import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function usePrivateMemberNotes() {
  const [canViewNotes, setCanViewNotes] = useState(false);
  useEffect(() => {
    let live = true;
    const check = async () => {
      const { data, error } = await supabase.rpc("can_manage_private_member_notes");
      if (live) setCanViewNotes(!error && data === true);
    };
    void check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { void check(); });
    return () => { live = false; subscription.unsubscribe(); };
  }, []);
  return canViewNotes;
}
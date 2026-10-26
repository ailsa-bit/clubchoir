import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function usePrivateMemberNotes() {
  const [canViewNotes, setCanViewNotes] = useState(false);
  useEffect(() => {
    let live = true;
    let generation = 0;
    const check = async () => {
      const current = ++generation;
      const { data, error } = await supabase.rpc("can_manage_private_member_notes");
      if (live && current === generation) setCanViewNotes(!error && data === true);
    };
    void check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      generation++;
      setCanViewNotes(false);
      setTimeout(() => { if (live) void check(); }, 0);
    });
    return () => { live = false; subscription.unsubscribe(); };
  }, []);
  return canViewNotes;
}
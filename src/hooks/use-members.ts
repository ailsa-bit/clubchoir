import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Member {
  firstName: string;
  lastName: string;
  location: string;
  status: "ACTIVE" | "INACTIVE" | "PROSPECT" | "TRIAL";
  joined: string;
  lastSession: string;
  paymentStatus: string;
  notes: string;
}

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    const load = async () => {
      const { data } = await supabase.from("members").select("first_name,last_name,location,status,joined,last_session");
      if (!live) return;
      setMembers((data || []).map(m => ({ firstName: m.first_name, lastName: m.last_name, location: m.location, status: m.status as Member["status"], joined: m.joined || "", lastSession: m.last_session || "", paymentStatus: "", notes: "" })));
      setLoading(false);
    };
    void load();
    return () => { live = false; };
  }, []);

  return { members, loading };
}


import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";

type Guest = { name: string; email: string; created_at: string };

// Aug 18, 2026 Hudson Open House only. The dedicated /hudson-open-house page launched
// Aug 8, 2026 — anything Hudson-related before that belongs to the previous open house.
const CUTOFF = new Date("2026-08-08T00:00:00-04:00").getTime();
const AUG18_CAMPAIGN = "hudson_open_house_aug18";

const isAug18Hudson = (r: {
  landing_page?: string | null;
  source_campaign?: string | null;
  utm_campaign?: string | null;
  created_at?: string | null;
}) => {
  const campaign = `${r.utm_campaign || ""} ${r.source_campaign || ""}`.toLowerCase();
  if (campaign.includes(AUG18_CAMPAIGN)) return true;
  const landing = (r.landing_page || "").toLowerCase();
  const onHudsonPage = landing.includes("/hudson-open-house") || landing.includes("/fr/hudson-open-house");
  return onHudsonPage && +new Date(r.created_at || 0) >= CUTOFF;
};


const HudsonGuestList = () => {
  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState<Guest[]>([]);

  useEffect(() => {
    (async () => {
      const [a, b] = await Promise.all([
        supabase
          .from("open_house_rsvps")
          .select("first_name,last_name,email,location,landing_page,source_campaign,created_at"),
        supabase
          .from("session_registrations")
          .select("first_name,last_name,email,location,landing_page,created_at")
          .eq("session_label", "open-house-2026"),
      ]);
      const rows = [...((a.data as any[]) || []), ...((b.data as any[]) || [])]
        .filter(isHudson)
        .map((r) => ({
          name: `${r.first_name || ""} ${r.last_name || ""}`.trim() || "—",
          email: (r.email || "").trim(),
          created_at: r.created_at,
        }));
      const seen = new Set<string>();
      const unique = rows.filter((r) => {
        const k = `${r.name.toLowerCase()}|${r.email.toLowerCase()}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      unique.sort((x, y) => x.name.localeCompare(y.name));
      setGuests(unique);
      setLoading(false);
    })();
  }, []);

  const csv = useMemo(() => {
    const esc = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
    return ["Name,Email", ...guests.map((g) => `${esc(g.name)},${esc(g.email)}`)].join("\n");
  }, [guests]);

  const download = () => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hudson-open-house-guest-list-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="font-heading font-bold text-lg">Hudson Open House guest list</h2>
          <Badge variant="outline">{guests.length} guests</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={download} disabled={guests.length === 0}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : guests.length === 0 ? (
        <p className="text-sm text-muted-foreground">No RSVPs yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 font-medium">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {guests.map((g, i) => (
                <tr key={i}>
                  <td className="py-2 pr-4 text-foreground">{g.name}</td>
                  <td className="py-2 text-muted-foreground break-all">{g.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HudsonGuestList;

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Music, Calendar, Star, PartyPopper, Clock, MapPin, ArrowLeft, Upload } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { format, parseISO, isThisWeek, isFuture, isPast } from "date-fns";
import AdminScheduleUpload from "@/components/AdminScheduleUpload";

interface SessionRow {
  id: string;
  week: string;
  location: string;
  session_date: string;
  activity: string;
  artist: string | null;
}

const locationMeta: Record<string, { dot: string; bg: string; venue: string; day: string; time: string; address: string }> = {
  "Montreal": { dot: "bg-pink", bg: "bg-pink-light border-pink/20", venue: "Kensington – Kensington Room", day: "Monday", time: "7:00–8:30 PM", address: "6225 Av. Godfrey" },
  "Hudson": { dot: "bg-orange", bg: "bg-orange-light border-orange/20", venue: "Kingfisher Pub", day: "Monday", time: "7:00–8:30 PM", address: "84 Cameron, Hudson, J0P 1H0" },
  "Arundel": { dot: "bg-aqua", bg: "bg-aqua-light border-aqua/20", venue: "Centre Arundel Centre", day: "Tuesday", time: "6:30–8:00 PM", address: "17 rue du Village, Arundel" },
  "Saint-Hubert": { dot: "bg-lime", bg: "bg-lime-light border-lime/20", venue: "St-Gabriel Catholic Church", day: "Wednesday", time: "7:00–8:30 PM", address: "5070 Rue Gilbert, Saint-Hubert" },
  "Pointe-Claire": { dot: "bg-purple", bg: "bg-purple-light border-purple/20", venue: "Valois United Church", day: "Thursday", time: "7:00–8:30 PM", address: "70 Belmont Ave, Pointe-Claire" },
};

function getSessionType(activity: string): "song" | "review" | "show" | "off" {
  if (activity === "REVIEW WEEK") return "review";
  if (activity === "Show Night") return "show";
  if (activity === "No Practice" || activity.startsWith("CANCELLED")) return "off";
  return "song";
}

function getSessionIcon(type: string) {
  switch (type) {
    case "review": return <Star className="w-4 h-4" />;
    case "show": return <PartyPopper className="w-4 h-4" />;
    case "song": return <Music className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
}

function getSessionLabel(type: string) {
  switch (type) {
    case "review": return "Review Week";
    case "show": return "Show Night";
    case "off": return "No Practice";
    default: return "New Song";
  }
}

const LocationSchedule = () => {
  const { locationSlug } = useParams<{ locationSlug: string }>();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const { isAdmin } = useAdmin();

  const locationName = locationSlug
    ? locationSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("-")
    : "";

  const meta = locationMeta[locationName];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    }).catch(() => {
      setAuthed(false);
    });
  }, []);

  useEffect(() => {
    if (!authed || !locationName) return;
    supabase
      .from("location_sessions")
      .select("*")
      .eq("location", locationName)
      .order("session_date", { ascending: true })
      .then(({ data }) => {
        setSessions((data as SessionRow[]) || []);
        setLoading(false);
      });
  }, [authed, locationName]);

  if (authed === null) return (
    <div className="py-16 px-4 text-center">
      <p className="text-muted-foreground text-sm">Loading…</p>
    </div>
  );

  if (!authed) {
    return (
      <div className="py-16 px-4 text-center">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-heading font-bold text-2xl text-foreground mb-2">Members Only</h1>
        <p className="text-muted-foreground mb-6">Sign in to view the session schedule.</p>
        <Link to="/profile" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
          Sign In
        </Link>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="py-16 px-4 text-center">
        <h1 className="font-heading font-bold text-2xl text-foreground mb-2">Location not found</h1>
        <Link to="/this-week" className="text-primary hover:underline">Back to This Week</Link>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <Link to="/this-week" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to This Week
        </Link>

        <div className={`rounded-2xl border p-6 mb-8 ${meta.bg}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-3 h-3 rounded-full ${meta.dot}`} />
            <h1 className="font-heading font-bold text-2xl text-foreground">{locationName}</h1>
          </div>
          <p className="text-sm font-medium text-foreground/80 mb-2">{meta.venue}</p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{meta.day} · {meta.time}</span>
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{meta.address}</span>
          </div>
        </div>

        {isAdmin && (
          <div className="mb-6">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              <Upload className="w-4 h-4" /> Upload Schedule CSV
            </button>
            {showUpload && (
              <AdminScheduleUpload
                onComplete={() => {
                  setShowUpload(false);
                  // Refresh
                  supabase
                    .from("location_sessions")
                    .select("*")
                    .eq("location", locationName)
                    .order("session_date", { ascending: true })
                    .then(({ data }) => setSessions((data as SessionRow[]) || []));
                }}
              />
            )}
          </div>
        )}

        <h2 className="font-heading font-bold text-lg text-foreground mb-4">Season Schedule</h2>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading schedule…</p>
        ) : sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No sessions scheduled yet.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => {
              const type = getSessionType(s.activity);
              const date = parseISO(s.session_date);
              const isCurrentWeek = isThisWeek(date, { weekStartsOn: 1 });
              const past = isPast(date) && !isCurrentWeek;

              return (
                <div
                  key={s.id}
                  className={`rounded-xl border p-4 flex items-start gap-3 transition-all ${
                    isCurrentWeek
                      ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                      : past
                      ? "opacity-50 bg-muted/30 border-border"
                      : "bg-card border-border"
                  }`}
                >
                  <div className={`mt-0.5 p-1.5 rounded-lg ${
                    type === "review" ? "bg-secondary/15 text-secondary" :
                    type === "show" ? "bg-primary/15 text-primary" :
                    type === "off" ? "bg-muted text-muted-foreground" :
                    "bg-accent/15 text-accent-foreground"
                  }`}>
                    {getSessionIcon(type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-muted-foreground">{s.week}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{format(date, "EEE, MMM d")}</span>
                      {isCurrentWeek && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          This Week
                        </span>
                      )}
                    </div>
                    <p className="font-heading font-bold text-foreground text-sm mt-0.5">
                      {type === "song" ? (
                        (() => {
                          const cleanTitle = s.activity.replace(/^\d+-/, "").trim();
                          // Use first 2 words as search query so variants (e.g. "O'Mine" vs "O' Mine") all match
                          const searchTerm = cleanTitle.split(/[\s/]+/).slice(0, 2).join(" ");
                          return (
                            <Link
                              to={`/resources?search=${encodeURIComponent(searchTerm)}`}
                              className="hover:underline text-primary"
                            >
                              {cleanTitle}
                              <Music className="w-3 h-3 inline ml-1 opacity-60" />
                            </Link>
                          );
                        })()
                      ) : (
                        s.activity
                      )}
                    </p>
                    {s.artist && type !== "off" && (
                      <p className="text-xs text-muted-foreground mt-0.5">{s.artist}</p>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap ${
                    type === "review" ? "bg-secondary/15 text-secondary" :
                    type === "show" ? "bg-primary/15 text-primary" :
                    type === "off" ? "bg-muted text-muted-foreground" :
                    "bg-accent/15 text-accent-foreground"
                  }`}>
                    {getSessionLabel(type)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSchedule;

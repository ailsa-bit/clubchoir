import { Music, MapPin, Clock } from "lucide-react";

const sessions = [
  { location: "Montreal", day: "Tuesday", time: "7:00 PM", address: "123 Rue Sainte-Catherine", dot: "bg-pink", bg: "bg-pink-light border-pink/20" },
  { location: "Arundel", day: "Wednesday", time: "7:30 PM", address: "45 Chemin du Village", dot: "bg-aqua", bg: "bg-aqua-light border-aqua/20" },
  { location: "St-Hubert", day: "Thursday", time: "6:30 PM", address: "789 Montée St-Hubert", dot: "bg-lime", bg: "bg-lime-light border-lime/20" },
  { location: "Pointe-Claire", day: "Thursday", time: "7:00 PM", address: "321 Lakeshore Road", dot: "bg-purple", bg: "bg-purple-light border-purple/20" },
];

const ThisWeek = () => {
  return (
    <div className="py-16 px-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2 text-center">
          This Week at Choir
        </h1>
        <p className="text-center text-muted-foreground mb-10">
          Find your session and come sing with us.
        </p>

        <div className="space-y-4">
          {sessions.map((s) => (
            <div key={s.location} className={`rounded-2xl border p-6 ${s.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 rounded-full ${s.dot}`} />
                <h3 className="font-heading font-bold text-lg text-foreground">{s.location}</h3>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{s.day} · {s.time}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{s.address}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 text-center">
          <Music className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-heading font-bold text-foreground mb-1">What to expect</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            No auditions, no sheet music. Just show up, warm up, and sing your heart out with a room full of good people.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThisWeek;

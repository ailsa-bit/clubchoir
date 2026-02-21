import { Link } from "react-router-dom";
import { Users, UserPlus, Calendar, Sparkles } from "lucide-react";
import { useMembers } from "@/hooks/use-members";

const Index = () => {
  const { members } = useMembers();

  const activeCountByLocation = members
    .filter((m) => m.status === "ACTIVE")
    .reduce<Record<string, number>>((acc, m) => {
      acc[m.location] = (acc[m.location] || 0) + 1;
      return acc;
    }, {});
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-hero py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-4 animate-fade-in">
            Your Club Choir Space
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Warm voices, real connections. Whether you're a seasoned singer or just curious — there's a spot for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Link
              to="/try"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-warm text-primary-foreground font-semibold text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Try a Session
            </Link>
            <Link
              to="/bring-a-friend"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-secondary text-secondary-foreground font-semibold text-base shadow hover:shadow-lg hover:scale-105 transition-all"
            >
              <UserPlus className="w-5 h-5" />
              Bring a Friend
            </Link>
          </div>
        </div>
      </section>

      {/* This Week Preview */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-8 text-center">
            This Week at Club Choir
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
              { location: "Montreal", color: "bg-pink-light border-pink/20", day: "Monday", time: "7:00–8:30 PM", dates: "Feb 2 – May 4", dot: "bg-pink" },
              { location: "Arundel", color: "bg-aqua-light border-aqua/20", day: "Tuesday", time: "6:30–8:00 PM", dates: "Feb 17 – May 26", dot: "bg-aqua" },
              { location: "Saint-Hubert", color: "bg-secondary border-secondary/20", day: "Wednesday", time: "7:00–8:30 PM", dates: "Feb 4 – May 13", dot: "bg-foreground" },
              { location: "Pointe-Claire", color: "bg-purple-light border-purple/20", day: "Thursday", time: "7:00–8:30 PM", dates: "Feb 5 – May 7", dot: "bg-purple" },
            ].map((item) => (
              <div
                key={item.location}
                className={`rounded-2xl border p-5 ${item.color} transition-shadow hover:shadow-md`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.dot}`} />
                  <span className="font-heading font-bold text-foreground">{item.location}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.day} · {item.time}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.dates}
                </p>
                {activeCountByLocation[item.location] != null && (
                  <p className="text-xs font-semibold text-foreground mt-2 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {activeCountByLocation[item.location]} active members
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-8 text-center">
            Club Choir Community
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              to="/events"
              className="group rounded-2xl border border-border bg-card p-6 hover:shadow-md transition-all"
            >
              <Calendar className="w-8 h-8 text-aqua mb-3" />
              <h3 className="font-heading font-bold text-lg text-foreground mb-1">Club Choir Events</h3>
              <p className="text-sm text-muted-foreground">PorchFest, themed nights, pop-up singalongs & more.</p>
            </Link>
            <Link
              to="/corporate"
              className="group rounded-2xl border border-border bg-card p-6 hover:shadow-md transition-all"
            >
              <Users className="w-8 h-8 text-purple mb-3" />
              <h3 className="font-heading font-bold text-lg text-foreground mb-1">Corporate & Private Events</h3>
              <p className="text-sm text-muted-foreground">Team-building singing experiences for your company.</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

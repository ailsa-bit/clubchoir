import { Calendar, MapPin, Share2 } from "lucide-react";

const events = [
  {
    title: "PorchFest Montreal",
    date: "March 15, 2026",
    location: "Montreal",
    color: "border-pink/30 bg-pink-light",
    dot: "bg-pink",
    description: "Bring your voice to the streets! Join us for an outdoor singalong as part of Montreal's beloved PorchFest.",
  },
  {
    title: "80s Night Choir",
    date: "March 22, 2026",
    location: "Pointe-Claire",
    color: "border-purple/30 bg-purple-light",
    dot: "bg-purple",
    description: "Neon optional, enthusiasm required. A themed evening of classic 80s hits sung together.",
  },
  {
    title: "Spring Pop-Up Singalong",
    date: "April 5, 2026",
    location: "Arundel",
    color: "border-aqua/30 bg-aqua-light",
    dot: "bg-aqua",
    description: "A casual outdoor singalong to welcome the warmer weather. Open to everyone!",
  },
  {
    title: "Seasonal Showcase",
    date: "April 18, 2026",
    location: "St-Hubert",
    color: "border-lime/20 bg-lime-light",
    dot: "bg-lime",
    description: "Our seasonal show celebrating what we've been working on. Friends and family welcome.",
  },
];

const Events = () => {
  const handleShare = (title: string) => {
    if (navigator.share) {
      navigator.share({ title: `Club Choir: ${title}`, text: `Check out ${title} at Club Choir!` });
    }
  };

  return (
    <div className="py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2 text-center">
          Club Choir Events
        </h1>
        <p className="text-center text-muted-foreground mb-10 max-w-lg mx-auto">
          Special events beyond our weekly rehearsals — come sing, connect, and celebrate together.
        </p>

        <div className="grid sm:grid-cols-2 gap-5">
          {events.map((event) => (
            <div
              key={event.title}
              className={`rounded-2xl border p-6 ${event.color} transition-shadow hover:shadow-md`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2.5 h-2.5 rounded-full ${event.dot}`} />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {event.location}
                </span>
              </div>
              <h3 className="font-heading font-bold text-lg text-foreground mb-1">{event.title}</h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {event.date}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {event.location}
                </span>
              </div>
              <p className="text-sm text-foreground/80 mb-4">{event.description}</p>
              <button
                onClick={() => handleShare(event.title)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Events;

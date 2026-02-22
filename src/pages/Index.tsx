import { Link } from "react-router-dom";
import { Users, UserPlus, Calendar, Sparkles, Star, ExternalLink, MessageCircle } from "lucide-react";
import { useMembers } from "@/hooks/use-members";

const testimonials = [
  { name: "Ron Cole", stars: 5, text: "As a ski instructor, I know the effort and skill required to take charge of a group of beginners and lead them as one unit in a successful and joyous direction. Ailsa is gifted in this capacity. Singing is one of the few activities that light up so many parts of the brain at once... a great way to keep the mind sharp." },
  { name: "Sonia Klebanskyj", stars: 5, text: "ClubChoir is so much fun! Ailsa Pehi is a wonderful choir director for a novice choir singer or for people who want to rediscover the joy of singing. Join and you won't be disappointed!" },
  { name: "Claude Aimée Villeneuve", stars: 5, text: "I love the way Ailsa has an interesting way of teaching the songs so that anyone who just loves singing can enjoy themselves right away, no need to know how to read music or have previous choir experience. It's fun, the vibes are upbeat!" },
  { name: "Claudine Turnbull", stars: 5, text: "I'm so thankful to my friend for encouraging me to join Club Choir! Ailsa instantly makes you feel comfortable and brings amazing energy every week. It's truly become my weekly happiness boost!" },
  { name: "Martin Leclerc", stars: 5, text: "Great, contagious energy from Ailsa, leading the choir through fun singing! Very happy with the repertoire, the people, the arrangement and the simple enjoyment of it all." },
  { name: "Lori Cook", stars: 5, text: "Ailsa has made my first choir experience a very positive one. I have met some great people and have gained confidence in my singing abilities." },
  { name: "Lydia Woronchak", stars: 5, text: "You don't have to be a great singer to be in Club Choir and you don't even have to audition. All you have to do is love to sing! You're guaranteed to have fun, meet new people and leave feeling joyful!" },
  { name: "Danielle Jasmin", stars: 5, text: "J'ai beaucoup apprécié Ailsa. Une maître choeur dynamique, qui connaît sa musique, ses chansons. Une très bonne approche pédagogique qui fait que tout le monde apprend en s'amusant !" },
  { name: "Kerry Johnson", stars: 5, text: "ClubChoir is awesome! It's a fantastic way to bring people together, celebrate community, and share the love of music in a welcoming space where everyone can sing, no experience required. Every session is filled with laughter and connection. A truly uplifting and fun experience!" },
];

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
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-border bg-card text-foreground font-semibold text-base shadow hover:shadow-lg hover:scale-105 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              Contact Us
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

      {/* Testimonials */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-2 text-center">
            What Our Members Say
          </h2>
          <p className="text-center text-muted-foreground mb-10">All 5-star reviews from Google</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{t.text}</p>
                <p className="mt-auto font-heading font-bold text-sm text-foreground">{t.name}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <a
              href="https://g.page/r/CU1hiLJTYmtXEAE/review"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-warm text-primary-foreground font-semibold text-sm shadow hover:shadow-lg hover:scale-105 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Leave Us a Review on Google
            </a>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 px-4">
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

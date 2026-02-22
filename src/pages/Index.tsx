import { Link } from "react-router-dom";
import { Users, UserPlus, Calendar, Sparkles, Star, ExternalLink, MessageCircle, Facebook } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-hero py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-4 animate-fade-in">
            Your Club Choir Space
          </h1>
          <p className="text-lg text-muted-foreground mb-2 max-w-xl mx-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Ever thought about joining a choir, but worried you "can't sing" or wouldn't fit in? That's exactly why Club Choir exists.
          </p>
          <p className="text-base text-muted-foreground mb-8 max-w-xl mx-auto animate-fade-in" style={{ animationDelay: "0.15s" }}>
            Our weekly sessions are for everyone — no auditions, no pressure, and no experience required. Sing together, laugh together, learn together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Link
              to="/try"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-warm text-primary-foreground font-semibold text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Try a Session / Get More Info
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

      {/* Sessions Overview */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-8 text-center">
            Where & When We Sing
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { location: "Montreal", venue: "Kensington Room", color: "bg-pink-light border-pink/20", day: "Monday", time: "7:00–8:30 PM", dot: "bg-pink" },
              { location: "Arundel", venue: "Centre Arundel Centre", color: "bg-aqua-light border-aqua/20", day: "Tuesday", time: "6:30–8:00 PM", dot: "bg-aqua" },
              { location: "Saint-Hubert", venue: "St-Gabriel Catholic Church", color: "bg-secondary border-secondary/20", day: "Wednesday", time: "7:00–8:30 PM", dot: "bg-foreground" },
              { location: "Pointe-Claire", venue: "Valois United Church", color: "bg-purple-light border-purple/20", day: "Thursday", time: "7:00–8:30 PM", dot: "bg-purple" },
            ].map((item) => (
              <div
                key={item.location}
                className={`rounded-2xl border p-5 ${item.color} transition-shadow hover:shadow-md`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.dot}`} />
                  <span className="font-heading font-bold text-foreground">{item.location}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  {item.day} · {item.time}
                </p>
                <p className="text-xs text-muted-foreground">{item.venue}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            <span className="font-semibold text-foreground">$280</span> per 14-week session · Winter session starting February · Fall session starting September
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-2 text-center">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-muted-foreground mb-10">Everything you need to know before your first session</p>
          <Accordion type="single" collapsible className="space-y-3">
            {[
              { q: "How much does it cost?", a: "Each 14-week session is $280. We run a Winter session starting in February and a Fall session starting in September." },
              { q: "Do I need to know how to read music?", a: "Not at all! Most of us learn by ear. Sheet music is there if you want it, but you can absolutely just show up and sing your heart out." },
              { q: "I'm shy — can I still join?", a: "One hundred percent! Club Choir is all about encouragement, laughter, and zero pressure. Sing quietly, sing loudly, or just hum along until you're ready to belt it out." },
              { q: "What if I can't make it every week?", a: "No stress — life happens! If you miss a session, we have resources to help you catch up, and our members are always happy to get you back in the groove." },
              { q: "Do I need to audition?", a: "No auditions and no experience needed. If you can sing in the shower, you're more than qualified." },
              { q: "What kind of music do you sing?", a: "Everything from pop classics to hidden gems. If it's fun to sing, it's on our list." },
              { q: "What should I bring to a session?", a: "Just yourself, your voice, and your sense of humour. We provide the good vibes." },
              { q: "What if I'm not a good singer?", a: "Club Choir is about progress, not perfection. If you love to sing, you belong here — it's that simple." },
            ].map((item) => (
              <AccordionItem key={item.q} value={item.q} className="rounded-2xl border border-border bg-card px-5">
                <AccordionTrigger className="font-heading font-bold text-foreground text-left hover:no-underline py-4">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="text-center mt-10">
            <p className="text-muted-foreground mb-4">Still have questions?</p>
            <Link
              to="/try"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-warm text-primary-foreground font-semibold text-sm shadow hover:shadow-lg hover:scale-105 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4">
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

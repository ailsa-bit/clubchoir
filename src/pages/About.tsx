import { Link } from "react-router-dom";
import { Sparkles, Calendar, Users } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import founderPhoto from "@/assets/founder-ailsa.jpg";

const About = () => {
  return (
    <div>
      <PageMeta
        title="Our Story – Club Choir | Founder Ailsa Pehi"
        description="Meet Ailsa Pehi, founder of Club Choir. From Māori roots in New Zealand to community choirs across Quebec — sing together, laugh together, learn together."
        path="/about"
      />

      {/* Hero */}
      <section className="bg-gradient-hero py-14 lg:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="text-center lg:text-left">
              <p className="text-sm font-bold uppercase tracking-wider text-primary mb-3">
                Our Story
              </p>
              <h1 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-foreground mb-5 leading-tight">
                Sing together. Laugh together. Learn together.
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                A community choir built on Māori roots, lifelong music, and the simple belief that
                everyone deserves to sing.
              </p>
              <p className="font-heading text-xl text-foreground italic">
                — Ailsa Pehi, Founder & Choir Director
              </p>
            </div>
            <div className="rounded-3xl overflow-hidden shadow-xl border border-border">
              <img
                src={founderPhoto}
                alt="Ailsa Pehi, founder of Club Choir, recording in a studio"
                className="w-full h-auto object-cover"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Story body */}
      <section className="py-14 px-4">
        <div className="container mx-auto max-w-3xl space-y-6 text-base md:text-lg text-foreground leading-relaxed">
          <p>
            As the Founder and Choir Director of Club Choir, my roots in music run deep. I was born
            in New Zealand into a Māori family where singing wasn't a hobby — it was the language
            of celebration, grief, welcome, and prayer. From a young age I learned that voices
            woven together can hold a room, and a community.
          </p>
          <p>
            That foundation carried me through years of performing, teaching, and directing. When I
            settled in Quebec, I noticed how many people quietly believed they "couldn't sing" —
            not because they lacked the voice, but because no one had ever invited them in. Club
            Choir is that invitation.
          </p>

          <blockquote className="my-10 border-l-4 border-primary pl-6 py-2">
            <p className="font-heading text-xl md:text-2xl text-foreground italic leading-snug">
              We champion progress over perfection.
            </p>
          </blockquote>

          <p>
            What began in 2021 with just 21 voices has grown into a community of 184 singers across
            five locations — Montreal, Hudson, Arundel, Saint-Hubert and Pointe-Claire — with a
            new Hudson chapter launching in summer 2026. To bring a dynamic, live energy to our
            rehearsals, I'm joined by talented local musicians at each location, ensuring every
            session feels like a shared performance.
          </p>
          <p>
            Our approach focuses on making music accessible and low-pressure. We learn by ear and
            provide flexible resources for those weeks when life gets a little too loud. Above
            all, we champion progress over perfection. Our philosophy is simple:{" "}
            <span className="font-bold text-primary">
              Sing together. Laugh together. Learn together.
            </span>
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="py-12 px-4 bg-muted/50">
        <div className="container mx-auto max-w-5xl">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div className="rounded-2xl bg-card border border-border p-6">
              <p className="font-heading font-bold text-4xl text-primary mb-1">2021</p>
              <p className="text-sm text-muted-foreground">Founded with 21 voices</p>
            </div>
            <div className="rounded-2xl bg-card border border-border p-6">
              <p className="font-heading font-bold text-4xl text-primary mb-1">184</p>
              <p className="text-sm text-muted-foreground">Singers and growing</p>
            </div>
            <div className="rounded-2xl bg-card border border-border p-6">
              <p className="font-heading font-bold text-4xl text-primary mb-1">5</p>
              <p className="text-sm text-muted-foreground">Locations across Quebec</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-3">
            Come sing with us
          </h2>
          <p className="text-base text-muted-foreground mb-7">
            No audition. No experience required. Just show up.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/try"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold shadow hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Try a session
            </Link>
            <Link
              to="/events"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-secondary text-secondary-foreground font-semibold shadow hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              <Calendar className="w-5 h-5" />
              Upcoming events
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;

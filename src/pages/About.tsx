import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Calendar, Users, Heart } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import founderPhoto from "@/assets/founder-ailsa.webp";

const About = () => {
  return (
    <div className="py-12 px-4">
      <PageMeta
        title="Our Story – Club Choir | Founder Ailsa"
        description="Meet Ailsa, founder of Club Choir. From 21 voices in Montreal to a regional family of 194 singers — sing together, laugh together, learn together."
        path="/about"
      />

      <div className="container mx-auto max-w-7xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        {/* Hero */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8 mb-8 overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider mb-3">
            <Heart className="w-3.5 h-3.5" /> Our Story
          </div>
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-3 leading-tight">
            Sing together. Laugh together. Learn together.
          </h1>
          <p className="text-base md:text-lg text-foreground/80 leading-relaxed mb-3">
            A community built on the simple joy of singing together — and the belonging that comes
            with it.
          </p>
          <p className="font-heading text-lg text-foreground italic">
            — Ailsa, Founder & Choir Director
          </p>
        </div>

        {/* Founder + Story */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-8 overflow-hidden">
          <img
            src={founderPhoto}
            alt="Ailsa, founder of Club Choir, recording in a studio"
            className="w-full h-auto rounded-xl mb-5 object-cover"
            loading="eager"
          />
          <h2 className="font-heading font-bold text-2xl text-foreground mb-3">Meet Ailsa</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            As the Founder and Choir Director of Club Choir, my roots in music run deep. I was born
            in New Zealand into a Māori family where music wasn't just a hobby—it was our way of
            life. My favorite memories are of our backyard filled with music: my dad on the guitar
            while my mother and aunties wove together perfect harmonies. That natural, joyful
            connection is what I've always carried with me.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Years later, while navigating a full-time career and raising three children, I realized
            how difficult it was to find a creative outlet that fit a busy life. I missed the
            community of a choir, but the rigid pressure of weekly rehearsals felt impossible. I
            also recognized a growing, universal need: people are searching for a true sense of
            community. We are all looking for ways to reconnect in person and rediscover the simple
            joy of belonging.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-5">
            I started Club Choir to bridge that gap, beginning with just 21 members in Montreal.
            Today, we are a vibrant regional family of 194 voices, with a new location launching in
            Hudson in Summer 2026. To bring a dynamic, live energy to our rehearsals, I am joined
            by talented local musicians at each location, ensuring every session feels like a
            shared performance.
          </p>

          <blockquote className="border-l-4 border-primary pl-5 py-2 my-5">
            <p className="font-heading text-xl md:text-2xl text-foreground italic leading-snug">
              We champion progress over perfection.
            </p>
          </blockquote>

          <p className="text-muted-foreground leading-relaxed">
            Our approach focuses on making music accessible and low-pressure. We learn by ear and
            provide flexible resources for those weeks when life gets a little too loud. Above all,
            we champion progress over perfection. Our philosophy is simple:{" "}
            <span className="font-bold text-primary">
              Sing together. Laugh together. Learn together.
            </span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-border bg-card p-5">
            <Calendar className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Founded
            </p>
            <p className="font-heading font-bold text-3xl text-foreground">2024</p>
            <p className="text-xs text-muted-foreground">Started with 21 singers</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <Users className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Members
            </p>
            <p className="font-heading font-bold text-3xl text-foreground">390</p>
            <p className="text-xs text-muted-foreground">Voices and growing</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <Sparkles className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Locations
            </p>
            <p className="font-heading font-bold text-3xl text-foreground">5</p>
            <p className="text-xs text-muted-foreground">Across Quebec</p>
          </div>
        </div>

        {/* CTA banner */}
        <div className="rounded-2xl bg-gradient-warm text-primary-foreground p-6 mb-8 text-center shadow-md">
          <Heart className="w-8 h-8 mx-auto mb-2 opacity-90" />
          <h3 className="font-heading font-bold text-xl mb-1">Come sing with us</h3>
          <p className="text-sm md:text-base opacity-95 max-w-md mx-auto">
            No audition. No experience required. Just show up.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-8 text-center">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/subscribe"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold shadow hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Join the mailing list
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

        <p className="text-center text-sm text-muted-foreground">
          Have questions?{" "}
          <a href="mailto:ailsa@clubchoir.ca" className="text-primary font-medium hover:underline">
            ailsa@clubchoir.ca
          </a>
        </p>
      </div>
    </div>
  );
};

export default About;

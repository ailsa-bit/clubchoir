import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Calendar, Music, Sparkles, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import pagodaStarling from "@/assets/pagoda-starling.png";
import { photosByTag } from "@/assets/photos";

const hudsonAtmospherePhoto = photosByTag("hudson")[0];

const HudsonSession = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("notify-hudson-signup", {
        body: { first_name: firstName.trim(), last_name: lastName.trim(), email: email.trim() },
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Something went wrong",
        description: "Please try again or email ailsa@clubchoir.ca",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-12 px-4">
      <PageMeta
        title="New! Hudson Summer Session — Club Choir"
        description="Join the brand-new Hudson Club Choir session led by Briana Doyle & Seiji Gutierrez of Pagoda Starling. Mondays starting May 18, 2026."
        path="/hudson-session"
      />
      <div className="container mx-auto max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back home
        </Link>

        {/* Hero */}
        <div className="rounded-2xl border border-orange/20 bg-orange-light p-6 md:p-8 mb-8 overflow-hidden">
          <div className="grid md:grid-cols-[1.1fr_1fr] gap-6 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange text-orange-foreground text-xs font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Brand new · Starting soon
              </div>
              <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-3">
                A new Club Choir session in Hudson
              </h1>
              <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
                Mondays, 7:00–8:30 PM · May 18 – August 17, 2026 · Kingfisher Pub
              </p>
            </div>
            {hudsonAtmospherePhoto && (
              <img
                src={hudsonAtmospherePhoto.wide}
                alt={hudsonAtmospherePhoto.alt.en}
                loading="eager"
                decoding="async"
                className="rounded-xl shadow-md w-full h-48 md:h-56 object-cover"
              />
            )}
          </div>
        </div>

        {/* Directors */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden mb-8">
          <img
            src={pagodaStarling}
            alt="Briana Doyle and Seiji Gutierrez of Pagoda Starling, the choir director and accompanist for the Hudson session"
            className="w-full h-auto object-cover"
          />
          <div className="p-6 md:p-8">
            <h2 className="font-heading font-bold text-2xl text-foreground mb-3">
              Meet your directors: Briana Doyle & Seiji Gutierrez
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              This session in Hudson will be led by choir director <strong className="text-foreground">Briana Doyle</strong>,
              joined by accompanist <strong className="text-foreground">Seiji Gutierrez</strong> — the creative duo behind{" "}
              <em>Pagoda Starling</em>. Known for their dreamy harmonies, intimate guitar work, and emotionally rich sound,
              Briana and Seiji bring a unique musical connection shaped by years of performing together.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              With roots in folk, acoustic rock, and alternative influences from the 60s through the 90s, their style
              is both nostalgic and fresh. As leaders, they create a warm, supportive atmosphere where singers of all
              levels can relax, connect, and experience the joy of making music together.
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-border bg-card p-5">
            <MapPin className="w-5 h-5 text-orange mb-2" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Where</p>
            <p className="text-sm font-medium text-foreground">Kingfisher Pub</p>
            <p className="text-xs text-muted-foreground">84 Cameron, Hudson, QC J0P 1H0</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <Clock className="w-5 h-5 text-orange mb-2" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">When</p>
            <p className="text-sm font-medium text-foreground">Mondays</p>
            <p className="text-xs text-muted-foreground">7:00 – 8:30 PM</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <Calendar className="w-5 h-5 text-orange mb-2" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Dates</p>
            <p className="text-sm font-medium text-foreground">May 18 – Aug 17, 2026</p>
            <p className="text-xs text-muted-foreground">14-week session · $280</p>
          </div>
        </div>

        {/* Urgency banner */}
        <div className="rounded-2xl bg-gradient-warm text-primary-foreground p-6 mb-8 text-center shadow-md">
          <Music className="w-8 h-8 mx-auto mb-2 opacity-90" />
          <h3 className="font-heading font-bold text-xl mb-1">Spots are filling up</h3>
          <p className="text-sm md:text-base opacity-95 max-w-md mx-auto">
            We start in just a few weeks — reserve your place now so you don't miss a single rehearsal.
          </p>
        </div>

        {/* Signup form */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-8" id="signup">
          {submitted ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 text-green-600 mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-heading font-bold text-2xl text-foreground mb-2">You're on the list! 🎉</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-4">
                Check your inbox — we just sent you the e-transfer instructions to confirm your spot.
                Your registration is finalized once payment is received.
              </p>
              <p className="text-sm text-muted-foreground">
                Questions? Email{" "}
                <a href="mailto:ailsa@clubchoir.ca" className="text-primary font-medium hover:underline">
                  ailsa@clubchoir.ca
                </a>
              </p>
            </div>
          ) : (
            <>
              <h2 className="font-heading font-bold text-2xl text-foreground mb-2">Reserve your spot</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Fill in your details and we'll email you the e-transfer instructions right away.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="firstName">
                      First name *
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-orange/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="lastName">
                      Last name *
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-orange/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="email">
                    Email address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-orange/40"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-orange text-orange-foreground font-semibold shadow hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Mail className="w-5 h-5" />
                  {submitting ? "Sending..." : "Send me the registration details"}
                </button>
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>
                    Your spot is officially reserved only once we receive your $280 e-transfer.
                    Instructions will be in the confirmation email.
                  </p>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Have questions? Write to{" "}
          <a href="mailto:ailsa@clubchoir.ca" className="text-primary font-medium hover:underline">
            ailsa@clubchoir.ca
          </a>
        </p>
      </div>
    </div>
  );
};

export default HudsonSession;

import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Calendar, Music, Sparkles, Mail, CheckCircle2, AlertCircle, MessageCircle } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import clubChoirLogo from "@/assets/club-choir-logo.png";


const HudsonSession = () => {
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const faqItems = [
    { q: t("home.faq.q.cost"), a: t("home.faq.a.cost") },
    { q: t("home.faq.q.music"), a: t("home.faq.a.music") },
    { q: t("home.faq.q.shy"), a: t("home.faq.a.shy") },
    { q: t("home.faq.q.miss"), a: t("home.faq.a.miss") },
    { q: t("home.faq.q.audition"), a: t("home.faq.a.audition") },
    { q: t("home.faq.q.kind"), a: t("home.faq.a.kind") },
    { q: t("home.faq.q.bring"), a: t("home.faq.a.bring") },
    { q: t("home.faq.q.bad"), a: t("home.faq.a.bad") },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast({ title: t("hudson.toast.fillFields"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("notify-hudson-signup", {
        body: { first_name: firstName.trim(), last_name: lastName.trim(), email: email.trim(), message: message.trim() },
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      toast({
        title: t("hudson.toast.errorTitle"),
        description: t("hudson.toast.errorDesc"),
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
          <ArrowLeft className="w-4 h-4" /> {t("hudson.backHome")}
        </Link>

        {/* Hero */}
        <div className="rounded-2xl border border-orange/20 bg-orange-light p-6 md:p-8 mb-8 overflow-hidden">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange text-orange-foreground text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> {t("hudson.brandNew")}
            </div>
            <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-3">
              {t("hudson.title")}
            </h1>
            <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
              {t("hudson.heroDates")}
            </p>
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
              {t("hudson.directorsTitle")}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {t("hudson.directorsP1.before")}
              <strong className="text-foreground">Briana Doyle</strong>
              {t("hudson.directorsP1.middle")}
              <strong className="text-foreground">Seiji Gutierrez</strong>
              {t("hudson.directorsP1.after")}
              <em>Pagoda Starling</em>
              {t("hudson.directorsP1.end")}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {t("hudson.directorsP2")}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-border bg-card p-5">
            <MapPin className="w-5 h-5 text-orange mb-2" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("hudson.where")}</p>
            <p className="text-sm font-medium text-foreground">Kingfisher Pub</p>
            <p className="text-xs text-muted-foreground">84 Cameron, Hudson, QC J0P 1H0</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <Clock className="w-5 h-5 text-orange mb-2" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("hudson.when")}</p>
            <p className="text-sm font-medium text-foreground">{t("hudson.mondays")}</p>
            <p className="text-xs text-muted-foreground">{t("hudson.timeRange")}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <Calendar className="w-5 h-5 text-orange mb-2" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("hudson.dates")}</p>
            <p className="text-sm font-medium text-foreground">{t("hudson.dateRange")}</p>
            <p className="text-xs text-muted-foreground">{t("hudson.sessionLength")}</p>
          </div>
        </div>

        {/* Urgency banner */}
        <div className="rounded-2xl bg-gradient-warm text-primary-foreground p-6 mb-8 text-center shadow-md">
          <Music className="w-8 h-8 mx-auto mb-2 opacity-90" />
          <h3 className="font-heading font-bold text-xl mb-1">{t("hudson.urgencyTitle")}</h3>
          <p className="text-sm md:text-base opacity-95 max-w-md mx-auto">
            {t("hudson.urgencyDesc")}
          </p>
        </div>

        {/* Signup form */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-8" id="signup">
          {submitted ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 text-green-600 mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-heading font-bold text-2xl text-foreground mb-2">{t("hudson.successTitle")}</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-4">
                {t("hudson.successDesc")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("hudson.questionsEmail")}{" "}
                <a href="mailto:ailsa@clubchoir.ca" className="text-primary font-medium hover:underline">
                  ailsa@clubchoir.ca
                </a>
              </p>
            </div>
          ) : (
            <>
              <h2 className="font-heading font-bold text-2xl text-foreground mb-2">{t("hudson.formTitle")}</h2>
              <p className="text-sm text-muted-foreground mb-6">
                {t("hudson.formDesc")}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="firstName">
                      {t("hudson.firstName")}
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
                      {t("hudson.lastName")}
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
                    {t("hudson.emailLabel")}
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
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="message">
                    {t("hudson.messageLabel")}
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("hudson.messagePlaceholder")}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-orange/40 resize-y"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-orange text-orange-foreground font-semibold shadow hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Mail className="w-5 h-5" />
                  {submitting ? t("hudson.submitting") : t("hudson.submit")}
                </button>
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>
                    {t("hudson.paymentNote")}
                  </p>
                </div>
              </form>
            </>
          )}
        </div>

        {/* FAQ */}
        <section className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-8">
          <h2 className="font-heading font-bold text-2xl text-foreground mb-1 text-center">
            {t("hudson.faqTitle")}
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-6">{t("hudson.faqSubtitle")}</p>
          <Accordion type="single" collapsible className="space-y-2">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`hudson-faq-${i}`} className="rounded-xl border border-border bg-background px-4">
                <AccordionTrigger className="font-heading font-bold text-foreground text-left hover:no-underline py-3 text-sm md:text-base">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-3 text-sm">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <p className="text-center text-sm text-muted-foreground">
          {t("hudson.haveQuestions")}{" "}
          <a href="mailto:ailsa@clubchoir.ca" className="text-primary font-medium hover:underline">
            ailsa@clubchoir.ca
          </a>
        </p>
      </div>
    </div>
  );
};

export default HudsonSession;

import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Calendar, Music, Sparkles, Mail, CheckCircle2, AlertCircle, Ticket, BellRing } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import garyWhitePhoto from "@/assets/gary-white.jpg";

const EVENT_SLUG = "studio-77-may-31";
const PRICE_PER_TICKET = 15;

const PopupStudio77 = () => {
  const { language } = useLanguage();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isFr = language === "fr";

  const faqItems = isFr
    ? [
        { q: "Ai-je besoin d'expérience en chant ?", a: "Non. C'est conçu pour les débutants et toute personne qui aime chanter." },
        { q: "Que ferons-nous pendant la session ?", a: "Nous apprendrons une chanson ensemble à l'oreille, en la divisant en parties simples et en harmonies, et nous la chanterons en groupe à la fin." },
        { q: "Combien de temps dure la session ?", a: "2 heures." },
        { q: "Combien ça coûte ?", a: "15 $ par personne." },
        { q: "Combien de places sont disponibles ?", a: "Les places sont limitées — une fois la capacité atteinte, plus aucun billet ne sera vendu." },
        { q: "Que dois-je apporter ?", a: "Juste vous-même. Studio 77 propose une belle sélection de boissons et de plats si vous souhaitez profiter de quelque chose pendant la session — y compris des cafés glacés, des chai lattes glacés, et des options comme du chili ou de la quiche." },
        { q: "Où se trouve l'événement ?", a: "Studio 77, 271 Chem. du Bord-du-Lac-Lakeshore, Pointe-Claire, QC H9S 4L1." },
        { q: "Et si je dois annuler ?", a: "Les places sont limitées, donc nous demandons un préavis d'au moins 48 heures. Les billets ne sont pas remboursables, mais vous pouvez transférer votre place à un ami." },
      ]
    : [
        { q: "Do I need singing experience?", a: "No. This is designed for beginners and anyone who simply enjoys singing." },
        { q: "What will we do during the session?", a: "We will learn a song together by ear, breaking it into simple parts and harmonies, and sing it as a group by the end." },
        { q: "How long is the session?", a: "2 hours." },
        { q: "How much does it cost?", a: "$15 per person." },
        { q: "How many spots are available?", a: "Spots are limited — once we reach capacity, no more tickets will be sold." },
        { q: "What should I bring?", a: "Just yourself. Studio 77 offers a great selection of drinks and food if you'd like to enjoy something during the session — including iced coffee, iced chai lattes, and options like chili or quiche." },
        { q: "Where is it located?", a: "Studio 77, 271 Chem. du Bord-du-Lac-Lakeshore, Pointe-Claire, QC H9S 4L1." },
        { q: "What if I need to cancel?", a: "Spots are limited, so we ask for at least 48 hours' notice. Tickets are non-refundable, but you are welcome to transfer your spot to a friend." },
      ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast({
        title: isFr ? "Veuillez remplir tous les champs" : "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("notify-popup-waitlist", {
        body: {
          event_slug: EVENT_SLUG,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
        },
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      toast({
        title: isFr ? "Une erreur s'est produite" : "Something went wrong",
        description: isFr
          ? "Veuillez réessayer ou nous écrire à ailsa@clubchoir.ca."
          : "Please try again or email us at ailsa@clubchoir.ca.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="py-12 px-4">
      <PageMeta
        title="Pop-Up Choir at Studio 77 — Reserve Your Spot"
        description="Join Club Choir and musician Gary White for a 2-hour pop-up choir at Studio 77, Pointe-Claire, on Sunday May 31 at 3 PM. No experience needed. $15 per person, spots limited."
        path="/popup/studio-77"
      />
      <div className="container mx-auto max-w-7xl">
        <Link to="/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {isFr ? "Retour aux événements" : "Back to events"}
        </Link>

        {/* SOLD OUT banner */}
        <div className="rounded-2xl bg-orange text-orange-foreground p-6 md:p-8 mb-8 text-center shadow-lg">
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl tracking-wide mb-2">
            {isFr ? "COMPLET — MERCI !" : "SOLD OUT — THANK YOU!"}
          </h2>
          <p className="text-base md:text-lg opacity-95 max-w-xl mx-auto">
            {isFr
              ? "Tous les billets pour cet événement sont vendus. Joignez-vous à la liste d'attente ci-dessous pour être les premiers informés de notre prochain Pop-Up !"
              : "Every ticket for this event has been claimed. Join the waitlist below to be the first to know about our next Pop-Up event!"}
          </p>
          <a
            href="#waitlist"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full bg-background text-foreground font-semibold shadow hover:shadow-lg transition-all"
          >
            <BellRing className="w-4 h-4" />
            {isFr ? "Rejoindre la liste d'attente" : "Join the waitlist"}
          </a>
        </div>

        {/* Hero */}
        <div className="rounded-2xl border border-orange/20 bg-orange-light p-6 md:p-8 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange text-orange-foreground text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> {isFr ? "Chorale Pop-Up" : "Pop-Up Choir"}
          </div>
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-3">
            {isFr ? "Club Choir Pop-Up arrive au Studio 77 🎶" : "Club Choir Pop-Up is coming to Studio 77 🎶"}
          </h1>
          <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
            {isFr
              ? "Joignez-vous à nous le dimanche 31 mai à 15 h pour une expérience de chorale pop-up spéciale de 2 heures, accompagnée par le musicien Gary White."
              : "Join us on Sunday, May 31 at 3:00 PM for a special 2-hour pop-up choir experience, accompanied by musician Gary White."}
          </p>
        </div>

        {/* Description */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-8">
          <p className="text-muted-foreground leading-relaxed mb-3">
            {isFr
              ? "Cet événement est pour quiconque aime chanter !"
              : "This is for anyone who loves to sing!"}
          </p>
          <p className="text-muted-foreground leading-relaxed mb-3">
            {isFr
              ? "Joignez-vous à Ailsa et Gary pour une expérience spéciale de Chorale Pop-Up de 2 heures où le public devient la chorale."
              : "Join Ailsa and Gary for a special 2-hour Pop-Up Choir experience where the audience becomes the choir."}
          </p>
          <p className="text-muted-foreground leading-relaxed mb-3">
            {isFr
              ? "En un seul après-midi, nous vous apprendrons une chanson à partir de zéro dans une ambiance détendue, accueillante et vraiment amusante."
              : "In just one afternoon, we'll teach you a song from scratch in a relaxed, welcoming, and genuinely fun atmosphere."}
          </p>
          <p className="text-muted-foreground leading-relaxed mb-3">
            {isFr
              ? "Que vous ayez chanté dans une chorale il y a des années ou que vous chantiez seulement dans la voiture quand personne n'écoute, vous serez surpris de voir à quelle vitesse une salle pleine d'inconnus peut se transformer en quelque chose qui sonne plutôt incroyable."
              : "Whether you sang in a choir years ago or only sing in the car when nobody's listening, you'll be surprised how quickly a room full of strangers can turn into something that sounds pretty incredible."}
          </p>
          <p className="text-muted-foreground leading-relaxed mb-3">
            {isFr
              ? "Ailsa guidera le groupe étape par étape pendant que Gary White donnera vie à la musique, et avant même de vous en rendre compte, vous chanterez en harmonie comme une grande chorale."
              : "Ailsa will guide the group step by step while Gary White brings the music to life, and before you know it, you'll be singing in harmony together as one big choir."}
          </p>
          <p className="text-muted-foreground leading-relaxed mb-3">
            {isFr
              ? "C'est joyeux, exaltant, un peu chaotique et très amusant."
              : "It's joyful, uplifting, a little chaotic, and a lot of fun."}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {isFr
              ? "Venez seul ou amenez un ami, tout le monde est bienvenu !"
              : "Come by yourself or bring a friend, everyone is welcome!"}
          </p>
        </div>

        {/* Special guest: Gary White */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-8 overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange text-orange-foreground text-xs font-bold uppercase tracking-wider mb-3">
            <Music className="w-3.5 h-3.5" /> {isFr ? "Invité spécial" : "Special guest"}
          </div>
          <img
            src={garyWhitePhoto}
            alt="Gary White, singer and musician, in profile wearing a cap and glasses"
            className="w-full h-auto rounded-xl mb-5 object-cover"
            loading="lazy"
          />
          <h2 className="font-heading font-bold text-2xl text-foreground mb-3">
            {isFr ? "Rencontrez Gary White" : "Meet Gary White"}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Gary White is an experienced singer, musician, and all-around performer who has spent years entertaining audiences around the world. With his acoustic guitar, harmonica, and an extensive repertoire spanning from the 1950s to today's hits, Gary brings energy, versatility, and a deep love of music to every performance.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-3">
            He regularly plays pubs, restaurants, and private events, tailoring each set to the crowd — from Gen Z to Golden Agers — and is especially skilled at adapting to the unique dynamics of community groups, including those with special needs. Gary can also support events as a host or step in as a budget-friendly DJ.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Gary and <Link to="/about" className="text-primary font-medium hover:underline">Ailsa</Link> first worked together in the summer of 2025, and he officially joined the Club Choir team in January 2026. Fun fact: Gary plays the guitar upside-down.
          </p>
        </div>

        {/* Details */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-border bg-card p-5">
            <MapPin className="w-5 h-5 text-orange mb-2" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{isFr ? "Lieu" : "Where"}</p>
            <p className="text-sm font-medium text-foreground">Studio 77</p>
            <p className="text-xs text-muted-foreground">271 Chem. du Bord-du-Lac-Lakeshore, Pointe-Claire</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <Calendar className="w-5 h-5 text-orange mb-2" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{isFr ? "Date" : "Date"}</p>
            <p className="text-sm font-medium text-foreground">{isFr ? "Dimanche 31 mai" : "Sunday, May 31"}</p>
            <p className="text-xs text-muted-foreground">2026</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <Clock className="w-5 h-5 text-orange mb-2" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{isFr ? "Heure" : "Time"}</p>
            <p className="text-sm font-medium text-foreground">{isFr ? "15 h – 17 h" : "3:00 PM – 5:00 PM"}</p>
            <p className="text-xs text-muted-foreground">{isFr ? "2 heures" : "2 hours"}</p>
          </div>
        </div>

        {/* FAQ */}
        <section className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-8">
          <h2 className="font-heading font-bold text-2xl text-foreground mb-1 text-center">
            {isFr ? "Questions fréquentes" : "Frequently asked questions"}
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-6">
            {isFr ? "Tout ce que vous devez savoir sur le pop-up" : "Everything you need to know about the pop-up"}
          </p>
          <Accordion type="single" collapsible className="space-y-2">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`popup-faq-${i}`} className="rounded-xl border border-border bg-background px-4">
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
          {isFr ? "D'autres questions ? Écrivez-nous à " : "More questions? Email us at "}
          <a href="mailto:ailsa@clubchoir.ca" className="text-primary font-medium hover:underline">
            ailsa@clubchoir.ca
          </a>
        </p>
      </div>
    </div>
  );
};

export default PopupStudio77;

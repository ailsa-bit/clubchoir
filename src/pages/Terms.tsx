import PageMeta from "@/components/PageMeta";
import { useLanguage } from "@/contexts/LanguageContext";

type Section = { h: string; p: string[] };

const EN: Section[] = [
  {
    h: "Refund Policy",
    p: [
      "You can receive a full refund if you withdraw before Week 3 of the session.",
      "From Week 3 onward, no refunds will be issued.",
      "To request a refund, send an email to ailsa@clubchoir.ca.",
    ],
  },
  {
    h: "Membership",
    p: [
      "Your registration covers one session at the location you choose. You're welcome to attend any Club Choir location during the session.",
      "Your member portal access (schedules, recordings, lyrics and sheet music) stays active for the session you paid for.",
      "Song resources are for your personal practice only. Please do not share them outside Club Choir.",
    ],
  },
  {
    h: "Respect and Safety",
    p: [
      "Club Choir is a welcoming, inclusive community. We ask every member to treat fellow singers, musicians and venues with kindness and respect.",
      "If you are feeling unwell, please stay home and rest — the recordings will help you catch up.",
    ],
  },
  {
    h: "Photos and Videos",
    p: [
      "We sometimes take photos and videos during rehearsals and events.",
      "With your registration, you agree that Club Choir may share these photos and videos on our website, social media (such as Facebook and Instagram) and other promotional materials to help people discover our choir.",
      "If you would prefer not to appear in photos or videos used for promotion, just let Ailsa know and we will happily respect your wishes.",
    ],
  },
  {
    h: "Emails and Privacy",
    p: [
      "With your permission, Club Choir sends emails for Club Choir purposes only: schedules, song resources, reminders and choir news.",
      "Your information is never sold or shared with anyone outside Club Choir.",
      "You can stop receiving emails at any time by sending an email to ailsa@clubchoir.ca.",
    ],
  },
  {
    h: "Changes",
    p: ["Club Choir may update these terms. The current version is always available on this page."],
  },
];

const FR: Section[] = [
  {
    h: "Politique de remboursement",
    p: [
      "Vous pouvez obtenir un remboursement complet si vous vous retirez avant la semaine 3 de la session.",
      "À partir de la semaine 3, aucun remboursement ne sera accordé.",
      "Pour demander un remboursement, envoyez un courriel à ailsa@clubchoir.ca.",
    ],
  },
  {
    h: "Adhésion",
    p: [
      "Votre inscription couvre une session au lieu de votre choix. Vous êtes le bienvenu à n'importe quel lieu de Club Choir pendant la session.",
      "Votre accès au portail des membres (horaires, enregistrements, paroles et partitions) reste actif pour la session payée.",
      "Les ressources sont réservées à votre pratique personnelle. Merci de ne pas les partager en dehors de Club Choir.",
    ],
  },
  {
    h: "Respect et sécurité",
    p: [
      "Club Choir est une communauté accueillante et inclusive. Nous demandons à chaque membre de traiter les choristes, les musiciens et les lieux avec gentillesse et respect.",
      "Si vous êtes malade, restez à la maison et reposez-vous — les enregistrements vous aideront à rattraper.",
    ],
  },
  {
    h: "Photos et vidéos",
    p: [
      "Nous prenons parfois des photos et des vidéos pendant les répétitions et les événements.",
      "Avec votre inscription, vous acceptez que Club Choir partage ces photos et vidéos sur notre site web, sur les réseaux sociaux (comme Facebook et Instagram) et dans d'autres documents promotionnels, afin de faire découvrir notre chorale.",
      "Si vous préférez ne pas apparaître dans les photos ou vidéos utilisées à des fins promotionnelles, faites-le simplement savoir à Ailsa et nous respecterons votre souhait avec plaisir.",
    ],
  },
  {
    h: "Courriels et confidentialité",
    p: [
      "Avec votre permission, Club Choir envoie des courriels uniquement à des fins liées à Club Choir : horaires, ressources, rappels et nouvelles de la chorale.",
      "Vos renseignements ne sont jamais vendus ni partagés en dehors de Club Choir.",
      "Vous pouvez cesser de recevoir des courriels en tout temps en écrivant à ailsa@clubchoir.ca.",
    ],
  },
  {
    h: "Modifications",
    p: ["Club Choir peut mettre à jour ces conditions. La version actuelle est toujours disponible sur cette page."],
  },
];

const Terms = () => {
  const { language } = useLanguage();
  const isFr = language === "fr";
  const sections = isFr ? FR : EN;
  const title = isFr ? "Conditions d'utilisation et politique de remboursement" : "Terms & Conditions and Refund Policy";

  return (
    <div className="py-12 px-4">
      <PageMeta
        title={`${title} | Club Choir`}
        description={isFr ? "Conditions, politique de remboursement et courriels de Club Choir." : "Club Choir terms, refund policy and email permission."}
        path="/terms"
      />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">{title}</h1>
        <div className="space-y-6">
          {sections.map((s, i) => (
            <section
              key={s.h}
              className={i === 0 ? "rounded-xl border-2 border-primary bg-primary/5 p-5" : "rounded-xl border border-border p-5"}
            >
              <h2 className="text-xl font-bold text-foreground mb-3">{s.h}</h2>
              <ul className="space-y-2 text-foreground">
                {s.p.map((line) => (
                  <li key={line} className="leading-relaxed">{line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Terms;

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type Language = "en" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Nav
  "nav.home": { en: "Home", fr: "Accueil" },
  "nav.thisWeek": { en: "This Week at Choir", fr: "Cette semaine au chœur" },
  "nav.events": { en: "Club Choir Events", fr: "Événements Club Choir" },
  "nav.corporate": { en: "Corporate Events", fr: "Événements corporatifs" },
  "nav.community": { en: "Choir Community", fr: "Communauté chorale" },
  "nav.chat": { en: "Chat", fr: "Clavardage" },
  "nav.resources": { en: "Song Resources", fr: "Ressources musicales" },
  "nav.profile": { en: "Profile", fr: "Profil" },

  // Footer
  "footer.tagline": { en: "Warm voices, real community.", fr: "Des voix chaleureuses, une vraie communauté." },
  "footer.facebook": { en: "Facebook", fr: "Facebook" },

  // Home - Hero
  "home.hero.title": { en: "Your Club Choir Space", fr: "Votre espace Club Choir" },
  "home.hero.subtitle": { en: "Ever thought about joining a choir, but worried you \"can't sing\" or wouldn't fit in? That's exactly why Club Choir exists.", fr: "Vous avez déjà pensé à joindre une chorale, mais vous craignez de « ne pas savoir chanter » ou de ne pas être à votre place ? C'est exactement pour ça que Club Choir existe." },
  "home.hero.desc": { en: "Our weekly sessions are for everyone — no auditions, no pressure, and no experience required. Sing together, laugh together, learn together.", fr: "Nos sessions hebdomadaires sont pour tout le monde — pas d'auditions, pas de pression et aucune expérience requise. Chantez ensemble, riez ensemble, apprenez ensemble." },
  "home.hero.try": { en: "Try a Session or Get in Touch", fr: "Essayer une session ou nous contacter" },
  "home.hero.friend": { en: "Bring a Friend", fr: "Inviter un ami" },

  // Home - Sessions
  "home.sessions.title": { en: "Where & When We Sing", fr: "Où et quand nous chantons" },
  "home.sessions.pricing": { en: "per 14-week session · Winter session starting February · Fall session starting September", fr: "par session de 14 semaines · Session d'hiver débutant en février · Session d'automne débutant en septembre" },

  // Home - FAQ
  "home.faq.title": { en: "Frequently Asked Questions", fr: "Questions fréquemment posées" },
  "home.faq.subtitle": { en: "Everything you need to know before your first session", fr: "Tout ce que vous devez savoir avant votre première session" },
  "home.faq.still": { en: "Still have questions?", fr: "Vous avez encore des questions ?" },
  "home.faq.touch": { en: "Get in Touch", fr: "Contactez-nous" },

  "home.faq.q.cost": { en: "How much does it cost?", fr: "Combien ça coûte ?" },
  "home.faq.a.cost": { en: "Each 14-week session is $280. We run a Winter session starting in February and a Fall session starting in September.", fr: "Chaque session de 14 semaines coûte 280 $. Nous offrons une session d'hiver débutant en février et une session d'automne débutant en septembre." },
  "home.faq.q.music": { en: "Do I need to know how to read music?", fr: "Dois-je savoir lire la musique ?" },
  "home.faq.a.music": { en: "Not at all! Most of us learn by ear. Sheet music is there if you want it, but you can absolutely just show up and sing your heart out.", fr: "Pas du tout ! La plupart d'entre nous apprennent à l'oreille. Les partitions sont là si vous le souhaitez, mais vous pouvez tout simplement vous présenter et chanter à cœur joie." },
  "home.faq.q.shy": { en: "I'm shy — can I still join?", fr: "Je suis timide — puis-je quand même participer ?" },
  "home.faq.a.shy": { en: "One hundred percent! Club Choir is all about encouragement, laughter, and zero pressure. Sing quietly, sing loudly, or just hum along until you're ready to belt it out.", fr: "Absolument ! Club Choir, c'est de l'encouragement, du plaisir et zéro pression. Chantez doucement, chantez fort ou fredonnez jusqu'à ce que vous soyez prêt à y aller à fond." },
  "home.faq.q.miss": { en: "What if I can't make it every week?", fr: "Et si je ne peux pas venir chaque semaine ?" },
  "home.faq.a.miss": { en: "No stress — life happens! If you miss a session, we have resources to help you catch up, and our members are always happy to get you back in the groove.", fr: "Pas de stress — la vie, c'est comme ça ! Si vous manquez une session, nous avons des ressources pour vous rattraper, et nos membres sont toujours heureux de vous remettre dans le bain." },
  "home.faq.q.audition": { en: "Do I need to audition?", fr: "Dois-je passer une audition ?" },
  "home.faq.a.audition": { en: "No auditions and no experience needed. If you can sing in the shower, you're more than qualified.", fr: "Pas d'audition et aucune expérience requise. Si vous pouvez chanter sous la douche, vous êtes plus que qualifié." },
  "home.faq.q.kind": { en: "What kind of music do you sing?", fr: "Quel genre de musique chantez-vous ?" },
  "home.faq.a.kind": { en: "Everything from pop classics to hidden gems. If it's fun to sing, it's on our list.", fr: "De tout, des classiques pop aux perles cachées. Si c'est amusant à chanter, c'est sur notre liste." },
  "home.faq.q.bring": { en: "What should I bring to a session?", fr: "Que dois-je apporter à une session ?" },
  "home.faq.a.bring": { en: "Just yourself, your voice, and your sense of humour. We provide the good vibes.", fr: "Juste vous-même, votre voix et votre sens de l'humour. On s'occupe de la bonne ambiance." },
  "home.faq.q.bad": { en: "What if I'm not a good singer?", fr: "Et si je ne chante pas bien ?" },
  "home.faq.a.bad": { en: "Club Choir is about progress, not perfection. If you love to sing, you belong here — it's that simple.", fr: "Club Choir, c'est le progrès, pas la perfection. Si vous aimez chanter, vous êtes chez vous ici — c'est aussi simple que ça." },

  // Home - Testimonials
  "home.testimonials.title": { en: "What Our Members Say", fr: "Ce que nos membres disent" },
  "home.testimonials.subtitle": { en: "All 5-star reviews from Google", fr: "Tous des avis 5 étoiles sur Google" },
  "home.testimonials.review": { en: "Leave Us a Review on Google", fr: "Laissez-nous un avis sur Google" },

  // Home - Community
  "home.community.title": { en: "Club Choir Community", fr: "Communauté Club Choir" },
  "home.community.events": { en: "Club Choir Events", fr: "Événements Club Choir" },
  "home.community.eventsDesc": { en: "PorchFest, themed nights, pop-up singalongs & more.", fr: "PorchFest, soirées thématiques, chants impromptus et plus encore." },
  "home.community.corporate": { en: "Corporate & Private Events", fr: "Événements corporatifs et privés" },
  "home.community.corporateDesc": { en: "Team-building singing experiences for your company.", fr: "Des expériences de chant pour le renforcement d'équipe." },

  // Try a Session
  "try.title": { en: "Try a Session", fr: "Essayer une session" },
  "try.subtitle": { en: "Curious about Club Choir? Drop us a message and we'll get you singing in no time.", fr: "Curieux à propos de Club Choir ? Envoyez-nous un message et vous chanterez en un rien de temps." },
  "try.name": { en: "Your name", fr: "Votre nom" },
  "try.email": { en: "Email", fr: "Courriel" },
  "try.location": { en: "Preferred location", fr: "Lieu préféré" },
  "try.locationPlaceholder": { en: "Choose a location…", fr: "Choisir un lieu…" },
  "try.message": { en: "Message", fr: "Message" },
  "try.messagePlaceholder": { en: "Tell us a bit about yourself and which location interests you…", fr: "Parlez-nous un peu de vous et du lieu qui vous intéresse…" },
  "try.send": { en: "Send Message", fr: "Envoyer le message" },
  "try.sending": { en: "Sending…", fr: "Envoi en cours…" },
  "try.thanks.title": { en: "Thanks for reaching out!", fr: "Merci de nous avoir contacté !" },
  "try.thanks.desc": { en: "We've received your message and will get back to you shortly.", fr: "Nous avons reçu votre message et vous répondrons sous peu." },

  // Events
  "events.title": { en: "Club Choir Events", fr: "Événements Club Choir" },
  "events.subtitle": { en: "Special events beyond our weekly rehearsals — come sing, connect, and celebrate together.", fr: "Des événements spéciaux au-delà de nos répétitions hebdomadaires — venez chanter, socialiser et célébrer ensemble." },
  "events.share": { en: "Share", fr: "Partager" },
  "events.register": { en: "Register for This Session", fr: "S'inscrire à cette session" },
  "events.registering": { en: "Redirecting…", fr: "Redirection…" },

  // Payment
  "payment.success.title": { en: "Payment Successful!", fr: "Paiement réussi !" },
  "payment.success.desc": { en: "Thank you for registering! You're all set for the upcoming session.", fr: "Merci pour votre inscription ! Vous êtes prêt pour la prochaine session." },
  "payment.success.back": { en: "Back to Events", fr: "Retour aux événements" },

  // Corporate
  "corporate.title": { en: "Corporate & Private Events", fr: "Événements corporatifs et privés" },
  "corporate.subtitle": { en: "Bring your team together through the power of singing. No experience required — just show up and have fun.", fr: "Rassemblez votre équipe grâce au pouvoir du chant. Aucune expérience requise — il suffit de se présenter et de s'amuser." },
  "corporate.teamBuilding": { en: "Team-Building", fr: "Renforcement d'équipe" },
  "corporate.teamBuildingDesc": { en: "Break the ice and build bonds through music.", fr: "Brisez la glace et créez des liens grâce à la musique." },
  "corporate.noExperience": { en: "No Experience Needed", fr: "Aucune expérience requise" },
  "corporate.noExperienceDesc": { en: "We guide everyone — from shower singers to pros.", fr: "Nous guidons tout le monde — des chanteurs de douche aux pros." },
  "corporate.unforgettable": { en: "Unforgettable", fr: "Inoubliable" },
  "corporate.unforgettableDesc": { en: "A unique, joyful experience your team will remember.", fr: "Une expérience unique et joyeuse dont votre équipe se souviendra." },
  "corporate.getInTouch": { en: "Get in Touch", fr: "Contactez-nous" },
  "corporate.yourName": { en: "Your Name", fr: "Votre nom" },
  "corporate.company": { en: "Company", fr: "Entreprise" },
  "corporate.email": { en: "Email", fr: "Courriel" },
  "corporate.eventType": { en: "Event Type", fr: "Type d'événement" },
  "corporate.selectEvent": { en: "Select an event type", fr: "Sélectionner un type d'événement" },
  "corporate.messageOpt": { en: "Message (optional)", fr: "Message (facultatif)" },
  "corporate.messagePlaceholder": { en: "Tell us about your event...", fr: "Parlez-nous de votre événement..." },
  "corporate.send": { en: "Send Inquiry", fr: "Envoyer la demande" },
  "corporate.sending": { en: "Sending…", fr: "Envoi en cours…" },
  "corporate.eventTypes.teamBuilding": { en: "Team-Building Workshop", fr: "Atelier de renforcement d'équipe" },
  "corporate.eventTypes.holiday": { en: "Holiday Party", fr: "Fête des Fêtes" },
  "corporate.eventTypes.conference": { en: "Conference Entertainment", fr: "Divertissement de conférence" },
  "corporate.eventTypes.launch": { en: "Product Launch", fr: "Lancement de produit" },
  "corporate.eventTypes.private": { en: "Private Celebration", fr: "Célébration privée" },
  "corporate.eventTypes.other": { en: "Other", fr: "Autre" },

  // This Week
  "thisWeek.title": { en: "This Week at Choir", fr: "Cette semaine au chœur" },
  "thisWeek.subtitle": { en: "Find your session and come sing with us.", fr: "Trouvez votre session et venez chanter avec nous." },
  "thisWeek.schedule": { en: "View Season Schedule", fr: "Voir le calendrier de la saison" },
  "thisWeek.expect.title": { en: "What to expect", fr: "À quoi s'attendre" },
  "thisWeek.expect.desc": { en: "No auditions, no sheet music. Just show up, warm up, and sing your heart out with a room full of good people.", fr: "Pas d'auditions, pas de partitions. Présentez-vous, échauffez-vous et chantez à cœur joie avec une salle pleine de bonnes personnes." },

  // Bring a Friend
  "friend.title": { en: "Bring a Friend", fr: "Inviter un ami" },
  "friend.subtitle": { en: "Know someone who'd love to sing? Invite them to try a session with you!", fr: "Vous connaissez quelqu'un qui aimerait chanter ? Invitez-le à essayer une session avec vous !" },
  "friend.loginRequired": { en: "This feature is available to active Club Choir members. Please log in to continue.", fr: "Cette fonctionnalité est réservée aux membres actifs de Club Choir. Veuillez vous connecter pour continuer." },
  "friend.notActive": { en: "This feature is available to active Club Choir members only. If you believe this is an error, please contact us.", fr: "Cette fonctionnalité est réservée aux membres actifs de Club Choir. Si vous croyez qu'il s'agit d'une erreur, veuillez nous contacter." },
  "friend.yourName": { en: "Your name", fr: "Votre nom" },
  "friend.friendName": { en: "Friend's name", fr: "Nom de l'ami(e)" },
  "friend.friendEmail": { en: "Friend's email", fr: "Courriel de l'ami(e)" },
  "friend.location": { en: "Preferred location", fr: "Lieu préféré" },
  "friend.messageOpt": { en: "Message (optional)", fr: "Message (facultatif)" },
  "friend.send": { en: "Send Invitation", fr: "Envoyer l'invitation" },
  "friend.sending": { en: "Sending…", fr: "Envoi en cours…" },
  "friend.sent.title": { en: "Invitation sent!", fr: "Invitation envoyée !" },
  "friend.sent.desc": { en: "We'll reach out to your friend and get them set up for a session.", fr: "Nous contacterons votre ami(e) et l'inscrirons à une session." },

  // Community
  "community.title": { en: "Our Members", fr: "Nos membres" },
  "community.search": { en: "Search members...", fr: "Rechercher des membres..." },
  "community.allStatuses": { en: "All statuses", fr: "Tous les statuts" },
  "community.allLocations": { en: "All locations", fr: "Tous les lieux" },
  "community.allPayments": { en: "All payments", fr: "Tous les paiements" },
  "community.showing": { en: "Showing", fr: "Affichage de" },
  "community.members": { en: "members", fr: "membres" },
  "community.member": { en: "member", fr: "membre" },
  "community.manage": { en: "Manage Members", fr: "Gérer les membres" },
  "community.loading": { en: "Loading members...", fr: "Chargement des membres..." },

  // Resources
  "resources.title": { en: "Song Resources", fr: "Ressources musicales" },
  "resources.subtitle": { en: "Recordings, lyrics, and sheet music for the songs we're learning.", fr: "Enregistrements, paroles et partitions des chansons que nous apprenons." },
  "resources.search": { en: "Search songs or files…", fr: "Rechercher des chansons ou fichiers…" },
  "resources.membersOnly": { en: "Members Only", fr: "Membres seulement" },
  "resources.signIn": { en: "Sign in to access song resources.", fr: "Connectez-vous pour accéder aux ressources musicales." },
  "resources.upload": { en: "Upload Resource", fr: "Téléverser une ressource" },
  "resources.songName": { en: "Song Name", fr: "Nom de la chanson" },
  "resources.type": { en: "Type", fr: "Type" },
  "resources.recording": { en: "Recording", fr: "Enregistrement" },
  "resources.lyrics": { en: "Lyrics", fr: "Paroles" },
  "resources.sheetMusic": { en: "Sheet Music", fr: "Partition" },
  "resources.file": { en: "File", fr: "Fichier" },
  "resources.loading": { en: "Loading resources…", fr: "Chargement des ressources…" },
  "resources.empty": { en: "No resources uploaded yet.", fr: "Aucune ressource téléversée pour l'instant." },

  // Profile
  "profile.title": { en: "Your Profile", fr: "Votre profil" },
  "profile.subtitle": { en: "Manage your Club Choir membership", fr: "Gérez votre adhésion à Club Choir" },
  "profile.sessions": { en: "My Sessions", fr: "Mes sessions" },
  "profile.sessionsDesc": { en: "View your rehearsal history", fr: "Voir l'historique de vos répétitions" },
  "profile.account": { en: "Account", fr: "Compte" },
  "profile.accountDesc": { en: "Update your details", fr: "Mettre à jour vos informations" },
  "profile.preferences": { en: "Preferences", fr: "Préférences" },
  "profile.preferencesDesc": { en: "Notifications & settings", fr: "Notifications et paramètres" },
  "profile.signOut": { en: "Sign Out", fr: "Déconnexion" },
  "profile.adminLogin": { en: "Admin Login", fr: "Connexion administrateur" },

  // Login
  "login.createAccount": { en: "Create Account", fr: "Créer un compte" },
  "login.adminLogin": { en: "Admin Login", fr: "Connexion administrateur" },
  "login.signUpDesc": { en: "Sign up to get started", fr: "Inscrivez-vous pour commencer" },
  "login.signInDesc": { en: "Sign in to access admin features", fr: "Connectez-vous pour accéder aux fonctionnalités admin" },
  "login.email": { en: "Email", fr: "Courriel" },
  "login.password": { en: "Password", fr: "Mot de passe" },
  "login.selectLocation": { en: "Select your location", fr: "Sélectionner votre lieu" },
  "login.wait": { en: "Please wait...", fr: "Veuillez patienter..." },
  "login.signUp": { en: "Sign Up", fr: "S'inscrire" },
  "login.signIn": { en: "Sign In", fr: "Se connecter" },
  "login.alreadyAccount": { en: "Already have an account?", fr: "Vous avez déjà un compte ?" },
  "login.noAccount": { en: "Don't have an account?", fr: "Vous n'avez pas de compte ?" },
  "login.confirmEmail": { en: "Check your email for a confirmation link, then come back and sign in.", fr: "Vérifiez votre courriel pour un lien de confirmation, puis revenez et connectez-vous." },
  "login.forgotPassword": { en: "Forgot password?", fr: "Mot de passe oublié ?" },
  "login.forgotSubtitle": { en: "Enter your email and we'll send you a reset link.", fr: "Entrez votre courriel et nous vous enverrons un lien de réinitialisation." },
  "login.sendResetLink": { en: "Send Reset Link", fr: "Envoyer le lien" },
  "login.resetEmailSent": { en: "Check your email for a password reset link.", fr: "Vérifiez votre courriel pour un lien de réinitialisation." },
  "login.backToSignIn": { en: "Back to Sign In", fr: "Retour à la connexion" },
  "login.newPassword": { en: "New Password", fr: "Nouveau mot de passe" },
  "login.confirmPassword": { en: "Confirm Password", fr: "Confirmer le mot de passe" },
  "login.resetPassword": { en: "Reset Password", fr: "Réinitialiser le mot de passe" },
  "login.resetSubtitle": { en: "Enter your new password below.", fr: "Entrez votre nouveau mot de passe ci-dessous." },
  "login.passwordsMismatch": { en: "Passwords do not match.", fr: "Les mots de passe ne correspondent pas." },
  "login.passwordUpdated": { en: "Password updated! You can now sign in.", fr: "Mot de passe mis à jour ! Vous pouvez maintenant vous connecter." },

  // 404
  "notFound.title": { en: "404", fr: "404" },
  "notFound.desc": { en: "Oops! Page not found", fr: "Oups ! Page introuvable" },
  "notFound.home": { en: "Return to Home", fr: "Retourner à l'accueil" },

  // Days
  "day.monday": { en: "Monday", fr: "Lundi" },
  "day.tuesday": { en: "Tuesday", fr: "Mardi" },
  "day.wednesday": { en: "Wednesday", fr: "Mercredi" },
  "day.thursday": { en: "Thursday", fr: "Jeudi" },

  // Common
  "common.logIn": { en: "Log In", fr: "Se connecter" },
  "common.signIn": { en: "Sign In", fr: "Se connecter" },
  "common.loading": { en: "Loading…", fr: "Chargement…" },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("clubchoir-lang");
    return (saved === "fr" ? "fr" : "en") as Language;
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("clubchoir-lang", lang);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const entry = translations[key];
      if (!entry) return key;
      return entry[language] || entry.en || key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};

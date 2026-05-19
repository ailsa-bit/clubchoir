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
  "footer.subscribe": { en: "Stay in the loop", fr: "Restez informé" },

  // Home - Subscribe CTA
  "home.subscribe.title": { en: "Stay in the loop", fr: "Restez informé" },
  "home.subscribe.desc": {
    en: "Not ready to join yet? Sign up for our mailing list to get the latest on Club Choir events, early registration for new sessions, and invites to summer pop-up choirs and open houses.",
    fr: "Pas encore prêt à vous joindre ? Inscrivez-vous à notre liste pour recevoir les nouvelles des événements Club Choir, les inscriptions anticipées aux nouvelles sessions et les invitations aux chorales pop-up estivales et journées portes ouvertes."
  },
  "home.subscribe.cta": { en: "Join the mailing list", fr: "S'inscrire à la liste" },

  // Home - Hero
  "home.hero.title": { en: "Your Club Choir Space", fr: "Votre espace Club Choir" },
  "home.hero.subtitle": { en: "Ever thought about joining a choir, but worried you \"can't sing\" or wouldn't fit in? That's exactly why Club Choir exists.", fr: "Vous avez déjà pensé à joindre une chorale, mais vous craignez de « ne pas savoir chanter » ou de ne pas être à votre place ? C'est exactement pour ça que Club Choir existe." },
 "home.hero.desc": {
  en: "Our winter session has now ended, and we are so grateful for an incredible season of singing, learning, laughing, and building community together.\n\nThis summer, Club Choir is still singing. Keep an eye out for pop-up choirs, community performances, and special events happening throughout the summer months.",
  fr: "Notre session d'hiver est maintenant terminée, et nous sommes tellement reconnaissants pour une saison incroyable de chant, d'apprentissage, de rires et de communauté.\n\nCet été, Club Choir continue de chanter. Restez à l'affût des chorales pop-up, performances communautaires et événements spéciaux organisés tout au long de l'été."
 },
  "home.hero.try": { en: "Get in Touch", fr: "Nous contacter" },
  "home.hero.friend": { en: "Bring a Friend", fr: "Inviter un ami" },

  // Home - Sessions
 "home.sessions.title": { en: "Where & When We Sing", fr: "Où et quand nous chantons" },
 "home.sessions.fallSoon": { en: "Fall Session dates coming soon", fr: "Les dates de la session d'automne seront bientôt annoncées" },
 "home.sessions.fall2026": { en: "Fall Session 2026", fr: "Session d'automne 2026" },
 "home.sessions.tbc": { en: "Dates to be confirmed", fr: "Dates à confirmer" },
  "home.sessions.pricing": { en: "per 14-week session · Winter session starting February · Fall session starting September", fr: "par session de 14 semaines · Session d'hiver débutant en février · Session d'automne débutant en septembre" },

  // Home - FAQ
  "home.faq.title": { en: "Frequently Asked Questions", fr: "Questions fréquemment posées" },
  "home.faq.subtitle": { en: "Everything you need to know before your first session", fr: "Tout ce que vous devez savoir avant votre première session" },
  "home.faq.still": { en: "Still have questions?", fr: "Vous avez encore des questions ?" },
  "home.faq.touch": { en: "Get in Touch", fr: "Contactez-nous" },

  // Home - Moments / Photo gallery
  "home.moments.title": { en: "Real moments, real voices", fr: "De vrais moments, de vraies voix" },
  "home.moments.subtitle": {
    en: "Snapshots from our weekly sessions and stage nights — no audition, no judgment, just the joy of singing together.",
    fr: "Aperçus de nos sessions hebdomadaires et soirées sur scène — pas d'audition, pas de jugement, juste la joie de chanter ensemble.",
  },

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
  "community.event.title": { en: "Summer Pop-Up Choir", fr: "Chorale Pop-Up d'été" },
  "community.event.festival": { en: "Victoria Village Street Festival", fr: "Festival de rue de Victoria Village" },
  "community.event.date": { en: "June 13 at 12 PM", fr: "13 juin à 12h" },
  "community.event.desc1": { en: "Join Club Choir for a fun, interactive outdoor singing experience in the heart of the festival. We'll start with a short performance, then invite everyone to take part in a live, all-levels sing-along—Club Choir style. No experience needed, just come ready to sing and enjoy the moment.", fr: "Joignez-vous à Club Choir pour une expérience de chant extérieure interactive et amusante au cœur du festival. Nous commencerons par une courte performance, puis inviterons tout le monde à participer à un chant spontané pour tous les niveaux, à la manière Club Choir. Aucune expérience requise, venez simplement prêt à chanter et à profiter du moment." },
  "community.event.desc2": { en: "This is a relaxed, welcoming event designed for anyone who loves music and wants to be part of something uplifting and social.", fr: "C'est un événement décontracté et accueillant conçu pour tous ceux qui aiment la musique et veulent faire partie de quelque chose de joyeux et social." },
  "community.event.accompanied": { en: "Accompanied by Gary White", fr: "Accompagné par Gary White" },
  "community.event.location": { en: "Prince-Albert Square", fr: "Place Prince-Albert" },
  "community.event.cta": { en: "Join us", fr: "Rejoignez-nous" },

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
  "resources.error": { en: "Error", fr: "Erreur" },
  "resources.song": { en: "Song", fr: "Chanson" },
  "resources.fileName": { en: "File Name", fr: "Nom du fichier" },
  "resources.actions": { en: "Actions", fr: "Actions" },

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

  // Home - Hero CTAs
  "home.hero.startingSoon": { en: "Starting soon", fr: "Bientôt" },
 "home.hero.reserveHudson": { en: "Reserve your Hudson spot", fr: "Réservez votre place à Hudson" },
 "home.hero.registerFall": { en: "Register for Fall 2026", fr: "Inscrivez-vous — Automne 2026" },
  "home.hero.trySession": { en: "Try a session", fr: "Essayer une session" },
  "home.hero.upcomingEvents": { en: "See upcoming events", fr: "Voir les événements à venir" },
  "home.hero.eventsSummary": {
    en: "We're also excited to announce Fall 2026 session dates and locations, with choirs returning across the Greater Montreal area this September.",
    fr: "Nous sommes également ravis d'annoncer les dates et lieux de la session d'automne 2026, avec le retour des chorales dans la grande région de Montréal en septembre."
  },
  "home.hero.hudsonCaption": {
    en: "Looking ahead, our new fall session dates are coming soon. Check back for details and find the location that works best for you.",
    fr: "À venir : les dates de notre nouvelle session d'automne seront bientôt annoncées. Revenez consulter les détails et trouvez l'emplacement qui vous convient le mieux."
  },

  // Hudson Session page
  "hudson.backHome": { en: "Back home", fr: "Retour à l'accueil" },
  "hudson.brandNew": { en: "Brand new · Starting soon", fr: "Tout nouveau · Bientôt" },
  "hudson.title": { en: "A new Club Choir session in Hudson", fr: "Une nouvelle session Club Choir à Hudson" },
  "hudson.heroDates": { en: "Mondays, 7:00–8:30 PM · May 18 – August 17, 2026 · Kingfisher Pub", fr: "Lundis, 19h00–20h30 · 18 mai – 17 août 2026 · Kingfisher Pub" },
  "hudson.vibeTitle": { en: "What is Club Choir?", fr: "C'est quoi Club Choir ?" },
  "hudson.vibeP1": { en: "Club Choir is a no-audition, no-pressure community choir for adults who love to sing — whether you've been in choirs your whole life or haven't sung since high school. We learn songs by ear, mix in a bit of sheet music, and focus on great harmonies, real connection, and having a blast together.", fr: "Club Choir est une chorale communautaire sans audition et sans pression pour les adultes qui aiment chanter — que vous ayez chanté toute votre vie ou pas depuis le secondaire. On apprend les chansons à l'oreille, avec un peu de partitions, en mettant l'accent sur les belles harmonies, les vraies connexions et le plaisir de chanter ensemble." },
  "hudson.vibeP2": { en: "Think folk, pop, indie and acoustic rock — songs you actually want to sing — in a warm, welcoming room where every voice belongs.", fr: "Pensez folk, pop, indie et rock acoustique — des chansons que vous avez vraiment envie de chanter — dans un espace chaleureux et accueillant où chaque voix a sa place." },
  "hudson.where": { en: "Where", fr: "Où" },
  "hudson.when": { en: "When", fr: "Quand" },
  "hudson.dates": { en: "Dates", fr: "Dates" },
  "hudson.mondays": { en: "Mondays", fr: "Lundis" },
  "hudson.timeRange": { en: "7:00 – 8:30 PM", fr: "19h00 – 20h30" },
  "hudson.dateRange": { en: "May 18 – Aug 17, 2026", fr: "18 mai – 17 août 2026" },
  "hudson.sessionLength": { en: "14-week session · $280", fr: "Session de 14 semaines · 280 $" },
  "hudson.urgencyTitle": { en: "Spots are filling up", fr: "Les places se remplissent" },
  "hudson.urgencyDesc": { en: "We start in just a few weeks — reserve your place now so you don't miss a single rehearsal.", fr: "Nous commençons dans quelques semaines — réservez votre place dès maintenant pour ne manquer aucune répétition." },
  "hudson.successTitle": { en: "You're on the list! 🎉", fr: "Vous êtes sur la liste ! 🎉" },
  "hudson.successDesc": { en: "Check your inbox — we just sent you the e-transfer instructions to confirm your spot. Your registration is finalized once payment is received.", fr: "Vérifiez votre boîte de réception — nous venons de vous envoyer les instructions pour le virement Interac afin de confirmer votre place. Votre inscription sera finalisée dès la réception du paiement." },
  "hudson.questionsEmail": { en: "Questions? Email", fr: "Des questions ? Écrivez à" },
  "hudson.formTitle": { en: "Reserve your spot", fr: "Réservez votre place" },
  "hudson.formDesc": { en: "Fill in your details and we'll email you the e-transfer instructions right away.", fr: "Remplissez vos coordonnées et nous vous enverrons les instructions de virement Interac immédiatement." },
  "hudson.firstName": { en: "First name *", fr: "Prénom *" },
  "hudson.lastName": { en: "Last name *", fr: "Nom *" },
  "hudson.emailLabel": { en: "Email address *", fr: "Adresse courriel *" },
  "hudson.messageLabel": { en: "Have a question? (optional)", fr: "Une question ? (facultatif)" },
  "hudson.messagePlaceholder": { en: "Ask anything — about the session, the music, or how registration works…", fr: "Posez n'importe quelle question — sur la session, la musique ou l'inscription…" },
  "hudson.faqTitle": { en: "Frequently asked questions", fr: "Questions fréquemment posées" },
  "hudson.faqSubtitle": { en: "Everything you need to know about Club Choir", fr: "Tout ce que vous devez savoir sur Club Choir" },
  "hudson.submit": { en: "Send me the registration details", fr: "Envoyez-moi les détails d'inscription" },
  "hudson.submitting": { en: "Sending...", fr: "Envoi en cours..." },
  "hudson.paymentNote": { en: "Your spot is officially reserved only once we receive your $280 e-transfer. Instructions will be in the confirmation email.", fr: "Votre place est officiellement réservée seulement après réception de votre virement Interac de 280 $. Les instructions se trouveront dans le courriel de confirmation." },
  "hudson.haveQuestions": { en: "Have questions? Write to", fr: "Des questions ? Écrivez à" },
  "hudson.toast.fillFields": { en: "Please fill in all fields", fr: "Veuillez remplir tous les champs" },
  "hudson.toast.errorTitle": { en: "Something went wrong", fr: "Une erreur est survenue" },
  "hudson.toast.errorDesc": { en: "Please try again or email ailsa@clubchoir.ca", fr: "Veuillez réessayer ou écrire à ailsa@clubchoir.ca" },

  // Hudson — Briana & Seiji intro
  "hudson.brianaTitle": { en: "Meet Briana & Seiji", fr: "Rencontrez Briana et Seiji" },
  "hudson.brianaP1": { en: "Briana Doyle and Seiji Gutierrez are the newest additions to the Club Choir team, with Briana leading the new Hudson choir and Seiji accompanying on guitar.", fr: "Briana Doyle et Seiji Gutierrez sont les plus récents membres de l'équipe Club Choir : Briana dirige la nouvelle chorale de Hudson et Seiji l'accompagne à la guitare." },
  "hudson.brianaP2": { en: "Briana is a singer-songwriter and performer known for her warm, expressive voice and her passion for storytelling through music. Drawing on folk, acoustic rock, and alternative influences from the 60s through the 90s, her sound is both emotive and timeless.", fr: "Briana est une autrice-compositrice-interprète reconnue pour sa voix chaleureuse et expressive et sa passion pour raconter des histoires en musique. Inspirée par le folk, le rock acoustique et les influences alternatives des années 60 aux années 90, sa musique est à la fois émotive et intemporelle." },
  "hudson.brianaP3": { en: "Her debut album The Road is Long (2025), featuring original songs in both English and French, has received airplay on CBC Radio and community stations across Canada. Briana performs regularly throughout Eastern Ontario and the Greater Montreal area, and is joined by Seiji, whose intuitive, layered guitar work adds depth and richness to their sound.", fr: "Son premier album The Road is Long (2025), comprenant des chansons originales en anglais et en français, a été diffusé sur CBC Radio et sur des stations communautaires partout au Canada. Briana se produit régulièrement dans l'Est de l'Ontario et dans la grande région de Montréal, accompagnée de Seiji, dont le jeu de guitare intuitif et nuancé ajoute profondeur et richesse à leur son." },
  "hudson.brianaP4": { en: "Together, they bring a musical approach grounded in connection, harmony, and authenticity — and are a perfect addition to the Club Choir team.", fr: "Ensemble, ils proposent une approche musicale ancrée dans la connexion, l'harmonie et l'authenticité — un ajout parfait à l'équipe Club Choir." },

  // ThisWeek meta
  "thisWeek.meta.title": { en: "This Week at Club Choir", fr: "Cette semaine au Club Choir" },
  "thisWeek.meta.desc": { en: "See what's happening this week at Club Choir. Weekly rehearsal times and locations for all 4 Quebec locations.", fr: "Voyez ce qui se passe cette semaine au Club Choir. Horaires et lieux des répétitions hebdomadaires pour nos 4 emplacements au Québec." },

  // Login extras
  "login.signIn.title": { en: "Sign In", fr: "Se connecter" },
  "login.signUp.subtitle": { en: "Create your Club Choir account", fr: "Créez votre compte Club Choir" },
  "login.signIn.subtitle": { en: "Sign in to your Club Choir account", fr: "Connectez-vous à votre compte Club Choir" },
  "login.notice": { en: "Please note: access to member resources (chat, song files, community page) is only available to current Club Choir members.", fr: "Veuillez noter : l'accès aux ressources des membres (clavardage, fichiers de chansons, page communauté) est réservé aux membres actuels de Club Choir." },
  "login.displayName.placeholder": { en: "Display name (visible to other members)", fr: "Nom d'affichage (visible par les autres membres)" },
  "login.requireLocation": { en: "Please select your location.", fr: "Veuillez sélectionner votre lieu." },
  "login.requireDisplayName": { en: "Please enter a display name.", fr: "Veuillez entrer un nom d'affichage." },
  "login.passwordRules": { en: "Password must be at least 8 characters with uppercase, lowercase and a number.", fr: "Le mot de passe doit comporter au moins 8 caractères avec majuscule, minuscule et un chiffre." },
  "login.rule.minLength": { en: "At least 8 characters", fr: "Au moins 8 caractères" },
  "login.rule.lowercase": { en: "One lowercase letter (a–z)", fr: "Une lettre minuscule (a–z)" },
  "login.rule.uppercase": { en: "One uppercase letter (A–Z)", fr: "Une lettre majuscule (A–Z)" },
  "login.rule.number": { en: "One number (0–9)", fr: "Un chiffre (0–9)" },
  "login.passwordRulesHint": { en: "Please meet all password requirements above before continuing.", fr: "Veuillez respecter toutes les exigences ci-dessus avant de continuer." },

  // Reset password extras
  "reset.loading": { en: "Loading...", fr: "Chargement..." },
  "reset.linkExpired": { en: "Your reset link has expired. Please request a new one from the login page.", fr: "Votre lien de réinitialisation a expiré. Veuillez en demander un nouveau depuis la page de connexion." },

  // Common toasts & errors
  "common.error": { en: "Error", fr: "Erreur" },
  "common.something.wrong": { en: "Something went wrong", fr: "Une erreur est survenue" },
  "common.try.again": { en: "Please try again later.", fr: "Veuillez réessayer plus tard." },
  "common.cancel": { en: "Cancel", fr: "Annuler" },
  "common.save": { en: "Save", fr: "Enregistrer" },
  "common.delete": { en: "Delete", fr: "Supprimer" },
  "common.add": { en: "Add", fr: "Ajouter" },
  "common.edit": { en: "Edit", fr: "Modifier" },
  "common.back": { en: "Back", fr: "Retour" },
  "common.retry": { en: "Retry", fr: "Réessayer" },

  // Try a Session — toasts & validation
  "try.toast.sent.title": { en: "Message sent!", fr: "Message envoyé !" },
  "try.toast.sent.desc": { en: "We'll be in touch soon.", fr: "Nous vous contacterons bientôt." },
  "try.validation.name": { en: "Name is required", fr: "Le nom est requis" },
  "try.validation.email": { en: "Invalid email address", fr: "Adresse courriel invalide" },
  "try.validation.location": { en: "Please choose a location", fr: "Veuillez choisir un lieu" },
  "try.validation.message": { en: "Message is required", fr: "Le message est requis" },
  "try.validation.messageMax": { en: "Message must be under 2000 characters", fr: "Le message doit faire moins de 2000 caractères" },
  "try.preview.caption": { en: "A real Club Choir session in progress — that's exactly what you're walking into.", fr: "Une vraie session Club Choir en action — c'est exactement ce qui vous attend." },

  // Bring a Friend — toasts & validation
  "friend.toast.sent.title": { en: "Request sent!", fr: "Demande envoyée !" },
  "friend.toast.sent.desc": { en: "We'll be in touch with your friend soon.", fr: "Nous contacterons votre ami(e) bientôt." },
  "friend.validation.yourName": { en: "Your name is required", fr: "Votre nom est requis" },
  "friend.validation.friendName": { en: "Friend's name is required", fr: "Le nom de l'ami(e) est requis" },
  "friend.validation.friendEmail": { en: "Invalid email address", fr: "Adresse courriel invalide" },
  "friend.validation.location": { en: "Please choose a location", fr: "Veuillez choisir un lieu" },
  "friend.validation.messageMax": { en: "Message must be under 2000 characters", fr: "Le message doit faire moins de 2000 caractères" },

  // Resources — toasts & misc
  "resources.toast.loadFail": { en: "Failed to load resources.", fr: "Échec du chargement des ressources." },
  "resources.toast.uploadFail": { en: "Upload failed", fr: "Échec du téléversement" },
  "resources.toast.saveFail": { en: "Save failed", fr: "Échec de l'enregistrement" },
  "resources.toast.uploaded": { en: "Uploaded!", fr: "Téléversé !" },
  "resources.toast.downloadFail": { en: "Download failed", fr: "Échec du téléchargement" },
  "resources.toast.loginToDownload": { en: "Please log in to download files.", fr: "Veuillez vous connecter pour télécharger les fichiers." },
  "resources.toast.cantGenerate": { en: "Could not generate download link.", fr: "Impossible de générer le lien de téléchargement." },
  "resources.toast.cantDownload": { en: "Could not download file.", fr: "Impossible de télécharger le fichier." },
  "resources.toast.playFail": { en: "Playback failed", fr: "Échec de la lecture" },
  "resources.toast.cantPlay": { en: "Could not play audio.", fr: "Impossible de lire l'audio." },
  "resources.toast.deleted": { en: "Deleted", fr: "Supprimé" },
  "resources.uploading": { en: "Uploading…", fr: "Téléversement…" },
  "resources.backToSchedule": { en: "Back to Schedule", fr: "Retour au calendrier" },
  "resources.deleteConfirm": { en: "Delete {name}?", fr: "Supprimer {name} ?" },
  "resources.songNamePlaceholder": { en: "e.g. Bohemian Rhapsody", fr: "ex. Bohemian Rhapsody" },
  "resources.slides": { en: "Slides", fr: "Diapositives" },
  "resources.play": { en: "Play", fr: "Lire" },
  "resources.pause": { en: "Pause", fr: "Pause" },
  "resources.download": { en: "Download", fr: "Télécharger" },

  // Profile extras
  "profile.admin": { en: "Admin", fr: "Administrateur" },
  "profile.adminDashboard": { en: "Admin Dashboard", fr: "Tableau de bord admin" },
  "profile.signInUp": { en: "Sign In / Sign Up", fr: "Connexion / Inscription" },

  // Subscribe page (was inline ternaries)
  "subscribe.meta.title": { en: "Join the mailing list – Club Choir", fr: "S'inscrire à la liste – Club Choir" },
  "subscribe.title": { en: "Stay in the loop with Club Choir", fr: "Restez informé avec Club Choir" },
  "subscribe.subtitle": { en: "Join our mailing list for news, events, and early registration — no commitment, no account required.", fr: "Inscrivez-vous à notre liste pour recevoir les nouvelles, les événements et les inscriptions anticipées — aucune obligation." },
  "subscribe.whatYouGet": { en: "What you'll get", fr: "Ce que vous recevrez" },
  "subscribe.benefit1": { en: "The latest information on Club Choir events", fr: "Les dernières nouvelles sur les événements Club Choir" },
  "subscribe.benefit2": { en: "Early registration emails so you can preview the songs in the new session", fr: "Inscriptions anticipées et aperçu des chansons de la prochaine session" },
  "subscribe.benefit3": { en: "Invitations to open houses and pop-up summer choir events", fr: "Invitations aux journées portes ouvertes et chorales pop-up estivales" },
  "subscribe.firstName": { en: "First name", fr: "Prénom" },
  "subscribe.lastName": { en: "Last name (optional)", fr: "Nom (facultatif)" },
  "subscribe.email": { en: "Email address", fr: "Adresse courriel" },
  "subscribe.locations": { en: "Locations you're interested in", fr: "Lieux qui vous intéressent" },
  "subscribe.locationsHelp": { en: "Select all that apply", fr: "Sélectionnez tous ceux qui s'appliquent" },
  "subscribe.submit": { en: "Add me to the list", fr: "M'inscrire à la liste" },
  "subscribe.submitting": { en: "Submitting...", fr: "Envoi en cours..." },
  "subscribe.success.title": { en: "You're on the list! 🎉", fr: "Bienvenue à bord ! 🎉" },
  "subscribe.success.desc": { en: "Check your inbox — a welcome email is on its way.", fr: "Surveillez votre boîte de réception — un courriel de bienvenue est en route." },
  "subscribe.backHome": { en: "Back to home", fr: "Retour à l'accueil" },
  "subscribe.privacy": { en: "We'll only use your email for Club Choir updates. Unsubscribe anytime.", fr: "Nous n'utiliserons votre courriel que pour les nouvelles de Club Choir. Désinscription en tout temps." },
  "subscribe.checkForm": { en: "Please check the form", fr: "Vérifiez le formulaire" },
  "subscribe.invalidInput": { en: "Invalid input", fr: "Saisie invalide" },
  "subscribe.tryAgain": { en: "Please try again.", fr: "Veuillez réessayer." },
  "subscribe.firstNameRequired": { en: "First name is required", fr: "Le prénom est requis" },
  "subscribe.validEmail": { en: "Please enter a valid email", fr: "Veuillez entrer un courriel valide" },
  "subscribe.selectLocation": { en: "Please select at least one location", fr: "Veuillez sélectionner au moins un lieu" },

  // Community filters & headers
  "community.filterLocation": { en: "Location", fr: "Lieu" },
  "community.filterStatus": { en: "Status", fr: "Statut" },
  "community.filterPayment": { en: "Payment", fr: "Paiement" },
  "community.locationsCount": { en: "locations", fr: "lieux" },
  "community.tableLocation": { en: "Location", fr: "Lieu" },
  "community.tableStatus": { en: "Status", fr: "Statut" },
  "community.tableJoined": { en: "Joined", fr: "Inscrit le" },
  "community.tablePayment": { en: "Payment", fr: "Paiement" },
  "community.status.active": { en: "Active", fr: "Actif" },
  "community.status.inactive": { en: "Inactive", fr: "Inactif" },
  "community.status.prospect": { en: "Prospect", fr: "Prospect" },
  "community.status.trial": { en: "Essai", fr: "Essai" },

  // Manage Members
  "manage.title": { en: "Manage Members", fr: "Gérer les membres" },
  "manage.totalMembers": { en: "{n} total members", fr: "{n} membres au total" },
  "manage.signedUpUsers": { en: "Signed Up Users", fr: "Utilisateurs inscrits" },
  "manage.addMember": { en: "Add Member", fr: "Ajouter un membre" },
  "manage.searchPlaceholder": { en: "Search by name or email...", fr: "Rechercher par nom ou courriel..." },
  "manage.allStatuses": { en: "All statuses", fr: "Tous les statuts" },
  "manage.selected": { en: "{n} selected", fr: "{n} sélectionné(s)" },
  "manage.changeStatus": { en: "Change Status", fr: "Modifier le statut" },
  "manage.clear": { en: "Clear", fr: "Effacer" },
  "manage.col.name": { en: "Name", fr: "Nom" },
  "manage.col.email": { en: "Email", fr: "Courriel" },
  "manage.col.location": { en: "Location", fr: "Lieu" },
  "manage.col.status": { en: "Status", fr: "Statut" },
  "manage.col.sessions": { en: "Sessions", fr: "Sessions" },
  "manage.col.joined": { en: "Joined", fr: "Inscrit le" },
  "manage.col.payment": { en: "Payment", fr: "Paiement" },
  "manage.col.actions": { en: "Actions", fr: "Actions" },
  "manage.noMembers": { en: "No members found.", fr: "Aucun membre trouvé." },
  "manage.editMember": { en: "Edit Member", fr: "Modifier le membre" },
  "manage.firstName": { en: "First Name *", fr: "Prénom *" },
  "manage.lastName": { en: "Last Name *", fr: "Nom *" },
  "manage.email": { en: "Email", fr: "Courriel" },
  "manage.location": { en: "Location", fr: "Lieu" },
  "manage.status": { en: "Status", fr: "Statut" },
  "manage.paymentStatus": { en: "Payment Status", fr: "Statut de paiement" },
  "manage.paymentPlaceholder": { en: "e.g. Paid, Pending", fr: "ex. Payé, En attente" },
  "manage.notes": { en: "Notes", fr: "Notes" },
  "manage.select": { en: "Select", fr: "Sélectionner" },
  "manage.saveChanges": { en: "Save Changes", fr: "Enregistrer" },
  "manage.bulkTitle": { en: "Change Status for {n} Member(s)", fr: "Modifier le statut pour {n} membre(s)" },
  "manage.newStatus": { en: "New Status", fr: "Nouveau statut" },
  "manage.applyTo": { en: "Apply to {n} Member(s)", fr: "Appliquer à {n} membre(s)" },
  "manage.removeMember": { en: "Remove Member", fr: "Retirer le membre" },
  "manage.aboutToRemove": { en: "You are about to remove", fr: "Vous êtes sur le point de retirer" },
  "manage.recommended": { en: "Recommended: Deactivate instead", fr: "Recommandé : désactiver plutôt" },
  "manage.recommendedDesc": { en: "Sets member status to INACTIVE. Their data is preserved and can be reactivated later.", fr: "Définit le statut du membre à INACTIF. Ses données sont conservées et peuvent être réactivées plus tard." },
  "manage.deactivate": { en: "Deactivate Member", fr: "Désactiver le membre" },
  "manage.permaDelete": { en: "Permanent Delete", fr: "Suppression définitive" },
  "manage.permaDeleteDesc": { en: "This cannot be undone. Type DELETE to confirm.", fr: "Action irréversible. Tapez DELETE pour confirmer." },
  "manage.typeDelete": { en: 'Type "DELETE" to confirm', fr: 'Tapez « DELETE » pour confirmer' },
  "manage.permaDeleteBtn": { en: "Permanently Delete", fr: "Supprimer définitivement" },
  "manage.toast.namesRequired": { en: "First and last name are required", fr: "Le prénom et le nom sont requis" },
  "manage.toast.errorUpdate": { en: "Error updating member", fr: "Erreur lors de la mise à jour du membre" },
  "manage.toast.errorAdd": { en: "Error adding member", fr: "Erreur lors de l'ajout du membre" },
  "manage.toast.updated": { en: "Member updated", fr: "Membre mis à jour" },
  "manage.toast.added": { en: "Member added", fr: "Membre ajouté" },
  "manage.toast.errorDeactivate": { en: "Error deactivating member", fr: "Erreur lors de la désactivation" },
  "manage.toast.deactivated": { en: "Member deactivated", fr: "Membre désactivé" },
  "manage.toast.errorDelete": { en: "Error deleting member", fr: "Erreur lors de la suppression" },
  "manage.toast.deleted": { en: "Member permanently removed", fr: "Membre supprimé définitivement" },
  "manage.toast.errorBulk": { en: "Error updating members", fr: "Erreur lors de la mise à jour des membres" },
  "manage.toast.bulkDone": { en: "{n} member(s) set to {status}", fr: "{n} membre(s) défini(s) à {status}" },

  // MemberEditForm
  "edit.editInfo": { en: "Edit Info", fr: "Modifier les infos" },
  "edit.title": { en: "Edit Member", fr: "Modifier le membre" },
  "edit.firstName": { en: "First Name", fr: "Prénom" },
  "edit.lastName": { en: "Last Name", fr: "Nom" },
  "edit.email": { en: "Email", fr: "Courriel" },
  "edit.location": { en: "Location", fr: "Lieu" },
  "edit.status": { en: "Status", fr: "Statut" },
  "edit.payment": { en: "Payment Status", fr: "Statut de paiement" },
  "edit.joined": { en: "Joined Date", fr: "Date d'inscription" },
  "edit.notes": { en: "Notes", fr: "Notes" },
  "edit.errorSaving": { en: "Error saving", fr: "Erreur lors de l'enregistrement" },
  "edit.updated": { en: "Member updated", fr: "Membre mis à jour" },

  // Send Email
  "sendEmail.title": { en: "Send Email", fr: "Envoyer un courriel" },
  "sendEmail.subtitle": { en: "Compose and send emails to your members", fr: "Composez et envoyez des courriels à vos membres" },
  "sendEmail.adminOnly": { en: "Admin Only", fr: "Réservé aux administrateurs" },
  "sendEmail.adminOnlyDesc": { en: "You need admin access to send emails.", fr: "Vous devez être administrateur pour envoyer des courriels." },
  "sendEmail.goHome": { en: "Go Home", fr: "Retour à l'accueil" },
  "sendEmail.loadFail": { en: "Failed to load members", fr: "Échec du chargement des membres" },
  "sendEmail.recipients": { en: "Recipients", fr: "Destinataires" },
  "sendEmail.allLocations": { en: "All locations", fr: "Tous les lieux" },
  "sendEmail.includeInactive": { en: "Include inactive", fr: "Inclure inactifs" },
  "sendEmail.recipientsSelected": { en: "{n} recipient(s) selected", fr: "{n} destinataire(s) sélectionné(s)" },
  "sendEmail.selectAll": { en: "Select all", fr: "Tout sélectionner" },
  "sendEmail.noMatch": { en: "No members match filters.", fr: "Aucun membre ne correspond aux filtres." },
  "sendEmail.searchOrAdd": { en: "Type to search members or add email…", fr: "Rechercher des membres ou ajouter un courriel…" },
  "sendEmail.subject": { en: "Subject", fr: "Sujet" },
  "sendEmail.subjectPlaceholder": { en: "e.g. This Week at Club Choir", fr: "ex. Cette semaine au Club Choir" },
  "sendEmail.message": { en: "Message", fr: "Message" },
  "sendEmail.messagePlaceholder": { en: "Write your message here…", fr: "Écrivez votre message ici…" },
  "sendEmail.charCount": { en: "{n}/5000 characters", fr: "{n}/5000 caractères" },
  "sendEmail.sending": { en: "Sending…", fr: "Envoi en cours…" },
  "sendEmail.sendTo": { en: "Send to {n} member(s)", fr: "Envoyer à {n} membre(s)" },
  "sendEmail.invalidEmail": { en: "Invalid email", fr: "Courriel invalide" },
  "sendEmail.invalidEmailDesc": { en: "Please enter a valid email address.", fr: "Veuillez entrer une adresse courriel valide." },
  "sendEmail.added": { en: "Added", fr: "Ajouté" },
  "sendEmail.removed": { en: "Removed", fr: "Retiré" },
  "sendEmail.noRecipients": { en: "No recipients", fr: "Aucun destinataire" },
  "sendEmail.noRecipientsDesc": { en: "Select at least one member.", fr: "Sélectionnez au moins un membre." },
  "sendEmail.missingSubject": { en: "Missing subject", fr: "Sujet manquant" },
  "sendEmail.missingSubjectDesc": { en: "Please enter a subject line.", fr: "Veuillez entrer un sujet." },
  "sendEmail.missingMessage": { en: "Missing message", fr: "Message manquant" },
  "sendEmail.missingMessageDesc": { en: "Please write a message.", fr: "Veuillez écrire un message." },
  "sendEmail.sent": { en: "Emails sent!", fr: "Courriels envoyés !" },
  "sendEmail.failed": { en: "Failed to send", fr: "Échec de l'envoi" },
  "sendEmail.errorLoading": { en: "Error loading members", fr: "Erreur de chargement des membres" },

  // Location Chat
  "chat.title": { en: "Location Chat", fr: "Clavardage par lieu" },
  "chat.subtitle": { en: "Connect with members at your location", fr: "Échangez avec les membres de votre lieu" },
  "chat.membersOnly": { en: "Members Only", fr: "Membres seulement" },
  "chat.loginPrompt": { en: "Log in to chat with your choir community.", fr: "Connectez-vous pour clavarder avec votre communauté chorale." },
  "chat.broadcast": { en: "Broadcast to All", fr: "Diffuser à tous" },
  "chat.broadcastTitle": { en: "Broadcast to All Locations", fr: "Diffuser à tous les lieux" },
  "chat.broadcastDesc": { en: "This message will be posted to all 4 location chats.", fr: "Ce message sera publié dans les clavardages des 4 lieux." },
  "chat.announcePlaceholder": { en: "Write your announcement…", fr: "Rédigez votre annonce…" },
  "chat.sending": { en: "Sending…", fr: "Envoi…" },
  "chat.sendToAll": { en: "Send to All Locations", fr: "Envoyer à tous les lieux" },
  "chat.empty": { en: "No messages yet. Start the conversation! 🎵", fr: "Aucun message pour l'instant. Lancez la conversation ! 🎵" },
  "chat.typeMessage": { en: "Type a message…", fr: "Écrire un message…" },
  "chat.today": { en: "Today", fr: "Aujourd'hui" },
  "chat.yesterday": { en: "Yesterday", fr: "Hier" },
  "chat.broadcastSent": { en: "Broadcast sent!", fr: "Diffusion envoyée !" },
  "chat.broadcastSentDesc": { en: "Message posted to all 4 locations.", fr: "Message publié dans les 4 lieux." },

  // Member Detail
  "detail.notFound": { en: "Member not found.", fr: "Membre introuvable." },
  "detail.backToMembers": { en: "Back to Members", fr: "Retour aux membres" },
  "detail.location": { en: "Location", fr: "Lieu" },
  "detail.joined": { en: "Joined", fr: "Inscrit le" },
  "detail.sessionsAttended": { en: "Sessions Attended", fr: "Sessions suivies" },
  "detail.payment": { en: "Payment", fr: "Paiement" },
  "detail.attendance": { en: "Session Attendance", fr: "Présence aux sessions" },
  "detail.attended": { en: "Attended", fr: "Présent" },
  "detail.interestedIn": { en: "Interested in {s}", fr: "Intéressé par {s}" },
  "detail.markInterested": { en: "Mark as interested in the upcoming session", fr: "Marquer comme intéressé par la prochaine session" },
  "detail.interested": { en: "Interested", fr: "Intéressé" },
  "detail.memberNotes": { en: "Member Notes", fr: "Notes du membre" },
  "detail.notesTimeline": { en: "Notes Timeline", fr: "Historique des notes" },
  "detail.addNotePlaceholder": { en: "Add a note...", fr: "Ajouter une note..." },
  "detail.noNotes": { en: "No notes yet. Add your first note above.", fr: "Aucune note pour l'instant. Ajoutez la première ci-dessus." },
  "detail.errorSavingNote": { en: "Error saving note", fr: "Erreur lors de l'enregistrement de la note" },
  "detail.noteAdded": { en: "Note added", fr: "Note ajoutée" },

  // Signed Up Users
  "signedUp.title": { en: "Signed Up Users", fr: "Utilisateurs inscrits" },
  "signedUp.totalUsers": { en: "{n} registered users", fr: "{n} utilisateurs inscrits" },
  "signedUp.allMembers": { en: "All Members", fr: "Tous les membres" },
  "signedUp.pending": { en: "Pending Signups ({n})", fr: "Inscriptions en attente ({n})" },
  "signedUp.unknown": { en: "Unknown", fr: "Inconnu" },
  "signedUp.noLocation": { en: "No location", fr: "Aucun lieu" },
  "signedUp.signedUpOn": { en: "Signed up", fr: "Inscrit le" },
  "signedUp.approve": { en: "Approve", fr: "Approuver" },
  "signedUp.searchPlaceholder": { en: "Search by name or email...", fr: "Rechercher par nom ou courriel..." },
  "signedUp.noUsers": { en: "No signed up users yet.", fr: "Aucun utilisateur inscrit pour l'instant." },
  "signedUp.col.email": { en: "Email", fr: "Courriel" },
  "signedUp.col.name": { en: "Name", fr: "Nom" },
  "signedUp.col.displayName": { en: "Display Name", fr: "Nom d'affichage" },
  "signedUp.col.location": { en: "Location", fr: "Lieu" },
  "signedUp.col.status": { en: "Status", fr: "Statut" },
  "signedUp.col.signedUp": { en: "Signed Up", fr: "Inscrit le" },
  "signedUp.col.verified": { en: "Verified", fr: "Vérifié" },
  "signedUp.yes": { en: "Yes", fr: "Oui" },
  "signedUp.confirm": { en: "Confirm", fr: "Confirmer" },
  "signedUp.resend": { en: "Resend", fr: "Renvoyer" },
  "signedUp.errorApproving": { en: "Error approving", fr: "Erreur lors de l'approbation" },
  "signedUp.approved": { en: "Member approved!", fr: "Membre approuvé !" },
  "signedUp.approvedDesc": { en: "{name} now has full access and has been emailed.", fr: "{name} a maintenant un accès complet et a reçu un courriel." },
  "signedUp.noMatch": { en: "No matching member record", fr: "Aucun dossier de membre correspondant" },
  "signedUp.noMatchDesc": { en: "Add a member with email {email} in Manage Members to complete their profile.", fr: "Ajoutez un membre avec le courriel {email} dans Gérer les membres pour compléter son profil." },
  "signedUp.emailConfirmed": { en: "Email confirmed!", fr: "Courriel confirmé !" },
  "signedUp.emailResent": { en: "Confirmation email resent!", fr: "Courriel de confirmation renvoyé !" },

  // Admin Schedule Upload
  "schedule.uploadHelp": { en: "Upload a CSV with columns: Week, Location, Date, Activity, Artist", fr: "Téléversez un CSV avec les colonnes : Semaine, Lieu, Date, Activité, Artiste" },
  "schedule.chooseCsv": { en: "Choose CSV File", fr: "Choisir un fichier CSV" },
  "schedule.processing": { en: "Processing CSV…", fr: "Traitement du CSV…" },
  "schedule.uploadFailed": { en: "Upload failed", fr: "Échec du téléversement" },
  "schedule.uploadedDone": { en: "Uploaded {n} sessions for {locs}.", fr: "{n} sessions téléversées pour {locs}." },
  "schedule.noRows": { en: "No valid rows found in CSV", fr: "Aucune ligne valide trouvée dans le CSV" },

  // Events page (was inline ternaries)
  "events.upcoming": { en: "Upcoming Events", fr: "Événements à venir" },
  "events.communityEvents": { en: "Community Events", fr: "Événements communautaires" },
  "events.summerOpen": { en: "Summer Choir · Registration open", fr: "Chorale d'été · Inscriptions ouvertes" },
  "events.hudsonSummerTitle": { en: "Hudson Summer Choir", fr: "Chorale d'été à Hudson" },
  "events.hudsonSummerDesc": { en: "Join us every Monday this summer at the Kingfisher Pub in Hudson for group singing in a relaxed, welcoming atmosphere. No experience needed.", fr: "Joignez-vous à nous tous les lundis de l'été au Kingfisher Pub à Hudson pour chanter en groupe dans une ambiance détendue et accueillante. Aucune expérience requise." },
  "events.reserveSpot": { en: "Reserve your spot", fr: "Réservez votre place" },
  "events.popupTickets": { en: "Pop-Up Choir · Tickets on sale", fr: "Chorale Pop-Up · Billets en vente" },
  "events.popupTitle": { en: "Club Choir Pop-Up at Studio 77", fr: "Club Choir Pop-Up au Studio 77" },
  "events.popupDate": { en: "Sunday, May 31 · 3:00 PM – 5:00 PM", fr: "Dimanche 31 mai · 15 h – 17 h" },
  "events.popupDesc": { en: "A 2-hour pop-up choir experience for anyone who loves to sing — no experience needed. We'll learn a song together and be singing in harmony by the end, accompanied by musician Gary White.", fr: "Une expérience de chorale pop-up de 2 heures pour quiconque aime chanter — aucune expérience requise. Nous apprendrons une chanson ensemble et chanterons en harmonie d'ici la fin, accompagnés par le musicien Gary White." },
  "events.popupPrice": { en: "$15 per person · Spots limited", fr: "15 $ par personne · Places limitées" },
  "events.communityPerf": { en: "Community Performance", fr: "Performance communautaire" },
  "events.porchfestTitle": { en: "Club Choir at NDG Porchfest", fr: "Club Choir au Porchfest NDG" },
  "events.porchfestDate": { en: "May 16 at 12 PM", fr: "16 mai à 12 h" },
  "events.porchfestDesc1": { en: "Club Choir members from all locations will come together for a special community performance as part of Porchfest NDG. This free, volunteer-run event transforms NDG into a self-guided walking tour of live music, with performances happening on porches throughout the neighbourhood.", fr: "Les membres de Club Choir de tous les lieux se réuniront pour une performance communautaire spéciale dans le cadre du Porchfest NDG. Cet événement gratuit, géré par des bénévoles, transforme NDG en un circuit de musique live autoguidé, avec des performances sur les porches du quartier." },
  "events.porchfestDesc2": { en: "Join us as our singers gather to share a few songs and celebrate music, community, and connection in one of Montreal's most vibrant local traditions.", fr: "Joignez-vous à nous alors que nos chanteurs se réunissent pour partager quelques chansons et célébrer la musique, la communauté et les liens dans l'une des traditions locales les plus vibrantes de Montréal." },
  "events.porchfestVenue": { en: "Montreal (NDG)", fr: "Montréal (NDG)" },
  "events.victoriaTitle": { en: "Club Choir at Victoria Village Street Festival", fr: "Club Choir au Festival de rue de Victoria Village" },
  "events.victoriaDate": { en: "June 13 at 1 PM", fr: "13 juin à 13h" },
  "events.victoriaDesc1": { en: "Join Club Choir for a fun, interactive outdoor singing experience in the heart of the festival. We'll start with a short performance, then invite everyone to take part in a live, all-levels sing-along—Club Choir style. No experience needed, just come ready to sing and enjoy the moment.", fr: "Joignez-vous à Club Choir pour une expérience de chant extérieure interactive et amusante au cœur du festival. Nous commencerons par une courte performance, puis inviterons tout le monde à participer à un chant spontané pour tous les niveaux, à la manière Club Choir. Aucune expérience requise, venez simplement prêt à chanter et à profiter du moment." },
  "events.victoriaDesc2": { en: "This is a relaxed, welcoming event designed for anyone who loves music and wants to be part of something uplifting and social.", fr: "C'est un événement décontracté et accueillant conçu pour tous ceux qui aiment la musique et veulent faire partie de quelque chose de joyeux et social." },
  "events.victoriaVenue": { en: "Prince-Albert Square", fr: "Place Prince-Albert" },
  "events.accompanied": { en: "Accompanied by Gary White", fr: "Accompagné par Gary White" },
  "events.pointeclaireTitle": { en: "Club Choir at Pointe-Claire Village Street Festival", fr: "Club Choir au Festival de rue du Village de Pointe-Claire" },
  "events.pointeclaireDate": { en: "Saturday, August 8 · Time to be confirmed", fr: "Samedi 8 août · Heure à confirmer" },
  "events.pointeclaireDesc1": { en: "Join Club Choir at the Pointe-Claire Village Day Festival for a fun, interactive outdoor singing experience filled with music, energy, and community spirit. We'll kick things off with a live performance, then invite the crowd to sing along with us—Club Choir style. No experience needed, just bring your voice and enjoy the moment.", fr: "Joignez-vous à Club Choir au Festival du Village de Pointe-Claire pour une expérience de chant extérieure interactive et amusante, remplie de musique, d'énergie et d'esprit communautaire. Nous commencerons par une performance live, puis inviterons la foule à chanter avec nous, à la manière Club Choir. Aucune expérience requise, apportez simplement votre voix et profitez du moment." },
  "events.pointeclaireDesc2": { en: "This is a relaxed and welcoming event for anyone who loves music, connection, and being part of something uplifting. Whether you sing all the time or only in the car, everyone is welcome to join in.", fr: "C'est un événement décontracté et accueillant pour tous ceux qui aiment la musique, le lien social et faire partie de quelque chose de joyeux. Que vous chantiez tout le temps ou seulement dans votre voiture, tout le monde est le bienvenu." },
  "events.pointeclaireVenue": { en: "Pointe-Claire Village", fr: "Village de Pointe-Claire" },
  "events.loginRegister": { en: "Please log in to register.", fr: "Veuillez vous connecter pour vous inscrire." },
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
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};


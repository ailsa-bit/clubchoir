// Public landing page data for each Club Choir location.
// Used by src/pages/ChoirLocation.tsx for SEO-friendly per-city pages.

export type LocationSlug = "montreal" | "hudson" | "saint-hubert" | "pointe-claire";

export interface ChoirLocationData {
  slug: LocationSlug;
  city: string;
  /** Used in <title>, h1, schema.org name */
  pageTitle: string;
  metaDescription: string;
  pageTitleFr: string;
  metaDescriptionFr: string;
  /** Headline shown in the hero */
  heroHeadline: { en: string; fr: string };
  heroBlurb: { en: string; fr: string };
  /** Two longer SEO paragraphs */
  about: { en: string[]; fr: string[] };
  /** Used in the schedule chip */
  day: { en: string; fr: string };
  time: string;
  dates: { en: string; fr: string };
  /** Venue */
  venueName: string;
  venueAddress: string;
  venueCity: string;
  postalCode: string;
  region: string;
  country: string;
  /** Google Maps link */
  mapsUrl: string;
  /** Brand color theme (Tailwind class fragments) */
  theme: { bg: string; border: string; dot: string };
  /** Which photo ids from src/assets/photos to feature */
  photoIds: string[];
  /** Show a "NEW" badge on the page and in listings */
  isNew?: boolean;
  /** Open house date (Aug 2026), if applicable */
  openHouse?: { en: string; fr: string; time: string };

}

export const choirLocations: Record<LocationSlug, ChoirLocationData> = {
  montreal: {
    slug: "montreal",
    city: "Montreal",
    pageTitle: "Montreal Choir – Club Choir | No-Audition Adult Choir in Montréal",
    metaDescription:
      "Join Club Choir in Montreal — a friendly no-audition adult community choir that meets Monday evenings at Paroisse Notre-Dame-De-Grâce. Fall 2026 registration is open.",
    pageTitleFr: "Chorale Montréal – Club Choir | chorale pour adultes sans audition à Montréal",
    metaDescriptionFr:
      "Joignez Club Choir à Montréal — une chorale communautaire chaleureuse et sans audition pour adultes, les lundis soirs à la Paroisse Notre-Dame-De-Grâce. Inscriptions ouvertes pour l'automne 2026.",
    heroHeadline: {
      en: "Montreal Choir – Sing with us on Monday nights",
      fr: "Chorale Montréal – Chantez avec nous le lundi soir",
    },
    heroBlurb: {
      en: "A welcoming no-audition community choir for adults in Montreal. Just come and sing.",
      fr: "Une chorale communautaire sans audition pour les adultes à Montréal. Venez simplement chanter.",
    },
    about: {
      en: [
        "Club Choir Montreal is a relaxed, no-audition choir for adults of all ages and skill levels. We meet Monday evenings at Paroisse Notre-Dame-De-Grâce in NDG, and you don't need to read music or have any choir experience to take part. If you love singing — or have always wanted to try — you belong here.",
        "Every week, founder and director Ailsa leads the group through pop classics, soulful ballads, and feel-good harmonies, with live instrumental accompaniment at every rehearsal. Sessions run for 14 weeks each fall (September–December) and winter (February–May) and end with a fun community showcase. It's a chance to learn something new, meet wonderful people across Montreal, and leave each rehearsal a little lighter than you arrived.",
      ],
      fr: [
        "Club Choir Montréal est une chorale détendue et sans audition pour les adultes de tous âges et niveaux. Nous nous rencontrons le lundi soir à la Paroisse Notre-Dame-De-Grâce à NDG, et vous n'avez pas besoin de lire la musique ou d'avoir de l'expérience pour participer. Si vous aimez chanter — ou avez toujours voulu essayer — vous avez votre place ici.",
        "Chaque semaine, la fondatrice et directrice Ailsa guide le groupe à travers des classiques pop, des ballades soul et des harmonies entraînantes, avec un accompagnement instrumental live à chaque répétition. Les sessions durent 14 semaines, à l'automne (septembre–décembre) et à l'hiver (février–mai), et se terminent par un spectacle communautaire convivial. C'est l'occasion d'apprendre, de rencontrer des gens formidables et de repartir un peu plus léger chaque semaine.",
      ],
    },
    day: { en: "Mondays", fr: "Lundis" },
    time: "7:00–8:30 PM",
    dates: { en: "Sept 7 – Dec 7, 2026", fr: "7 sept. – 7 déc. 2026" },
    venueName: "Paroisse Notre-Dame-De-Grâce",
    venueAddress: "5333 avenue Notre-Dame-De-Grâce (corner Décarie)",
    venueCity: "Montréal",
    postalCode: "H4B 1K3",
    region: "QC",
    country: "CA",
    mapsUrl: "https://maps.google.com/?q=Paroisse+Notre-Dame-De-Grace+5333+avenue+Notre-Dame-De-Grace+Montreal",
    theme: { bg: "bg-pink-light", border: "border-pink/30", dot: "bg-pink" },
    photoIds: ["stage-performance", "group-christmas", "group-rehearsal"],
    openHouse: { en: "Monday, August 3, 2026", fr: "Lundi 3 août 2026", time: "7:00 PM" },
  },
  hudson: {
    slug: "hudson",
    city: "Hudson",
    pageTitle: "Hudson Choir – Club Choir | NEW No-Audition Community Choir at The Hudson Legion",
    metaDescription:
      "Club Choir Hudson is coming September 2026 — a brand-new no-audition community choir meeting Tuesday nights at The Hudson Legion on Beach Road. Register your interest now.",
    pageTitleFr: "Chorale Hudson – Club Choir | NOUVELLE chorale sans audition au Hudson Legion",
    metaDescriptionFr:
      "Club Choir Hudson arrive en septembre 2026 — une toute nouvelle chorale communautaire sans audition, les mardis soirs au Hudson Legion, sur Beach Road. Manifestez votre intérêt dès maintenant.",
    heroHeadline: {
      en: "Hudson Choir – Coming September 2026",
      fr: "Chorale Hudson – Dès septembre 2026",
    },
    heroBlurb: {
      en: "A brand-new no-audition adult choir is coming to Hudson at The Hudson Legion on Beach Road — a warm, welcoming community hall built for singing together.",
      fr: "Une toute nouvelle chorale sans audition pour adultes arrive à Hudson, au Hudson Legion sur Beach Road — une salle communautaire chaleureuse et accueillante, parfaite pour chanter ensemble.",
    },
    about: {
      en: [
        "Club Choir Hudson will launch in September 2026 at The Hudson Legion — a much-loved community gathering place on Beach Road, right in the heart of the village. It's a warm, welcoming space with plenty of room to sing, laugh, and make new friends.",
        "The session will meet every Tuesday night, led by director Ailsa through pop, folk, and feel-good harmonies with live instrumental accompaniment at every rehearsal. It's a no-audition community choir for adults, so whether you've sung your whole life or never set foot in a rehearsal, you'll be welcome to pull up a chair. Expect laughter, an end-of-term showcase, and friendships that spill out into the village long after rehearsal ends.",
      ],
      fr: [
        "Club Choir Hudson sera lancée en septembre 2026 au Hudson Legion — un lieu de rassemblement communautaire très aimé, sur Beach Road, au cœur du village. C'est un espace chaleureux et accueillant, avec beaucoup de place pour chanter, rire et faire de nouvelles rencontres.",
        "La session aura lieu chaque mardi soir, dirigée par Ailsa à travers la pop, le folk et des harmonies entraînantes, avec un accompagnement instrumental live à chaque répétition. C'est une chorale communautaire sans audition pour les adultes : que vous chantiez depuis toujours ou jamais, vous serez les bienvenus. Attendez-vous à des rires, un spectacle de fin de session, et des amitiés qui se prolongeront bien après les répétitions.",
      ],
    },
    day: { en: "Tuesdays", fr: "Mardis" },
    time: "7:00–8:30 PM",
    dates: { en: "Sept 8 – Dec 8, 2026", fr: "8 sept. – 8 déc. 2026" },
    venueName: "The Hudson Legion",
    venueAddress: "57 Beach Road",
    venueCity: "Hudson",
    postalCode: "J0P 1H0",
    region: "QC",
    country: "CA",
    mapsUrl: "https://maps.google.com/?q=Hudson+Legion+57+Beach+Road+Hudson+QC",
    theme: { bg: "bg-orange-light", border: "border-orange/30", dot: "bg-orange" },
    photoIds: ["pub-conducting", "pub-singing", "hudson-lyrics"],
    openHouse: { en: "Tuesday, August 4, 2026", fr: "Mardi 4 août 2026", time: "7:00 PM" },
    isNew: true,
  },
  "saint-hubert": {
    slug: "saint-hubert",
    city: "Saint-Hubert",
    pageTitle: "Saint-Hubert Choir – Club Choir | South Shore Community Choir",
    metaDescription:
      "Join Club Choir Saint-Hubert — a no-audition adult community choir on Montreal's South Shore. Wednesday evenings at St-Gabriel Catholic Church. Fall 2026 sign-up open.",
    pageTitleFr: "Chorale Saint-Hubert – Club Choir | chorale communautaire de la Rive-Sud",
    metaDescriptionFr:
      "Joignez Club Choir Saint-Hubert — une chorale communautaire pour adultes, sans audition, sur la Rive-Sud de Montréal. Les mercredis soirs à l'église St-Gabriel. Inscriptions ouvertes pour l'automne 2026.",
    heroHeadline: {
      en: "Saint-Hubert Choir – Wednesday evenings on the South Shore",
      fr: "Chorale Saint-Hubert – Mercredis soirs sur la Rive-Sud",
    },
    heroBlurb: {
      en: "A friendly no-audition adult choir for the South Shore, meeting weekly in Saint-Hubert.",
      fr: "Une chorale sans audition pour adultes de la Rive-Sud, chaque mercredi soir à Saint-Hubert.",
    },
    about: {
      en: [
        "Club Choir Saint-Hubert brings the same warm, no-audition spirit to Montreal's South Shore. We meet Wednesday evenings at St-Gabriel Catholic Church on Rue Gilbert, and the door is open to any adult who wants to sing — beginners absolutely welcome.",
        "Each session, director Ailsa teaches songs by ear with live instrumental accompaniment at every rehearsal, so you'll never need to read music. Sessions run for 14 weeks — fall (September–December) and winter (February–May) — and finish with a relaxed showcase performance. Expect harmony, laughter, and a real sense of community right in your own backyard.",
      ],
      fr: [
        "Club Choir Saint-Hubert apporte la même ambiance chaleureuse et sans audition sur la Rive-Sud. Nous nous rencontrons le mercredi soir à l'église St-Gabriel sur la rue Gilbert, et la porte est ouverte à tous les adultes qui veulent chanter — débutants bienvenus.",
        "Chaque session, la directrice Ailsa enseigne les chansons à l'oreille avec un accompagnement instrumental live à chaque répétition : pas besoin de lire la musique. Les sessions durent 14 semaines — à l'automne (septembre–décembre) et à l'hiver (février–mai) — et se terminent par un spectacle détendu. Attendez-vous à des harmonies, des rires et un vrai sentiment de communauté.",
      ],
    },
    day: { en: "Wednesdays", fr: "Mercredis" },
    time: "7:00–8:30 PM",
    dates: { en: "Sept 9 – Dec 9, 2026", fr: "9 sept. – 9 déc. 2026" },
    venueName: "St-Gabriel Catholic Church",
    venueAddress: "5070 Rue Gilbert",
    venueCity: "Saint-Hubert",
    postalCode: "J3Y 2K7",
    region: "QC",
    country: "CA",
    mapsUrl: "https://maps.google.com/?q=St-Gabriel+Catholic+Church+5070+Gilbert+Saint-Hubert",
    theme: { bg: "bg-lime-light", border: "border-lime/30", dot: "bg-lime" },
    photoIds: ["sh-concert", "sh-band", "sh-group"],
    openHouse: { en: "Wednesday, August 5, 2026", fr: "Mercredi 5 août 2026", time: "7:00 PM" },
  },
  "pointe-claire": {
    slug: "pointe-claire",
    city: "Pointe-Claire",
    pageTitle: "Pointe-Claire Choir – Club Choir | West Island Adult Choir",
    metaDescription:
      "Sing with Club Choir Pointe-Claire — a no-audition community choir for adults on the West Island. Thursday evenings at Valois United Church. Fall 2026 sign-up open.",
    pageTitleFr: "Chorale Pointe-Claire – Club Choir | chorale pour adultes dans l'Ouest-de-l'Île",
    metaDescriptionFr:
      "Chantez avec Club Choir Pointe-Claire — une chorale communautaire sans audition pour adultes dans l'Ouest-de-l'Île. Les jeudis soirs à l'église Valois United. Inscriptions ouvertes pour l'automne 2026.",
    heroHeadline: {
      en: "Pointe-Claire Choir – Thursdays on the West Island",
      fr: "Chorale Pointe-Claire – Jeudis soirs dans l'Ouest-de-l'Île",
    },
    heroBlurb: {
      en: "Your West Island choir home: no audition, no music to read, just a warm room full of voices.",
      fr: "Votre chorale dans l'Ouest-de-l'Île : sans audition, sans partition, juste une salle remplie de voix.",
    },
    about: {
      en: [
        "Club Choir Pointe-Claire is the West Island home of our adult, no-audition choir. We gather Thursday evenings at Valois United Church on Avenue Belmont, and we welcome singers of every level — including people who've been told they 'can't sing.'",
        "Director Ailsa leads the group through pop, classics, and modern favourites in approachable harmonies. The vibe is upbeat and pressure-free, and the 14-week session — fall (September–December) or winter (February–May) — wraps with a friendly performance you can invite your people to.",
      ],
      fr: [
        "Club Choir Pointe-Claire est notre chorale adulte sans audition dans l'Ouest-de-l'Île. Nous nous rencontrons le jeudi soir à l'église Valois United, avenue Belmont, et nous accueillons les chanteurs de tous les niveaux — y compris ceux à qui on a dit qu'ils ne savaient pas chanter.",
        "La directrice Ailsa guide le groupe à travers la pop, les classiques et les favoris modernes dans des harmonies accessibles. L'ambiance est joyeuse et sans pression, et la session de 14 semaines (automne septembre–décembre ou hiver février–mai) se termine par un spectacle convivial.",
      ],
    },
    day: { en: "Thursdays", fr: "Jeudis" },
    time: "7:00–8:30 PM",
    dates: { en: "Sept 10 – Dec 10, 2026", fr: "10 sept. – 10 déc. 2026" },
    venueName: "Valois United Church",
    venueAddress: "70 Av. Belmont",
    venueCity: "Pointe-Claire",
    postalCode: "H9R 4H2",
    region: "QC",
    country: "CA",
    mapsUrl: "https://maps.google.com/?q=Valois+United+Church+70+Belmont+Pointe-Claire",
    theme: { bg: "bg-purple-light", border: "border-purple/30", dot: "bg-purple" },
    photoIds: ["ptc-folders", "ptc-formation", "ptc-concert"],
    openHouse: { en: "Thursday, August 6, 2026", fr: "Jeudi 6 août 2026", time: "7:00 PM" },
  },
};

export const locationSlugs = Object.keys(choirLocations) as LocationSlug[];

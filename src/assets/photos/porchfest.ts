// NDG Porchfest May 16, 2026 photo set
import type { ChoirPhoto } from "./index";

import w1 from "./pf01-wide.webp"; import t1 from "./pf01-tile.webp";
import w2 from "./pf02-wide.webp"; import t2 from "./pf02-tile.webp";
import w3 from "./pf03-wide.webp"; import t3 from "./pf03-tile.webp";
import w4 from "./pf04-wide.webp"; import t4 from "./pf04-tile.webp";
import w5 from "./pf05-wide.webp"; import t5 from "./pf05-tile.webp";
import w6 from "./pf06-wide.webp"; import t6 from "./pf06-tile.webp";
import w7 from "./pf07-wide.webp"; import t7 from "./pf07-tile.webp";
import w8 from "./pf08-wide.webp"; import t8 from "./pf08-tile.webp";
import w9 from "./pf09-wide.webp"; import t9 from "./pf09-tile.webp";
import w10 from "./pf10-wide.webp"; import t10 from "./pf10-tile.webp";

export const porchfestPhotos: ChoirPhoto[] = [
  { id: "pf-choir-full", wide: w1, tile: t1, alt: { en: "Club Choir performing on the lawn at NDG Porchfest", fr: "Club Choir en performance sur la pelouse au Porchfest NDG" }, tags: ["montreal", "performance", "group"] },
  { id: "pf-singing-close", wide: w2, tile: t2, alt: { en: "Choir members singing together in the spring sunshine at NDG Porchfest", fr: "Choristes chantant ensemble au soleil printanier au Porchfest NDG" }, tags: ["montreal", "performance", "group"] },
  { id: "pf-conductor", wide: w3, tile: t3, alt: { en: "Conductor leading Club Choir on the sidewalk at NDG Porchfest", fr: "Cheffe dirigeant Club Choir sur le trottoir au Porchfest NDG" }, tags: ["montreal", "performance"] },
  { id: "pf-folders-group", wide: w4, tile: t4, alt: { en: "Smiling Club Choir members holding their colourful song folders at NDG Porchfest", fr: "Membres souriants de Club Choir tenant leurs cahiers colorés au Porchfest NDG" }, tags: ["montreal", "group"] },
  { id: "pf-folders-row", wide: w5, tile: t5, alt: { en: "Row of choir members proudly holding Club Choir binders", fr: "Rangée de choristes tenant fièrement leurs cahiers Club Choir" }, tags: ["montreal", "group"] },
  { id: "pf-guitar", wide: w6, tile: t6, alt: { en: "Guitarist accompanying Club Choir at NDG Porchfest", fr: "Guitariste accompagnant Club Choir au Porchfest NDG" }, tags: ["montreal", "performance"] },
  { id: "pf-crowd", wide: w7, tile: t7, alt: { en: "Club Choir surrounded by an audience at NDG Porchfest", fr: "Club Choir entouré d'un public au Porchfest NDG" }, tags: ["montreal", "performance", "atmosphere"] },
  { id: "pf-formation", wide: w8, tile: t8, alt: { en: "Full Club Choir in formation in front of the brick church at NDG Porchfest", fr: "Club Choir au complet en formation devant l'église en brique au Porchfest NDG" }, tags: ["montreal", "performance", "group"] },
  { id: "pf-pink-shirt", wide: w9, tile: t9, alt: { en: "Club Choir director in a pink Club Choir tee waving hello", fr: "La directrice de Club Choir en t-shirt rose saluant" }, tags: ["montreal", "atmosphere"] },
  { id: "pf-hey-sign", wide: w10, tile: t10, alt: { en: "Volunteer holding a hand-painted 'Hey' sign welcoming people to NDG Porchfest", fr: "Bénévole tenant une affiche peinte à la main « Hey » accueillant les gens au Porchfest NDG" }, tags: ["montreal", "atmosphere"] },
];

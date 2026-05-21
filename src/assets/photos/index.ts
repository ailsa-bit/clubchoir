// Curated choir photo set. Each photo has a wide (1600px) and tile (900px) WebP variant,
// pre-cropped, color-corrected, and brand-warmed.
// Add new photos by dropping cleaned WebPs in this folder and appending to choirPhotos.

import p1Wide from "./p1-pub-conducting-wide.webp";
import p1Tile from "./p1-pub-conducting-tile.webp";
import p2Wide from "./p2-group-portrait-wide.webp";
import p2Tile from "./p2-group-portrait-tile.webp";
import p3Wide from "./p3-pub-singing-wide.webp";
import p3Tile from "./p3-pub-singing-tile.webp";
import p5Wide from "./p5-hudson-lyrics-wide.webp";
import p5Tile from "./p5-hudson-lyrics-tile.webp";
import p6Wide from "./p6-ptc-folders-wide.webp";
import p6Tile from "./p6-ptc-folders-tile.webp";
import p7Wide from "./p7-ptc-formation-wide.webp";
import p7Tile from "./p7-ptc-formation-tile.webp";
import p9Wide from "./p9-stage-performance-wide.webp";
import p9Tile from "./p9-stage-performance-tile.webp";
import p10Wide from "./p10-group-christmas-wide.webp";
import p10Tile from "./p10-group-christmas-tile.webp";
import p11Wide from "./p11-group-rehearsal-wide.webp";
import p11Tile from "./p11-group-rehearsal-tile.webp";
import sh1Wide from "./sh1-saint-hubert-wide.webp";
import sh1Tile from "./sh1-saint-hubert-tile.webp";
import sh2Wide from "./sh2-saint-hubert-wide.webp";
import sh2Tile from "./sh2-saint-hubert-tile.webp";
import sh3Wide from "./sh3-saint-hubert-wide.webp";
import sh3Tile from "./sh3-saint-hubert-tile.webp";

export interface ChoirPhoto {
  id: string;
  wide: string;
  tile: string;
  alt: { en: string; fr: string };
  /** Where this photo is most thematically appropriate. Used for filtering. */
  tags: Array<"hudson" | "arundel" | "saint-hubert" | "pointe-claire" | "montreal" | "performance" | "session" | "group" | "atmosphere">;
}

export const choirPhotos: ChoirPhoto[] = [
  {
    id: "pub-conducting",
    wide: p1Wide,
    tile: p1Tile,
    alt: {
      en: "Ailsa conducting Club Choir on stage at the Kingfisher Pub in Hudson, surrounded by string lights and a disco ball",
      fr: "Ailsa dirigeant Club Choir sur scène au Kingfisher Pub à Hudson, entourée de guirlandes lumineuses et d'une boule disco",
    },
    tags: ["hudson", "performance", "atmosphere"],
  },
  {
    id: "group-portrait",
    wide: p2Wide,
    tile: p2Tile,
    alt: {
      en: "Smiling group portrait of Club Choir members with director Ailsa front and centre",
      fr: "Portrait de groupe souriant des membres de Club Choir avec la directrice Ailsa au centre",
    },
    tags: ["saint-hubert", "group"],
  },
  {
    id: "pub-singing",
    wide: p3Wide,
    tile: p3Tile,
    alt: {
      en: "Choir members singing together under warm string lights at the Kingfisher Pub",
      fr: "Choristes chantant ensemble sous des guirlandes lumineuses chaleureuses au Kingfisher Pub",
    },
    tags: ["hudson", "atmosphere", "session"],
  },
  {
    id: "hudson-lyrics",
    wide: p5Wide,
    tile: p5Tile,
    alt: {
      en: "Choir members seated in a teal-walled venue singing along to lyrics on a projection screen",
      fr: "Choristes assis dans une salle aux murs turquoise chantant les paroles projetées à l'écran",
    },
    tags: ["hudson", "session"],
  },
  {
    id: "ptc-folders",
    wide: p6Wide,
    tile: p6Tile,
    alt: {
      en: "Wide group photo of the Pointe-Claire Club Choir holding their colourful song folders",
      fr: "Photo de groupe panoramique de Club Choir Pointe-Claire tenant leurs cahiers de chansons colorés",
    },
    tags: ["pointe-claire", "group"],
  },
  {
    id: "ptc-formation",
    wide: p7Wide,
    tile: p7Tile,
    alt: {
      en: "Pointe-Claire choir in performance formation under cathedral skylights, songbooks open",
      fr: "Chorale de Pointe-Claire en formation de spectacle sous les puits de lumière de la cathédrale, cahiers ouverts",
    },
    tags: ["pointe-claire", "performance", "group"],
  },
  {
    id: "stage-performance",
    wide: p9Wide,
    tile: p9Tile,
    alt: {
      en: "Choir performing on a community stage with conductor leading from the foreground",
      fr: "Chorale en performance sur une scène communautaire avec la cheffe dirigeant depuis l'avant-plan",
    },
    tags: ["performance", "group"],
  },
  {
    id: "group-christmas",
    wide: p10Wide,
    tile: p10Tile,
    alt: {
      en: "Full Club Choir group photo on stage flanked by two lit Christmas trees, hands raised in celebration",
      fr: "Photo de groupe complète de Club Choir sur scène, encadrée par deux sapins de Noël illuminés, mains levées en signe de fête",
    },
    tags: ["performance", "group", "atmosphere"],
  },
  {
    id: "group-rehearsal",
    wide: p11Wide,
    tile: p11Tile,
    alt: {
      en: "Large Club Choir group portrait at a community hall rehearsal, members smiling together in rows",
      fr: "Grande photo de groupe de Club Choir lors d'une répétition en salle communautaire, membres souriant ensemble en rangées",
    },
    tags: ["pointe-claire", "group", "session"],
  },
];

export function photosByTag(tag: ChoirPhoto["tags"][number]): ChoirPhoto[] {
  return choirPhotos.filter((p) => p.tags.includes(tag));
}

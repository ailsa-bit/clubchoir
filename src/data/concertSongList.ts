/** Fall 2026 showcase running order, from Ailsa's concert song list PDF. */
export type ConcertPart = "melody" | "parts";

export interface ConcertSong {
  order: number;
  title: string;
  week: number; // week it was taught, links to that week's resources
  pink: ConcertPart;
  blue: ConcertPart;
}

export const CONCERT_SONGS: ConcertSong[] = [
  { order: 1, title: "Lovely Day", week: 1, pink: "melody", blue: "parts" },
  { order: 2, title: "So Easy (To Fall in Love)", week: 10, pink: "parts", blue: "melody" },
  { order: 3, title: "Bloom", week: 7, pink: "melody", blue: "parts" },
  { order: 4, title: "Flowers", week: 3, pink: "melody", blue: "parts" },
  { order: 5, title: "J'entends frapper", week: 8, pink: "parts", blue: "melody" },
  { order: 6, title: "Time of the Season", week: 5, pink: "melody", blue: "parts" },
  { order: 7, title: "Toxic", week: 6, pink: "parts", blue: "melody" },
  { order: 8, title: "Losing My Religion", week: 9, pink: "melody", blue: "parts" },
  { order: 9, title: "Dreams", week: 2, pink: "parts", blue: "melody" },
  { order: 10, title: "When Doves Cry", week: 4, pink: "parts", blue: "melody" },
];

/** The short audience-participation break comes after this song number. */
export const BREAK_AFTER = 5;

export const SHOWCASE_DATES = [
  { city: "Montreal", en: "Monday, December 7, 2026", fr: "lundi 7 décembre 2026" },
  { city: "Hudson", en: "Tuesday, December 8, 2026", fr: "mardi 8 décembre 2026" },
  { city: "Saint-Hubert", en: "Wednesday, December 9, 2026", fr: "mercredi 9 décembre 2026" },
  { city: "Pointe-Claire", en: "Thursday, December 10, 2026", fr: "jeudi 10 décembre 2026" },
];

// Free "try a session" evenings — Fall 2026 weeks 3 through 9.
// Kept in sync with the location_sessions schedule in the database.

export type TrialSong = { week: number; date: string; song: string; artist: string };

export type TrialLocation = {
  name: string;
  day: { en: string; fr: string };
  time: string;
  // Hudson runs 7:30–9:00 PM for weeks 1–6 (Legion BBQ night)
  altTime?: { time: string; weeks: number[] };
  venue: string;
  color: string;
  border: string;
  dot: string;
  ring: string;
  nights: TrialSong[];
};

const SONGS: { week: number; song: string; artist: string }[] = [
  { week: 3, song: "Flowers", artist: "Miley Cyrus" },
  { week: 4, song: "When Doves Cry", artist: "Prince" },
  { week: 5, song: "Time of the Season", artist: "The Zombies" },
  { week: 6, song: "Toxic", artist: "Britney Spears (Melanie Martinez version)" },
  { week: 7, song: "Bloom", artist: "The Paper Kites" },
  { week: 8, song: "J'Entends Frapper", artist: "Michel Pagliaro" },
  { week: 9, song: "Losing My Religion", artist: "REM (Molly Parden version)" },
];

const nightsFrom = (startDates: string[]): TrialSong[] =>
  SONGS.map((s, i) => ({ ...s, date: startDates[i] }));

export const TRIAL_LOCATIONS: TrialLocation[] = [
  {
    name: "Montreal",
    day: { en: "Mondays", fr: "Les lundis" },
    time: "7:00–8:30 PM",
    venue: "Paroisse Notre-Dame-De-Grâce, 5333 avenue Notre-Dame-De-Grâce (corner Décarie), Montréal",
    color: "bg-pink-light",
    border: "border-pink/30",
    dot: "bg-pink",
    ring: "ring-pink",
    nights: nightsFrom(["2026-09-21", "2026-09-28", "2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26", "2026-11-02"]),
  },
  {
    name: "Hudson",
    day: { en: "Tuesdays", fr: "Les mardis" },
    time: "7:00–8:30 PM",
    altTime: { time: "7:30–9:00 PM", weeks: [3, 4, 5, 6] },
    venue: "The Hudson Legion, 57 Beach Road, Hudson",
    color: "bg-orange-light",
    border: "border-orange/30",
    dot: "bg-orange",
    ring: "ring-orange",
    nights: nightsFrom(["2026-09-22", "2026-09-29", "2026-10-06", "2026-10-13", "2026-10-20", "2026-10-27", "2026-11-03"]),
  },
  {
    name: "Saint-Hubert",
    day: { en: "Wednesdays", fr: "Les mercredis" },
    time: "7:00–8:30 PM",
    venue: "St-Gabriel Catholic Church, 5070 Rue Gilbert, Saint-Hubert",
    color: "bg-lime-light",
    border: "border-lime/30",
    dot: "bg-lime",
    ring: "ring-lime",
    nights: nightsFrom(["2026-09-23", "2026-09-30", "2026-10-07", "2026-10-14", "2026-10-21", "2026-10-28", "2026-11-04"]),
  },
  {
    name: "Pointe-Claire",
    day: { en: "Thursdays", fr: "Les jeudis" },
    time: "7:00–8:30 PM",
    venue: "Valois United Church, 70 Av. Belmont, Pointe-Claire",
    color: "bg-purple-light",
    border: "border-purple/30",
    dot: "bg-purple",
    ring: "ring-purple",
    nights: nightsFrom(["2026-09-24", "2026-10-01", "2026-10-08", "2026-10-15", "2026-10-22", "2026-10-29", "2026-11-05"]),
  },
];

export const timeForNight = (loc: TrialLocation, week: number) =>
  loc.altTime && loc.altTime.weeks.includes(week) ? loc.altTime.time : loc.time;

export const formatNight = (iso: string, isFr: boolean) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(isFr ? "fr-CA" : "en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

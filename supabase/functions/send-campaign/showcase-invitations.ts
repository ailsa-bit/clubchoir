export const SHOWCASE_SEGMENT = "showcase-invitations";
export const SHOWCASE_CAMPAIGN_KEY = "fall-2026-showcase-invitations-v1";
export const INVITATION_SESSION = "showcase-2026-invitations";
export const INVITATION_VERSIONS = ["portrait-en", "portrait-fr", "landscape-en", "landscape-fr"] as const;
export const KARAOKE_EVENT = { date: "2026-11-01", start: "14:00", end: "17:00", venue: "The Wheel Club", address: "3373 Cavendish, Montreal" };

export interface InvitationRow {
  location: string;
  part: string | null;
  file_name: string;
  storage_path: string;
}
export interface EmailInvitation extends InvitationRow { url: string; }

export function invitationsForLocation(rows: InvitationRow[], location: string): InvitationRow[] {
  if (!["Montreal", "Hudson", "Saint-Hubert", "Pointe-Claire"].includes(location)) throw new Error("A valid choir location is required for invitations.");
  return INVITATION_VERSIONS.map((version) => {
    const matches = rows.filter((row) => row.location === location && row.part === version);
    if (matches.length !== 1) throw new Error(`${location}: upload exactly one ${version} invitation before sending.`);
    const row = matches[0];
    if (!row || !row.storage_path.startsWith(`invitations/${location.toLowerCase()}/`)) throw new Error(`${location}: invitation file does not match its location.`);
    return row;
  });
}
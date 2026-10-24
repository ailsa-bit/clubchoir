import { describe, expect, it } from "vitest";
import { invitationsForLocation, INVITATION_VERSIONS, KARAOKE_EVENT } from "../../supabase/functions/send-campaign/showcase-invitations";

const locations = ["Montreal", "Hudson", "Saint-Hubert", "Pointe-Claire"];
const rows = locations.flatMap((location) => INVITATION_VERSIONS.map((part) => ({ location, part, file_name: `${location}-${part}.png`, storage_path: `invitations/${location.toLowerCase()}/${part}.png` })));

describe("Showcase invitation delivery", () => {
  it.each(locations)("includes only %s's four versions", (location) => {
    const selected = invitationsForLocation(rows, location);
    expect(selected).toHaveLength(4);
    expect(selected.map((row) => row.part)).toEqual(["portrait-en", "portrait-fr", "landscape-en", "landscape-fr"]);
    expect(selected.every((row) => row.location === location)).toBe(true);
  });
  it("blocks missing versions rather than substituting another location", () => {
    expect(() => invitationsForLocation(rows.filter((row) => row.location !== "Hudson" || row.part !== "portrait-en"), "Hudson")).toThrow();
  });
  it("blocks a file stored under another location", () => {
    expect(() => invitationsForLocation(rows.map((row) => row.location === "Hudson" && row.part === "portrait-en" ? { ...row, storage_path: "invitations/montreal/portrait-en.png" } : row), "Hudson")).toThrow();
  });
  it("keeps the November 1 social at the Wheel Club from 2 to 5 PM", () => {
    expect(KARAOKE_EVENT).toEqual({ date: "2026-11-01", start: "14:00", end: "17:00", venue: "The Wheel Club", address: "3373 Cavendish, Montreal" });
  });
});
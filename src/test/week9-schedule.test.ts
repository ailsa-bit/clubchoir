import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync(".lovable/week9-schedule.sql", "utf8");

describe("Week 9 location send times", () => {
  for (const [location, day] of [["montreal", 2], ["hudson", 3], ["saint-hubert", 4], ["pointe-claire", 5]] as const) {
    it(`schedules ${location} on November ${day} at 8 AM Toronto, after daylight saving ends`, () => {
      const block = sql.split(`SELECT cron.schedule('week9-choir-tonight-${location}',`)[1]?.split("$job$);")[0];
      expect(block).toBeDefined();
      expect(block).toContain(`'0 13 ${day} 11 *'`);
      expect(block).toContain(`2026-11-0${day} 08:00:00 America/Toronto`);
      const local = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Toronto", hour: "2-digit", hourCycle: "h23",
      }).format(new Date(`2026-11-0${day}T13:00:00Z`));
      expect(local).toBe("08");
      expect(block).toContain(`cron.unschedule('week9-choir-tonight-${location}')`);
      expect(block).toContain("fall-2026-choir-tonight-week9-v1");
    });
  }
});
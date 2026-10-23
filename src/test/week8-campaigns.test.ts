import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const serverSource = readFileSync("supabase/functions/send-campaign/index.ts", "utf8");
const pageSource = readFileSync("src/pages/Campaigns.tsx", "utf8");

function trackingKey(source: string, segment: string) {
  return source.match(new RegExp(`"${segment}":\\s*"([^"]+)"`))?.[1];
}

describe("Week 8 campaign tracking resets", () => {
  it("starts the resources campaign with a fresh Week 8 key on server and page", () => {
    for (const source of [serverSource, pageSource]) {
      expect(trackingKey(source, "resources-week3-paid")).toBe("fall-2026-resources-week8-paid-v1");
    }
  });

  it("starts the weekly reminder with a fresh Week 8 key on server and page", () => {
    for (const source of [serverSource, pageSource]) {
      expect(trackingKey(source, "choir-tonight")).toBe("fall-2026-choir-tonight-week8-v1");
    }
  });
});
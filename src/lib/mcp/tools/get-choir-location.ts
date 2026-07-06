import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { choirLocations, type LocationSlug } from "../../../data/choirLocations";

export default defineTool({
  name: "get_choir_location",
  title: "Get choir location details",
  description:
    "Get full details for one Club Choir location (schedule, venue, address, about text) by slug: montreal, hudson, saint-hubert, or pointe-claire.",
  inputSchema: {
    slug: z
      .enum(["montreal", "hudson", "saint-hubert", "pointe-claire"])
      .describe("Location slug"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ slug }) => {
    const l = choirLocations[slug as LocationSlug];
    if (!l) {
      return { content: [{ type: "text", text: `Unknown location: ${slug}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(l, null, 2) }],
      structuredContent: { location: l },
    };
  },
});

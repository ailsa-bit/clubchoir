import { defineTool } from "@lovable.dev/mcp-js";
import { choirLocations } from "@/data/choirLocations";

export default defineTool({
  name: "list_choir_locations",
  title: "List choir locations",
  description:
    "List all Club Choir locations (city, day, time, venue) so an assistant can help members and prospects find a nearby choir.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const items = Object.values(choirLocations).map((l) => ({
      slug: l.slug,
      city: l.city,
      day_en: l.day.en,
      day_fr: l.day.fr,
      time: l.time,
      dates_en: l.dates.en,
      dates_fr: l.dates.fr,
      venue: `${l.venueName}, ${l.venueAddress}, ${l.venueCity}`,
      maps_url: l.mapsUrl,
      is_new: !!l.isNew,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { locations: items },
    };
  },
});

import { defineMcp } from "@lovable.dev/mcp-js";
import listChoirLocations from "./tools/list-choir-locations";
import getChoirLocation from "./tools/get-choir-location";

export default defineMcp({
  name: "club-choir-mcp",
  title: "Club Choir",
  version: "0.1.0",
  instructions:
    "Tools for Club Choir — a no-audition community choir in the Montreal area. Use these tools to answer questions about choir locations, schedules, and venues.",
  tools: [listChoirLocations, getChoirLocation],
});

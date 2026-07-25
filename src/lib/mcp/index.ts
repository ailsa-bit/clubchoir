import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listChoirLocations from "./tools/list-choir-locations";
import getChoirLocation from "./tools/get-choir-location";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "club-choir-mcp",
  title: "Club Choir",
  version: "0.2.0",
  instructions:
    "Tools for Club Choir — a no-audition community choir in the Montreal area. Use these tools to answer questions about choir locations, schedules, and venues.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listChoirLocations, getChoirLocation],
});

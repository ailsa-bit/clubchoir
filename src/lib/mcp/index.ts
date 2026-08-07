import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listChoirLocations from "./tools/list-choir-locations";
import getChoirLocation from "./tools/get-choir-location";
import getMembershipOverview from "./tools/get-membership-overview";
import getSignupTrend from "./tools/get-signup-trend";
import getProspectPipeline from "./tools/get-prospect-pipeline";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "club-choir-mcp",
  title: "Club Choir",
  version: "0.3.0",
  instructions:
    "Tools for Club Choir — a no-audition community choir in the Montreal area. Public tools answer questions about choir locations, schedules and venues. Admin tools (membership overview, signup trend, prospect pipeline) return CRM and dashboard numbers and require an admin account; they exclude Arundel.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listChoirLocations,
    getChoirLocation,
    getMembershipOverview,
    getSignupTrend,
    getProspectPipeline,
  ],
});

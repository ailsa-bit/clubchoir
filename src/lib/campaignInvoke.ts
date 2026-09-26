import { supabase } from "@/integrations/supabase/client";

/** Thrown when the admin's login session is gone or can no longer be refreshed. */
export class SessionExpiredError extends Error {
  constructor() {
    super("Your session has expired. Please sign in again.");
    this.name = "SessionExpiredError";
  }
}

const statusOf = (error: any) => {
  const ctx = error?.context;
  return ctx?.status ?? ctx?.response?.status;
};

/**
 * Calls the send-campaign function with a guaranteed-fresh session.
 * A single 401 is usually a token that expired a moment ago (e.g. tab was asleep),
 * so we let the client renew it and retry once before treating it as signed out.
 */
export async function invokeCampaign<T = any>(body: Record<string, unknown>): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new SessionExpiredError();

  let { data, error } = await supabase.functions.invoke("send-campaign", { body });
  if (error && statusOf(error) === 401) {
    // Only renew if the token is actually near/after expiry; getSession handles locking.
    await new Promise((r) => setTimeout(r, 800));
    const { data: fresh } = await supabase.auth.getSession();
    if (!fresh.session?.access_token) throw new SessionExpiredError();
    ({ data, error } = await supabase.functions.invoke("send-campaign", {
      body,
      headers: { Authorization: `Bearer ${fresh.session.access_token}` },
    }));
  }
  if (error) {
    if (statusOf(error) === 401) throw new SessionExpiredError();
    throw error;
  }
  return data as T;
}

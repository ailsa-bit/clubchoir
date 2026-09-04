import { supabase } from "@/integrations/supabase/client";

/** Thrown when the admin's login session is gone or can no longer be refreshed. */
export class SessionExpiredError extends Error {
  constructor() {
    super("Your session has expired. Please sign in again.");
    this.name = "SessionExpiredError";
  }
}

/**
 * Calls the send-campaign function with a guaranteed-fresh session.
 * Turns auth failures into a clear SessionExpiredError instead of a generic server error.
 */
export async function invokeCampaign<T = any>(body: Record<string, unknown>): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new SessionExpiredError();

  const { data, error } = await supabase.functions.invoke("send-campaign", { body });
  if (error) {
    const ctx = (error as any)?.context;
    const status = ctx?.status ?? ctx?.response?.status;
    if (status === 401) throw new SessionExpiredError();
    throw error;
  }
  return data as T;
}

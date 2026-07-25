import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import PageMeta from "@/components/PageMeta";

// Beta namespace on supabase-js; minimal typed wrapper
type OAuthClient = { name?: string; redirect_uris?: string[] };
type AuthzDetails = {
  client?: OAuthClient;
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthzDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthzDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthzDetails | null; error: { message: string } | null }>;
};
const oauth = (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthzDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization ID.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      setEmail(sess.session.user.email ?? null);
      const { data, error: err } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (err) {
        setError(err.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error: err } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <div className="py-16 px-4">
      <PageMeta title="Authorize app – Club Choir" description="Authorize an external app to connect to your Club Choir account." path="/.lovable/oauth/consent" noindex />
      <div className="container mx-auto max-w-md">
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4 text-sm text-destructive">
            {error}
          </div>
        )}
        {!details && !error && (
          <p className="text-sm text-muted-foreground text-center">Loading…</p>
        )}
        {details && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h1 className="font-heading font-bold text-2xl text-foreground">
              Connect {details.client?.name ?? "this app"} to Club Choir
            </h1>
            {email && (
              <p className="text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{email}</span>
              </p>
            )}
            <p className="text-sm text-foreground">
              {details.client?.name ?? "This app"} will be able to call Club Choir's tools while you are signed in.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
              <li>Share your basic profile</li>
              <li>Share your email address</li>
              <li>Access Club Choir tools as you</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              This does not bypass Club Choir's permissions or backend policies.
            </p>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
                Approve
              </Button>
              <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
                Cancel connection
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

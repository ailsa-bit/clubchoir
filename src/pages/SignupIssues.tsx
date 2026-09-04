import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import SignupIssuesPanel from "@/components/SignupIssuesPanel";
import PageMeta from "@/components/PageMeta";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Loader2, Send, KeyRound, CheckCircle2, XCircle, ShieldCheck, UserSearch } from "lucide-react";

interface AuthUserRow {
  id: string;
  email: string | null;
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at?: string | null;
  display_name?: string | null;
  location?: string | null;
  profile_status?: string | null;
}

interface MemberRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  location: string;
  status: string;
  payment_status: string;
  crm_tags: string[];
}

interface RegRow {
  email: string;
  first_name: string;
  last_name: string;
  location: string;
  payment_status: string;
  session_label: string;
  created_at: string;
}

interface Person {
  email: string;
  name: string;
  location: string;
  member?: MemberRow;
  auth?: AuthUserRow;
  regs: RegRow[];
}

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" }) : "—";

const SignupIssues = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [authUsers, setAuthUsers] = useState<AuthUserRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [regs, setRegs] = useState<RegRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [authRes, memRes, regRes] = await Promise.all([
        supabase.functions.invoke("list-signups"),
        supabase.from("members").select("id,first_name,last_name,email,location,status,payment_status,crm_tags"),
        supabase
          .from("session_registrations")
          .select("email,first_name,last_name,location,payment_status,session_label,created_at"),
      ]);
      if (authRes.error) throw authRes.error;
      setAuthUsers((authRes.data as AuthUserRow[]) || []);
      setMembers(((memRes.data as any[]) || []) as MemberRow[]);
      setRegs(((regRes.data as any[]) || []) as RegRow[]);
    } catch (e: any) {
      toast.error(e.message || "Could not load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const people = useMemo(() => {
    const map = new Map<string, Person>();
    const key = (e?: string | null) => (e || "").toLowerCase().trim();
    const ensure = (email: string, name: string, location: string) => {
      if (!map.has(email)) map.set(email, { email, name, location, regs: [] });
      const p = map.get(email)!;
      if (name && (!p.name || p.name === p.email)) p.name = name;
      if (location && (!p.location || p.location === "—")) p.location = location;
      return p;
    };

    members.forEach((m) => {
      const e = key(m.email);
      if (!e) return;
      const p = ensure(e, `${m.first_name} ${m.last_name}`.trim(), m.location);
      p.member = m;
    });
    regs.forEach((r) => {
      const e = key(r.email);
      if (!e) return;
      const p = ensure(e, `${r.first_name} ${r.last_name}`.trim(), r.location);
      p.regs.push(r);
    });
    authUsers.forEach((u) => {
      const e = key(u.email);
      if (!e) return;
      const p = ensure(e, u.display_name || e, u.location || "—");
      p.auth = u;
    });
    return Array.from(map.values());
  }, [members, regs, authUsers]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return people
      .filter((p) => p.name.toLowerCase().includes(q) || p.email.includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 25);
  }, [people, query]);

  const act = async (fn: string, body: any, id: string, okMsg: string) => {
    setBusy(id);
    try {
      const { error } = await supabase.functions.invoke(fn, { body });
      if (error) throw error;
      toast.success(okMsg);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="font-heading text-2xl font-bold mb-2">Admins only</h1>
        <p className="text-muted-foreground">This page is only available to Club Choir administrators.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <PageMeta
        title="Signup Issues & Member Lookup | Club Choir"
        description="Admin tool to look up a member's account status and help them get signed in."
        noindex
      />

      <h1 className="font-heading text-2xl md:text-3xl font-bold mb-1 inline-flex items-center gap-2">
        <UserSearch className="w-6 h-6 text-primary" /> Signup issues &amp; member lookup
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Search anyone by name or email to see their account status, payment and registration — then help them right here.
      </p>

      <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6">
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Search by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading accounts…
          </div>
        ) : query.trim().length < 2 ? (
          <p className="text-sm text-muted-foreground py-2">Type at least 2 letters to search.</p>
        ) : results.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No one found matching “{query}”.</p>
        ) : (
          <div className="space-y-4">
            {results.map((p) => {
              const paid = p.regs.some((r) => r.payment_status === "paid");
              const hasAccount = !!p.auth;
              const confirmed = !!p.auth?.email_confirmed_at;
              const signedIn = !!p.auth?.last_sign_in_at;
              return (
                <div key={p.email} className="border border-border rounded-lg p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-muted-foreground break-all">
                        {p.email} · {p.location || "—"}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={paid ? "default" : "secondary"}>{paid ? "Paid" : "Not paid"}</Badge>
                      <Badge variant={hasAccount ? "secondary" : "destructive"}>
                        {hasAccount ? "Has account" : "No account"}
                      </Badge>
                      {hasAccount && (
                        <Badge variant={confirmed ? "secondary" : "destructive"}>
                          {confirmed ? "Email confirmed" : "Email not confirmed"}
                        </Badge>
                      )}
                      {p.member && (
                        <Badge variant="outline">{p.member.status}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground mb-3">
                    <div className="inline-flex items-center gap-1.5">
                      {hasAccount ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                      Account created: {fmt(p.auth?.created_at)}
                    </div>
                    <div className="inline-flex items-center gap-1.5">
                      {signedIn ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                      Last sign-in: {fmt(p.auth?.last_sign_in_at)}
                    </div>
                    <div>Portal status: {p.auth?.profile_status || "—"}</div>
                    <div>
                      Registrations:{" "}
                      {p.regs.length
                        ? p.regs.map((r) => `${r.session_label} (${r.payment_status})`).join(", ")
                        : "none"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={busy === p.email + "magic"}
                      onClick={() => act("send-magic-link", { email: p.email }, p.email + "magic", `Magic link sent to ${p.email}`)}
                    >
                      {busy === p.email + "magic" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-1" /> Magic link</>}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === p.email + "setup"}
                      onClick={() => act("send-account-setup-link", { emails: [p.email] }, p.email + "setup", `Account setup link sent to ${p.email}`)}
                    >
                      {busy === p.email + "setup" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><KeyRound className="w-4 h-4 mr-1" /> Account setup link</>}
                    </Button>
                    {hasAccount && !confirmed && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === p.email + "confirm"}
                        onClick={() => act("confirm-user-email", { email: p.email }, p.email + "confirm", `${p.email} confirmed`)}
                      >
                        {busy === p.email + "confirm" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldCheck className="w-4 h-4 mr-1" /> Confirm email</>}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SignupIssuesPanel />
    </div>
  );
};

export default SignupIssues;

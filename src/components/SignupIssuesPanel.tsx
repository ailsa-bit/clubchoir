import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, LifeBuoy, Send, RefreshCw, CheckCircle2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AuthUserRow {
  id: string;
  email: string | null;
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at?: string | null;
}

interface PaidReg {
  email: string;
  first_name: string | null;
  last_name: string | null;
  location: string | null;
}

type IssueKind = "no-account" | "unconfirmed" | "never-signed-in";

interface IssueRow {
  email: string;
  name: string;
  location: string;
  kind: IssueKind;
  since: string;
}

const KIND_LABEL: Record<IssueKind, string> = {
  "no-account": "No account yet",
  unconfirmed: "Email not confirmed",
  "never-signed-in": "Never signed in",
};

const KIND_HELP: Record<IssueKind, string> = {
  "no-account": "Paid member who has never started signup.",
  unconfirmed: "Started signup but never clicked the confirmation email — they cannot sign in or reset a password.",
  "never-signed-in": "Account confirmed but never used.",
};

const KIND_TONE: Record<IssueKind, string> = {
  "no-account": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  unconfirmed: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  "never-signed-in": "bg-muted text-muted-foreground",
};

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-CA", { month: "short", day: "numeric" });

const SignupIssuesPanel = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<IssueRow[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<IssueKind | "all">("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [authRes, regRes] = await Promise.all([
        supabase.functions.invoke("list-signups"),
        supabase
          .from("session_registrations")
          .select("email,first_name,last_name,location,payment_status")
          .eq("session_label", "fall-2026")
          .eq("payment_status", "paid"),
      ]);

      if (authRes.error) throw authRes.error;
      const users = (authRes.data as AuthUserRow[]) || [];
      const paid = ((regRes.data as any[]) || []) as PaidReg[];

      const byEmail = new Map<string, AuthUserRow>();
      users.forEach((u) => {
        if (u.email) byEmail.set(u.email.toLowerCase().trim(), u);
      });

      const out: IssueRow[] = [];
      const seen = new Set<string>();

      // Paid members with no account at all
      paid.forEach((p) => {
        const email = (p.email || "").toLowerCase().trim();
        if (!email || seen.has(email)) return;
        seen.add(email);
        const name = `${p.first_name || ""} ${p.last_name || ""}`.trim() || email;
        const u = byEmail.get(email);
        if (!u) {
          out.push({ email, name, location: p.location || "—", kind: "no-account", since: "" });
        } else if (!u.email_confirmed_at) {
          out.push({ email, name, location: p.location || "—", kind: "unconfirmed", since: u.created_at });
        } else if (!u.last_sign_in_at) {
          out.push({ email, name, location: p.location || "—", kind: "never-signed-in", since: u.created_at });
        }
      });

      // Any other unconfirmed accounts (not paid registrations)
      users.forEach((u) => {
        const email = (u.email || "").toLowerCase().trim();
        if (!email || seen.has(email)) return;
        if (!u.email_confirmed_at) {
          seen.add(email);
          out.push({ email, name: email, location: "—", kind: "unconfirmed", since: u.created_at });
        }
      });

      out.sort((a, b) => (b.since || "").localeCompare(a.since || ""));
      setRows(out);
    } catch (e: any) {
      toast.error(e.message || "Could not load signup issues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length, "no-account": 0, unconfirmed: 0, "never-signed-in": 0 };
    rows.forEach((r) => { c[r.kind] = (c[r.kind] || 0) + 1; });
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    let out = filter === "all" ? rows : rows.filter((r) => r.kind === filter);
    const q = search.trim().toLowerCase();
    if (q) out = out.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
    return out;
  }, [rows, filter, search]);

  const sendLink = async (email: string) => {
    setSending(email);
    try {
      const { error } = await supabase.functions.invoke("send-magic-link", { body: { email } });
      if (error) throw error;
      setSent((s) => new Set(s).add(email));
      toast.success(`Magic link sent to ${email}`);
    } catch (e: any) {
      toast.error(e.message || "Could not send magic link");
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <h2 className="font-heading font-bold text-lg inline-flex items-center gap-2">
          <LifeBuoy className="w-5 h-5 text-primary" /> Signup issues
        </h2>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Members who are stuck creating their portal account. Send a magic link — it signs them in and lets them set a password.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(["all", "unconfirmed", "no-account", "never-signed-in"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              filter === k ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {k === "all" ? "All" : KIND_LABEL[k]} ({counts[k] || 0})
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Checking accounts…
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 inline-flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" /> No one is stuck right now.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {visible.map((r) => (
            <div key={r.email} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{r.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {r.email} · {r.location}{r.since ? ` · since ${fmt(r.since)}` : ""}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{KIND_HELP[r.kind]}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary" className={KIND_TONE[r.kind]}>{KIND_LABEL[r.kind]}</Badge>
                <Button
                  size="sm"
                  variant={sent.has(r.email) ? "outline" : "default"}
                  onClick={() => sendLink(r.email)}
                  disabled={sending === r.email}
                >
                  {sending === r.email ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : sent.has(r.email) ? (
                    <><CheckCircle2 className="w-4 h-4 mr-1" /> Sent — resend</>
                  ) : (
                    <><Send className="w-4 h-4 mr-1" /> Magic link</>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SignupIssuesPanel;

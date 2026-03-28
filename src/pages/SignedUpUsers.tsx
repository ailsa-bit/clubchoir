import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  UserCheck,
  Loader2,
  ShieldCheck,
  Mail,
  AlertTriangle,
  CheckSquare,
  Users,
} from "lucide-react";

interface PendingSignup {
  id: string;
  user_id: string;
  display_name: string | null;
  location: string | null;
  status: string;
  created_at: string;
}

interface SignedUpUser {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
  display_name: string | null;
  location: string | null;
  profile_status: string;
}

interface MemberRow {
  first_name: string;
  last_name: string;
  email: string | null;
}

const SignedUpUsers = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [signedUpUsers, setSignedUpUsers] = useState<SignedUpUser[]>([]);
  const [signupsLoading, setSignupsLoading] = useState(true);
  const [signupSearch, setSignupSearch] = useState("");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [pendingSignups, setPendingSignups] = useState<PendingSignup[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [confirmingUserId, setConfirmingUserId] = useState<string | null>(null);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("members")
      .select("first_name, last_name, email");
    setMembers((data as MemberRow[]) || []);
  };

  const fetchPending = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("status", "inactive")
      .order("created_at", { ascending: false });
    setPendingSignups((data as PendingSignup[]) || []);
    setPendingLoading(false);
  };

  const fetchSignups = async () => {
    setSignupsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("list-signups");
      if (!error && data) {
        setSignedUpUsers(data);
      }
    } catch {}
    setSignupsLoading(false);
  };

  const handleApprove = async (signup: PendingSignup) => {
    const { error } = await supabase
      .from("profiles")
      .update({ status: "active" })
      .eq("id", signup.id);
    if (error) {
      toast({ title: "Error approving", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Member approved!", description: `${signup.display_name || "User"} now has full access.` });
    fetchPending();
  };

  const handleConfirmEmail = async (userId: string, action: "confirm" | "resend") => {
    setConfirmingUserId(userId);
    try {
      const { error } = await supabase.functions.invoke("confirm-user-email", {
        body: { user_id: userId, action },
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: action === "confirm" ? "Email confirmed!" : "Confirmation email resent!" });
        fetchSignups();
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    }
    setConfirmingUserId(null);
  };

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/community");
      return;
    }
    if (isAdmin) {
      fetchSignups();
      fetchPending();
      fetchMembers();
    }
  }, [isAdmin, adminLoading]);

  if (adminLoading || signupsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="py-10 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground flex items-center gap-2">
              <UserCheck className="w-6 h-6" /> Signed Up Users
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{signedUpUsers.length} registered users</p>
          </div>
          <Link to="/manage-members">
            <Button variant="outline" size="sm">
              <Users className="w-4 h-4 mr-1" /> All Members
            </Button>
          </Link>
        </div>

        {/* Pending Signups */}
        {pendingSignups.length > 0 && (
          <div className="mb-8 rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 p-5">
            <h2 className="font-heading font-bold text-lg text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Pending Signups ({pendingSignups.length})
            </h2>
            <div className="space-y-3">
              {pendingSignups.map((signup) => (
                <div key={signup.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{signup.display_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{signup.location || "No location"} · Signed up {new Date(signup.created_at).toLocaleDateString()}</p>
                  </div>
                  <Button size="sm" onClick={() => handleApprove(signup)}>
                    <CheckSquare className="w-4 h-4 mr-1" /> Approve
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        {signedUpUsers.length > 0 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={signupSearch}
              onChange={(e) => setSignupSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* Signed Up Users Table */}
        {signedUpUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">No signed up users yet.</p>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="p-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Display Name</th>
                    <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Location</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Signed Up</th>
                    <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {signedUpUsers.filter((u) => {
                    if (!signupSearch) return true;
                    const q = signupSearch.toLowerCase();
                    const matchedMember = members.find((m) => m.email && m.email.toLowerCase() === u.email.toLowerCase());
                    const fullName = matchedMember ? `${matchedMember.first_name} ${matchedMember.last_name}` : "";
                    return u.email.toLowerCase().includes(q) || (u.display_name || "").toLowerCase().includes(q) || fullName.toLowerCase().includes(q) || (u.location || "").toLowerCase().includes(q);
                  }).map((u) => {
                    const matchedMember = members.find((m) => m.email && m.email.toLowerCase() === u.email.toLowerCase());
                    return (
                      <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-foreground">{u.email}</td>
                        <td className="p-3 text-foreground font-medium">{matchedMember ? `${matchedMember.first_name} ${matchedMember.last_name}` : "—"}</td>
                        <td className="p-3 text-muted-foreground hidden sm:table-cell">{u.display_name || "—"}</td>
                        <td className="p-3 text-muted-foreground hidden md:table-cell">{u.location || "—"}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-[10px] ${u.profile_status === "active" ? "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30" : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"}`}>
                            {u.profile_status}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground hidden lg:table-cell">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-3 hidden lg:table-cell">
                          {u.email_confirmed_at ? (
                            <Badge variant="outline" className="text-[10px] bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">Yes</Badge>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-2"
                                disabled={confirmingUserId === u.id}
                                onClick={() => handleConfirmEmail(u.id, "confirm")}
                              >
                                <ShieldCheck className="w-3 h-3 mr-1" />
                                {confirmingUserId === u.id ? "..." : "Confirm"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-[10px] px-2"
                                disabled={confirmingUserId === u.id}
                                onClick={() => handleConfirmEmail(u.id, "resend")}
                              >
                                <Mail className="w-3 h-3 mr-1" />
                                Resend
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignedUpUsers;

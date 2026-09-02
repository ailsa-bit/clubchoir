import { useEffect, useState } from "react";
import { User, LogIn, LogOut, Shield, Pencil, Mail, MapPin, CalendarDays, BadgeCheck, Music, CalendarRange } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";

type MemberProfile = {
  display_name: string | null;
  email: string | null;
  status: string | null;
  active_until: string | null;
  location: string | null;
  member_since: string | null;
};

const Profile = () => {
  const { user, isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    const { data, error } = await supabase.rpc("get_my_member_profile");
    if (error) {
      console.error("get_my_member_profile failed", error);
      toast.error(error.message);
    }
    if (!error && data && data.length > 0) {
      const p = data[0] as MemberProfile;
      setProfile(p);
      const parts = (p.display_name || "").trim().split(" ");
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" "));
    }
    setLoading(false);
  };


  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleSaveName = async () => {
    if (!firstName.trim()) return;
    setSaving(true);
    const { error } = await supabase.rpc("update_my_member_name", {
      _first_name: firstName.trim(),
      _last_name: lastName.trim(),
    });
    setSaving(false);
    if (error) {
      console.error("update_my_member_name failed", error);
      toast.error(`${t("profile.nameError")} (${error.message})`);
      return;
    }
    // optimistic: show the new name immediately
    setProfile((prev) =>
      prev ? { ...prev, display_name: `${firstName.trim()} ${lastName.trim()}`.trim() } : prev
    );
    toast.success(t("profile.nameSaved"));
    setEditing(false);
    loadProfile();
  };


  const formatDate = (d: string | null) => {
    if (!d) return t("profile.notSet");
    return new Date(`${d}T00:00:00`).toLocaleDateString(language === "fr" ? "fr-CA" : "en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isActive = profile?.status === "active";

  const Row = ({
    icon: Icon,
    label,
    children,
  }: {
    icon: typeof Mail;
    label: string;
    children: React.ReactNode;
  }) => (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <Icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="text-base text-foreground break-words">{children}</div>
      </div>
    </div>
  );

  return (
    <div className="py-16 px-4">
      <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>
      <div className="container mx-auto max-w-2xl">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-warm mx-auto mb-4 flex items-center justify-center">
            <User className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-foreground mb-1">{t("profile.title")}</h1>
          <p className="text-muted-foreground mb-8">{t("profile.subtitle")}</p>
        </div>

        {!user ? (
          <div className="max-w-md mx-auto">
            <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
              <LogIn className="w-4 h-4 mr-2" /> {t("profile.signInUp")}
            </Button>
          </div>
        ) : loading ? (
          <p className="text-center text-muted-foreground">{t("profile.loading")}</p>
        ) : (
          <div className="space-y-6">
            {isAdmin && (
              <div className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground text-sm">{t("profile.admin")}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-6">
              {editing ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="firstName">{t("profile.firstName")}</Label>
                      <Input id="firstName" value={firstName} maxLength={80} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="lastName">{t("profile.lastName")}</Label>
                      <Input id="lastName" value={lastName} maxLength={80} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveName} disabled={saving || !firstName.trim()}>
                      {t("profile.save")}
                    </Button>
                    <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                      {t("profile.cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Row icon={User} label={t("profile.name")}>
                    <div className="flex items-center gap-2">
                      <span>{profile?.display_name || t("profile.notSet")}</span>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground" onClick={() => setEditing(true)}>
                        <Pencil className="w-3.5 h-3.5 mr-1" /> {t("profile.editName")}
                      </Button>
                    </div>
                  </Row>
                  <Row icon={Mail} label={t("profile.email")}>{profile?.email}</Row>
                  <Row icon={BadgeCheck} label={t("profile.status")}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? t("profile.statusActive") : t("profile.statusInactive")}
                      </Badge>
                      {isActive && profile?.active_until && (
                        <span className="text-sm text-muted-foreground">
                          {t("profile.activeUntil").replace("{date}", formatDate(profile.active_until))}
                        </span>
                      )}
                    </div>
                  </Row>
                  <Row icon={MapPin} label={t("profile.homeBase")}>{profile?.location || t("profile.notSet")}</Row>
                  <Row icon={CalendarDays} label={t("profile.memberSince")}>{formatDate(profile?.member_since ?? null)}</Row>
                </>
              )}
            </div>

            <p className="text-sm text-muted-foreground text-center">{t("profile.contactNote")}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" onClick={() => navigate("/this-week")}>
                <CalendarRange className="w-4 h-4 mr-2" /> {t("profile.myChoir")}
              </Button>
              <Button variant="outline" onClick={() => navigate("/resources/fall-2026")}>
                <Music className="w-4 h-4 mr-2" /> {t("profile.songResources")}
              </Button>
            </div>

            <div className="max-w-md mx-auto">
              <Button variant="outline" className="w-full" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> {t("profile.signOut")}
              </Button>
              {isAdmin && (
                <Button variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground" onClick={() => navigate("/manage-members")}>
                  {t("profile.adminDashboard")}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

import { User, Settings, Music, LogIn, LogOut, Shield } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const Profile = () => {
  const { user, isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const menuItems = [
    { icon: Music, label: t("profile.sessions"), desc: t("profile.sessionsDesc") },
    { icon: User, label: t("profile.account"), desc: t("profile.accountDesc") },
    { icon: Settings, label: t("profile.preferences"), desc: t("profile.preferencesDesc") },
  ];

  return (
    <div className="py-16 px-4">
      <div className="container mx-auto max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-warm mx-auto mb-4 flex items-center justify-center">
          <User className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="font-heading font-bold text-2xl text-foreground mb-1">{t("profile.title")}</h1>
        <p className="text-muted-foreground mb-8">{t("profile.subtitle")}</p>

        <div className="space-y-3 text-left">
          {user ? (
            <>
              {isAdmin && (
                <div className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground text-sm">Admin</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              )}
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:shadow-sm transition-shadow text-left"
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </button>
              ))}
              <Button variant="outline" className="w-full mt-4" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> {t("profile.signOut")}
              </Button>
            </>
          ) : (
            <>
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:shadow-sm transition-shadow text-left"
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </button>
              ))}
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/login")}>
                <LogIn className="w-4 h-4 mr-2" /> {t("profile.adminLogin")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

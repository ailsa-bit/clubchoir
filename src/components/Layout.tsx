import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, User, Mail, Facebook } from "lucide-react";
import clubChoirLogo from "@/assets/club-choir-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const publicNavItems = [
    { label: t("nav.home"), path: "/" },
    { label: t("nav.thisWeek"), path: "/this-week" },
    { label: t("nav.events"), path: "/events" },
    { label: t("nav.corporate"), path: "/corporate" },
  ];

  const memberNavItems = [
    { label: t("nav.community"), path: "/community" },
    { label: t("nav.chat"), path: "/chat" },
    { label: t("nav.resources"), path: "/resources" },
  ];

  const navItems = isLoggedIn ? [...publicNavItems, ...memberNavItems] : publicNavItems;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={clubChoirLogo} alt="Club Choir" className="h-10 w-auto" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => setLanguage(language === "en" ? "fr" : "en")}
              className="ml-2 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {language === "en" ? "FR" : "EN"}
            </button>
            <Link
              to="/profile"
              className={`ml-1 p-2 rounded-full transition-colors ${
                location.pathname === "/profile"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <User className="w-5 h-5" />
            </Link>
          </nav>

          {/* Mobile toggle */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === "en" ? "fr" : "en")}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              {language === "en" ? "FR" : "EN"}
            </button>
            <button
              className="p-2 text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="lg:hidden border-t border-border bg-card px-4 pb-4 pt-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/profile"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {t("nav.profile")}
            </Link>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="font-heading font-semibold text-foreground mb-2">Club Choir</p>
          <p className="mb-3">{t("footer.tagline")} © {new Date().getFullYear()}</p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="mailto:ailsa@clubchoir.ca"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="w-4 h-4" />
              ailsa@clubchoir.ca
            </a>
            <a
              href="https://www.facebook.com/clubchoir"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Facebook className="w-4 h-4" />
              {t("footer.facebook")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

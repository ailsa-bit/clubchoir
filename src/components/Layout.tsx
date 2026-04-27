import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, User, Mail, Facebook, Bell } from "lucide-react";
import clubChoirLogo from "@/assets/club-choir-logo.png";
import clubChoirWordmark from "@/assets/club-choir-wordmark.png";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const Layout = ({ children }: {children: React.ReactNode;}) => {
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
  { label: t("nav.corporate"), path: "/corporate" }];


  const memberNavItems = [
  { label: t("nav.community"), path: "/community" },
  { label: t("nav.chat"), path: "/chat" },
  { label: t("nav.resources"), path: "/resources" }];


  const navItems = isLoggedIn ? [...publicNavItems, ...memberNavItems] : publicNavItems;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center">
            <img alt="Club Choir" className="h-10 w-auto" src={clubChoirLogo} />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) =>
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 rounded-lg text-base font-medium transition-colors ${
              location.pathname === item.path ?
              "bg-primary/10 text-primary" :
              "text-muted-foreground hover:text-foreground hover:bg-muted"}`
              }>

                {item.label}
              </Link>
            )}
            <button
              onClick={() => setLanguage(language === "en" ? "fr" : "en")}
              className="ml-2 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">

              {language === "en" ? "FR" : "EN"}
            </button>
            {isLoggedIn ? (
              <Link
                to="/profile"
                className={`ml-1 px-3 py-1.5 rounded-lg text-base font-medium inline-flex items-center gap-1.5 transition-colors ${
                location.pathname === "/profile" ?
                "bg-primary/10 text-primary" :
                "text-muted-foreground hover:text-foreground hover:bg-muted"}`
                }>
                <User className="w-4 h-4" />
                {t("nav.profile")}
              </Link>
            ) : (
              <Link
                to="/login"
                className="ml-2 px-3 py-1.5 rounded-lg text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                {t("login.signIn")}
              </Link>
            )}
          </nav>

          {/* Mobile toggle */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === "en" ? "fr" : "en")}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-border text-muted-foreground hover:text-foreground transition-colors">

              {language === "en" ? "FR" : "EN"}
            </button>
            <button
              className="p-2 text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}>

              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen &&
        <nav className="lg:hidden border-t border-border bg-card px-4 pb-4 pt-2 space-y-1">
            {navItems.map((item) =>
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            location.pathname === item.path ?
            "bg-primary/10 text-primary" :
            "text-muted-foreground hover:text-foreground hover:bg-muted"}`
            }>

                {item.label}
              </Link>
          )}
            {isLoggedIn ? (
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/profile" ?
                "bg-primary/10 text-primary" :
                "text-muted-foreground hover:text-foreground hover:bg-muted"}`
                }>
                {t("nav.profile")}
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
                {t("login.signIn")}
              </Link>
            )}
          </nav>
        }
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center text-base text-muted-foreground">
          <img
            src={clubChoirWordmark}
            alt="Club Choir"
            className="h-8 sm:h-9 w-auto mx-auto mb-3"
            loading="lazy"
          />
          <p className="mb-3">{t("footer.tagline")} © {new Date().getFullYear()}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/subscribe"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">

              <Bell className="w-4 h-4" />
              {t("footer.subscribe")}
            </Link>
            <a
              href="mailto:ailsa@clubchoir.ca"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">

              <Mail className="w-4 h-4" />
              ailsa@clubchoir.ca
            </a>
            <a
              href="https://www.facebook.com/clubchoir"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">

              <Facebook className="w-4 h-4" />
              {t("footer.facebook")}
            </a>
          </div>
        </div>
      </footer>
    </div>);

};

export default Layout;
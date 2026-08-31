import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, User, Mail, Facebook, Bell, ChevronDown, Globe, Shield, LogOut } from "lucide-react";
import clubChoirLogo from "@/assets/club-choir-logo.webp";
import clubChoirWordmark from "@/assets/club-choir-wordmark.webp";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/hooks/use-admin";

const Layout = ({ children }: {children: React.ReactNode;}) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const toggleMenu = (path: string) =>
    setExpandedMenus((prev) => ({ ...prev, [path]: !prev[path] }));
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { isAdmin } = useAdmin();

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
    { label: "About", path: "/about" },
    { label: t("nav.events"), path: "/events" },
    { label: t("nav.corporate"), path: "/corporate" },
  ];

  // Logged-in members: keep About + Corporate accessible from top nav
  const loggedInPublicItems = [
    { label: t("nav.home"), path: "/" },
    { label: "About", path: "/about" },
    { label: t("nav.events"), path: "/events" },
    { label: t("nav.corporate"), path: "/corporate" },
  ];

  // Consolidated "My Choir" dropdown for member-only day-to-day items
  const myChoirChildren = [
    { label: t("nav.songs.fall2026"), path: "/resources/fall-2026" },
    { label: "Montreal", path: "/schedule/montreal" },
    { label: "Hudson", path: "/schedule/hudson" },
    { label: "Saint-Hubert", path: "/schedule/saint-hubert" },
    { label: "Pointe-Claire", path: "/schedule/pointe-claire" },
    { label: t("nav.chat"), path: "/chat" },
  ];

  const memberNavItems = [
    { label: "My Choir", path: "/this-week", children: myChoirChildren },
  ];

  const navItems: Array<{ label: string; path: string; children?: { label: string; path: string }[] }> =
    isLoggedIn ? [...loggedInPublicItems, ...memberNavItems] : publicNavItems;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMobileOpen(false);
  };


  const isBare = location.pathname.startsWith("/reports");

  if (isBare) {
    return <div className="min-h-screen flex flex-col bg-background"><main className="flex-1">{children}</main></div>;
  }

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
              item.children ? (
                <div key={item.path} className="relative group">
                  <Link
                    to={item.path}
                    className={`px-3 py-2 rounded-lg text-base font-medium transition-colors inline-flex items-center gap-1 ${
                    location.pathname === item.path ?
                    "bg-primary/10 text-primary" :
                    "text-muted-foreground hover:text-foreground hover:bg-muted"}`
                    }>
                    {item.label}
                    <ChevronDown className="w-4 h-4" />
                  </Link>
                  <div className="absolute left-0 top-full pt-1 hidden group-hover:block z-50 min-w-[220px]">
                    <div className="bg-card border border-border rounded-lg shadow-lg py-1">
                      {item.children.map((c) => (
                        <Link
                          key={c.path}
                          to={c.path}
                          className={`block px-3 py-2 text-sm font-medium transition-colors ${
                          location.pathname === c.path ?
                          "bg-primary/10 text-primary" :
                          "text-muted-foreground hover:text-foreground hover:bg-muted"}`
                          }>
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
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
              )
            )}
            <button
              onClick={() => setLanguage(language === "en" ? "fr" : "en")}
              aria-label={language === "en" ? "Switch to French" : "Switch to English"}
              title={language === "en" ? "Français" : "English"}
              className="ml-2 inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Globe className="w-4 h-4" />
              <span>{language === "en" ? "FR" : "EN"}</span>
            </button>
            {isLoggedIn ? (
              <div className="relative group ml-1">
                <button
                  className={`px-3 py-1.5 rounded-lg text-base font-medium inline-flex items-center gap-1.5 transition-colors ${
                  location.pathname === "/profile" ?
                  "bg-primary/10 text-primary" :
                  "text-muted-foreground hover:text-foreground hover:bg-muted"}`
                  }>
                  <User className="w-4 h-4" />
                  {t("nav.profile")}
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute right-0 top-full pt-1 hidden group-hover:block z-50 min-w-[220px]">
                  <div className="bg-card border border-border rounded-lg shadow-lg py-1">
                    <Link to="/profile" className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
                      {t("nav.profile")}
                    </Link>
                    {isAdmin && (
                      <>
                        <div className="my-1 border-t border-border" />
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 inline-flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Admin
                        </div>
                        <Link to="/dashboard" className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">Dashboard</Link>
                        <Link to="/crm" className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">CRM</Link>
                        <Link to="/reports" className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">Reports &amp; Lists</Link>
                        <Link to="/open-house-rsvps" className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">Open House RSVPs</Link>
                        <Link to="/send-email" className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">Send Email</Link>
                        <Link to="/campaigns" className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">Email Campaigns</Link>
                      </>
                    )}
                    <div className="my-1 border-t border-border" />
                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted inline-flex items-center gap-2">
                      <LogOut className="w-4 h-4" /> {t("profile.signOut")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link
                  to="/register"
                  className="ml-2 px-4 py-1.5 rounded-lg text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                  {language === "fr" ? "Inscription" : "Register"}
                </Link>
                <Link
                  to="/login"
                  className="ml-1 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  {t("login.signIn")}
                </Link>
              </>
            )}

          </nav>

          {/* Mobile toggle */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === "en" ? "fr" : "en")}
              aria-label={language === "en" ? "Switch to French" : "Switch to English"}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
              <Globe className="w-4 h-4" />
              <span>{language === "en" ? "FR" : "EN"}</span>
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
          <div key={item.path}>
            <div className="flex items-center gap-1">
              <Link
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex-1 block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path ?
                "bg-primary/10 text-primary" :
                "text-muted-foreground hover:text-foreground hover:bg-muted"}`
                }>
                {item.label}
              </Link>
              {item.children && (
                <button
                  type="button"
                  aria-label={`Toggle ${item.label} submenu`}
                  aria-expanded={!!expandedMenus[item.path]}
                  onClick={() => toggleMenu(item.path)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${expandedMenus[item.path] ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>
              {item.children && expandedMenus[item.path] && item.children.map((c) => (
                <Link
                  key={c.path}
                  to={c.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block ml-4 px-3 py-2 rounded-lg text-sm transition-colors ${
                  location.pathname === c.path ?
                  "bg-primary/10 text-primary" :
                  "text-muted-foreground hover:text-foreground hover:bg-muted"}`
                  }>
                  ↳ {c.label}
                </Link>
              ))}
            </div>
          )}
            {isLoggedIn ? (
              <>
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
                {isAdmin && (
                  <>
                    <div className="mt-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 inline-flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Admin
                    </div>
                    <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">Dashboard</Link>
                    <Link to="/crm" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">CRM</Link>
                    <Link to="/reports" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">Reports &amp; Lists</Link>
                    <Link to="/open-house-rsvps" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">Open House RSVPs</Link>
                    <Link to="/send-email" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">Send Email</Link>
                    <Link to="/campaigns" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">Email Campaigns</Link>
                  </>
                )}
                <button onClick={handleLogout} className="w-full text-left block px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted inline-flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> {t("profile.signOut")}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-center">
                  {language === "fr" ? "Inscription" : "Register"}
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  {t("login.signIn")}
                </Link>
              </>
            )}
          </nav>
        }
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center text-base text-muted-foreground">
          <img
            src={clubChoirWordmark}
            alt="Club Choir"
            className="h-8 sm:h-9 w-auto mx-auto mb-3"
            loading="lazy"
          />
          <p className="mb-3">{t("footer.tagline")} © {new Date().getFullYear()}</p>

          {/* Site links for SEO & navigation */}
          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-4 text-sm">
            <Link to="/" className="hover:text-foreground transition-colors">{t("footer.nav.home")}</Link>
            <Link to="/about" className="hover:text-foreground transition-colors">{t("footer.nav.about")}</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">{t("footer.nav.register")}</Link>
            <Link to="/events" className="hover:text-foreground transition-colors">{t("footer.nav.events")}</Link>
            <Link to="/try" className="hover:text-foreground transition-colors">{t("footer.nav.try")}</Link>
            <Link to="/bring-a-friend" className="hover:text-foreground transition-colors">{t("footer.nav.bringFriend")}</Link>
            <Link to="/corporate" className="hover:text-foreground transition-colors">{t("footer.nav.corporate")}</Link>
            <Link to="/subscribe" className="hover:text-foreground transition-colors">{t("footer.nav.mailing")}</Link>
          </nav>

          {/* Per-location links for SEO ([city] choir queries) */}
          <nav aria-label="Locations" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-4 text-sm">
            <span className="text-xs uppercase tracking-wider text-muted-foreground/70">{t("footer.locations")}</span>
            <Link to="/choir/montreal" className="hover:text-foreground transition-colors">{t("footer.choir.montreal")}</Link>
            <Link to="/choir/hudson" className="hover:text-foreground transition-colors inline-flex items-center gap-1">
              {t("footer.choir.hudson")}
              <span className="inline-flex items-center rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">{t("footer.choir.new")}</span>
            </Link>
            <Link to="/choir/pointe-claire" className="hover:text-foreground transition-colors">{t("footer.choir.pointeClaire")}</Link>
            <Link to="/choir/saint-hubert" className="hover:text-foreground transition-colors">{t("footer.choir.saintHubert")}</Link>
            
          </nav>

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
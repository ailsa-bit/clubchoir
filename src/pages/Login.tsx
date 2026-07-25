import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, KeyRound, Eye, EyeOff, Check, Circle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import PageMeta from "@/components/PageMeta";

const LOCATIONS = ["Montreal", "Hudson", "Saint-Hubert", "Pointe-Claire"] as const;

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawNext = searchParams.get("next") ?? "";
  // Only allow same-origin relative paths
  const nextPath = /^\/[^\/].*/.test(rawNext) && !rawNext.startsWith("//") ? rawNext : "";
  const postAuthRedirect = nextPath || "/community";
  const postAuthAbsolute = `${window.location.origin}${postAuthRedirect}`;
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [location, setLocation] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const passwordValid =
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (isForgotPassword) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage(t("login.resetEmailSent"));
      }
      setLoading(false);
      return;
    }

    if (isSignUp) {
      if (!location) {
        setError(t("login.requireLocation"));
        setLoading(false);
        return;
      }
      if (!displayName.trim()) {
        setError(t("login.requireDisplayName"));
        setLoading(false);
        return;
      }
      if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        setError(t("login.passwordRules"));
        setLoading(false);
        return;
      }
      const trimmedName = displayName.trim();
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: postAuthAbsolute,
          data: { location, display_name: trimmedName },
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage(t("login.confirmEmail"));
        try {
          setTimeout(async () => {
            try {
              const { data: profile } = await supabase
                .from("profiles")
                .select("status")
                .eq("user_id", signUpData.user?.id ?? "")
                .maybeSingle();
              if (profile?.status === "inactive") {
                await supabase.functions.invoke("notify-new-signup", {
                  body: { email, display_name: trimmedName, location, status: "inactive" },
                });
              }
            } catch {}
          }, 2000);
        } catch {}
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        navigate(postAuthRedirect);
      }
    }
    setLoading(false);
  };

  const getTitle = () => {
    if (isForgotPassword) return t("login.forgotPassword");
    if (isSignUp) return t("login.createAccount");
    return t("login.signIn.title");
  };

  const getSubtitle = () => {
    if (isForgotPassword) return t("login.forgotSubtitle");
    if (isSignUp) return t("login.signUp.subtitle");
    return t("login.signIn.subtitle");
  };

  const getIcon = () => {
    if (isForgotPassword) return <KeyRound className="w-7 h-7 text-primary" />;
    if (isSignUp) return <UserPlus className="w-7 h-7 text-primary" />;
    return <LogIn className="w-7 h-7 text-primary" />;
  };

 return (
   <div className="py-16 px-4">
     <PageMeta title="Member Login – Club Choir" description="Sign in to your Club Choir account to access songs, schedules, and your member community." path="/login" noindex />
     <div className="container mx-auto max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
            {getIcon()}
          </div>
          <h1 className="font-heading font-bold text-2xl text-foreground mb-1">
            {getTitle()}
          </h1>
          <p className="text-sm text-muted-foreground">
            {getSubtitle()}
          </p>
        </div>

        <div className="bg-muted/60 border border-border rounded-lg px-4 py-3 mb-6 text-sm text-muted-foreground text-center">
          {t("login.notice")}
        </div>

        {!isForgotPassword && (
          <>
            <Button
              type="button"
              variant="outline"
              className="w-full mb-3 gap-2"
              disabled={loading}
              onClick={async () => {
                setError(""); setMessage(""); setLoading(true);
                const result = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin,
                });
                if (result.error) {
                  setError(result.error.message || "Google sign-in failed");
                  setLoading(false);
                  return;
                }
                if (result.redirected) return;
                navigate("/community");
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
              </svg>
              {isSignUp ? t("login.signUp") : t("login.signIn")} with Google
            </Button>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px bg-border flex-1" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">or</span>
              <div className="h-px bg-border flex-1" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder={t("login.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {!isForgotPassword && (
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t("login.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
           )}
          {isSignUp && !isForgotPassword && (() => {
            const rules = [
              { label: t("login.rule.minLength"), ok: password.length >= 8 },
              { label: t("login.rule.lowercase"), ok: /[a-z]/.test(password) },
              { label: t("login.rule.uppercase"), ok: /[A-Z]/.test(password) },
              { label: t("login.rule.number"), ok: /[0-9]/.test(password) },
            ];
            return (
              <ul className="-mt-2 space-y-1.5 text-xs" aria-label="Password requirements">
                {rules.map((r) => (
                  <li
                    key={r.label}
                    className={`flex items-center gap-2 transition-colors ${
                      r.ok ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                    }`}
                  >
                    {r.ok ? (
                      <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    )}
                    <span>{r.label}</span>
                  </li>
                ))}
              </ul>
            );
          })()}
          {isSignUp && !isForgotPassword && (
            <Input
              type="text"
              placeholder={t("login.displayName.placeholder")}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={50}
            />
          )}
          {isSignUp && !isForgotPassword && (
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder={t("login.selectLocation")} />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}
          {isSignUp && !isForgotPassword && !passwordValid && password.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {t("login.passwordRulesHint")}
            </p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || (isSignUp && !isForgotPassword && !passwordValid)}
          >
            {loading
              ? t("login.wait")
              : isForgotPassword
              ? t("login.sendResetLink")
              : isSignUp
              ? t("login.signUp")
              : t("login.signIn")}
          </Button>
        </form>

        {!isSignUp && !isForgotPassword && (
          <p className="text-center text-sm text-muted-foreground mt-3">
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={() => { setIsForgotPassword(true); setError(""); setMessage(""); }}
            >
              {t("login.forgotPassword")}
            </button>
          </p>
        )}

        <p className="text-center text-sm text-muted-foreground mt-4">
          {isForgotPassword ? (
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={() => { setIsForgotPassword(false); setError(""); setMessage(""); }}
            >
              {t("login.backToSignIn")}
            </button>
          ) : (
            <>
              {isSignUp ? t("login.alreadyAccount") : t("login.noAccount")}{" "}
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}
              >
                {isSignUp ? t("login.signIn") : t("login.signUp")}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Login;

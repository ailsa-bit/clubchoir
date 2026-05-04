import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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

const LOCATIONS = ["Montreal", "Hudson", "Arundel", "Saint-Hubert", "Pointe-Claire"] as const;

const Login = () => {
  const navigate = useNavigate();
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
        setError("Please select your location.");
        setLoading(false);
        return;
      }
      if (!displayName.trim()) {
        setError("Please enter a display name.");
        setLoading(false);
        return;
      }
      if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        setError("Password must be at least 8 characters with uppercase, lowercase and a number.");
        setLoading(false);
        return;
      }
      const trimmedName = displayName.trim();
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
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
        navigate("/community");
      }
    }
    setLoading(false);
  };

  const getTitle = () => {
    if (isForgotPassword) return t("login.forgotPassword");
    if (isSignUp) return t("login.createAccount");
    return "Sign In";
  };

  const getSubtitle = () => {
    if (isForgotPassword) return t("login.forgotSubtitle");
    if (isSignUp) return "Create your Club Choir account";
    return "Sign in to your Club Choir account";
  };

  const getIcon = () => {
    if (isForgotPassword) return <KeyRound className="w-7 h-7 text-primary" />;
    if (isSignUp) return <UserPlus className="w-7 h-7 text-primary" />;
    return <LogIn className="w-7 h-7 text-primary" />;
  };

  return (
    <div className="py-16 px-4">
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
          Please note: access to member resources (chat, song files, community page) is only available to current Club Choir members.
        </div>

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
              { label: "At least 8 characters", ok: password.length >= 8 },
              { label: "One lowercase letter (a–z)", ok: /[a-z]/.test(password) },
              { label: "One uppercase letter (A–Z)", ok: /[A-Z]/.test(password) },
              { label: "One number (0–9)", ok: /[0-9]/.test(password) },
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
              placeholder="Display name (visible to other members)"
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
          <Button type="submit" className="w-full" disabled={loading}>
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

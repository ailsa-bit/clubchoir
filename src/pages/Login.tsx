import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

const LOCATIONS = ["Montreal", "Arundel", "Saint-Hubert", "Pointe-Claire"] as const;

const Login = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [location, setLocation] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (isSignUp) {
      if (!location) {
        setError("Please select your location.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { location },
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage(t("login.confirmEmail"));
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

  return (
    <div className="py-16 px-4">
      <div className="container mx-auto max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
            {isSignUp ? <UserPlus className="w-7 h-7 text-primary" /> : <LogIn className="w-7 h-7 text-primary" />}
          </div>
          <h1 className="font-heading font-bold text-2xl text-foreground mb-1">
            {isSignUp ? t("login.createAccount") : t("login.adminLogin")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSignUp ? t("login.signUpDesc") : t("login.signInDesc")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder={t("login.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder={t("login.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {isSignUp && (
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
            {loading ? t("login.wait") : isSignUp ? t("login.signUp") : t("login.signIn")}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isSignUp ? t("login.alreadyAccount") : t("login.noAccount")}{" "}
          <button
            type="button"
            className="text-primary hover:underline font-medium"
            onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}
          >
            {isSignUp ? t("login.signIn") : t("login.signUp")}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;

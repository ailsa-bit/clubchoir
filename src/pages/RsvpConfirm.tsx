import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/record-open-house-rsvp`;

const RsvpConfirm = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const location = params.get("location") || "";
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(FN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ token, location, attribution: getAttribution() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Something went wrong");
        setEmail(data.email || "");
        setState("ok");
      } catch (e: any) {
        setState("error");
        setMessage(e?.message || "Invalid link");
      }
    };
    if (!token || !location) {
      setState("error");
      setMessage("Missing token or location.");
      return;
    }
    run();
  }, [token, location]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>
      <div className="max-w-lg w-full text-center bg-card border border-border rounded-2xl p-8">
        {state === "loading" && (
          <>
            <Loader2 className="w-10 h-10 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Recording your RSVP…</p>
          </>
        )}
        {state === "ok" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="font-heading font-bold text-2xl text-foreground mb-2">You're on the list! 🎉</h1>
            <p className="text-muted-foreground mb-4">
              Thanks {email ? <span className="text-foreground">({email})</span> : null} — we've got you down for the <strong>{location}</strong> open house.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Feel free to bring a friend or neighbour — everyone is welcome. See you soon!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="outline"><Link to="/">Back to homepage</Link></Button>
              <Button asChild><Link to="/open-house">See all open houses</Link></Button>
            </div>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="font-heading font-bold text-2xl text-foreground mb-2">We couldn't confirm your RSVP</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Button asChild><Link to="/open-house">Sign up here instead</Link></Button>
          </>
        )}
      </div>
    </div>
  );
};

export default RsvpConfirm;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const TermsAcceptanceGate = ({ userId, children }: { userId: string; children: React.ReactNode }) => {
  const { language } = useLanguage();
  const fr = language === "fr";
  const [status, setStatus] = useState<"loading" | "needed" | "ok">("loading");
  const [terms, setTerms] = useState(false);
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let done = false;
    const timer = setTimeout(() => { if (!done) setStatus("ok"); }, 5000); // never block on network blips
    supabase.from("profiles").select("terms_accepted_at").eq("user_id", userId).maybeSingle()
      .then(({ data, error }) => {
        done = true; clearTimeout(timer);
        setStatus(!error && data && !(data as any).terms_accepted_at ? "needed" : "ok");
      });
    return () => clearTimeout(timer);
  }, [userId]);

  if (status === "loading") return null;
  if (status === "ok") return <>{children}</>;

  const accept = async () => {
    setSaving(true);
    const { error } = await supabase.rpc("accept_member_terms" as any);
    setSaving(false);
    if (error) {
      toast.error(fr ? "Oups, réessayez dans un instant." : "Oops, please try again in a moment.");
      return;
    }
    toast.success(fr ? "Merci! Bienvenue dans votre portail." : "Thank you! Welcome to your portal.");
    setStatus("ok");
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-lg mx-auto bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
        <FileCheck className="w-10 h-10 text-primary mb-4" />
        <h1 className="font-heading font-bold text-2xl text-foreground mb-3">
          {fr ? "Un petit pas avant de continuer" : "One quick step before you continue"}
        </h1>
        <p className="text-muted-foreground mb-6">
          {fr
            ? "Nous avons ajouté nos conditions et notre politique de remboursement pour que tout soit clair et transparent. Prenez un moment pour les lire, puis cochez les deux cases."
            : "We've added our terms and refund policy so everything is clear and transparent. Please take a moment to read them, then check both boxes."}
        </p>
        <Button asChild variant="outline" className="mb-6 w-full">
          <Link to="/terms" target="_blank">{fr ? "Lire les conditions et remboursements" : "Read the Terms & Refunds"}</Link>
        </Button>
        <label className="flex items-start gap-3 mb-4 cursor-pointer">
          <Checkbox checked={terms} onCheckedChange={(v) => setTerms(v === true)} className="mt-1" />
          <span className="text-sm text-foreground">
            {fr
              ? "J'accepte les conditions et la politique de remboursement (remboursement complet avant la semaine 3, aucun remboursement à partir de la semaine 3), y compris l'utilisation de photos et vidéos."
              : "I accept the Terms & Conditions and Refund Policy (full refund before Week 3, no refunds from Week 3 on), including the use of photos and videos."}
          </span>
        </label>
        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-1" />
          <span className="text-sm text-foreground">
            {fr
              ? "J'autorise Club Choir à m'envoyer des courriels, uniquement à des fins liées à Club Choir."
              : "I give Club Choir permission to email me, for Club Choir purposes only."}
          </span>
        </label>
        <Button className="w-full" size="lg" disabled={!terms || !consent || saving} onClick={accept}>
          {saving ? (fr ? "Enregistrement..." : "Saving...") : (fr ? "J'accepte et je continue" : "Accept and continue")}
        </Button>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          {fr ? "Des questions? Écrivez à " : "Questions? Send an email to "}
          <a href="mailto:ailsa@clubchoir.ca" className="text-primary hover:underline">ailsa@clubchoir.ca</a>
        </p>
      </div>
    </div>
  );
};

export default TermsAcceptanceGate;

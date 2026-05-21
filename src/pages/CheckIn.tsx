import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, Ticket } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface Reservation {
  id: string;
  event_slug: string;
  first_name: string;
  last_name: string;
  email: string;
  ticket_count: number;
  payment_received: boolean;
  checked_in_at: string | null;
}

const CheckIn = () => {
  const { token } = useParams<{ token: string }>();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const hasUsableToken = Boolean(token && token.trim() && !token.startsWith(":"));
  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const lookup = async (action?: "check_in") => {
    if (!hasUsableToken) {
      setReservation(null);
      setError("Open a ticket link from the QR code or resend the ticket from reservations.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: invErr } = await supabase.functions.invoke("popup-checkin-lookup", {
      body: { ticket_token: token, action },
    });
    if (invErr || data?.error) {
      setError(data?.error || invErr?.message || "Could not load ticket");
      setReservation(null);
    } else {
      setReservation(data.reservation);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) {
      navigate("/login");
      return;
    }
    lookup();
  }, [isAdmin, adminLoading, token]);

  const handleCheckIn = async () => {
    setChecking(true);
    await lookup("check_in");
    setChecking(false);
    toast({ title: "Checked in!" });
  };

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="py-10 px-4">
      <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>
      <div className="container mx-auto max-w-md">
        <h1 className="font-heading font-bold text-2xl text-foreground flex items-center gap-2 mb-6">
          <Ticket className="w-6 h-6" /> Ticket Check-In
        </h1>

        {error && (
          <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-6 text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
            <p className="font-semibold text-foreground">{error}</p>
            {!hasUsableToken && (
              <Button className="mt-4" variant="outline" onClick={() => navigate("/popup-reservations")}>
                Open reservations
              </Button>
            )}
          </div>
        )}

        {reservation && (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Attendee</p>
              <p className="font-heading font-bold text-2xl text-foreground">
                {reservation.first_name} {reservation.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{reservation.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Tickets</p>
                <p className="text-2xl font-bold text-foreground">{reservation.ticket_count}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Payment</p>
                {reservation.payment_received ? (
                  <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 mt-1">Paid</Badge>
                ) : (
                  <Badge variant="destructive" className="mt-1">Unpaid</Badge>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">Event: {reservation.event_slug}</p>

            {reservation.checked_in_at ? (
              <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-foreground">Already checked in</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(reservation.checked_in_at).toLocaleString()}
                </p>
              </div>
            ) : !reservation.payment_received ? (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-center">
                <p className="font-semibold text-amber-700 dark:text-amber-400">⚠️ Payment not received</p>
                <p className="text-xs text-muted-foreground mt-1">Collect payment before check-in.</p>
                <Button className="w-full mt-3" onClick={handleCheckIn} disabled={checking} variant="outline">
                  {checking ? "..." : "Check in anyway"}
                </Button>
              </div>
            ) : (
              <Button className="w-full" size="lg" onClick={handleCheckIn} disabled={checking}>
                {checking ? "Checking in..." : "✓ Mark as checked in"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckIn;

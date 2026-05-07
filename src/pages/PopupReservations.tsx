import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Ticket, CheckCircle2, Circle, Mail, UserCheck, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Reservation {
  id: string;
  event_slug: string;
  first_name: string;
  last_name: string;
  email: string;
  ticket_count: number;
  payment_received: boolean;
  paid_email_sent_at: string | null;
  checked_in_at: string | null;
  created_at: string;
}

const PRICE = 15;

const PopupReservations = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("popup_ticket_reservations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error loading reservations", description: error.message, variant: "destructive" });
    } else {
      setRows((data as Reservation[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
      return;
    }
    if (isAdmin) fetch();
  }, [isAdmin, adminLoading]);

  const sendTicketEmail = async (r: Reservation, force = false) => {
    const { data, error } = await supabase.functions.invoke("notify-popup-paid", {
      body: { reservation_id: r.id, resend: force },
    });
    if (error || data?.error) {
      toast({ title: "Email failed", description: data?.error || error?.message, variant: "destructive" });
      return false;
    }
    if (data?.skipped) {
      toast({ title: "Email already sent" });
    } else {
      toast({ title: "Ticket email sent 🎟️", description: `Sent to ${r.email}` });
    }
    return true;
  };

  const togglePaid = async (r: Reservation) => {
    setBusyId(r.id);
    const newVal = !r.payment_received;
    const { error } = await supabase
      .from("popup_ticket_reservations")
      .update({ payment_received: newVal })
      .eq("id", r.id);
    if (error) {
      setBusyId(null);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, payment_received: newVal } : x)));
    if (newVal) {
      toast({ title: "Marked as paid — sending ticket…" });
      await sendTicketEmail({ ...r, payment_received: true });
      await fetch();
    } else {
      toast({ title: "Marked as unpaid" });
    }
    setBusyId(null);
  };

  const resendTicket = async (r: Reservation) => {
    setBusyId(r.id);
    await sendTicketEmail(r, true);
    await fetch();
    setBusyId(null);
  };

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAdmin) return null;

  const totalPaid = rows.filter((r) => r.payment_received).reduce((s, r) => s + r.ticket_count * PRICE, 0);
  const totalOwed = rows.filter((r) => !r.payment_received).reduce((s, r) => s + r.ticket_count * PRICE, 0);
  const checkedIn = rows.filter((r) => r.checked_in_at).length;

  return (
    <div className="py-10 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-2xl text-foreground flex items-center gap-2">
            <Ticket className="w-6 h-6" /> Pop-Up Ticket Reservations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {rows.length} reservations · ${totalPaid} CAD received · ${totalOwed} CAD pending · {checkedIn} checked in
          </p>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">No reservations yet.</p>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Tickets</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Owed</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Payment</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Ticket / Check-in</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-foreground font-medium">{r.first_name} {r.last_name}</td>
                      <td className="p-3 text-muted-foreground">{r.email}</td>
                      <td className="p-3 text-foreground">{r.ticket_count}</td>
                      <td className="p-3 text-foreground">${r.ticket_count * PRICE}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {r.payment_received ? (
                            <Badge variant="outline" className="text-[10px] bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">
                              <Circle className="w-3 h-3 mr-1" /> Unpaid
                            </Badge>
                          )}
                          <Button
                            size="sm" variant="outline" className="h-7 text-[11px]"
                            disabled={busyId === r.id}
                            onClick={() => togglePaid(r)}
                          >
                            {busyId === r.id ? "..." : r.payment_received ? "Mark unpaid" : "Mark paid"}
                          </Button>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {r.checked_in_at && (
                            <Badge variant="outline" className="text-[10px] bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30">
                              <UserCheck className="w-3 h-3 mr-1" /> Checked in
                            </Badge>
                          )}
                          {r.payment_received && (
                            <Button
                              size="sm" variant="ghost" className="h-7 text-[11px]"
                              disabled={busyId === r.id}
                              onClick={() => resendTicket(r)}
                              title={r.paid_email_sent_at ? `Last sent ${new Date(r.paid_email_sent_at).toLocaleString()}` : "Send ticket email"}
                            >
                              <Mail className="w-3 h-3 mr-1" />
                              {r.paid_email_sent_at ? "Resend ticket" : "Send ticket"}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PopupReservations;

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
import { Helmet } from "react-helmet-async";

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
  notes: string | null;
}

const DEFAULT_PRICE = 15;

const EVENT_LABELS: Record<string, string> = {
  "studio-77-may-31": "Pop-Up · Studio 77",
  "sing-for-the-herd": "Sing for the Herd",
};

const parseNotes = (n: string | null): any => {
  if (!n) return null;
  try { return JSON.parse(n); } catch { return null; }
};

const owedFor = (r: Reservation): number => {
  const parsed = parseNotes(r.notes);
  if (parsed && typeof parsed.total_cad === "number") return parsed.total_cad;
  return r.ticket_count * DEFAULT_PRICE;
};

const breakdownFor = (r: Reservation): string => {
  const p = parseNotes(r.notes);
  if (!p) return `${r.ticket_count} ticket${r.ticket_count > 1 ? "s" : ""}`;
  const parts: string[] = [];
  if (p.adults) parts.push(`${p.adults} adult`);
  if (p.children_6_10) parts.push(`${p.children_6_10} child 6–10`);
  if (p.family_passes) parts.push(`${p.family_passes} family pass`);
  if (p.children_under_6) parts.push(`${p.children_under_6} under 6`);
  return parts.length ? parts.join(", ") : `${r.ticket_count} ticket${r.ticket_count > 1 ? "s" : ""}`;
};

const PopupReservations = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<string>("all");

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("popup_ticket_reservations")
      .select("*")
      .order("first_name", { ascending: true });
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

  const toggleCheckIn = async (r: Reservation) => {
    setBusyId(r.id);
    const newVal = r.checked_in_at ? null : new Date().toISOString();
    const { error } = await supabase
      .from("popup_ticket_reservations")
      .update({ checked_in_at: newVal })
      .eq("id", r.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, checked_in_at: newVal } : x)));
      toast({ title: newVal ? `✓ Checked in ${r.first_name}` : "Check-in undone" });
    }
    setBusyId(null);
  };

  const deleteReservation = async (r: Reservation) => {
    setBusyId(r.id);
    const { error } = await supabase.from("popup_ticket_reservations").delete().eq("id", r.id);
    if (error) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    } else {
      setRows((prev) => prev.filter((x) => x.id !== r.id));
      toast({ title: "Reservation cancelled" });
    }
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

  const ticketsSold = rows.filter((r) => r.payment_received).reduce((s, r) => s + r.ticket_count, 0);
  const ticketsPending = rows.filter((r) => !r.payment_received).reduce((s, r) => s + r.ticket_count, 0);
  const totalPaid = ticketsSold * PRICE;
  const totalOwed = ticketsPending * PRICE;
  const checkedInTickets = rows.filter((r) => r.checked_in_at).reduce((s, r) => s + r.ticket_count, 0);
  const CAPACITY = 40;
  const remaining = Math.max(0, CAPACITY - checkedInTickets);

  return (
    <div className="py-10 px-4">
      <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl text-foreground flex items-center gap-2">
            <Ticket className="w-6 h-6" /> Pop-Up Ticket Reservations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {rows.length} reservations · {ticketsSold} sold · {ticketsPending} pending · ${totalPaid} received · ${totalOwed} owed
          </p>
        </div>

        {/* Door counter */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border-2 border-blue-500/30 bg-blue-500/5 p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Checked in</p>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{checkedInTickets}</p>
          </div>
          <div className="rounded-xl border-2 border-border bg-card p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Capacity</p>
            <p className="text-3xl font-bold text-foreground">{CAPACITY}</p>
          </div>
          <div className="rounded-xl border-2 border-green-500/30 bg-green-500/5 p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Seats left</p>
            <p className="text-3xl font-bold text-green-700 dark:text-green-400">{remaining}</p>
          </div>
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
                    <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
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
                          <Button
                            size="sm"
                            variant={r.checked_in_at ? "outline" : "default"}
                            className="h-7 text-[11px]"
                            disabled={busyId === r.id}
                            onClick={() => toggleCheckIn(r)}
                          >
                            <UserCheck className="w-3 h-3 mr-1" />
                            {r.checked_in_at ? "Undo check-in" : "Check in"}
                          </Button>
                          {r.checked_in_at && (
                            <Badge variant="outline" className="text-[10px] bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30">
                              ✓ {new Date(r.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                              {r.paid_email_sent_at ? "Resend" : "Send ticket"}
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 text-[11px] text-destructive hover:text-destructive" disabled={busyId === r.id}>
                              <Trash2 className="w-3 h-3 mr-1" /> Cancel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel this reservation?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {r.first_name} {r.last_name}'s reservation ({r.ticket_count} ticket{r.ticket_count > 1 ? "s" : ""}). This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep it</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteReservation(r)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete reservation
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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

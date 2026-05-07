import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Ticket, CheckCircle2, Circle } from "lucide-react";

interface Reservation {
  id: string;
  event_slug: string;
  first_name: string;
  last_name: string;
  email: string;
  ticket_count: number;
  payment_received: boolean;
  created_at: string;
}

const PRICE = 15;

const PopupReservations = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const togglePaid = async (r: Reservation) => {
    setUpdatingId(r.id);
    const newVal = !r.payment_received;
    const { error } = await supabase
      .from("popup_ticket_reservations")
      .update({ payment_received: newVal })
      .eq("id", r.id);
    setUpdatingId(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, payment_received: newVal } : x)));
    toast({ title: newVal ? "Marked as paid" : "Marked as unpaid" });
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

  return (
    <div className="py-10 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-2xl text-foreground flex items-center gap-2">
            <Ticket className="w-6 h-6" /> Pop-Up Ticket Reservations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {rows.length} reservations · ${totalPaid} CAD received · ${totalOwed} CAD pending
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
                    <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Event</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Tickets</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Owed</th>
                    <th className="p-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Reserved</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-foreground font-medium">{r.first_name} {r.last_name}</td>
                      <td className="p-3 text-muted-foreground">{r.email}</td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">{r.event_slug}</td>
                      <td className="p-3 text-foreground">{r.ticket_count}</td>
                      <td className="p-3 text-foreground">${r.ticket_count * PRICE}</td>
                      <td className="p-3 text-muted-foreground hidden sm:table-cell">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
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
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px]"
                            disabled={updatingId === r.id}
                            onClick={() => togglePaid(r)}
                          >
                            {updatingId === r.id ? "..." : r.payment_received ? "Mark unpaid" : "Mark paid"}
                          </Button>
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

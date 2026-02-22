import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Users, MapPin, Search, DollarSign, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { useProfile } from "@/hooks/use-profile";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

interface MemberRow {
  id: string;
  first_name: string;
  last_name: string;
  location: string;
  status: string;
  joined: string | null;
  payment_status: string;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  INACTIVE: "bg-muted text-muted-foreground border-border",
  PROSPECT: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  TRIAL: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
};

const Community = () => {
  const { isAdmin, loading: adminLoading, user } = useAdmin();
  const { location: userLocation } = useProfile();
  const { t } = useLanguage();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [locationFilter, setLocationFilter] = useState<string>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");

  useEffect(() => {
    const fetchMembers = async () => {
      let query = supabase
        .from("members")
        .select("id, first_name, last_name, location, status, joined, payment_status")
        .order("last_name", { ascending: true });
      if (!isAdmin) {
        query = query.eq("status", "ACTIVE");
      }
      const { data } = await query;
      setMembers((data as MemberRow[]) || []);
      setLoading(false);
    };
    if (!adminLoading) fetchMembers();
  }, [isAdmin, adminLoading]);

  const baseMembers = useMemo(() => {
    if (isAdmin) return members;
    if (user && userLocation) return members.filter((m) => m.location === userLocation);
    return members;
  }, [members, isAdmin, user, userLocation]);

  const locations = useMemo(() => [...new Set(baseMembers.map((m) => m.location).filter(Boolean))].sort(), [baseMembers]);
  const paymentStatuses = useMemo(() => [...new Set(baseMembers.map((m) => m.payment_status).filter(Boolean))].sort(), [baseMembers]);

  const filtered = useMemo(() => {
    return baseMembers.filter((m) => {
      const matchesSearch = !search || `${m.first_name} ${m.last_name}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
      const matchesLocation = locationFilter === "ALL" || m.location === locationFilter;
      const matchesPayment = paymentFilter === "ALL" || m.payment_status === paymentFilter;
      return matchesSearch && matchesStatus && matchesLocation && matchesPayment;
    });
  }, [baseMembers, search, statusFilter, locationFilter, paymentFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: baseMembers.length };
    baseMembers.forEach((m) => (c[m.status] = (c[m.status] || 0) + 1));
    return c;
  }, [baseMembers]);

  return (
    <div className="py-10 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2">
            {t("community.title")}
          </h1>
          <p className="text-muted-foreground">
            {baseMembers.length} {baseMembers.length === 1 ? t("community.member") : t("community.members")} · {locations.length} locations
          </p>
          {isAdmin && (
            <Link to="/manage-members">
              <Button variant="outline" size="sm" className="mt-3">
                <Settings className="w-4 h-4 mr-1" /> {t("community.manage")}
              </Button>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {(["ACTIVE", "INACTIVE", "PROSPECT", "TRIAL"] as const).map((s) => (
            <div key={s} className="rounded-2xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{counts[s] || 0}</p>
              <p className="text-xs text-muted-foreground capitalize">{s.toLowerCase()}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t("community.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          {isAdmin && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("community.allStatuses")}</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="PROSPECT">Prospect</SelectItem>
                <SelectItem value="TRIAL">Trial</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Location" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("community.allLocations")}</SelectItem>
              {locations.map((loc) => (<SelectItem key={loc} value={loc}>{loc}</SelectItem>))}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Payment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("community.allPayments")}</SelectItem>
                {paymentStatuses.map((ps) => (<SelectItem key={ps} value={ps}>{ps}</SelectItem>))}
              </SelectContent>
            </Select>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          {t("community.showing")} {filtered.length} {filtered.length !== 1 ? t("community.members") : t("community.member")}
        </p>

        {loading || adminLoading ? (
          <div className="text-center py-12 text-muted-foreground">{t("community.loading")}</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((m) => (
              <div key={m.id} className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{m.first_name[0]}{m.last_name[0]}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{m.first_name} {m.last_name}</p>
                  {m.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="w-3 h-3" />{m.location}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColors[m.status] || ""}`}>{m.status}</Badge>
                    {m.joined && <span className="text-[10px] text-muted-foreground">Joined {m.joined}</span>}
                    {isAdmin && m.payment_status && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30">
                        <DollarSign className="w-2.5 h-2.5 mr-0.5" />{m.payment_status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;

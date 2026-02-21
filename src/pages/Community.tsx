import { useState, useMemo } from "react";
import { Users, MapPin, Search, Filter } from "lucide-react";
import { useMembers, Member } from "@/hooks/use-members";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  INACTIVE: "bg-muted text-muted-foreground border-border",
  PROSPECT: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  TRIAL: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
};

const Community = () => {
  const { members, loading } = useMembers();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [locationFilter, setLocationFilter] = useState<string>("ALL");

  const locations = useMemo(
    () => [...new Set(members.map((m) => m.location))].sort(),
    [members]
  );

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        !search ||
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
      const matchesLocation = locationFilter === "ALL" || m.location === locationFilter;
      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [members, search, statusFilter, locationFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: members.length };
    members.forEach((m) => (c[m.status] = (c[m.status] || 0) + 1));
    return c;
  }, [members]);

  return (
    <div className="py-10 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2">
            Our Members
          </h1>
          <p className="text-muted-foreground">
            {members.length} voices strong across {locations.length} locations
          </p>
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
            <Input
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="PROSPECT">Prospect</SelectItem>
              <SelectItem value="TRIAL">Trial</SelectItem>
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          Showing {filtered.length} member{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* Members grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading members...</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((m, i) => (
              <div
                key={`${m.firstName}-${m.lastName}-${i}`}
                className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {m.firstName[0]}{m.lastName[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">
                    {m.firstName} {m.lastName}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {m.location}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColors[m.status] || ""}`}>
                      {m.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">Joined {m.joined}</span>
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

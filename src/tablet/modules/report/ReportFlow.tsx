import { useQuery } from "@tanstack/react-query";
import { BedDouble, Loader2, LogIn, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOccupancy } from "@/hooks/useOccupancy";
import { todayISO } from "@/tablet/lib/format";
import { TabletCard } from "@/tablet/ui/TabletCard";

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

/** Module 7 — live operational report dashboard (read-only). */
export default function ReportFlow() {
  const { hospitalConfig } = useAuth();
  const occ = useOccupancy();
  const today = todayISO();
  const tomorrow = tomorrowISO();

  const flow = useQuery({
    queryKey: ["tablet-report-flow", hospitalConfig.name, today],
    staleTime: 1000 * 60,
    queryFn: async () => {
      const admits = await supabase
        .from("visits")
        .select("visit_id, patients!inner(hospital_name)", {
          count: "exact",
          head: true,
        })
        .eq("patients.hospital_name", hospitalConfig.name)
        .gte("admission_date", today)
        .lt("admission_date", tomorrow);
      if (admits.error) throw admits.error;

      const discharges = await supabase
        .from("visits")
        .select("visit_id, patients!inner(hospital_name)", {
          count: "exact",
          head: true,
        })
        .eq("patients.hospital_name", hospitalConfig.name)
        .gte("discharge_date", today)
        .lt("discharge_date", tomorrow);
      if (discharges.error) throw discharges.error;

      return {
        admissionsToday: admits.count || 0,
        dischargesToday: discharges.count || 0,
      };
    },
  });

  const loading = occ.isLoading || flow.isLoading;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const occupancyPct =
    occ.data && occ.data.totalCapacity > 0
      ? Math.round((occ.data.totalOccupied / occ.data.totalCapacity) * 100)
      : 0;

  return (
    <div className="tablet-no-scrollbar h-full overflow-y-auto p-4">
      <h2 className="mb-1 text-xl font-bold">Today at a glance</h2>
      <p className="mb-4 text-muted-foreground">{hospitalConfig.fullName}</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TabletCard className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100">
            <BedDouble className="h-6 w-6 text-sky-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {occ.data?.totalOccupied ?? 0}/{occ.data?.totalCapacity ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">
              Beds occupied ({occupancyPct}%)
            </p>
          </div>
        </TabletCard>
        <TabletCard className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
            <LogIn className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{flow.data?.admissionsToday ?? 0}</p>
            <p className="text-sm text-muted-foreground">Admissions today</p>
          </div>
        </TabletCard>
        <TabletCard className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100">
            <LogOut className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{flow.data?.dischargesToday ?? 0}</p>
            <p className="text-sm text-muted-foreground">Discharges today</p>
          </div>
        </TabletCard>
      </div>

      <h3 className="mb-2 mt-6 font-semibold">Occupancy by ward</h3>
      {occ.data && occ.data.wards.length > 0 ? (
        <div className="space-y-2">
          {occ.data.wards.map((w) => (
            <TabletCard key={w.id} className="flex items-center justify-between py-3">
              <span className="font-medium">{w.wardType}</span>
              <span className="text-muted-foreground">
                {w.occupied}/{w.capacity}
              </span>
            </TabletCard>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-muted-foreground">
          No wards configured.
        </p>
      )}
    </div>
  );
}

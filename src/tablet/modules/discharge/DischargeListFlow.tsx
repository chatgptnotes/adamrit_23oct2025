import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, LogOut, Search, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { shortDate } from "@/tablet/lib/format";
import { PatientTypeBadge } from "@/tablet/components/PatientTypeBadge";
import { TabletCard } from "@/tablet/ui/TabletCard";
import { TabletInput } from "@/tablet/ui/TabletInput";

interface DischargedRow {
  visit_id: string;
  patient_type: string | null;
  discharge_date: string | null;
  discharge_mode: string | null;
  ward_allotted: string | null;
  patients: {
    name: string;
    patients_id: string | null;
    age: number | null;
    gender: string | null;
    hospital_name: string | null;
  };
}

/** Module 9 — discharged-patient list (read-only). */
export default function DischargeListFlow() {
  const { hospitalConfig } = useAuth();
  const [term, setTerm] = useState("");

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["tablet-discharged", hospitalConfig.name],
    staleTime: 1000 * 60,
    queryFn: async (): Promise<DischargedRow[]> => {
      const { data, error } = await supabase
        .from("visits")
        .select(
          "visit_id, patient_type, discharge_date, discharge_mode, ward_allotted, patients!inner(name, patients_id, age, gender, hospital_name)",
        )
        .not("discharge_date", "is", null)
        .in("patient_type", ["IPD", "IPD (Inpatient)", "Emergency"])
        .eq("patients.hospital_name", hospitalConfig.name)
        .order("discharge_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as unknown as DischargedRow[];
    },
  });

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return data;
    return data.filter(
      (r) =>
        r.patients?.name?.toLowerCase().includes(t) ||
        r.patients?.patients_id?.toLowerCase().includes(t) ||
        r.visit_id?.toLowerCase().includes(t),
    );
  }, [data, term]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 border-b p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <TabletInput
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search discharged patients"
            className="pl-11"
          />
        </div>
      </div>
      <div className="tablet-no-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="py-10 text-center text-destructive">
            Could not load discharged patients.
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">
            {term ? "No matches." : "No discharged patients."}
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <TabletCard key={r.visit_id} className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{r.patients?.name}</p>
                    <PatientTypeBadge type={r.patient_type} />
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {r.patients?.patients_id || r.visit_id} ·{" "}
                    {r.patients?.age ?? "—"}/{r.patients?.gender || "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="flex items-center gap-1 text-sm font-medium">
                    <LogOut className="h-4 w-4" />
                    {shortDate(r.discharge_date)}
                  </p>
                  {r.discharge_mode ? (
                    <p className="text-xs capitalize text-muted-foreground">
                      {r.discharge_mode.replace(/_/g, " ")}
                    </p>
                  ) : null}
                </div>
              </TabletCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

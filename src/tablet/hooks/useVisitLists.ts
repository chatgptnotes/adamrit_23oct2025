import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TabletVisit {
  id: string; // visits.id (UUID)
  visitId: string; // visits.visit_id (text)
  patientType: string | null;
  admissionDate: string | null;
  dischargeDate: string | null;
  dischargeMode: string | null;
  ward: string | null;
  room: string | null;
  patientName: string;
  patientsId: string | null;
  age: number | null;
  gender: string | null;
}

function mapRow(v: any): TabletVisit {
  return {
    id: v.id,
    visitId: v.visit_id,
    patientType: v.patient_type ?? null,
    admissionDate: v.admission_date ?? null,
    dischargeDate: v.discharge_date ?? null,
    dischargeMode: v.discharge_mode ?? null,
    ward: v.ward_allotted ?? null,
    room: v.room_allotted ?? null,
    patientName: v.patients?.name ?? "Unknown",
    patientsId: v.patients?.patients_id ?? null,
    age: v.patients?.age ?? null,
    gender: v.patients?.gender ?? null,
  };
}

const SELECT =
  "id, visit_id, patient_type, admission_date, discharge_date, discharge_mode, ward_allotted, room_allotted, patients!inner(name, patients_id, age, gender, hospital_name)";

/** Currently admitted IPD + Emergency visits for the active hospital. */
export function useAdmittedVisits() {
  const { hospitalConfig } = useAuth();
  return useQuery({
    queryKey: ["tablet-admitted-visits", hospitalConfig.name],
    staleTime: 1000 * 30,
    queryFn: async (): Promise<TabletVisit[]> => {
      const { data, error } = await supabase
        .from("visits")
        .select(SELECT)
        .in("patient_type", ["IPD", "IPD (Inpatient)", "Emergency"])
        .is("discharge_date", null)
        .eq("patients.hospital_name", hospitalConfig.name)
        .order("admission_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []).map(mapRow);
    },
  });
}

/** Recently discharged visits for the active hospital. */
export function useDischargedVisits() {
  const { hospitalConfig } = useAuth();
  return useQuery({
    queryKey: ["tablet-discharged-visits", hospitalConfig.name],
    staleTime: 1000 * 60,
    queryFn: async (): Promise<TabletVisit[]> => {
      const { data, error } = await supabase
        .from("visits")
        .select(SELECT)
        .not("discharge_date", "is", null)
        .in("patient_type", ["IPD", "IPD (Inpatient)", "Emergency"])
        .eq("patients.hospital_name", hospitalConfig.name)
        .order("discharge_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []).map(mapRow);
    },
  });
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DoorOpen, Loader2, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDischargedVisits, type TabletVisit } from "@/tablet/hooks/useVisitLists";
import { TabletVisitList } from "@/tablet/components/TabletVisitList";
import { FlowScaffold } from "@/tablet/components/FlowScaffold";
import { TabletButton } from "@/tablet/ui/TabletButton";
import { TabletCard } from "@/tablet/ui/TabletCard";
import { inr, shortDate } from "@/tablet/lib/format";

interface GatePass {
  id: string;
  gate_pass_number: string | null;
  patient_name: string | null;
  discharge_date: string | null;
  discharge_mode: string | null;
  bill_paid: boolean | null;
  payment_amount: number | null;
  created_at: string | null;
}

/** Module 5 — view & print a gate pass (read-only). */
export default function GatePassFlow() {
  const visits = useDischargedVisits();
  const [selected, setSelected] = useState<TabletVisit | null>(null);

  const pass = useQuery({
    queryKey: ["tablet-gate-pass", selected?.id],
    enabled: !!selected,
    queryFn: async (): Promise<GatePass | null> => {
      const { data, error } = await supabase
        .from("gate_passes")
        .select(
          "id, gate_pass_number, patient_name, discharge_date, discharge_mode, bill_paid, payment_amount, created_at",
        )
        .eq("visit_id", selected!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as GatePass) || null;
    },
  });

  if (!selected) {
    return (
      <TabletVisitList
        visits={visits.data || []}
        loading={visits.isLoading}
        error={visits.isError}
        onSelect={setSelected}
        emptyText="No discharged patients."
        metaKind="discharged"
      />
    );
  }

  return (
    <FlowScaffold
      heading="Gate Pass"
      subheading={`${selected.patientName} · ${selected.patientsId || selected.visitId}`}
      actions={
        <>
          <TabletButton
            variant="outline"
            className="flex-1"
            onClick={() => setSelected(null)}
          >
            Back
          </TabletButton>
          <TabletButton
            className="flex-1"
            disabled={!pass.data}
            onClick={() => window.print()}
          >
            <Printer className="h-5 w-5" /> Print
          </TabletButton>
        </>
      }
    >
      {pass.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : pass.isError ? (
        <p className="py-10 text-center text-destructive">
          Could not load the gate pass.
        </p>
      ) : !pass.data ? (
        <p className="py-10 text-center text-muted-foreground">
          No gate pass has been generated for this visit. Generate it from the
          desktop discharge workflow.
        </p>
      ) : (
        <div className="tablet-print-area">
          <TabletCard className="space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <DoorOpen className="h-8 w-8 text-cyan-600" />
              <div>
                <h3 className="text-lg font-bold">Gate Pass</h3>
                <p className="text-sm text-muted-foreground">
                  {pass.data.gate_pass_number || "—"}
                </p>
              </div>
            </div>
            <dl className="space-y-2.5">
              {[
                ["Patient", pass.data.patient_name || selected.patientName],
                ["Patient ID", selected.patientsId || selected.visitId],
                ["Discharge date", shortDate(pass.data.discharge_date)],
                [
                  "Discharge mode",
                  (pass.data.discharge_mode || "—").replace(/_/g, " "),
                ],
                ["Bill paid", pass.data.bill_paid ? "Yes" : "No"],
                [
                  "Payment amount",
                  pass.data.payment_amount != null
                    ? inr(pass.data.payment_amount)
                    : "—",
                ],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b pb-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-medium capitalize">{v}</dd>
                </div>
              ))}
            </dl>
          </TabletCard>
        </div>
      )}
    </FlowScaffold>
  );
}

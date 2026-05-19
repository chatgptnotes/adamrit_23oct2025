import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmittedVisits, type TabletVisit } from "@/tablet/hooks/useVisitLists";
import { TabletVisitList } from "@/tablet/components/TabletVisitList";
import { FlowScaffold } from "@/tablet/components/FlowScaffold";
import { TabletConfirm } from "@/tablet/components/TabletConfirm";
import { TabletButton } from "@/tablet/ui/TabletButton";
import { TabletInput, TabletLabel } from "@/tablet/ui/TabletInput";
import { DictationTextarea } from "@/tablet/components/DictationTextarea";
import { shortDate, todayISO } from "@/tablet/lib/format";

/** Module 10 — discharge a patient against medical advice (DAMA / LAMA). */
export default function DamaFlow() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const visits = useAdmittedVisits();
  const [selected, setSelected] = useState<TabletVisit | null>(null);
  const [date, setDate] = useState(todayISO());
  const [reason, setReason] = useState("");

  const discharge = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("No visit selected");
      const { error } = await supabase
        .from("visits")
        .update({
          status: "discharged",
          discharge_date: new Date(date).toISOString(),
          discharge_mode: "lama",
          discharge_notes: reason.trim() || null,
        })
        .eq("id", selected.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tablet-admitted-visits"] });
      qc.invalidateQueries({ queryKey: ["tablet-discharged-visits"] });
      qc.invalidateQueries({ queryKey: ["tablet-occupancy"] });
    },
  });

  if (!selected) {
    return (
      <TabletVisitList
        visits={visits.data || []}
        loading={visits.isLoading}
        error={visits.isError}
        onSelect={setSelected}
        emptyText="No admitted patients."
        metaKind="admitted"
      />
    );
  }

  if (discharge.isSuccess) {
    return (
      <TabletConfirm
        status="success"
        title="Patient discharged (DAMA)"
        message={`${selected.patientName} has been discharged against medical advice on ${shortDate(date)}.`}
        primaryAction={{ label: "Back to Home", onClick: () => navigate("/") }}
      />
    );
  }

  return (
    <FlowScaffold
      heading="Discharge Against Medical Advice"
      subheading={`${selected.patientName} · ${selected.patientsId || selected.visitId}`}
      actions={
        <>
          <TabletButton
            variant="outline"
            className="flex-1"
            onClick={() => setSelected(null)}
            disabled={discharge.isPending}
          >
            Cancel
          </TabletButton>
          <TabletButton
            variant="destructive"
            className="flex-1"
            disabled={discharge.isPending}
            onClick={() => discharge.mutate()}
          >
            {discharge.isPending ? "Discharging…" : "Confirm DAMA"}
          </TabletButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-2xl bg-orange-50 p-4">
          <AlertTriangle className="mt-0.5 h-6 w-6 flex-shrink-0 text-orange-600" />
          <p className="text-sm">
            This marks the visit as <strong>discharged</strong> with mode{" "}
            <strong>LAMA</strong> (Leave / Discharge Against Medical Advice).
            The patient will move to the discharged list.
          </p>
        </div>
        <div>
          <TabletLabel>Discharge date</TabletLabel>
          <TabletInput
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <TabletLabel htmlFor="dama-reason">Reason / notes</TabletLabel>
          <DictationTextarea
            id="dama-reason"
            value={reason}
            onChange={setReason}
            rows={4}
            placeholder="Reason recorded for leaving against advice"
          />
        </div>
        {discharge.isError ? (
          <p className="text-destructive">
            {(discharge.error as Error)?.message || "Could not discharge."}
          </p>
        ) : null}
      </div>
    </FlowScaffold>
  );
}

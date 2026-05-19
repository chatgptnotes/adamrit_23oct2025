import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDischargedVisits, type TabletVisit } from "@/tablet/hooks/useVisitLists";
import { TabletVisitList } from "@/tablet/components/TabletVisitList";
import { FlowScaffold } from "@/tablet/components/FlowScaffold";
import { TabletButton } from "@/tablet/ui/TabletButton";
import { shortDate } from "@/tablet/lib/format";

const HIDE_KEYS = new Set([
  "id",
  "created_at",
  "updated_at",
  "visit_id",
  "hospital_name",
  "patient_id",
]);

function labelize(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Module 2 — view & print an IPD discharge summary (read-only). */
export default function DischargeSummaryFlow() {
  const visits = useDischargedVisits();
  const [selected, setSelected] = useState<TabletVisit | null>(null);

  const summary = useQuery({
    queryKey: ["tablet-discharge-summary", selected?.visitId],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ipd_discharge_summary")
        .select("*")
        .eq("visit_id", selected!.visitId)
        .maybeSingle();
      if (error) throw error;
      return data as Record<string, unknown> | null;
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

  const fields = summary.data
    ? Object.entries(summary.data).filter(
        ([k, v]) =>
          !HIDE_KEYS.has(k) &&
          v != null &&
          v !== "" &&
          typeof v !== "object",
      )
    : [];

  return (
    <FlowScaffold
      heading="Discharge Summary"
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
            disabled={!summary.data}
            onClick={() => window.print()}
          >
            <Printer className="h-5 w-5" /> Print
          </TabletButton>
        </>
      }
    >
      {summary.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : summary.isError ? (
        <p className="py-10 text-center text-destructive">
          Could not load the discharge summary.
        </p>
      ) : !summary.data ? (
        <p className="py-10 text-center text-muted-foreground">
          No discharge summary recorded for this visit.
        </p>
      ) : (
        <div className="tablet-print-area space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-lg font-bold">Discharge Summary</h3>
            <p className="text-sm text-muted-foreground">
              {selected.patientName} · {selected.patientsId || selected.visitId} ·
              Discharged {shortDate(selected.dischargeDate)}
            </p>
          </div>
          <dl className="space-y-3">
            {fields.map(([k, v]) => (
              <div key={k}>
                <dt className="text-sm font-medium text-muted-foreground">
                  {labelize(k)}
                </dt>
                <dd className="whitespace-pre-wrap">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </FlowScaffold>
  );
}

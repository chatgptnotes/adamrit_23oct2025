import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Plus, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useAdmittedVisits, type TabletVisit } from "@/tablet/hooks/useVisitLists";
import { TabletVisitList } from "@/tablet/components/TabletVisitList";
import { FlowScaffold } from "@/tablet/components/FlowScaffold";
import { TabletButton } from "@/tablet/ui/TabletButton";
import { TabletInput, TabletLabel } from "@/tablet/ui/TabletInput";

// `medication_administration` is not in the generated types — untyped client.
const db = supabase as any;

const SETUP_SQL = `create table if not exists medication_administration (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid, patient_id uuid, prescription_item_id uuid,
  medication_name text not null, dose text, route text, frequency text,
  scheduled_time timestamptz, administered_at timestamptz, administered_by text,
  status text not null default 'pending', missed_reason text, notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);`;

const TH =
  "border-b px-3 py-2.5 text-sm font-semibold text-muted-foreground whitespace-nowrap";
const TD = "border-b px-3 py-3 align-top text-sm";

interface PrescribedMed {
  id: string; // visit_medications.id
  name: string;
  dose: string;
  route: string;
  frequency: string;
}
interface AdminRow {
  id: string;
  prescription_item_id: string | null;
  medication_name: string;
  dose: string | null;
  route: string | null;
  status: string;
  administered_at: string | null;
  administered_by: string | null;
  missed_reason: string | null;
  scheduled_time: string | null;
  created_at: string | null;
}

function eventTime(r: AdminRow): string | null {
  return r.administered_at || r.scheduled_time || r.created_at || null;
}
function isToday(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}
function hhmm(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

/** First non-erroring rows for a list of (table, column, value) attempts. */
async function tryRows(
  attempts: { table: string; col: string; val: string }[],
): Promise<any[]> {
  for (const a of attempts) {
    if (!a.val) continue;
    const res = await db.from(a.table).select("*").eq(a.col, a.val);
    if (!res.error && Array.isArray(res.data) && res.data.length) return res.data;
  }
  return [];
}

/** Module — Medication Round (MAR) as a table. */
export default function MedicationRoundFlow() {
  const visits = useAdmittedVisits();
  const [visit, setVisit] = useState<TabletVisit | null>(null);

  if (!visit) {
    return (
      <TabletVisitList
        visits={visits.data || []}
        loading={visits.isLoading}
        error={visits.isError}
        onSelect={setVisit}
        emptyText="No admitted patients."
        metaKind="admitted"
      />
    );
  }
  return <MedicationRound visit={visit} onBack={() => setVisit(null)} />;
}

function MedicationRound({
  visit,
  onBack,
}: {
  visit: TabletVisit;
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [missedFor, setMissedFor] = useState<string | null>(null);
  const [missedReason, setMissedReason] = useState("");
  const [addingExtra, setAddingExtra] = useState(false);
  const [extra, setExtra] = useState({ medication_name: "", dose: "", route: "" });

  const prescribed = useQuery({
    queryKey: ["tablet-mar-prescribed", visit.id, visit.visitId],
    queryFn: async (): Promise<PrescribedMed[]> => {
      const allRows = await tryRows([
        { table: "visit_medications", col: "visit_id", val: visit.id },
        { table: "visit_medications", col: "visit_id", val: visit.visitId },
      ]);
      // Nurses administer only what pharmacy actually dispensed.
      const vm = allRows.filter((r: any) => r.status === "dispensed");
      // Resolve names against the dispensed medicine (the substitute), not the
      // doctor's original prescription.
      const ids = [
        ...new Set(vm.map((r: any) => r.dispensed_medication_id).filter(Boolean)),
      ];
      let names: Record<string, any> = {};
      for (const tbl of ["medicine_master", "medication", "medications"]) {
        if (!ids.length) break;
        const res = await db.from(tbl).select("*").in("id", ids);
        if (!res.error && res.data?.length) {
          names = Object.fromEntries(res.data.map((m: any) => [m.id, m]));
          break;
        }
      }
      return vm.map((r: any) => ({
        id: String(r.id),
        name:
          r.dispensed_medication_name ||
          names[r.dispensed_medication_id]?.medicine_name ||
          names[r.dispensed_medication_id]?.name ||
          names[r.dispensed_medication_id]?.generic_name ||
          r.medication_type ||
          "Medication",
        dose: r.dosage || "",
        route: r.route || "",
        frequency: r.frequency || "",
      }));
    },
  });

  const adminKey = ["tablet-mar-admin", visit.id];
  const admin = useQuery({
    queryKey: adminKey,
    queryFn: async (): Promise<{ rows: AdminRow[]; tableMissing: boolean }> => {
      const res = await db
        .from("medication_administration")
        .select("*")
        .eq("visit_id", visit.id);
      if (res.error) return { rows: [], tableMissing: true };
      return { rows: (res.data || []) as AdminRow[], tableMissing: false };
    },
  });

  // INSERT-only: every tick is a new administration event.
  const record = useMutation({
    mutationFn: async (row: Record<string, any>) => {
      const { error } = await db.from("medication_administration").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      setMissedFor(null);
      setMissedReason("");
      setAddingExtra(false);
      setExtra({ medication_name: "", dose: "", route: "" });
      qc.invalidateQueries({ queryKey: adminKey });
    },
  });

  const tick = (
    med: PrescribedMed,
    status: "given" | "missed",
    reason?: string,
  ) =>
    record.mutate({
      visit_id: visit.id,
      prescription_item_id: med.id,
      medication_name: med.name,
      dose: med.dose || null,
      route: med.route || null,
      frequency: med.frequency || null,
      status,
      administered_at: status === "given" ? new Date().toISOString() : null,
      administered_by: status === "given" ? user?.username || null : null,
      missed_reason: status === "missed" ? reason || null : null,
      scheduled_time: new Date().toISOString(),
    });

  const allRows = admin.data?.rows || [];
  const todayFor = (predicate: (r: AdminRow) => boolean) =>
    allRows
      .filter((r) => predicate(r) && isToday(eventTime(r)))
      .sort(
        (a, b) =>
          new Date(eventTime(b) || 0).getTime() -
          new Date(eventTime(a) || 0).getTime(),
      );

  // --- Add extra (un-prescribed / PRN) dose ---------------------------------
  if (addingExtra) {
    return (
      <FlowScaffold
        heading="Add extra dose"
        subheading={`${visit.patientName} · ${visit.patientsId || visit.visitId}`}
        actions={
          <>
            <TabletButton
              variant="outline"
              className="flex-1"
              onClick={() => setAddingExtra(false)}
              disabled={record.isPending}
            >
              Cancel
            </TabletButton>
            <TabletButton
              className="flex-1"
              disabled={!extra.medication_name.trim() || record.isPending}
              onClick={() =>
                record.mutate({
                  visit_id: visit.id,
                  prescription_item_id: null,
                  medication_name: extra.medication_name.trim(),
                  dose: extra.dose.trim() || null,
                  route: extra.route.trim() || null,
                  status: "given",
                  administered_at: new Date().toISOString(),
                  administered_by: user?.username || null,
                  scheduled_time: new Date().toISOString(),
                })
              }
            >
              {record.isPending ? "Saving…" : "Log as given"}
            </TabletButton>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            For a medication not on the doctor's prescription (e.g. a PRN dose).
          </p>
          <div>
            <TabletLabel>Medication *</TabletLabel>
            <TabletInput
              value={extra.medication_name}
              onChange={(e) =>
                setExtra((x) => ({ ...x, medication_name: e.target.value }))
              }
              placeholder="Medication name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <TabletLabel>Dose</TabletLabel>
              <TabletInput
                value={extra.dose}
                onChange={(e) => setExtra((x) => ({ ...x, dose: e.target.value }))}
                placeholder="e.g. 500 mg"
              />
            </div>
            <div>
              <TabletLabel>Route</TabletLabel>
              <TabletInput
                value={extra.route}
                onChange={(e) =>
                  setExtra((x) => ({ ...x, route: e.target.value }))
                }
                placeholder="e.g. Oral"
              />
            </div>
          </div>
          {record.isError ? (
            <p className="text-destructive">
              {(record.error as Error)?.message || "Could not save the dose."}
            </p>
          ) : null}
        </div>
      </FlowScaffold>
    );
  }

  // --- The round (MAR table) ------------------------------------------------
  const meds = prescribed.data || [];
  const extras = todayFor((r) => !r.prescription_item_id);

  return (
    <FlowScaffold
      heading="Medication Round"
      subheading={`${visit.patientName} · ${visit.patientsId || visit.visitId}`}
      actions={
        <>
          <TabletButton variant="outline" className="flex-1" onClick={onBack}>
            Change patient
          </TabletButton>
          <TabletButton
            className="flex-1"
            onClick={() => setAddingExtra(true)}
            disabled={admin.data?.tableMissing}
          >
            <Plus className="h-5 w-5" /> Add extra dose
          </TabletButton>
        </>
      }
    >
      {prescribed.isLoading || admin.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : admin.data?.tableMissing ? (
        <div className="space-y-2 rounded-xl bg-amber-50 p-4 text-sm">
          <p className="font-semibold text-amber-800">One-time setup needed</p>
          <p className="text-muted-foreground">
            The Medication Round needs its own table. Run this once in the
            Supabase SQL editor — it only creates a new table and changes no
            existing data:
          </p>
          <code className="block whitespace-pre-wrap break-all rounded bg-muted p-2 text-xs">
            {SETUP_SQL}
          </code>
        </div>
      ) : (
        <div className="space-y-5">
          {/* MAR table */}
          <section>
            <h4 className="mb-2 font-semibold">
              Medication chart ({meds.length})
            </h4>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted">
                    <th className={TH}>Medication</th>
                    <th className={TH}>Dose / Route / Freq</th>
                    <th className={TH}>Today's doses</th>
                    <th className={`${TH} text-right`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {meds.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-8 text-center text-muted-foreground"
                      >
                        No dispensed medicines yet — they appear here once
                        pharmacy dispenses the approved Treatment Sheet meds.
                      </td>
                    </tr>
                  ) : (
                    meds.map((med) => {
                      const events = todayFor(
                        (r) => r.prescription_item_id === med.id,
                      );
                      return (
                        <tr key={med.id} className="last:[&>td]:border-0">
                          <td className={`${TD} font-medium`}>{med.name}</td>
                          <td className={TD}>
                            {[med.dose, med.route, med.frequency]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </td>
                          <td className={TD}>
                            {events.length > 0 ? (
                              <div className="space-y-1">
                                {events.map((e) => (
                                  <p
                                    key={e.id}
                                    className={cn(
                                      "flex items-center gap-1 text-xs",
                                      e.status === "given"
                                        ? "text-emerald-700"
                                        : "text-rose-700",
                                    )}
                                  >
                                    {e.status === "given" ? (
                                      <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                                    ) : (
                                      <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
                                    )}
                                    {e.status === "given"
                                      ? `Given ${hhmm(eventTime(e))}${
                                          e.administered_by
                                            ? ` · ${e.administered_by}`
                                            : ""
                                        }`
                                      : `Missed ${hhmm(eventTime(e))}${
                                          e.missed_reason
                                            ? ` — ${e.missed_reason}`
                                            : ""
                                        }`}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Not given yet today
                              </span>
                            )}
                          </td>
                          <td className={`${TD} text-right`}>
                            {missedFor === med.id ? (
                              <div className="flex min-w-[200px] flex-col gap-2">
                                <input
                                  value={missedReason}
                                  onChange={(e) =>
                                    setMissedReason(e.target.value)
                                  }
                                  placeholder="Reason missed"
                                  className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMissedFor(null);
                                      setMissedReason("");
                                    }}
                                    className="h-11 flex-1 rounded-lg border text-sm font-semibold"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={
                                      !missedReason.trim() || record.isPending
                                    }
                                    onClick={() =>
                                      tick(med, "missed", missedReason.trim())
                                    }
                                    className="h-11 flex-1 rounded-lg bg-rose-600 text-sm font-semibold text-white disabled:opacity-50"
                                  >
                                    Confirm
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={record.isPending}
                                  onClick={() => tick(med, "given")}
                                  className="flex h-11 items-center gap-1 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                  <CheckCircle2 className="h-4 w-4" /> Given
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMissedFor(med.id);
                                    setMissedReason("");
                                  }}
                                  className="flex h-11 items-center gap-1 rounded-lg border px-3 text-sm font-semibold"
                                >
                                  <XCircle className="h-4 w-4" /> Missed
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Extra / PRN doses */}
          {extras.length > 0 ? (
            <section>
              <h4 className="mb-2 font-semibold">
                Extra doses today ({extras.length})
              </h4>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-muted">
                      <th className={TH}>Medication</th>
                      <th className={TH}>Given at</th>
                      <th className={TH}>Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extras.map((e) => (
                      <tr key={e.id} className="last:[&>td]:border-0">
                        <td className={`${TD} font-medium`}>
                          {e.medication_name}
                        </td>
                        <td className={TD}>
                          {hhmm(eventTime(e))}
                          {e.administered_by ? ` · ${e.administered_by}` : ""}
                        </td>
                        <td className={TD}>
                          {[e.dose, e.route].filter(Boolean).join(" ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {record.isError ? (
            <p className="text-destructive">
              {(record.error as Error)?.message || "Could not record the dose."}
            </p>
          ) : null}
        </div>
      )}
    </FlowScaffold>
  );
}

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Printer, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useMedicalDataMutations } from "@/hooks/useMedicalDataMutations";
import {
  useMedicineSearch,
  fetchMedicineStock,
  type MedicineResult,
} from "@/tablet/hooks/useMedicineSearch";
import type { TabletVisit } from "@/tablet/hooks/useVisitLists";
import { FlowScaffold } from "@/tablet/components/FlowScaffold";
import { TabletButton } from "@/tablet/ui/TabletButton";
import { TabletInput, TabletLabel } from "@/tablet/ui/TabletInput";

interface MedRow {
  id: string;
  name: string;
  dosage: string;
  route: string;
  frequency: string;
  duration: string;
  stock: number;
}
interface PlanRow {
  day_number: number;
  date_of_stay: string | null;
  medication: string | null;
  lab_and_radiology: string | null;
  accommodation: string | null;
}

// Untyped client — schema/column names vary across deployments.
const db = supabase as any;

const TH =
  "border-b px-3 py-2.5 text-sm font-semibold text-muted-foreground whitespace-nowrap";
const TD = "border-b px-3 py-3 align-top text-sm";

const FREQUENCIES = ["OD", "BD", "TDS", "QID", "HS", "SOS"];
const ROUTES = ["Oral", "IV", "IM", "S/C", "Topical"];
const DURATIONS = ["3 days", "5 days", "7 days", "10 days"];
const DOSES = ["250 mg", "500 mg", "650 mg", "1 g"];

const CHIP_BASE =
  "h-11 rounded-full px-4 text-sm font-medium transition-colors";

/** Live pharmacy-stock badge — green In stock / amber Low / red Out of stock. */
function StockBadge({ stock }: { stock: number }) {
  const out = stock <= 0;
  const low = !out && stock <= 10;
  return (
    <span
      className={cn(
        "whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        out
          ? "bg-rose-100 text-rose-700"
          : low
            ? "bg-amber-100 text-amber-800"
            : "bg-emerald-100 text-emerald-700",
      )}
    >
      {out ? "Out of stock" : low ? `Low: ${stock}` : `In stock: ${stock}`}
    </span>
  );
}

/** A label + one-tap chips; tapping the selected chip clears it. */
function ChipRow({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: string[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div>
      <TabletLabel>{label}</TabletLabel>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onSelect(value === o ? "" : o)}
            className={cn(
              CHIP_BASE,
              value === o
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

/** First non-erroring result for a list of (table, column, value) attempts. */
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

/**
 * Treatment Sheet — the medication chart table (with live pharmacy stock), an
 * inline "Add medication" search right on the same page, and the daily plan.
 */
export function TreatmentSheet({
  visit,
  onBack,
}: {
  visit: TabletVisit;
  onBack: () => void;
}) {
  const data = useQuery({
    queryKey: ["tablet-treatment-sheet", visit.id, visit.visitId],
    queryFn: async (): Promise<{ medications: MedRow[]; plan: PlanRow[] }> => {
      const medRows = await tryRows([
        { table: "visit_medications", col: "visit_id", val: visit.id },
        { table: "visit_medications", col: "visit_id", val: visit.visitId },
      ]);

      const medIds = [
        ...new Set(medRows.map((m: any) => m.medication_id).filter(Boolean)),
      ];
      let medMap: Record<string, any> = {};
      for (const tbl of ["medicine_master", "medication", "medications"]) {
        if (!medIds.length) break;
        const res = await db.from(tbl).select("*").in("id", medIds);
        if (!res.error && Array.isArray(res.data) && res.data.length) {
          medMap = Object.fromEntries(res.data.map((m: any) => [m.id, m]));
          break;
        }
      }
      const stockMap = await fetchMedicineStock(medIds as string[]);

      const medications: MedRow[] = medRows.map((m: any) => {
        const med = medMap[m.medication_id] || {};
        return {
          id: String(m.id),
          name:
            med.medicine_name ||
            med.name ||
            med.generic_name ||
            m.medication_type ||
            "Medication",
          dosage: [m.dosage, med.strength].filter(Boolean).join(" "),
          route: m.route || "",
          frequency: m.frequency || "",
          duration: m.duration || "",
          stock: stockMap[m.medication_id] || 0,
        };
      });

      const planRows = await tryRows([
        { table: "doctor_plan", col: "visit_id", val: visit.visitId },
        { table: "doctor_plan", col: "visit_id", val: visit.id },
      ]);
      const plan: PlanRow[] = [...planRows].sort(
        (a, b) => (a.day_number || 0) - (b.day_number || 0),
      ) as PlanRow[];

      return { medications, plan };
    },
  });

  const meds = data.data?.medications || [];
  const plan = data.data?.plan || [];

  return (
    <FlowScaffold
      heading="Treatment Sheet"
      subheading={`${visit.patientName} · ${visit.patientsId || visit.visitId}`}
      actions={
        <>
          <TabletButton variant="outline" className="flex-1" onClick={onBack}>
            Back
          </TabletButton>
          <TabletButton
            variant="outline"
            className="flex-1"
            onClick={() => window.print()}
            disabled={data.isLoading}
          >
            <Printer className="h-5 w-5" /> Print
          </TabletButton>
        </>
      }
    >
      {data.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="tablet-print-area space-y-5">
          {/* Title block — printout only; the page header already shows this
              title on screen, so showing it here too would duplicate it. */}
          <div className="hidden border-b pb-3 print:block">
            <h3 className="text-lg font-bold">Treatment Sheet</h3>
            <p className="text-sm text-muted-foreground">
              {visit.patientName} · {visit.patientsId || visit.visitId}
            </p>
          </div>

          {/* Prescribed medications — chart table with live availability */}
          <section>
            <h4 className="mb-2 font-semibold">
              Prescribed medications ({meds.length})
            </h4>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted">
                    <th className={TH}>#</th>
                    <th className={TH}>Medication</th>
                    <th className={TH}>Dose</th>
                    <th className={TH}>Route</th>
                    <th className={TH}>Frequency</th>
                    <th className={TH}>Duration</th>
                    <th className={TH}>Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {meds.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-8 text-center text-muted-foreground"
                      >
                        No medications added yet — add one below.
                      </td>
                    </tr>
                  ) : (
                    meds.map((m, i) => (
                      <tr key={m.id} className="last:[&>td]:border-0">
                        <td className={TD}>{i + 1}</td>
                        <td className={`${TD} font-medium`}>{m.name}</td>
                        <td className={TD}>{m.dosage || "—"}</td>
                        <td className={TD}>{m.route || "—"}</td>
                        <td className={TD}>{m.frequency || "—"}</td>
                        <td className={TD}>{m.duration || "—"}</td>
                        <td className={TD}>
                          <StockBadge stock={m.stock} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Add medication — inline on this same page (hidden when printing) */}
          <AddMedicationSection visit={visit} />

          {/* Daily treatment plan — table */}
          {plan.length > 0 ? (
            <section>
              <h4 className="mb-2 font-semibold">Daily treatment plan</h4>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-muted">
                      <th className={TH}>Day</th>
                      <th className={TH}>Date</th>
                      <th className={TH}>Medication</th>
                      <th className={TH}>Lab / Radiology</th>
                      <th className={TH}>Accommodation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.map((p, i) => (
                      <tr key={`${p.day_number}-${i}`} className="last:[&>td]:border-0">
                        <td className={`${TD} font-medium`}>
                          Day {p.day_number}
                        </td>
                        <td className={TD}>{p.date_of_stay || "—"}</td>
                        <td className={TD}>{p.medication || "—"}</td>
                        <td className={TD}>{p.lab_and_radiology || "—"}</td>
                        <td className={TD}>{p.accommodation || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </FlowScaffold>
  );
}

/**
 * Inline "Add medication" — quick-pick frequent drugs, full pharmacy search,
 * and a one-tap prescribe panel, all on the Treatment Sheet page (no separate
 * screen). Hidden when printing.
 */
function AddMedicationSection({ visit }: { visit: TabletVisit }) {
  const qc = useQueryClient();
  const { medicines, isLoading, searchTerm, setSearchTerm } = useMedicineSearch();
  const { addMedications, isAddingMedications } = useMedicalDataMutations();

  // Most-prescribed medicines across the system — one-tap quick picks.
  const quickPicks = useQuery({
    queryKey: ["tablet-frequent-meds"],
    queryFn: async (): Promise<MedicineResult[]> => {
      const { data: rows, error } = await db
        .from("visit_medications")
        .select("medication_id")
        .limit(500);
      if (error || !Array.isArray(rows)) return [];
      const counts: Record<string, number> = {};
      for (const r of rows) {
        if (r.medication_id) {
          counts[r.medication_id] = (counts[r.medication_id] || 0) + 1;
        }
      }
      const topIds = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([id]) => id);
      if (!topIds.length) return [];
      const res = await db
        .from("medicine_master")
        .select("id, medicine_name, generic_name, type")
        .in("id", topIds);
      const stock = await fetchMedicineStock(topIds);
      const byId: Record<string, MedicineResult> = {};
      for (const m of res.data || []) {
        byId[m.id] = {
          id: m.id,
          name: m.medicine_name || m.generic_name || "Medicine",
          generic: m.generic_name || "",
          type: m.type || "",
          totalStock: stock[m.id] || 0,
        };
      }
      return topIds.map((id) => byId[id]).filter(Boolean); // keep frequency order
    },
  });

  // `from` disambiguates a drug that is both a quick pick and a search hit.
  const [expanded, setExpanded] = useState<{
    id: string;
    from: "quick" | "search";
  } | null>(null);
  const [dosage, setDosage] = useState("");
  const [route, setRoute] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");

  const resetFields = () => {
    setDosage("");
    setRoute("");
    setFrequency("");
    setDuration("");
  };

  const toggleMed = (m: MedicineResult, from: "quick" | "search") => {
    if (expanded?.id === m.id && expanded.from === from) {
      setExpanded(null);
      return;
    }
    setExpanded({ id: m.id, from });
    resetFields();
  };

  const addMed = (m: MedicineResult) => {
    addMedications(
      {
        visitId: visit.id,
        medications: [
          {
            medication_id: m.id,
            medication_type: "prescribed",
            dosage: dosage.trim() || undefined,
            route: route.trim() || undefined,
            frequency: frequency.trim() || undefined,
            duration: duration.trim() || undefined,
          },
        ],
      },
      {
        onSuccess: () => {
          setExpanded(null);
          resetFields();
          setSearchTerm("");
          // The chart table above refreshes; the quick-pick list re-ranks.
          qc.invalidateQueries({
            queryKey: ["tablet-treatment-sheet", visit.id, visit.visitId],
          });
          qc.invalidateQueries({ queryKey: ["tablet-frequent-meds"] });
        },
      },
    );
  };

  /** The inline prescribe panel for one medicine — dose + chips + add button. */
  const renderPanel = (m: MedicineResult) => (
    <div className="space-y-3 p-3">
      {m.totalStock <= 0 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Out of stock in the pharmacy — you can still prescribe it.
        </p>
      ) : null}
      <div>
        <TabletLabel>Dose</TabletLabel>
        <TabletInput
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          placeholder="e.g. 500 mg (optional)"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {DOSES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDosage(dosage === d ? "" : d)}
              className={cn(
                CHIP_BASE,
                dosage === d
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <ChipRow
        label="Frequency"
        options={FREQUENCIES}
        value={frequency}
        onSelect={setFrequency}
      />
      <ChipRow label="Route" options={ROUTES} value={route} onSelect={setRoute} />
      <ChipRow
        label="Duration"
        options={DURATIONS}
        value={duration}
        onSelect={setDuration}
      />
      <TabletButton
        className="w-full"
        disabled={isAddingMedications}
        onClick={() => addMed(m)}
      >
        {isAddingMedications ? "Adding…" : "Add to chart"}
      </TabletButton>
    </div>
  );

  const showResults = searchTerm.trim().length > 0;
  const picks = quickPicks.data || [];
  const quickExpanded =
    expanded?.from === "quick"
      ? picks.find((p) => p.id === expanded.id)
      : undefined;

  return (
    <section className="tablet-no-print space-y-4 rounded-2xl border bg-muted/30 p-4">
      <h4 className="font-semibold">Add medication</h4>

      {/* Quick picks — one-tap frequent medicines (hidden while searching) */}
      {!showResults && picks.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Frequently prescribed — tap to add
          </p>
          <div className="flex flex-wrap gap-2">
            {picks.map((m) => {
              const open = expanded?.id === m.id && expanded.from === "quick";
              const dot =
                m.totalStock <= 0
                  ? "bg-rose-500"
                  : m.totalStock <= 10
                    ? "bg-amber-500"
                    : "bg-emerald-500";
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMed(m, "quick")}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
                    open
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background",
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", dot)} />
                  {m.name}
                </button>
              );
            })}
          </div>
          {quickExpanded ? (
            <div className="rounded-xl border bg-background">
              {renderPanel(quickExpanded)}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Search the full pharmacy catalogue */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <TabletInput
          className="pl-12"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search all pharmacy medicines…"
        />
      </div>

      {!showResults ? null : isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : medicines.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground">
          No medicines found. Try another search.
        </p>
      ) : (
        <div className="space-y-2">
          {medicines.map((m) => {
            const open = expanded?.id === m.id && expanded.from === "search";
            return (
              <div
                key={m.id}
                className={cn(
                  "overflow-hidden rounded-xl border bg-background",
                  open && "ring-2 ring-primary",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleMed(m, "search")}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{m.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {[m.generic, m.type].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <StockBadge stock={m.totalStock} />
                </button>
                {open ? (
                  <div className="border-t">{renderPanel(m)}</div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

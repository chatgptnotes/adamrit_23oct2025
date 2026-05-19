import { useState } from "react";
import { FileText, NotebookPen, Pill } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdmittedVisits, type TabletVisit } from "@/tablet/hooks/useVisitLists";
import { TabletVisitList } from "@/tablet/components/TabletVisitList";
import { FlowScaffold } from "@/tablet/components/FlowScaffold";
import { TabletButton } from "@/tablet/ui/TabletButton";
import { TabletCard } from "@/tablet/ui/TabletCard";
import { AdmissionNotes } from "./AdmissionNotes";
import { ProgressNotes } from "./ProgressNotes";
import { TreatmentSheet } from "./TreatmentSheet";

type View = "menu" | "admission" | "progress" | "treatment";

const MENU = [
  {
    id: "admission" as const,
    label: "Admission Notes",
    desc: "Initial clinical write-up",
    icon: FileText,
    tint: "from-violet-400 to-violet-600",
  },
  {
    id: "progress" as const,
    label: "Progress Notes",
    desc: "Daily clinical notes",
    icon: NotebookPen,
    tint: "from-teal-400 to-teal-600",
  },
  {
    id: "treatment" as const,
    label: "Treatment Sheet",
    desc: "Medications & treatment plan",
    icon: Pill,
    tint: "from-sky-400 to-sky-600",
  },
];

/**
 * Module — Doctor Notes hub. Pick an admitted visit, then choose Admission Notes,
 * Progress Notes, or Treatment Sheet.
 */
export default function DoctorNotesFlow() {
  const visits = useAdmittedVisits();
  const [visit, setVisit] = useState<TabletVisit | null>(null);
  const [view, setView] = useState<View>("menu");

  if (!visit) {
    return (
      <TabletVisitList
        visits={visits.data || []}
        loading={visits.isLoading}
        error={visits.isError}
        onSelect={(v) => {
          setVisit(v);
          setView("menu");
        }}
        emptyText="No admitted patients."
        metaKind="admitted"
      />
    );
  }

  if (view === "admission") {
    return <AdmissionNotes visit={visit} onBack={() => setView("menu")} />;
  }
  if (view === "progress") {
    return <ProgressNotes visit={visit} onBack={() => setView("menu")} />;
  }
  if (view === "treatment") {
    return <TreatmentSheet visit={visit} onBack={() => setView("menu")} />;
  }

  return (
    <FlowScaffold
      heading="Doctor Notes"
      subheading={`${visit.patientName} · ${visit.patientsId || visit.visitId}`}
      actions={
        <TabletButton
          variant="outline"
          className="flex-1"
          onClick={() => setVisit(null)}
        >
          Change patient
        </TabletButton>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {MENU.map((m) => {
          const Icon = m.icon;
          return (
            <TabletCard
              key={m.id}
              interactive
              onClick={() => setView(m.id)}
              className="flex flex-col gap-3"
            >
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                  m.tint,
                )}
              >
                <Icon className="h-7 w-7" />
              </div>
              <div>
                <p className="font-semibold leading-tight">{m.label}</p>
                <p className="text-sm text-muted-foreground">{m.desc}</p>
              </div>
            </TabletCard>
          );
        })}
      </div>
    </FlowScaffold>
  );
}

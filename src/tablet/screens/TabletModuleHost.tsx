import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { getModule } from "@/tablet/config/modules";
import { TabletConfirm } from "@/tablet/components/TabletConfirm";

/** Lazy module-flow registry, keyed by the module id from config/modules.ts. */
const FLOWS: Record<string, LazyExoticComponent<ComponentType>> = {
  register: lazy(() => import("@/tablet/modules/register/RegisterPatientFlow")),
  occupancy: lazy(() => import("@/tablet/modules/occupancy/OccupancyBoard")),
  "icu-admission": lazy(() => import("@/tablet/modules/icu-admission/IcuAdmissionFlow")),
  advance: lazy(() => import("@/tablet/modules/advance/AdvanceFlow")),
  requisition: lazy(() => import("@/tablet/modules/requisition/RequisitionFlow")),
  "gate-pass": lazy(() => import("@/tablet/modules/gate-pass/GatePassFlow")),
  "discharge-summary": lazy(
    () => import("@/tablet/modules/discharge-summary/DischargeSummaryFlow"),
  ),
  "doctor-notes": lazy(
    () => import("@/tablet/modules/doctor-notes/DoctorNotesFlow"),
  ),
  "medication-round": lazy(
    () => import("@/tablet/modules/medication-round/MedicationRoundFlow"),
  ),
  discharge: lazy(() => import("@/tablet/modules/discharge/DischargeListFlow")),
  dama: lazy(() => import("@/tablet/modules/dama/DamaFlow")),
  billing: lazy(() => import("@/tablet/modules/billing/BillingFlow")),
  "cash-in-hand": lazy(() => import("@/tablet/modules/cash-in-hand/CashInHandView")),
  report: lazy(() => import("@/tablet/modules/report/ReportFlow")),
};

/** Resolves /:moduleId to its flow component. */
export function TabletModuleHost() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const mod = getModule(moduleId);
  const Flow = moduleId ? FLOWS[moduleId] : undefined;

  if (!mod || !Flow) {
    return (
      <TabletConfirm
        status="error"
        title="Module not found"
        message="This screen is not available."
        primaryAction={{ label: "Back to Home", onClick: () => navigate("/") }}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <Flow />
    </Suspense>
  );
}

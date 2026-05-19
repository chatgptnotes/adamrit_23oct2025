import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Patient } from "@/components/PatientLookup/types/patientLookup";
import { cn } from "@/lib/utils";
import { inr, shortDate } from "@/tablet/lib/format";
import { TabletPatientPicker } from "@/tablet/components/TabletPatientPicker";
import { TabletNumpad } from "@/tablet/components/TabletNumpad";
import { FlowScaffold } from "@/tablet/components/FlowScaffold";
import { TabletConfirm } from "@/tablet/components/TabletConfirm";
import { TabletButton } from "@/tablet/ui/TabletButton";
import { TabletCard } from "@/tablet/ui/TabletCard";
import { DictationTextarea } from "@/tablet/components/DictationTextarea";

const MODES = ["CASH", "CARD", "UPI", "CHEQUE", "NEFT"];

interface AdvanceRow {
  id: string;
  advance_amount: number;
  returned_amount: number;
  is_refund: boolean;
  payment_date: string;
  payment_mode: string;
  status: string;
}

/** Module 6 — view a patient's advance statement and collect an advance. */
export default function AdvanceFlow() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [stage, setStage] = useState<"view" | "collect">("view");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("CASH");
  const [remarks, setRemarks] = useState("");

  const advances = useQuery({
    queryKey: ["tablet-advances", patient?.id],
    enabled: !!patient,
    queryFn: async (): Promise<AdvanceRow[]> => {
      const { data, error } = await supabase
        .from("advance_payment")
        .select(
          "id, advance_amount, returned_amount, is_refund, payment_date, payment_mode, status",
        )
        .eq("patient_id", patient!.id)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return (data || []) as AdvanceRow[];
    },
  });

  const collect = useMutation({
    mutationFn: async () => {
      const value = Number(amount);
      if (!patient || !value || value <= 0) throw new Error("Enter a valid amount");
      const { error } = await supabase.from("advance_payment").insert({
        patient_id: patient.id,
        patient_name: patient.name,
        patients_id: patient.patients_id || null,
        advance_amount: value,
        returned_amount: 0,
        is_refund: false,
        payment_date: new Date().toISOString(),
        payment_mode: mode,
        remarks: remarks.trim() || null,
        status: "ACTIVE",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tablet-advances", patient?.id] });
    },
  });

  if (!patient) {
    return (
      <TabletPatientPicker
        heading="Advance — select patient"
        hint="Search for the patient to view advances or collect a new one."
        onSelect={setPatient}
      />
    );
  }

  if (collect.isSuccess) {
    return (
      <TabletConfirm
        status="success"
        title="Advance collected"
        message={`${inr(Number(amount))} recorded for ${patient.name} via ${mode}.`}
        primaryAction={{
          label: "Back to statement",
          onClick: () => {
            setAmount("");
            setRemarks("");
            setStage("view");
            collect.reset();
          },
        }}
        secondaryAction={{ label: "Home", onClick: () => navigate("/") }}
      />
    );
  }

  if (stage === "collect") {
    const value = Number(amount) || 0;
    return (
      <FlowScaffold
        heading="Collect advance"
        subheading={`${patient.name} · ${patient.patients_id || ""}`}
        actions={
          <>
            <TabletButton
              variant="outline"
              className="flex-1"
              onClick={() => setStage("view")}
              disabled={collect.isPending}
            >
              Cancel
            </TabletButton>
            <TabletButton
              className="flex-1"
              disabled={value <= 0 || collect.isPending}
              onClick={() => collect.mutate()}
            >
              {collect.isPending ? "Saving…" : `Collect ${inr(value)}`}
            </TabletButton>
          </>
        }
      >
        <div className="space-y-5">
          <div className="rounded-2xl bg-muted p-5 text-center">
            <p className="text-sm text-muted-foreground">Advance amount</p>
            <p className="text-4xl font-bold">{inr(value)}</p>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-muted-foreground">
              Payment mode
            </p>
            <div className="grid grid-cols-5 gap-2">
              {MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "h-12 rounded-xl text-sm font-medium",
                    mode === m ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <TabletNumpad
            value={amount}
            onChange={setAmount}
            allowDecimal
            maxLength={9}
          />
          <div>
            <p className="mb-1.5 text-sm font-medium text-muted-foreground">
              Remarks
            </p>
            <DictationTextarea
              value={remarks}
              onChange={setRemarks}
              rows={3}
              placeholder="Optional remarks / narration"
            />
          </div>
          {collect.isError ? (
            <p className="text-destructive">
              {(collect.error as Error)?.message || "Could not save advance."}
            </p>
          ) : null}
        </div>
      </FlowScaffold>
    );
  }

  const rows = advances.data || [];
  const totalAdvance = rows
    .filter((r) => !r.is_refund)
    .reduce((s, r) => s + (Number(r.advance_amount) || 0), 0);
  const totalReturned = rows.reduce(
    (s, r) => s + (Number(r.returned_amount) || 0),
    0,
  );

  return (
    <FlowScaffold
      heading={patient.name}
      subheading={`${patient.patients_id || ""} — advance statement`}
      actions={
        <>
          <TabletButton
            variant="outline"
            className="flex-1"
            onClick={() => setPatient(null)}
          >
            Change patient
          </TabletButton>
          <TabletButton className="flex-1" onClick={() => setStage("collect")}>
            Collect advance
          </TabletButton>
        </>
      }
    >
      <TabletCard className="mb-4 flex items-center gap-4 bg-amber-50">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
          <Wallet className="h-7 w-7 text-amber-600" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Net advance balance</p>
          <p className="text-3xl font-bold">{inr(totalAdvance - totalReturned)}</p>
        </div>
      </TabletCard>

      {advances.isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No advances recorded for this patient.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <TabletCard key={r.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">
                  {r.is_refund ? "Refund" : "Advance"} · {r.payment_mode}
                </p>
                <p className="text-xs text-muted-foreground">
                  {shortDate(r.payment_date)} · {r.status}
                </p>
              </div>
              <span
                className={cn(
                  "font-semibold",
                  r.is_refund ? "text-rose-700" : "text-emerald-700",
                )}
              >
                {r.is_refund ? "−" : "+"}
                {inr(r.advance_amount)}
              </span>
            </TabletCard>
          ))}
        </div>
      )}
    </FlowScaffold>
  );
}

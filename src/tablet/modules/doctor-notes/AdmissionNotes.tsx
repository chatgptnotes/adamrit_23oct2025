import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { TabletVisit } from "@/tablet/hooks/useVisitLists";
import { FlowScaffold } from "@/tablet/components/FlowScaffold";
import { DictationTextarea } from "@/tablet/components/DictationTextarea";
import { TabletButton } from "@/tablet/ui/TabletButton";
import { TabletInput, TabletLabel } from "@/tablet/ui/TabletInput";

/** Clinical-note fields — same shape the desktop Admission Notes form uses. */
const FIELDS: { key: string; label: string; input?: boolean }[] = [
  { key: "history_present_illness", label: "History of present illness" },
  { key: "past_illness", label: "Past illness" },
  { key: "personal_history_habits", label: "Personal history & habits" },
  { key: "occupation_family_history", label: "Occupation & family history" },
  { key: "clinical_examination", label: "Clinical examination" },
  { key: "investigation", label: "Investigation" },
  { key: "provisional_diagnosis", label: "Provisional diagnosis" },
  { key: "surgery_plans_doctor", label: "Surgery / treatment plan" },
  { key: "review", label: "Review / follow-up" },
  { key: "doctor_signature", label: "Doctor", input: true },
  { key: "complaint", label: "Chief complaint" },
];

type NotesData = Record<string, string>;
const EMPTY: NotesData = Object.fromEntries(FIELDS.map((f) => [f.key, ""]));

/**
 * Admission Notes — reads & writes `visits.ipd_admission_notes` (JSONB), the exact
 * column the desktop Admission Notes page uses. Free-text fields support dictation.
 */
export function AdmissionNotes({
  visit,
  onBack,
}: {
  visit: TabletVisit;
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState<NotesData>(EMPTY);

  const notes = useQuery({
    queryKey: ["tablet-admission-notes", visit.visitId],
    queryFn: async (): Promise<NotesData | null> => {
      const { data, error } = await supabase
        .from("visits")
        .select("ipd_admission_notes")
        .eq("visit_id", visit.visitId)
        .single();
      if (error) throw error;
      return (data?.ipd_admission_notes as NotesData) || null;
    },
  });

  useEffect(() => {
    if (notes.isLoading) return;
    const loaded = { ...EMPTY, ...(notes.data || {}) };
    if (!loaded.doctor_signature && user?.username) {
      loaded.doctor_signature = user.username;
    }
    setForm(loaded);
  }, [notes.data, notes.isLoading, user?.username]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("visits")
        .update({
          ipd_admission_notes: form,
          updated_at: new Date().toISOString(),
        })
        .eq("visit_id", visit.visitId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["tablet-admission-notes", visit.visitId],
      });
    },
  });

  return (
    <FlowScaffold
      heading="Admission Notes"
      subheading={`${visit.patientName} · ${visit.patientsId || visit.visitId}`}
      actions={
        <>
          <TabletButton
            variant="outline"
            className="flex-1"
            onClick={onBack}
            disabled={save.isPending}
          >
            Back to menu
          </TabletButton>
          <TabletButton
            className="flex-1"
            onClick={() => save.mutate()}
            disabled={save.isPending || notes.isLoading}
          >
            {save.isPending ? "Saving…" : "Save notes"}
          </TabletButton>
        </>
      }
    >
      {notes.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : notes.isError ? (
        <p className="py-10 text-center text-destructive">
          Could not load notes for this visit.
        </p>
      ) : (
        <div className="space-y-4">
          {save.isSuccess ? (
            <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 font-medium text-emerald-700">
              <CheckCircle2 className="h-5 w-5" /> Notes saved
            </p>
          ) : null}
          {FIELDS.map((f) => (
            <div key={f.key}>
              <TabletLabel>{f.label}</TabletLabel>
              {f.input ? (
                <TabletInput
                  value={form[f.key] || ""}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, [f.key]: e.target.value }))
                  }
                  placeholder={f.label}
                />
              ) : (
                <DictationTextarea
                  value={form[f.key] || ""}
                  onChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
                  placeholder={f.label}
                />
              )}
            </div>
          ))}
          {save.isError ? (
            <p className="text-destructive">
              {(save.error as Error)?.message || "Could not save notes."}
            </p>
          ) : null}
        </div>
      )}
    </FlowScaffold>
  );
}

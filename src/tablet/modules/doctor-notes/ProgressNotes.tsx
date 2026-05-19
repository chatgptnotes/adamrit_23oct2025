import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, NotebookPen, Plus, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { TabletVisit } from "@/tablet/hooks/useVisitLists";
import { FlowScaffold } from "@/tablet/components/FlowScaffold";
import { DictationTextarea } from "@/tablet/components/DictationTextarea";
import { TabletButton } from "@/tablet/ui/TabletButton";
import { TabletCard } from "@/tablet/ui/TabletCard";

interface ProgressEntry {
  id: string;
  date: string;
  time: string;
  text: string;
  doctor: string;
}

// `daily_progress_notes` is missing from the stale generated types — use untyped.
const db = supabase as any;

const SETUP_SQL =
  "alter table ipd_discharge_summary add column if not exists daily_progress_notes jsonb default '[]'::jsonb;";

/**
 * Progress Notes — daily clinical notes appended to
 * `ipd_discharge_summary.daily_progress_notes` (JSONB array). Append-only:
 * earlier entries are never edited or removed. Reads are resilient — a missing
 * table/column shows an empty list, never a hard error.
 */
export function ProgressNotes({
  visit,
  onBack,
}: {
  visit: TabletVisit;
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const notes = useQuery({
    queryKey: ["tablet-progress-notes", visit.visitId],
    queryFn: async (): Promise<ProgressEntry[]> => {
      // select("*") + tolerate errors: a not-yet-added column or table never
      // breaks the screen — it just shows an empty list.
      const { data, error } = await db
        .from("ipd_discharge_summary")
        .select("*")
        .eq("visit_id", visit.visitId)
        .maybeSingle();
      if (error) return [];
      const arr = data?.daily_progress_notes;
      return Array.isArray(arr) ? (arr as ProgressEntry[]) : [];
    },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const text = draft.trim();
      if (!text) throw new Error("Write a note first");
      const now = new Date();
      const entry: ProgressEntry = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now()),
        date: format(now, "yyyy-MM-dd"),
        time: format(now, "HH:mm"),
        text,
        doctor: user?.username || "",
      };
      // Read current row, append the new entry, write back — prior notes untouched.
      const { data: existing } = await db
        .from("ipd_discharge_summary")
        .select("*")
        .eq("visit_id", visit.visitId)
        .maybeSingle();
      const current = Array.isArray(existing?.daily_progress_notes)
        ? (existing.daily_progress_notes as ProgressEntry[])
        : [];
      const next = [...current, entry];
      if (existing?.id) {
        const { error } = await db
          .from("ipd_discharge_summary")
          .update({ daily_progress_notes: next })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await db
          .from("ipd_discharge_summary")
          .insert({ visit_id: visit.visitId, daily_progress_notes: next });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setDraft("");
      setAdding(false);
      qc.invalidateQueries({
        queryKey: ["tablet-progress-notes", visit.visitId],
      });
    },
  });

  const entries = [...(notes.data || [])].reverse(); // newest first

  return (
    <FlowScaffold
      heading="Progress Notes"
      subheading={`${visit.patientName} · ${visit.patientsId || visit.visitId}`}
      actions={
        adding ? (
          <>
            <TabletButton
              variant="outline"
              className="flex-1"
              onClick={() => {
                setAdding(false);
                setDraft("");
                addNote.reset();
              }}
              disabled={addNote.isPending}
            >
              Cancel
            </TabletButton>
            <TabletButton
              className="flex-1"
              onClick={() => addNote.mutate()}
              disabled={!draft.trim() || addNote.isPending}
            >
              {addNote.isPending ? "Saving…" : "Save note"}
            </TabletButton>
          </>
        ) : (
          <>
            <TabletButton
              variant="outline"
              className="flex-1"
              onClick={onBack}
            >
              Back to menu
            </TabletButton>
            <TabletButton className="flex-1" onClick={() => setAdding(true)}>
              <Plus className="h-5 w-5" /> Add note
            </TabletButton>
          </>
        )
      }
    >
      {adding ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            New progress note — {format(new Date(), "dd MMM yyyy, HH:mm")}
          </p>
          <DictationTextarea
            value={draft}
            onChange={setDraft}
            rows={7}
            placeholder="Type or dictate the progress note…"
          />
          {addNote.isError ? (
            <div className="space-y-1.5 rounded-xl bg-destructive/10 p-3 text-sm">
              <p className="font-medium text-destructive">
                Could not save: {(addNote.error as Error)?.message || "unknown error"}
              </p>
              <p className="text-muted-foreground">
                If that mentions a missing column, run this once in the Supabase
                SQL editor:
              </p>
              <code className="block break-all rounded bg-muted p-2 text-xs">
                {SETUP_SQL}
              </code>
            </div>
          ) : null}
        </div>
      ) : notes.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : entries.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          No progress notes yet. Tap “Add note”.
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <TabletCard key={e.id}>
              <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                  <NotebookPen className="h-4 w-4" />
                  {e.date} · {e.time}
                </span>
                {e.doctor ? (
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {e.doctor}
                  </span>
                ) : null}
              </div>
              <p className="whitespace-pre-wrap">{e.text}</p>
            </TabletCard>
          ))}
        </div>
      )}
    </FlowScaffold>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { shortDate } from "@/tablet/lib/format";
import { FlowScaffold } from "@/tablet/components/FlowScaffold";
import { TabletConfirm } from "@/tablet/components/TabletConfirm";
import { TabletButton } from "@/tablet/ui/TabletButton";
import { TabletCard } from "@/tablet/ui/TabletCard";
import { TabletInput, TabletLabel } from "@/tablet/ui/TabletInput";
import { DictationTextarea } from "@/tablet/components/DictationTextarea";

interface ExtReq {
  id: string;
  service_name: string;
  scan_center: string | null;
  created_at: string;
}

/** Module 4 — external requisition services (list + add). */
export default function RequisitionFlow() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [scanCenter, setScanCenter] = useState("");
  const [notes, setNotes] = useState("");

  const list = useQuery({
    queryKey: ["tablet-external-requisitions"],
    staleTime: 1000 * 60,
    queryFn: async (): Promise<ExtReq[]> => {
      const { data, error } = await supabase
        .from("external_requisitions")
        .select("id, service_name, scan_center, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ExtReq[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!serviceName.trim()) throw new Error("Service name is required");
      const { data, error } = await supabase
        .from("external_requisitions")
        .insert({
          service_name: serviceName.trim(),
          scan_center: scanCenter.trim() || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      // Notes are optional and saved best-effort, so a missing `notes` column
      // never blocks creating the requisition.
      const note = notes.trim();
      if (note && data?.id) {
        const { error: noteErr } = await (supabase as any)
          .from("external_requisitions")
          .update({ notes: note })
          .eq("id", data.id);
        if (noteErr) {
          console.warn(
            "Requisition note not saved — add a `notes` column to external_requisitions.",
            noteErr.message,
          );
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tablet-external-requisitions"] });
    },
  });

  if (create.isSuccess) {
    return (
      <TabletConfirm
        status="success"
        title="Requisition added"
        message={`${serviceName} has been added to external requisitions.`}
        primaryAction={{
          label: "Add another",
          onClick: () => {
            setServiceName("");
            setScanCenter("");
            setNotes("");
            setAdding(true);
            create.reset();
          },
        }}
        secondaryAction={{
          label: "View list",
          onClick: () => {
            setServiceName("");
            setScanCenter("");
            setNotes("");
            setAdding(false);
            create.reset();
          },
        }}
      />
    );
  }

  if (adding) {
    return (
      <FlowScaffold
        heading="New external requisition"
        subheading="Add a diagnostic / scan service."
        actions={
          <>
            <TabletButton
              variant="outline"
              className="flex-1"
              onClick={() => setAdding(false)}
              disabled={create.isPending}
            >
              Cancel
            </TabletButton>
            <TabletButton
              className="flex-1"
              disabled={!serviceName.trim() || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending ? "Saving…" : "Save"}
            </TabletButton>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <TabletLabel>Service name *</TabletLabel>
            <TabletInput
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="e.g. MRI Brain, CT Chest"
            />
          </div>
          <div>
            <TabletLabel>Scan centre</TabletLabel>
            <TabletInput
              value={scanCenter}
              onChange={(e) => setScanCenter(e.target.value)}
              placeholder="Outsourced centre (optional)"
            />
          </div>
          <div>
            <TabletLabel>Notes</TabletLabel>
            <DictationTextarea
              value={notes}
              onChange={setNotes}
              rows={3}
              placeholder="Notes about this service (optional)"
            />
          </div>
          {create.isError ? (
            <p className="text-destructive">
              {(create.error as Error)?.message || "Could not save."}
            </p>
          ) : null}
        </div>
      </FlowScaffold>
    );
  }

  const rows = list.data || [];

  return (
    <FlowScaffold
      heading="External requisitions"
      subheading={`${rows.length} service${rows.length === 1 ? "" : "s"}`}
      actions={
        <TabletButton className="flex-1" onClick={() => setAdding(true)}>
          <Plus className="h-5 w-5" /> Add requisition
        </TabletButton>
      }
    >
      {list.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : list.isError ? (
        <p className="py-10 text-center text-destructive">
          Could not load requisitions.
        </p>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          No external requisitions yet. Tap “Add requisition”.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <TabletCard key={r.id} className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
                <ClipboardList className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{r.service_name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {r.scan_center || "In-house"} · {shortDate(r.created_at)}
                </p>
              </div>
            </TabletCard>
          ))}
        </div>
      )}
    </FlowScaffold>
  );
}

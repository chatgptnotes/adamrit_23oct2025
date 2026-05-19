import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HeartPulse, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useAdmittedVisits, type TabletVisit } from "@/tablet/hooks/useVisitLists";
import { TabletVisitList } from "@/tablet/components/TabletVisitList";
import { FlowScaffold } from "@/tablet/components/FlowScaffold";
import { TabletConfirm } from "@/tablet/components/TabletConfirm";
import { TabletButton } from "@/tablet/ui/TabletButton";
import { TabletCard } from "@/tablet/ui/TabletCard";
import { TabletInput, TabletLabel } from "@/tablet/ui/TabletInput";

interface IcuWard {
  id: string;
  ward_type: string;
  ward_id: string | null;
  location: string | null;
}

/** Module 12 — admit / transfer an admitted patient to an ICU bed. */
export default function IcuAdmissionFlow() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hospitalConfig } = useAuth();
  const visits = useAdmittedVisits();
  const [selected, setSelected] = useState<TabletVisit | null>(null);
  const [ward, setWard] = useState<IcuWard | null>(null);
  const [room, setRoom] = useState("");

  const icuWards = useQuery({
    queryKey: ["tablet-icu-wards", hospitalConfig.name],
    enabled: !!selected,
    queryFn: async (): Promise<IcuWard[]> => {
      const { data, error } = await supabase
        .from("room_management")
        .select("id, ward_type, ward_id, location")
        .eq("hospital_name", hospitalConfig.name)
        .ilike("ward_type", "%icu%");
      if (error) throw error;
      return (data || []) as IcuWard[];
    },
  });

  const admit = useMutation({
    mutationFn: async () => {
      if (!selected || !ward) throw new Error("Select a patient and ICU ward");
      const { error } = await supabase
        .from("visits")
        .update({
          ward_allotted: ward.ward_id || ward.ward_type,
          room_allotted: room.trim() || null,
        })
        .eq("id", selected.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tablet-admitted-visits"] });
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

  if (admit.isSuccess) {
    return (
      <TabletConfirm
        status="success"
        title="Moved to ICU"
        message={`${selected.patientName} is now assigned to ${ward?.ward_type}${room ? ` · room ${room}` : ""}.`}
        primaryAction={{ label: "Back to Home", onClick: () => navigate("/") }}
      />
    );
  }

  return (
    <FlowScaffold
      heading="ICU Admission"
      subheading={`${selected.patientName} · currently: ${selected.ward || "no ward"}`}
      actions={
        <>
          <TabletButton
            variant="outline"
            className="flex-1"
            onClick={() => setSelected(null)}
            disabled={admit.isPending}
          >
            Change patient
          </TabletButton>
          <TabletButton
            className="flex-1"
            disabled={!ward || admit.isPending}
            onClick={() => admit.mutate()}
          >
            {admit.isPending ? "Saving…" : "Assign ICU bed"}
          </TabletButton>
        </>
      }
    >
      {icuWards.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : icuWards.isError ? (
        <p className="py-10 text-center text-destructive">
          Could not load ICU wards.
        </p>
      ) : (icuWards.data || []).length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          No ICU wards are configured for this hospital.
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <TabletLabel>Select ICU ward</TabletLabel>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(icuWards.data || []).map((w) => (
                <TabletCard
                  key={w.id}
                  interactive
                  onClick={() => setWard(w)}
                  className={cn(
                    "flex items-center gap-3",
                    ward?.id === w.id && "ring-2 ring-primary",
                  )}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100">
                    <HeartPulse className="h-5 w-5 text-rose-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{w.ward_type}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {w.location || w.ward_id || "—"}
                    </p>
                  </div>
                </TabletCard>
              ))}
            </div>
          </div>
          <div>
            <TabletLabel>Bed / room number</TabletLabel>
            <TabletInput
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g. ICU-3 (optional)"
            />
          </div>
          {admit.isError ? (
            <p className="text-destructive">
              {(admit.error as Error)?.message || "Could not assign bed."}
            </p>
          ) : null}
        </div>
      )}
    </FlowScaffold>
  );
}

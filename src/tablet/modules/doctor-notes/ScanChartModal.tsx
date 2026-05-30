import { useRef, useState } from "react";
import { Camera, Check, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { TabletVisit } from "@/tablet/hooks/useVisitLists";
import { TabletButton } from "@/tablet/ui/TabletButton";
import {
  extractMedicationChart,
  normaliseChartRoute,
  type ExtractedMedicine,
} from "@/lib/extractMedicationChart";

const db = supabase as any;

interface ReviewMed extends ExtractedMedicine {
  include: boolean;
}

/**
 * Scan a handwritten medication chart on the bedside Treatment Sheet. Capture a
 * photo → Gemini reads the medicines → the doctor reviews the list → Confirm
 * files a PENDING prescription (header + items) in the pharmacy Prescription
 * Queue.
 */
export function ScanChartModal({
  open,
  onOpenChange,
  visit,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: TabletVisit;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [sending, setSending] = useState(false);
  const [review, setReview] = useState<ReviewMed[] | null>(null);
  const [doctor, setDoctor] = useState("");

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setExtracting(false);
    setSending(false);
    setReview(null);
    setDoctor("");
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      toast({ title: "Unsupported file", description: "Please capture or choose an image.", variant: "destructive" });
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleExtract = async () => {
    if (!file) return;
    setExtracting(true);
    try {
      const { medicines, doctor: doc } = await extractMedicationChart(file);
      setReview(medicines.map((m) => ({ ...m, include: true })));
      setDoctor(doc);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Extraction failed";
      console.error("Scan chart failed:", error);
      toast({ title: "Scan failed", description: message, variant: "destructive" });
    } finally {
      setExtracting(false);
    }
  };

  const handleConfirm = async () => {
    const chosen = (review || []).filter((m) => m.include);
    if (chosen.length === 0) {
      toast({ title: "Nothing selected", description: "Select at least one medicine.", variant: "destructive" });
      return;
    }

    setSending(true);
    const nowIso = new Date().toISOString();
    const today = nowIso.slice(0, 10);
    try {
      // Upload the captured chart so it shows in the prescription's "Photo"
      // panel. Non-fatal: if the upload fails the prescription is still created.
      let imageUrl: string | null = null;
      const imageType = file?.type || "image/jpeg";
      if (file) {
        const storagePath = `uploads/${Date.now()}_scan_${visit.visitId || "chart"}.jpg`.replace(/[^a-zA-Z0-9._/-]/g, "_");
        const { error: upErr } = await db.storage.from("uploads").upload(storagePath, file);
        if (upErr) {
          console.warn("Chart image upload failed (continuing without photo):", upErr.message);
        } else {
          imageUrl = db.storage.from("uploads").getPublicUrl(storagePath).data?.publicUrl || null;
        }
      }

      // Prescription Queue — prescriptions + prescription_items (PENDING).
      const rxPayload: Record<string, any> = {
        prescription_number: "RX-" + Date.now(),
        patient_id: visit.patientUuid,
        doctor_name: doctor || "As per records",
        prescription_date: today,
        status: "PENDING",
        notes: `Scanned treatment sheet — ${visit.patientName}`,
        prescription_image_url: imageUrl,
        prescription_image_type: imageUrl ? imageType : null,
      };

      let { data: rxData, error: rxError } = await db
        .from("prescriptions")
        .insert(rxPayload)
        .select("id")
        .single();

      // Older DBs without migration 20260516000001 lack the image columns —
      // retry without them so the prescription still saves.
      if (rxError && /prescription_image_(url|type)/.test(rxError.message || "")) {
        delete rxPayload.prescription_image_url;
        delete rxPayload.prescription_image_type;
        ({ data: rxData, error: rxError } = await db
          .from("prescriptions")
          .insert(rxPayload)
          .select("id")
          .single());
      }
      if (rxError) throw new Error(`Prescription queue: ${rxError.message}`);

      if (rxData?.id) {
        const items = chosen.map((m) => ({
          prescription_id: rxData.id,
          medicine_id: null,
          medicine_name: m.brand_name || m.name,
          generic_name: m.generic_name || "",
          brand_name: m.brand_name || "",
          quantity_prescribed: 1,
          dosage_frequency: m.frequency || "",
          dosage_timing: normaliseChartRoute(m.route),
          duration_days: parseInt(m.duration || "") || 0,
          special_instructions: [m.instructions, m.strength].filter(Boolean).join(" | "),
        }));
        const { error: itemsError } = await db.from("prescription_items").insert(items);
        if (itemsError) throw new Error(`Prescription items: ${itemsError.message}`);
      }

      toast({ title: "Prescription sent", description: `${chosen.length} medicine(s) sent to the pharmacy queue.` });
      onDone();
      handleClose(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not create prescription";
      console.error("Send to pharmacy failed:", error);
      toast({ title: "Send failed", description: message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const toggle = (idx: number) =>
    setReview((rows) => (rows ? rows.map((r, i) => (i === idx ? { ...r, include: !r.include } : r)) : rows));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Scan Medication Chart</h2>
          </div>

          {!review ? (
            <>
              <p className="text-sm text-muted-foreground">
                Photograph the handwritten chart. The AI reads the medicines for you to review
                before they are added to the chart and sent to the pharmacy.
              </p>

              {previewUrl ? (
                <div className="space-y-3">
                  <img
                    src={previewUrl}
                    alt="Captured medication chart"
                    className="max-h-72 w-full rounded-lg border bg-muted/30 object-contain"
                  />
                  <div className="flex gap-2">
                    <TabletButton variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()} disabled={extracting}>
                      <RefreshCw className="h-5 w-5" /> Retake
                    </TabletButton>
                    <TabletButton className="flex-1" onClick={handleExtract} disabled={extracting}>
                      {extracting ? <><Loader2 className="h-5 w-5 animate-spin" /> Reading…</> : <><Sparkles className="h-5 w-5" /> Extract</>}
                    </TabletButton>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-12 text-muted-foreground hover:border-primary hover:bg-primary/5"
                >
                  <Camera className="h-10 w-10" />
                  <span className="font-medium">Tap to capture or choose a photo</span>
                  <span className="text-xs">JPG / PNG of the medication chart</span>
                </button>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelected} />
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {review.length} medicine(s) read{doctor ? ` · Dr ${doctor}` : ""}. Untick anything wrong, then send.
              </p>
              <div className="space-y-2">
                {review.map((m, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggle(idx)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                      m.include ? "border-primary bg-primary/5" : "opacity-50",
                    )}
                  >
                    <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border", m.include ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground")}>
                      {m.include ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{m.brand_name || m.name}{m.strength ? ` ${m.strength}` : ""}</span>
                      <span className="block text-sm text-muted-foreground">
                        {[normaliseChartRoute(m.route), m.frequency, m.duration].filter(Boolean).join(" · ") || "—"}
                        {m.generic_name ? ` · ${m.generic_name}` : ""}
                      </span>
                      {m.instructions ? <span className="block text-xs text-muted-foreground">{m.instructions}</span> : null}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <TabletButton variant="outline" className="flex-1" onClick={() => setReview(null)} disabled={sending}>
                  Back
                </TabletButton>
                <TabletButton className="flex-1" onClick={handleConfirm} disabled={sending}>
                  {sending ? <><Loader2 className="h-5 w-5 animate-spin" /> Sending…</> : <><Check className="h-5 w-5" /> Confirm & send to pharmacy</>}
                </TabletButton>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ScanChartModal;

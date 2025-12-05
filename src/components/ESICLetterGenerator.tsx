import React, { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { Edit, Trash2, Plus, Save, Printer, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ESICLetterGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  additionalApprovalSurgery?: string;
  additionalApprovalInvestigation?: string;
  extensionOfStayApproval?: string;
  patientData?: any;
  visitId?: string;
}

// Sample templates with Mustache-like placeholders
const DEFAULT_TEMPLATES = [
  {
    id: 'tmpl-no-deduction',
    title: 'No Deduction Letter – ESIC',
    body:
      `To,\nState Medical Officer,\nRegional Office Maharashtra,\nEmployees State Insurance Corporation,\nGround Floor, Panchdeep Bhavan,\nNear Strand Cinema Bus Stop, S.B.S Marg,\nColaba, Mumbai – 400005\n\nThrough :- The Superintendent, ESIS Hospital, Somwarpeth, Nagpur\n\nSubject : Regarding patient {{patient.name}} – complication after CGHS package {{admission.cghs_code}} ({{admission.cghs_surgery}}) and approval for Medical Management\n\nDear Sir,\n\nPatient {{patient.name}}, age {{patient.age}}, gender {{patient.gender}}, ESIC Claim ID {{patient.claim_id}}, UHID {{patient.uhid}}, was admitted on {{admission.date}} with a diagnosis of {{admission.diagnosis}}. CGHS code {{admission.cghs_code}} was approved for {{admission.package_days}} days for {{admission.cghs_surgery}}.\n\nFollowing the procedure, the patient developed {{complication.name}} on {{complication.onset_date}} ({{complication.description}}). This is not covered under the original CGHS package; separate medical management was required ({{complication.not_covered_reason}}). Additional care provided: {{management.additional_treatment}}.\n\nReferring specialist: {{management.ref_doctor_name}} ({{management.ref_doctor_designation}}) advised continued management on {{management.advice_date}} due to {{management.severity}}. Additional days requested/used: {{management.extra_days}} (as per CGHS tariff reference {{management.cghs_tariff_ref}}).\n\nIn view of the above, we request that no deduction be made from the claimed amount; all interventions were medically necessary and in the patient's best interest.\n\nRegards,\nDr Murali BK\nHope Hospital, Nagpur`,
  },
];

// Real data structure - no mock data needed

function mergeTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/{{\s*([\w\.]+)\s*}}/g, (_, path) => {
    const parts = String(path).split('.');
    let v: any = data;
    for (const p of parts) v = v?.[p];
    return v == null ? '' : String(v);
  });
}

export const ESICLetterGenerator: React.FC<ESICLetterGeneratorProps> = ({
  isOpen,
  onClose,
  patientData,
  visitId,
}) => {
  // Fetch comprehensive data from visits table
  const { data: visitData, refetch } = useQuery({
    queryKey: ['esic-letter-generator', visitId],
    enabled: !!visitId && isOpen,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          patients(*),
          visit_diagnoses(
            diagnoses(
              id,
              name,
              description
            )
          ),
          visit_surgeries(
            id,
            status,
            sanction_status,
            cghs_surgery(
              id,
              name,
              code,
              description,
              category
            )
          ),
          visit_complications(
            complications!complication_id(
              id,
              name,
              description
            )
          ),
          visit_esic_surgeons(
            esic_surgeons!surgeon_id(
              id,
              name,
              specialty,
              department
            )
          ),
          visit_hope_surgeons(
            hope_surgeons!surgeon_id(
              id,
              name,
              specialty
            )
          ),
          referees(
            id,
            name,
            specialty,
            institution
          )
        `)
        .eq('visit_id', visitId)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  const initialFetched = useMemo(() => {
    const src = visitData || patientData;

    // Create data structure using exact visits table schema
    const allSurgeryNames = Array.isArray(src?.visit_surgeries)
      ? src.visit_surgeries
          .map((vs: any) => vs?.cghs_surgery?.name)
          .filter(Boolean)
      : [];
    const allSurgeryCodes = Array.isArray(src?.visit_surgeries)
      ? src.visit_surgeries
          .map((vs: any) => vs?.cghs_surgery?.code)
          .filter(Boolean)
      : [];
    const surgeriesCombined = allSurgeryNames.length
      ? allSurgeryNames.join(', ')
      : (allSurgeryCodes.length ? allSurgeryCodes.join(', ') : 'Surgery Details Not Available');
    const realData = {
      patient: {
        name: src?.patients?.name || 'Patient Name Not Available',
        age: src?.patients?.age || 'Age Not Available',
        gender: src?.patients?.gender || 'Gender Not Available',
        claim_id: src?.claim_id || 'Claim ID Not Available',
        uhid: src?.patients?.patients_id || 'UHID Not Available',
      },
      admission: {
        date: src?.admission_date ? new Date(src.admission_date).toLocaleDateString('en-GB') : 'Admission Date Not Available',
        diagnosis: src?.visit_diagnoses?.[0]?.diagnoses?.name ||
                  src?.reason_for_visit || 'Diagnosis Not Available',
        cghs_code: src?.cghs_code || (allSurgeryCodes.length ? allSurgeryCodes.join(', ') : 'CGHS Code Not Available'),
        cghs_surgery: surgeriesCombined,
        package_days: src?.package_amount || 'Package Days Not Available',
        discharge_date: src?.discharge_date ? new Date(src.discharge_date).toLocaleDateString('en-GB') : 'Discharge Date Not Available',
      },
      complication: {
        name: src?.visit_complications?.[0]?.complications?.name || 'No Complications Recorded',
        onset_date: src?.surgery_date ? new Date(src.surgery_date).toLocaleDateString('en-GB') : 'Complication Date Not Available',
        description: src?.visit_complications?.[0]?.complications?.description || 'Medical complication requiring additional care',
        not_covered_reason: 'Beyond standard package scope - requires additional medical management',
      },
      management: {
        ref_doctor_name: src?.appointment_with ||
                        src?.visit_esic_surgeons?.[0]?.esic_surgeons?.name ||
                        src?.referees?.name || 'Referring Doctor Not Available',
        ref_doctor_designation: src?.visit_esic_surgeons?.[0]?.esic_surgeons?.department ||
                               src?.visit_esic_surgeons?.[0]?.esic_surgeons?.specialty ||
                               src?.referees?.specialty || 'Consultant',
        advice_date: src?.surgery_date ? new Date(src.surgery_date).toLocaleDateString('en-GB') :
                    src?.visit_date ? new Date(src.visit_date).toLocaleDateString('en-GB') : 'Advice Date Not Available',
        severity: 'requiring continued medical supervision and monitoring',
        extra_days: src?.extension_taken ||
                   (src?.discharge_date && src?.admission_date ?
                    Math.ceil((new Date(src.discharge_date).getTime() - new Date(src.admission_date).getTime()) / (1000 * 60 * 60 * 24)) :
                    'Extra Days Not Available'),
        additional_treatment: 'Medical management as per clinical requirements and specialist advice',
        cghs_tariff_ref: 'CGHS 2024 Ward Tariff',
      },
      visit_info: {
        visit_id: src?.visit_id || 'Visit ID Not Available',
        visit_type: src?.visit_type || 'Visit Type Not Available',
        status: src?.status || 'Status Not Available',
        relation_with_employee: src?.relation_with_employee || 'SELF',
      }
    };

    return realData;
  }, [patientData, visitData]);

  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [selectedId, setSelectedId] = useState<string>(templates[0].id);
  const [titleEdit, setTitleEdit] = useState<string>(templates[0].title);
  const [editor, setEditor] = useState<string>(templates[0].body);
  const [search, setSearch] = useState<string>('');
  const [fetched, setFetched] = useState<Record<string, any>>(initialFetched);

  // Keep fetched data in sync when real data is loaded
  React.useEffect(() => {
    setFetched(initialFetched);
  }, [initialFetched]);

  const selected = useMemo(() => templates.find(t => t.id === selectedId)!, [templates, selectedId]);
  const previewText = useMemo(() => mergeTemplate(editor, fetched), [editor, fetched]);

  const printRef = useRef<HTMLDivElement | null>(null);
  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML || '';
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset='utf-8'/><title>Print</title><style>body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;line-height:1.6;padding:28px} h1{font-size:18px;margin-bottom:12px} pre{white-space:pre-wrap;word-wrap:break-word;font:inherit} .no-print-title{display:none} @page{margin:18mm}</style></head><body>${printContents}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  const handleExportPdf = () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      // Export only the letter body without the UI title
      const lines = pdf.splitTextToSize(`${previewText}`, pageWidth - 40);
      let y = 30;
      const lh = 7;
      for (const line of lines) {
        if (y > pdf.internal.pageSize.getHeight() - 30) {
          pdf.addPage();
          y = 30;
        }
        pdf.text(line, 20, y);
        y += lh;
      }
      pdf.save(`ESIC_No_Deduction_${Date.now()}.pdf`);
      toast.success('PDF exported');
    } catch (e) {
      console.error(e);
      toast.error('Failed to export PDF');
    }
  };

  const saveEditsToTemplate = () => {
    setTemplates(prev => prev.map(t => (t.id === selectedId ? { ...t, title: titleEdit, body: editor } : t)));
    toast.success('Template saved');
  };

  const addTemplate = () => {
    const nid = `tmpl-${Date.now()}`;
    const t = { id: nid, title: 'Untitled Template', body: 'Type your template here...' };
    setTemplates([t, ...templates]);
    setSelectedId(nid);
    setTitleEdit(t.title);
    setEditor(t.body);
  };

  const deleteTemplate = (id: string) => {
    const next = templates.filter(t => t.id !== id);
    setTemplates(next);
    if (id === selectedId && next.length) {
      setSelectedId(next[0].id);
      setTitleEdit(next[0].title);
      setEditor(next[0].body);
    }
  };

  const filtered = templates.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate ESIC “No Deduction” Letter</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Left: Templates */}
          <section className="rounded-xl bg-white p-3 border">
            <div className="mb-3 flex items-center gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates"
                className="flex-1"
              />
              <Button variant="outline" onClick={addTemplate} className="shrink-0">
                <Plus className="h-4 w-4 mr-1" /> New
              </Button>
            </div>
            <ul className="space-y-1 max-h-[520px] overflow-auto pr-1">
              {filtered.map((t) => {
                const isActive = selectedId === t.id;
                return (
                  <li
                    key={t.id}
                    className={`flex items-center justify-between rounded-lg px-2 py-2 text-sm border ${isActive ? 'bg-indigo-50/80 border-indigo-200' : 'hover:bg-neutral-50 border-transparent'}`}
                  >
                    <button
                      onClick={() => { setSelectedId(t.id); setTitleEdit(t.title); setEditor(t.body); }}
                      className="truncate text-left font-medium flex-1"
                      title={t.title}
                    >
                      {t.title}
                    </button>
                    <div className="ml-2 flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Edit template"
                        onClick={(e) => { e.stopPropagation(); setSelectedId(t.id); setTitleEdit(t.title); setEditor(t.body); }}
                        className="h-7 w-7"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Delete template"
                        onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }}
                        className="h-7 w-7 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Middle: Preview and editor header */}
          <section className="rounded-xl bg-white p-0 border overflow-hidden">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-white p-3">
              <Input value={titleEdit} onChange={(e) => setTitleEdit(e.target.value)} className="mr-2" />
              <div className="flex items-center gap-2">
                <Button variant="default" onClick={saveEditsToTemplate} className="whitespace-nowrap">
                  <Save className="h-4 w-4 mr-1" /> Save Template
                </Button>
                <Button variant="outline" onClick={handlePrint} className="whitespace-nowrap">
                  <Printer className="h-4 w-4 mr-1" /> Print
                </Button>
                <Button variant="outline" onClick={handleExportPdf} className="whitespace-nowrap">
                  <Download className="h-4 w-4 mr-1" /> Export PDF
                </Button>
              </div>
            </div>
            <div ref={printRef} className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold no-print-title">{titleEdit}</h2>
              <pre className="whitespace-pre-wrap text-[13px] leading-6">{previewText}</pre>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-neutral-500">Template Body</label>
              <Textarea value={editor} onChange={(e) => setEditor(e.target.value)} className="h-56" />
            </div>
          </section>

          {/* Right: Data inspector */}
          <section className="rounded-xl bg-white p-3 border">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Fetched Patient Data</h3>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => refetch()} title="Re-fetch latest data from HMIS/ESIC">
                  Refresh
                </Button>
                {!visitId && (
                  <Button size="sm" variant="outline" disabled title="Provide visitId prop to fetch real patient data">
                    No Data Source
                  </Button>
                )}
              </div>
            </div>
            <pre className="h-[520px] overflow-auto rounded-lg bg-neutral-50 p-3 text-[12px] leading-6">{JSON.stringify(fetched, null, 2)}</pre>
            <p className="mt-2 text-[11px] text-neutral-500">
              {visitId ? 'Real patient data fetched from database.' : 'No data source - provide visitId prop to fetch real patient data.'}
            </p>
          </section>
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
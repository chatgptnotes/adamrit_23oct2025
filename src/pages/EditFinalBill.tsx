import React, { useState, useEffect, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { format, differenceInDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"
import { ChevronUp, ChevronDown, Trash2, Plus, ChevronLeft, ChevronRight, Edit, X, Copy, Save, ArrowLeft, Calendar } from "lucide-react"
import { useParams, useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useFinalBillData } from "@/hooks/useFinalBillData"
import { toast } from "sonner"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { ESICLetterGenerator } from "@/components/ESICLetterGenerator"
import { DateRange } from "react-day-picker"
import { Badge } from "@/components/ui/badge"

// Define interfaces for our data structures
interface PatientData {
  billNo: string;
  claimId: string;
  registrationNo: string;
  name: string;
  age: string;
  sex: string;
  contactNo: string;
  address: string;
  beneficiaryName: string;
  relation: string;
  rank: string;
  serviceNo: string;
  category: string;
  diagnosis: string;
  dateOfAdmission: string;
  dateOfDischarge: string;
  billDate: string;
}

interface BillItem {
  id: string;
  srNo: string;
  description: string;
  code: string;
  rate: number;
  qty: number;
  amount: number;
  type: 'standard' | 'surgical';
  baseAmount?: number;
  primaryAdjustment?: string;
  secondaryAdjustment?: string;
  dates?: { from: string; to: string };
}

interface BillSection {
  id: string;
  title: string;
  dates?: { from: string; to: string };
  items: BillItem[];
}

const relationOptions = [
  'SELF', 'SPOUSE', 'SON', 'DAUGHTER', 'FATHER', 'MOTHER', 'BROTHER', 'SISTER'
];

const categoryOptions = [
  'GENERAL', 'SC', 'ST', 'OBC', 'ESIC', 'CGHS', 'ECHS'
];

const sexOptions = [
  'Male', 'Female', 'Other'
];

const EditFinalBill = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const { billData, isLoading: isBillLoading, saveBill, isSaving } = useFinalBillData(visitId || '');
  
  // State for patient information
  const [patientInfo, setPatientInfo] = useState<PatientData>({
    billNo: "",
    claimId: "",
    registrationNo: "",
    name: "",
    age: "",
    sex: "",
    contactNo: "",
    address: "",
    beneficiaryName: "",
    relation: "SELF",
    rank: "",
    serviceNo: "",
    category: "GENERAL",
    diagnosis: "",
    dateOfAdmission: "",
    dateOfDischarge: "",
    billDate: new Date().toISOString().split('T')[0],
  });

  // State for bill sections and items
  const [billSections, setBillSections] = useState<BillSection[]>([
    {
      id: 'conservative-treatment',
      title: 'Conservative Treatment',
      dates: { from: '', to: '' },
      items: []
    },
    {
      id: 'surgical-package',
      title: 'Surgical Package (6 Days)',
      dates: { from: '', to: '' },
      items: []
    },
    {
      id: 'consultation',
      title: 'Consultation for Inpatients',
      items: []
    },
    {
      id: 'accommodation',
      title: 'Accommodation Charges',
      items: []
    },
    {
      id: 'pathology',
      title: 'Pathology Charges',
      items: []
    },
    {
      id: 'medicine',
      title: 'Medicine Charges',
      items: []
    },
    {
      id: 'other',
      title: 'Other Charges',
      items: []
    },
    {
      id: 'miscellaneous',
      title: 'Miscellaneous Charges',
      items: []
    }
  ]);

  // Fetch patient and visit data
  const { data: visitData } = useQuery({
    queryKey: ['visit-data-edit', visitId],
    queryFn: async () => {
      if (!visitId) return null;
      
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          patients (*),
          diagnosis:diagnosis_id (id, name)
        `)
        .eq('visit_id', visitId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!visitId
  });

  // Populate patient info from fetched data
  useEffect(() => {
    if (visitData?.patients) {
      const patient = visitData.patients;
      const visit = visitData;
      
      setPatientInfo(prev => ({
        ...prev,
        billNo: `BL-${visitId}`,
        claimId: visit.claim_id || visitId || '',
        registrationNo: patient.patients_id || '',
        name: patient.name || '',
        age: patient.age?.toString() || '',
        sex: patient.gender || '',
        contactNo: patient.phone || '',
        address: patient.address || '',
        beneficiaryName: patient.name || '',
        relation: visit.relation_with_employee || 'SELF',
        category: patient.corporate?.toUpperCase() || 'GENERAL',
        diagnosis: visit.diagnosis?.name || 'Phimosis/Circumcision',
        dateOfAdmission: visit.admission_date || '',
        dateOfDischarge: visit.discharge_date || '',
      }));
    }
  }, [visitData, visitId]);

  // Populate bill sections from saved bill data
  useEffect(() => {
    if (billData?.line_items && billData?.sections) {
      const sectionsWithItems = billSections.map(section => {
        const sectionFromDb = billData.sections.find(s => 
          s.section_title.toLowerCase().includes(section.title.toLowerCase().substring(0, 5))
        );
        
        const sectionItems = billData.line_items
          .filter(item => item.bill_section_id === sectionFromDb?.id)
          .map((item, index) => ({
            id: item.id || `item-${section.id}-${index}`,
            srNo: item.sr_no || (index + 1).toString(),
            description: item.item_description || '',
            code: item.cghs_nabh_code || '',
            rate: Number(item.cghs_nabh_rate) || 0,
            qty: item.qty || 1,
            amount: Number(item.amount) || 0,
            type: (item.item_type === 'surgical' ? 'surgical' : 'standard') as 'standard' | 'surgical',
            baseAmount: item.base_amount ? Number(item.base_amount) : undefined,
            primaryAdjustment: item.primary_adjustment || undefined,
            secondaryAdjustment: item.secondary_adjustment || undefined,
            dates: item.dates_info ? JSON.parse(item.dates_info) : undefined
          }));

        return {
          ...section,
          items: sectionItems,
          dates: sectionFromDb ? {
            from: sectionFromDb.date_from || '',
            to: sectionFromDb.date_to || ''
          } : section.dates
        };
      });

      setBillSections(sectionsWithItems);
    }
  }, [billData]);

  const updatePatientInfo = (field: keyof PatientData, value: string) => {
    setPatientInfo(prev => ({ ...prev, [field]: value }));
  };

  const updateSectionDates = (sectionId: string, dates: { from: string; to: string }) => {
    setBillSections(prev => prev.map(section => 
      section.id === sectionId ? { ...section, dates } : section
    ));
  };

  const addItemToSection = (sectionId: string) => {
    setBillSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        const newItem: BillItem = {
          id: `${sectionId}-${Date.now()}`,
          srNo: (section.items.length + 1).toString(),
          description: '',
          code: '',
          rate: 0,
          qty: 1,
          amount: 0,
          type: 'standard'
        };
        return { ...section, items: [...section.items, newItem] };
      }
      return section;
    }));
  };

  const updateSectionItem = (sectionId: string, itemId: string, field: keyof BillItem, value: any) => {
    setBillSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        const updatedItems = section.items.map(item => {
          if (item.id === itemId) {
            const updated = { ...item, [field]: value };
            // Auto-calculate amount when rate or qty changes
            if (field === 'rate' || field === 'qty') {
              updated.amount = updated.rate * updated.qty;
            }
            return updated;
          }
          return item;
        });
        return { ...section, items: updatedItems };
      }
      return section;
    }));
  };

  const removeItemFromSection = (sectionId: string, itemId: string) => {
    setBillSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return { ...section, items: section.items.filter(item => item.id !== itemId) };
      }
      return section;
    }));
  };

  const calculateTotalAmount = () => {
    return billSections.reduce((total, section) => {
      return total + section.items.reduce((sectionTotal, item) => sectionTotal + item.amount, 0);
    }, 0);
  };

  const handleSave = async () => {
    if (!visitId || !visitData) {
      toast.error("Visit data not available");
      return;
    }

    try {
      // Prepare sections and line items
      const sections = billSections
        .filter(section => section.items.length > 0)
        .map((section, index) => ({
          title: section.title,
          dates: section.dates,
          order: index
        }));

      const lineItems = billSections.flatMap((section, sectionIndex) =>
        section.items.map((item, itemIndex) => ({
          srNo: item.srNo,
          description: item.description,
          code: item.code,
          rate: item.rate,
          qty: item.qty,
          amount: item.amount,
          type: item.type,
          baseAmount: item.baseAmount,
          primaryAdjustment: item.primaryAdjustment,
          secondaryAdjustment: item.secondaryAdjustment,
          dates: item.dates,
          order: itemIndex
        }))
      );

      const billDataToSave = {
        patient_id: visitData.patient_id,
        bill_no: patientInfo.billNo,
        claim_id: patientInfo.claimId,
        date: patientInfo.billDate,
        category: patientInfo.category,
        total_amount: calculateTotalAmount(),
        sections,
        line_items: lineItems
      };

      await saveBill(billDataToSave);
      toast.success("Bill saved successfully!");
      
      // Navigate back to view bill page
      navigate(`/final-bill/${visitId}`);
    } catch (error) {
      console.error('Error saving bill:', error);
      toast.error("Failed to save bill");
    }
  };

  if (isBillLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bill data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Final Bill</h1>
              <p className="text-gray-600">Edit bill for visit: {visitId}</p>
            </div>
            <Button
              onClick={() => navigate(`/final-bill/${visitId}`)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to View
            </Button>
          </div>

          {/* Bill Header */}
          <div className="border border-gray-300 mb-6">
            <div className="bg-gray-100 p-3 text-center font-bold text-lg border-b border-gray-300">
              FINAL BILL
            </div>
            <div className="bg-gray-100 p-3 text-center font-semibold border-b border-gray-300">
              ESIC
            </div>
            <div className="bg-gray-100 p-3 text-center border-b border-gray-300">
              <div className="flex items-center justify-center gap-2">
                <Label>CLAIM ID -</Label>
                <Input
                  value={patientInfo.claimId}
                  onChange={(e) => updatePatientInfo('claimId', e.target.value)}
                  className="w-48"
                />
              </div>
            </div>
          </div>

          {/* Patient Information Grid */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="w-32">BILL NO:</Label>
                <Input
                  value={patientInfo.billNo}
                  onChange={(e) => updatePatientInfo('billNo', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-32">REGISTRATION NO:</Label>
                <Input
                  value={patientInfo.registrationNo}
                  onChange={(e) => updatePatientInfo('registrationNo', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-32">NAME OF PATIENT:</Label>
                <Input
                  value={patientInfo.name}
                  onChange={(e) => updatePatientInfo('name', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-32">AGE:</Label>
                <Input
                  value={patientInfo.age}
                  onChange={(e) => updatePatientInfo('age', e.target.value)}
                  className="w-24"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-32">SEX:</Label>
                <Select value={patientInfo.sex} onValueChange={(value) => updatePatientInfo('sex', value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sexOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-32">ADDRESS:</Label>
                <Textarea
                  value={patientInfo.address}
                  onChange={(e) => updatePatientInfo('address', e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-32">RELATION WITH IP:</Label>
                <Select value={patientInfo.relation} onValueChange={(value) => updatePatientInfo('relation', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {relationOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="w-32">DATE:</Label>
                <Input
                  type="date"
                  value={patientInfo.billDate}
                  onChange={(e) => updatePatientInfo('billDate', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-32">DATE OF ADMISSION:</Label>
                <Input
                  type="date"
                  value={patientInfo.dateOfAdmission}
                  onChange={(e) => updatePatientInfo('dateOfAdmission', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-32">DATE OF DISCHARGE:</Label>
                <Input
                  type="date"
                  value={patientInfo.dateOfDischarge}
                  onChange={(e) => updatePatientInfo('dateOfDischarge', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-32">SERVICE NO:</Label>
                <Input
                  value={patientInfo.serviceNo}
                  onChange={(e) => updatePatientInfo('serviceNo', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-32">CATEGORY:</Label>
                <Select value={patientInfo.category} onValueChange={(value) => updatePatientInfo('category', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-32">DIAGNOSIS:</Label>
                <Input
                  value={patientInfo.diagnosis}
                  onChange={(e) => updatePatientInfo('diagnosis', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Bill Sections */}
          <div className="mb-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SR NO</TableHead>
                  <TableHead>ITEM</TableHead>
                  <TableHead>CGHS NABH CODE NO.</TableHead>
                  <TableHead>CGHS NABH RATE</TableHead>
                  <TableHead>QTY</TableHead>
                  <TableHead>AMOUNT</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billSections.map((section) => (
                  <React.Fragment key={section.id}>
                    {/* Section Header */}
                    <TableRow className="bg-gray-50">
                      <TableCell colSpan={7} className="font-semibold">
                        <div className="flex items-center justify-between">
                          <span>{section.title}</span>
                          <div className="flex items-center gap-2">
                            {section.dates && (
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-4 w-4" />
                                <Input
                                  type="date"
                                  value={section.dates.from}
                                  onChange={(e) => updateSectionDates(section.id, { ...section.dates!, from: e.target.value })}
                                  className="w-32 h-8"
                                />
                                <span>-</span>
                                <Input
                                  type="date"
                                  value={section.dates.to}
                                  onChange={(e) => updateSectionDates(section.id, { ...section.dates!, to: e.target.value })}
                                  className="w-32 h-8"
                                />
                              </div>
                            )}
                            <Button
                              size="sm"
                              onClick={() => addItemToSection(section.id)}
                              className="h-8"
                            >
                              <Plus className="h-4 w-4" />
                              Add
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* Section Items */}
                    {section.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Input
                            value={item.srNo}
                            onChange={(e) => updateSectionItem(section.id, item.id, 'srNo', e.target.value)}
                            className="w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) => updateSectionItem(section.id, item.id, 'description', e.target.value)}
                            className="min-w-60"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.code}
                            onChange={(e) => updateSectionItem(section.id, item.id, 'code', e.target.value)}
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateSectionItem(section.id, item.id, 'rate', Number(e.target.value))}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.qty}
                            onChange={(e) => updateSectionItem(section.id, item.id, 'qty', Number(e.target.value))}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">₹{item.amount.toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeItemFromSection(section.id, item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Total Amount */}
          <div className="mb-8">
            <div className="bg-black text-white p-4 rounded">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">TOTAL BILL AMOUNT</span>
                <span className="text-xl font-bold">
                  ₹{calculateTotalAmount().toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(`/final-bill/${visitId}`)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Bill
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditFinalBill;
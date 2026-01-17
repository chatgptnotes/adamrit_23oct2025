import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Loader2, Search, Users, Calendar, Clock, UserCheck, Shield, AlertTriangle, Filter, RotateCcw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText, Printer, Upload } from "lucide-react";
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Set PDF.js worker from local package
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
import { toast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { CascadingBillingStatusDropdown } from '@/components/shared/CascadingBillingStatusDropdown';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';
import { RefereeDoaPaymentModal } from '@/components/ipd/RefereeDoaPaymentModal';

interface Visit {
  id: string;
  visit_id: string;
  visit_date: string;
  admission_date: string | null;
  discharge_date: string | null;
  surgery_date: string | null;
  sr_no: string | null;
  discharged_sr_no: string | null;
  bunch_no: string | null;
  status: string;
  sst_treatment: string | null;
  intimation_done: string | null;
  cghs_code: string | null;
  package_amount: number | null;
  billing_executive: string | null;
  extension_taken: string | null;
  delay_waiver_intimation: string | null;
  surgical_approval: string | null;
  remark1: string | null;
  remark2: string | null;
  condonation_delay_submission: string | null;
  billing_status: string | null;
  patient_type: string | null;
  discharge_summary_status: string | null;
  referral_payment_status: string | null;
  referee_discharge_amt_paid: number | null;
  referees: {
    name: string;
  } | null;
  patients: {
    id: string;
    patients_id: string;
    name: string;
    age: number | null;
    gender: string | null;
    phone: string | null;
    insurance_person_no: string | null;
    hospital_name: string | null;
    corporate: string | null;
  };
}

interface CorporateOption {
  id: string;
  name: string;
}

// Referee Discharge Amount Cell with Payment Modal
const RefereeAmountCell = ({
  visit,
  onUpdate,
  isAdmin
}: {
  visit: Visit;
  onUpdate?: () => void;
  isAdmin: boolean;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch total payments for this visit
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['referee-doa-payments-total', visit.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referee_doa_payments')
        .select('amount')
        .eq('visit_id', visit.id);

      if (error) {
        console.error('Error fetching payments:', error);
        return [];
      }
      return data || [];
    },
    staleTime: 30000
  });

  // Calculate total
  const totalAmount = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  // Non-admin users can only view the value
  if (!isAdmin) {
    return <span className="text-xs">{totalAmount > 0 ? `₹${totalAmount.toLocaleString()}` : '—'}</span>;
  }

  // Create visit object for modal
  const visitForModal = {
    id: visit.id,
    visit_id: visit.visit_id,
    patients: visit.patients
  };

  return (
    <>
      <Button
        variant={totalAmount > 0 ? "default" : "outline"}
        size="sm"
        className={`h-6 px-2 text-xs ${totalAmount > 0 ? 'bg-green-600 hover:bg-green-700' : ''}`}
        onClick={() => setIsModalOpen(true)}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : totalAmount > 0 ? (
          `₹${totalAmount.toLocaleString()}`
        ) : (
          'Pay'
        )}
      </Button>

      <RefereeDoaPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        visit={visitForModal}
        onUpdate={onUpdate}
      />
    </>
  );
};

// Referral Payment Status Cell - displays latest referral_payment_status from referee_doa_payments
const ReferralPaymentStatusCell = ({ visit }: { visit: Visit }) => {
  const { data: latestStatus, isLoading } = useQuery({
    queryKey: ['referee-doa-payment-status', visit.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referee_doa_payments')
        .select('referral_payment_status')
        .eq('visit_id', visit.id)
        .order('payment_date', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching referral payment status:', error);
        return null;
      }
      return data?.[0]?.referral_payment_status || null;
    },
    staleTime: 30000
  });

  if (isLoading) {
    return <Loader2 className="h-3 w-3 animate-spin" />;
  }

  return <span className="text-xs">{latestStatus || '-'}</span>;
};

const DischargedPatients = () => {
  const navigate = useNavigate();
  const { user, hospitalConfig } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Check if current user is a marketing manager
  const isMarketingManager = user?.role === 'marketing_manager';

  // URL-persisted state
  const searchTerm = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || 'all';
  const patientTypeFilter = searchParams.get('patientType') || 'all';
  const billingStatusFilter = searchParams.get('billingStatus') || 'all';
  const corporateFilter = searchParams.get('corporate') || 'all';
  const sortBy = searchParams.get('sortBy') || 'discharged_sr_no';
  // For discharged_sr_no, always use desc unless explicitly set to asc in URL
  const urlSortOrder = searchParams.get('sortOrder');
  const sortOrder = (urlSortOrder || 'desc') as 'asc' | 'desc';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const itemsPerPage = 10;
  const fromDate = searchParams.get('from') || '';
  const toDate = searchParams.get('to') || '';

  // Helper to update URL params
  const updateParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || (key === 'page' && value === '1') || (value === 'all' && key !== 'page')) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams, { replace: true });
  };

  // Setter functions
  const setSearchTerm = (value: string) => updateParams({ search: value, page: '1' });
  const setStatusFilter = (value: string) => updateParams({ status: value, page: '1' });
  const setPatientTypeFilter = (value: string) => updateParams({ patientType: value, page: '1' });
  const setBillingStatusFilter = (value: string) => updateParams({ billingStatus: value, page: '1' });
  const setCorporateFilter = (value: string) => updateParams({ corporate: value, page: '1' });
  const setSortBy = (value: string) => updateParams({ sortBy: value });
  const setSortOrder = (value: 'asc' | 'desc') => updateParams({ sortOrder: value });
  const setCurrentPage = (value: number) => updateParams({ page: value.toString() });
  const setFromDate = (value: string) => updateParams({ from: value || null, page: '1' });
  const setToDate = (value: string) => updateParams({ to: value || null, page: '1' });

  // State for undischarge functionality
  const [isUndischargeDialogOpen, setIsUndischargeDialogOpen] = useState(false);
  const [selectedVisitForUndischarge, setSelectedVisitForUndischarge] = useState<Visit | null>(null);

  // State for gate pass modal
  const [isGatePassModalOpen, setIsGatePassModalOpen] = useState(false);
  const [selectedVisitForGatePass, setSelectedVisitForGatePass] = useState<Visit | null>(null);

  // State for Excel upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadPreviewData, setUploadPreviewData] = useState<Array<{visit_id: string, discharged_sr_no: string}>>([]);
  const [isUploading, setIsUploading] = useState(false);

  // State for referral report preview modal
  const [isReferralReportOpen, setIsReferralReportOpen] = useState(false);

  // State for unpaid referral report modal
  const [isUnpaidReportOpen, setIsUnpaidReportOpen] = useState(false);

  // State for DOA payments (individual payments with dates)
  const [doaPayments, setDoaPayments] = useState<Record<string, Array<{
    amount: number;
    payment_date: string;
    notes: string | null;
    referral_payment_status: string | null;
  }>>>({});

  // Fetch notifications for selected visit
  const { data: gatePassNotifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['gatepass-notifications', selectedVisitForGatePass?.visit_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gatepass_notifications')
        .select('*')
        .eq('visit_id', selectedVisitForGatePass?.visit_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedVisitForGatePass?.visit_id && isGatePassModalOpen
  });

  // Mutation to mark notification as resolved
  const markResolvedMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('gatepass_notifications')
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gatepass-notifications'] });
      toast({ title: "Notification marked as resolved" });
    },
    onError: (error: any) => {
      toast({ title: "Error marking resolved", description: error.message, variant: "destructive" });
    }
  });

  // Print Gate Pass function
  const handlePrintGatePass = () => {
    if (!selectedVisitForGatePass) return;

    const visit = selectedVisitForGatePass;
    const gatePassNumber = `GP-${visit.visit_id}`;
    const currentDate = new Date().toISOString();

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Gate Pass - ${gatePassNumber}</title>
            <style>
              body {
                margin: 0;
                padding: 15px;
                font-family: Arial, sans-serif;
                background: white;
                font-size: 12px;
              }
              .gate-pass-card {
                max-width: 750px;
                margin: 0 auto;
                border: 2px solid black;
                padding: 20px;
              }
              .header { text-align: center; margin-bottom: 20px; }
              .title { font-size: 24px; font-weight: bold; margin-bottom: 4px; }
              .subtitle { color: #666; margin-bottom: 12px; font-size: 11px; }
              .gate-pass-title {
                border: 2px solid black;
                padding: 12px;
                margin-top: 12px;
              }
              .gate-pass-number {
                font-size: 18px;
                font-weight: bold;
                color: #dc2626;
                margin-bottom: 4px;
              }
              .section-title {
                font-size: 14px;
                font-weight: bold;
                border-bottom: 2px solid black;
                padding-bottom: 4px;
                margin-bottom: 10px;
              }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 20px; }
              .info-item { display: flex; margin-bottom: 6px; font-size: 11px; }
              .info-label { font-weight: bold; width: 100px; }
              .info-value { flex: 1; border-bottom: 1px dotted black; }
              .clearance-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
              .clearance-item {
                border: 2px solid black;
                padding: 8px;
                text-align: center;
                font-size: 10px;
              }
              .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 20px; }
              .signature-box { text-align: center; font-size: 10px; }
              .signature-line { border-bottom: 2px solid black; height: 40px; margin-bottom: 4px; }
              .security-section {
                border: 3px solid #dc2626;
                padding: 12px;
                margin-bottom: 15px;
              }
              .security-title {
                font-size: 14px;
                font-weight: bold;
                color: #dc2626;
                text-align: center;
                margin-bottom: 8px;
              }
              .security-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 10px; }
              .checkbox-group { display: flex; gap: 10px; margin-top: 4px; }
              .barcode-section { text-align: center; margin-bottom: 10px; }
              .barcode-box {
                border: 2px solid black;
                padding: 8px;
                display: inline-block;
                font-family: monospace;
                font-size: 10px;
              }
              .footer { text-align: center; margin-top: 15px; color: #666; font-size: 10px; }
              .warning { font-weight: bold; color: #dc2626; }
              .badge-cleared { background: #22c55e; color: white; padding: 2px 6px; border-radius: 3px; font-size: 9px; }
              @page { margin: 0.4in; size: A4; }
            </style>
          </head>
          <body>
            <div class="gate-pass-card">
              <div class="header">
                <h1 class="title">HOPE HOSPITAL</h1>
                <p class="subtitle">Hospital Management Information System</p>
                <div class="gate-pass-title">
                  <h2 class="gate-pass-number">DISCHARGE GATE PASS</h2>
                  <p style="font-size: 16px; font-weight: 600;">Gate Pass No: ${gatePassNumber}</p>
                </div>
              </div>

              <div class="info-grid">
                <div>
                  <h3 class="section-title">PATIENT INFORMATION</h3>
                  <div class="info-item">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${visit.patients?.name || ''}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Patient ID:</span>
                    <span class="info-value">${visit.patients?.insurance_person_no || visit.patients?.patients_id || ''}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Visit ID:</span>
                    <span class="info-value">${visit.visit_id}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Age/Gender:</span>
                    <span class="info-value">${visit.patients?.age || ''} years / ${visit.patients?.gender || ''}</span>
                  </div>
                </div>

                <div>
                  <h3 class="section-title">DISCHARGE DETAILS</h3>
                  <div class="info-item">
                    <span class="info-label">Discharge Date:</span>
                    <span class="info-value">${visit.discharge_date ? format(new Date(visit.discharge_date), 'dd/MM/yyyy') : ''}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Discharge Time:</span>
                    <span class="info-value">${visit.discharge_date ? format(new Date(visit.discharge_date), 'HH:mm') : ''}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Patient Type:</span>
                    <span class="info-value">${visit.patient_type || ''}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Corporate:</span>
                    <span class="info-value">${visit.patients?.corporate || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div style="margin-bottom: 20px;">
                <h3 class="section-title">CLEARANCE STATUS</h3>
                <div class="clearance-grid">
                  <div class="clearance-item">
                    <p style="font-weight: 600;">Medical Clearance</p>
                    <span class="badge-cleared">CLEARED</span>
                  </div>
                  <div class="clearance-item">
                    <p style="font-weight: 600;">Billing Clearance</p>
                    <span class="badge-cleared">CLEARED</span>
                  </div>
                  <div class="clearance-item">
                    <p style="font-weight: 600;">Administrative Clearance</p>
                    <span class="badge-cleared">CLEARED</span>
                  </div>
                </div>
              </div>

              <div class="signature-grid">
                <div class="signature-box">
                  <div class="signature-line"></div>
                  <p style="font-weight: 600;">RECEPTIONIST SIGNATURE</p>
                  <p style="color: #666;">Name: ___________________</p>
                  <p style="color: #666;">Date & Time: ___________</p>
                </div>
                <div class="signature-box">
                  <div class="signature-line"></div>
                  <p style="font-weight: 600;">BILLING OFFICER SIGNATURE</p>
                  <p style="color: #666;">Name: ___________________</p>
                  <p style="color: #666;">Date & Time: ___________</p>
                </div>
              </div>

              <div class="security-section">
                <h3 class="security-title">FOR SECURITY USE ONLY</h3>
                <div class="security-grid">
                  <div>
                    <p style="font-weight: 600;">Gate Pass Verified:</p>
                    <div class="checkbox-group">
                      <label><input type="checkbox" style="margin-right: 4px;" />Yes</label>
                      <label><input type="checkbox" style="margin-right: 4px;" />No</label>
                    </div>
                  </div>
                  <div>
                    <p style="font-weight: 600;">Exit Time:</p>
                    <div style="border-bottom: 1px solid black; margin-top: 8px; height: 24px;"></div>
                  </div>
                </div>
                <div style="margin-top: 12px;">
                  <p style="font-weight: 600;">Security Officer Name & Signature:</p>
                  <div style="border-bottom: 1px solid black; margin-top: 8px; height: 24px;"></div>
                </div>
              </div>

              <div class="barcode-section">
                <div class="barcode-box">
                  <div>${gatePassNumber}</div>
                  <div style="font-size: 9px; color: #666; margin-top: 4px;">Scan for verification</div>
                </div>
              </div>

              <div class="footer">
                <p>Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                <p class="warning">⚠️ This gate pass is valid only for the date of discharge mentioned above</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Fetch available corporates for filter
  const { data: availableCorporates, isLoading: corporatesLoading } = useQuery({
    queryKey: ['corporates'],
    queryFn: async () => {
      console.log('🏢 Fetching available corporates for filter...');

      const { data, error } = await supabase
        .from('corporate')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching corporates:', error);
        throw error;
      }

      console.log(`🏢 Found ${data?.length || 0} corporates for filter`);
      return data as CorporateOption[];
    },
    staleTime: 300000, // 5 minutes - corporates don't change often
  });

  // Fetch discharged patients
  const { data: visits, isLoading, error, refetch } = useQuery({
    queryKey: ['discharged-patients', statusFilter, patientTypeFilter, billingStatusFilter, corporateFilter, sortBy, sortOrder, hospitalConfig?.name, availableCorporates?.length],
    queryFn: async () => {
      console.log('🏥 Fetching discharged patients for hospital:', hospitalConfig?.name, '(IPD, IPD (Inpatient) & Emergency only)');

      let query = supabase
        .from('visits')
        .select(`
          *,
          patients!inner(
            id,
            patients_id,
            name,
            age,
            gender,
            phone,
            insurance_person_no,
            hospital_name,
            corporate
          ),
          referees(
            name
          ),
          relationship_managers(
            name
          ),
          ipd_discharge_summary!visit_id(
            status
          )
        `)
        .not('discharge_date', 'is', null) // Only show discharged patients
        .in('patient_type', ['IPD', 'IPD (Inpatient)', 'Emergency']) // Only show IPD and Emergency patients, exclude OPD
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply hospital filter if hospitalConfig exists
      if (hospitalConfig?.name) {
        query = query.eq('patients.hospital_name', hospitalConfig.name);
        console.log('🏥 DischargedPatients: Applied hospital filter for:', hospitalConfig.name);
      }

      // Apply filters
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Patient type filter - since we already filter to IPD & Emergency, only apply if user wants specific type
      if (patientTypeFilter && patientTypeFilter !== 'all') {
        query = query.eq('patient_type', patientTypeFilter);
        console.log('🏥 DischargedPatients: Applied additional patient type filter for:', patientTypeFilter);
      }

      if (billingStatusFilter && billingStatusFilter !== 'all') {
        query = query.eq('billing_status', billingStatusFilter);
      }

      // Corporate filter
      if (corporateFilter && corporateFilter !== 'all') {
        query = query.eq('patients.corporate', corporateFilter);
        console.log('🏥 DischargedPatients: Applied corporate filter for:', corporateFilter);
      }

      // Date range filter moved to client-side to preserve original Sr. No
      // Skip database search for now - we'll filter client-side
      // This avoids all PostgREST parsing issues
      // TODO: Fix database search later

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching discharged patients:', error);
        throw error;
      }

      // Process data to extract discharge summary status
      const processedData = data?.map((visit: any) => {
        // Get the latest discharge summary status
        const dischargeSummary = Array.isArray(visit.ipd_discharge_summary)
          ? visit.ipd_discharge_summary[0]
          : visit.ipd_discharge_summary;

        return {
          ...visit,
          discharge_summary_status: dischargeSummary?.status || null,
          // Remove the nested discharge summary object to keep the data structure clean
          ipd_discharge_summary: undefined
        };
      });

      console.log(`🏥 Found ${processedData?.length || 0} discharged patients (IPD, IPD (Inpatient) & Emergency) for hospital:`, hospitalConfig?.name);
      return processedData as Visit[];
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  // Apply client-side filtering to avoid PostgREST parsing issues
  // Step 1: First filter only by discharged status to get FULL list
  const dischargedVisits = visits?.filter(visit =>
    visit.status?.toLowerCase() === 'discharged'
  ) || [];

  // Step 2: Assign original Sr. No based on position in FULL sorted list
  const visitsWithOriginalSrNo = dischargedVisits.map((visit, index) => ({
    ...visit,
    originalSrNo: sortOrder === 'desc'
      ? dischargedVisits.length - index
      : index + 1
  }));

  // Step 3: Apply date filter (AFTER assigning originalSrNo to preserve original position)
  const dateFilteredVisits = visitsWithOriginalSrNo.filter(visit => {
    if (!fromDate && !toDate) return true;
    const dischargeDate = visit.discharge_date ? new Date(visit.discharge_date) : null;
    if (!dischargeDate) return false;

    if (fromDate && dischargeDate < new Date(fromDate)) return false;
    if (toDate && dischargeDate > new Date(toDate + 'T23:59:59')) return false;
    return true;
  });

  // Step 4: Apply search filter (preserving originalSrNo)
  const filteredVisits = dateFilteredVisits.filter(visit => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      visit.visit_id?.toLowerCase().includes(searchLower) ||
      visit.patients?.patients_id?.toLowerCase().includes(searchLower) ||
      visit.patients?.name?.toLowerCase().includes(searchLower) ||
      visit.patients?.phone?.toLowerCase().includes(searchLower) ||
      visit.patients?.insurance_person_no?.toLowerCase().includes(searchLower)
    );
  });

  // Pagination calculations
  const totalCount = filteredVisits.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVisits = filteredVisits.slice(startIndex, endIndex);

  // Pagination helper functions
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, patientTypeFilter, billingStatusFilter, corporateFilter, sortBy, sortOrder]);

  // Fetch DOA payments for referral report (with dates for detailed display)
  useEffect(() => {
    const fetchDoaPayments = async () => {
      if (!filteredVisits || filteredVisits.length === 0) {
        setDoaPayments({});
        return;
      }

      const visitUuids = filteredVisits.map(v => v.id).filter(Boolean) as string[];
      if (visitUuids.length === 0) {
        setDoaPayments({});
        return;
      }

      try {
        const { data: doaData, error: doaError } = await supabase
          .from('referee_doa_payments')
          .select('visit_id, amount, payment_date, notes, referral_payment_status')
          .in('visit_id', visitUuids)
          .order('payment_date', { ascending: false });

        if (doaError) {
          console.error('Error fetching DOA payments:', doaError);
          return;
        }

        // Group payments by visit_id
        const doaByVisit: Record<string, Array<{ amount: number; payment_date: string; notes: string | null; referral_payment_status: string | null }>> = {};
        (doaData as Array<{ visit_id: string; amount: number; payment_date: string; notes: string | null; referral_payment_status: string | null }> || []).forEach(payment => {
          if (!doaByVisit[payment.visit_id]) {
            doaByVisit[payment.visit_id] = [];
          }
          doaByVisit[payment.visit_id].push({
            amount: Number(payment.amount),
            payment_date: payment.payment_date,
            notes: payment.notes,
            referral_payment_status: payment.referral_payment_status
          });
        });

        setDoaPayments(doaByVisit);
      } catch (err) {
        console.error('Error in DOA payments fetch:', err);
      }
    };

    fetchDoaPayments();
  }, [filteredVisits]);

  // Undischarge mutation
  const undischargeMutation = useMutation({
    mutationFn: async (visitId: string) => {
      const { error } = await supabase
        .from('visits')
        .update({
          discharge_date: null,
          status: 'admitted'
        })
        .eq('id', visitId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Refresh both dashboards
      queryClient.invalidateQueries({ queryKey: ['discharged-patients'] });
      queryClient.invalidateQueries({ queryKey: ['currently-admitted-patients'] });

      // Show success message
      toast({
        title: "Patient Undischarged",
        description: "Patient has been moved back to Currently Admitted dashboard",
      });

      // Close dialog
      setIsUndischargeDialogOpen(false);
      setSelectedVisitForUndischarge(null);
    },
    onError: (error) => {
      console.error('Error undischarging patient:', error);
      toast({
        title: "Error",
        description: "Failed to undischarge patient. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle undischarge button click
  const handleUndischargeClick = (visit: Visit) => {
    setSelectedVisitForUndischarge(visit);
    setIsUndischargeDialogOpen(true);
  };

  // Handle confirm undischarge
  const handleConfirmUndischarge = () => {
    if (selectedVisitForUndischarge) {
      undischargeMutation.mutate(selectedVisitForUndischarge.id);
    }
  };

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format datetime helper
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate days between admission and discharge
  const calculateDaysAdmitted = (admissionDate: string | null, dischargeDate: string | null) => {
    if (!admissionDate || !dischargeDate) return 'N/A';

    const admission = new Date(admissionDate);
    const discharge = new Date(dischargeDate);
    const diffTime = Math.abs(discharge.getTime() - admission.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'discharged':
        return 'success';
      case 'pending':
      case 'in_progress':
        return 'warning';
      case 'cancelled':
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Get billing status badge variant
  const getBillingStatusBadgeVariant = (billingStatus: string | null) => {
    switch (billingStatus?.toLowerCase()) {
      case 'bill completed':
      case 'bill submitted':
        return 'success';
      case 'bill not submitted':
      case 'id pending':
        return 'warning';
      case 'approval pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Helper to extract short form from corporate name (e.g., "Ayushman Bharat (PM-JAY)" -> "PM-JAY")
  const getCorporateShortForm = (corporate: string | null) => {
    if (!corporate) return '-';
    // Look for text in parentheses
    const match = corporate.match(/\(([^)]+)\)/);
    if (match) return match[1];
    // If no parentheses, return the original (might already be short like "ECHS")
    return corporate;
  };

  // Open Referral Report Preview Modal
  const handleOpenReferralReport = () => {
    setIsReferralReportOpen(true);
  };

  // Print Referral Report
  const handlePrintReferralReport = () => {
    const printContent = document.getElementById('referral-report-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Referral Amount Summary - ${format(new Date(), 'dd MMM yyyy')}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  padding: 20px;
                  font-size: 12px;
                  margin: 0;
                }
                h1 { text-align: center; margin-bottom: 5px; font-size: 18px; }
                .subtitle { text-align: center; color: #666; margin-bottom: 15px; font-size: 11px; }
                .header-info {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 15px;
                  padding: 8px;
                  background: #f5f5f5;
                  font-size: 10px;
                }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #000; padding: 6px; text-align: left; font-size: 10px; }
                th { background-color: #f0f0f0; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .text-right { text-align: right; }
                @media print {
                  body { margin: 0; }
                  @page { margin: 0.5in; size: A4 landscape; }
                }
              </style>
            </head>
            <body>
              <h1>Referral Amount Summary</h1>
              <p class="subtitle">Discharged Patients - Referral Details</p>
              <div class="header-info">
                <span><strong>Print Date:</strong> ${format(new Date(), 'dd MMM yyyy, hh:mm a')}</span>
                <span><strong>Total Records:</strong> ${filteredVisits.length}</span>
              </div>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  // Filter for unpaid referral visits (excludes DIRECT referrals and patients with paid status)
  const unpaidReferralVisits = filteredVisits.filter(visit => {
    // Exclude DIRECT referrals
    const refereeName = visit.referees?.name?.toUpperCase();
    const rmName = visit.relationship_managers?.name?.toUpperCase();
    if (refereeName === 'DIRECT' || rmName === 'DIRECT') {
      return false;
    }

    // Check if any payment has "Spot paid" or "Backing paid" status
    const visitPayments = doaPayments[visit.id] || [];
    const hasPaidStatus = visitPayments.some(
      payment => payment.referral_payment_status === 'Spot paid' ||
                 payment.referral_payment_status === 'Backing paid'
    );
    if (hasPaidStatus) {
      return false;
    }

    // Original condition - only show truly unpaid visits
    return (!visit.referral_payment_status || visit.referral_payment_status === 'Unpaid') &&
           visitPayments.length === 0;
  });

  // Filter for referral report (excludes DIRECT referrals)
  const referralReportVisits = filteredVisits.filter(visit => {
    const refereeName = visit.referees?.name?.toUpperCase();
    const rmName = visit.relationship_managers?.name?.toUpperCase();
    // Exclude DIRECT referrals
    if (refereeName === 'DIRECT' || rmName === 'DIRECT') {
      return false;
    }
    return true;
  });

  // Open Unpaid Referral Report Modal
  const handleOpenUnpaidReport = () => {
    setIsUnpaidReportOpen(true);
  };

  // Print Unpaid Referral Report
  const handlePrintUnpaidReport = () => {
    const printContent = document.getElementById('unpaid-report-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Unpaid Referral Amount Summary - ${format(new Date(), 'dd MMM yyyy')}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  padding: 20px;
                  font-size: 12px;
                  margin: 0;
                }
                h1 { text-align: center; margin-bottom: 5px; font-size: 18px; }
                .subtitle { text-align: center; color: #666; margin-bottom: 15px; font-size: 11px; }
                .header-info {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 15px;
                  padding: 8px;
                  background: #f5f5f5;
                  font-size: 10px;
                }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #000; padding: 6px; text-align: left; font-size: 10px; }
                th { background-color: #f0f0f0; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .text-right { text-align: right; }
                @media print {
                  body { margin: 0; }
                  @page { margin: 0.5in; size: A4 landscape; }
                }
              </style>
            </head>
            <body>
              <h1>Unpaid Referral Amount Summary</h1>
              <p class="subtitle">Discharged Patients - Unpaid Referral Details</p>
              <div class="header-info">
                <span><strong>Print Date:</strong> ${format(new Date(), 'dd MMM yyyy, hh:mm a')}</span>
                <span><strong>Total Unpaid:</strong> ${unpaidReferralVisits.length}</span>
              </div>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  // Print Dashboard function
  const handlePrintDashboard = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Discharged Patients Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
              h1 { text-align: center; margin-bottom: 5px; }
              .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
              .header-info { display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px; background: #f5f5f5; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #000; padding: 8px; text-align: left; }
              th { background-color: #f0f0f0; color: #000; font-weight: bold; font-size: 13px; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .text-center { text-align: center; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>Discharged Patients Report</h1>
            <p class="subtitle">IPD & Emergency Patients</p>
            <div class="header-info">
              <span><strong>Print Date:</strong> ${format(new Date(), 'dd MMM yyyy, hh:mm a')}</span>
              <span><strong>Total Patients:</strong> ${filteredVisits?.length || 0}</span>
              ${fromDate || toDate ? `<span><strong>Date Filter:</strong> ${fromDate || 'Start'} to ${toDate || 'End'}</span>` : ''}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Discharged Sr. No</th>
                  <th>Patient Name</th>
                  <th>Patient ID</th>
                  <th>Visit ID</th>
                  <th>Admission Date</th>
                  <th>Discharge Date</th>
                  <th>Days</th>
                  <th>Billing Status</th>
                  <th>Corporate</th>
                </tr>
              </thead>
              <tbody>
                ${filteredVisits?.map((visit, index) => `
                  <tr>
                    <td class="text-center">${visit.discharged_sr_no || '-'}</td>
                    <td>${visit.patients?.name || '-'}</td>
                    <td>${visit.patients?.patients_id || '-'}</td>
                    <td>${visit.visit_id || '-'}</td>
                    <td>${visit.admission_date ? format(new Date(visit.admission_date), 'dd MMM yyyy') : '-'}</td>
                    <td>${visit.discharge_date ? format(new Date(visit.discharge_date), 'dd MMM yyyy') : '-'}</td>
                    <td class="text-center">${calculateDaysAdmitted(visit.admission_date, visit.discharge_date)}</td>
                    <td>${visit.billing_status || '-'}</td>
                    <td>${getCorporateShortForm(visit.patients?.corporate)}</td>
                  </tr>
                `).join('') || '<tr><td colspan="9" class="text-center">No data</td></tr>'}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Parse PDF file and extract Sr. No. and Visit ID
  const parsePdfFile = async (file: File): Promise<Array<{visit_id: string, discharged_sr_no: string}>> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let allText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Extract text with position info to maintain table structure
      const items = textContent.items as any[];

      // Sort by Y position (top to bottom) then X position (left to right)
      items.sort((a, b) => {
        const yDiff = b.transform[5] - a.transform[5]; // Y is inverted in PDF
        if (Math.abs(yDiff) > 5) return yDiff;
        return a.transform[4] - b.transform[4]; // X position
      });

      // Join text items with spaces
      const pageText = items.map((item: any) => item.str).join(' ');
      allText += pageText + '\n';
    }

    // Debug: Log extracted text to console
    console.log('📄 PDF Text Extracted:', allText.substring(0, 3000));

    const results: Array<{visit_id: string, discharged_sr_no: string}> = [];

    // Visit ID pattern: IH + 2 digits (year) + 1 letter + 5 digits
    // Examples: IH25L26030, IH25K16003, IH25J01004, IH24L19001, IH25I30003
    const visitIdPattern = /IH\d{2}[A-Z]\d{5}/g;

    // Find all Visit IDs in the text
    const visitIdMatches = allText.match(visitIdPattern) || [];
    console.log('🔍 Found Visit IDs:', visitIdMatches.length, visitIdMatches.slice(0, 10));

    // Split text into tokens for analysis
    const tokens = allText.split(/\s+/);
    console.log('📝 Total tokens:', tokens.length);

    for (let i = 0; i < tokens.length; i++) {
      // Check if this token is a Visit ID
      if (/^IH\d{2}[A-Z]\d{5}$/.test(tokens[i])) {
        const visitId = tokens[i];

        // Look backwards for Sr. No. (should be within 20 tokens before)
        for (let j = i - 1; j >= Math.max(0, i - 20); j--) {
          const token = tokens[j];

          // Sr. No. is 1-4 digit number (like 380, 379, 267, etc.)
          if (/^\d{1,4}$/.test(token)) {
            const srNo = parseInt(token);

            // Valid Sr. No. range and not a date component
            if (srNo >= 1 && srNo <= 9999) {
              // Skip if it looks like a day of month (followed by month name)
              const nextToken = tokens[j + 1] || '';
              const isDateDay = srNo <= 31 && /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(nextToken);

              // Skip if it looks like a year (2024, 2025, etc.)
              const isYear = srNo >= 2020 && srNo <= 2030;

              if (!isDateDay && !isYear) {
                results.push({
                  discharged_sr_no: token,
                  visit_id: visitId
                });
                console.log(`✅ Matched: Sr.No=${token}, Visit ID=${visitId}`);
                break;
              }
            }
          }
        }
      }
    }

    // Remove duplicates (keep first occurrence of each visit_id)
    const uniqueResults = results.filter((item, index, self) =>
      index === self.findIndex(t => t.visit_id === item.visit_id)
    );

    console.log('📊 Total unique records found:', uniqueResults.length);
    return uniqueResults;
  };

  // Handle file upload (Excel or PDF)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    try {
      if (fileExtension === 'pdf') {
        // Handle PDF
        toast({ title: "Processing PDF...", description: "Please wait" });
        const data = await parsePdfFile(file);

        if (data.length === 0) {
          toast({
            title: "No Data Found",
            description: "Could not extract Sr. No. and Visit ID from PDF. Please check the format.",
            variant: "destructive",
          });
          return;
        }

        setUploadPreviewData(data);
        toast({
          title: "PDF Loaded",
          description: `Found ${data.length} records to update`,
        });
      } else {
        // Handle Excel/CSV
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json<{visit_id: string, discharged_sr_no: string | number}>(worksheet);

            // Convert to proper format
            const formattedData = jsonData.map(row => ({
              visit_id: String(row.visit_id || '').trim(),
              discharged_sr_no: String(row.discharged_sr_no || '').trim()
            })).filter(row => row.visit_id && row.discharged_sr_no);

            setUploadPreviewData(formattedData);
            toast({
              title: "File Loaded",
              description: `Found ${formattedData.length} records to update`,
            });
          } catch (err) {
            toast({
              title: "Error",
              description: "Failed to read Excel file. Please check the format.",
              variant: "destructive",
            });
          }
        };
        reader.readAsBinaryString(file);
      }
    } catch (err) {
      console.error('File upload error:', err);
      toast({
        title: "Error",
        description: "Failed to read file. Please check the format.",
        variant: "destructive",
      });
    }
  };

  // Apply uploaded Sr. No. to database
  const applyUploadedSrNo = async () => {
    if (uploadPreviewData.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const row of uploadPreviewData) {
        const { error } = await supabase
          .from('visits')
          .update({ discharged_sr_no: row.discharged_sr_no })
          .eq('visit_id', row.visit_id);

        if (error) {
          errorCount++;
          console.error(`Failed to update ${row.visit_id}:`, error);
        } else {
          successCount++;
        }
      }

      toast({
        title: "Update Complete",
        description: `Successfully updated ${successCount} records. ${errorCount > 0 ? `Failed: ${errorCount}` : ''}`,
        variant: errorCount > 0 ? "destructive" : "default",
      });

      // Reset and refresh
      setUploadPreviewData([]);
      setIsUploadModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['discharged-visits'] });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update records",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };


  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Error loading discharged patients: {error.message}</span>
            </div>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Discharged Patients</h1>
            <p className="text-muted-foreground">
              View and manage all discharged inpatients (IPD & Emergency)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrintDashboard}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          {/* Only show referral-related buttons for marketing managers */}
          {isMarketingManager && (
            <>
              <Button
                onClick={handleOpenReferralReport}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Referral Report
              </Button>
              <Button
                onClick={handleOpenUnpaidReport}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
              >
                <FileText className="h-4 w-4" />
                Unpaid Referral
              </Button>
            </>
          )}
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {filteredVisits?.length || 0} patients
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-base">Filters & Search</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by Visit ID, Patient ID, Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="discharged">Discharged</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Patient Type Filter */}
            <Select value={patientTypeFilter} onValueChange={setPatientTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Patient Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All (IPD & Emergency)</SelectItem>
                <SelectItem value="IPD">IPD Only</SelectItem>
                <SelectItem value="IPD (Inpatient)">IPD (Inpatient) Only</SelectItem>
                <SelectItem value="Emergency">Emergency Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Billing Status Filter */}
            <Select value={billingStatusFilter} onValueChange={setBillingStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Billing Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Billing Status</SelectItem>
                <SelectItem value="Bill Completed">Bill Completed</SelectItem>
                <SelectItem value="Bill Submitted">Bill Submitted</SelectItem>
                <SelectItem value="Bill Not Submitted">Bill Not Submitted</SelectItem>
                <SelectItem value="ID Pending">ID Pending</SelectItem>
                <SelectItem value="Approval Pending">Approval Pending</SelectItem>
              </SelectContent>
            </Select>

            {/* Corporate Filter */}
            <Select value={corporateFilter} onValueChange={setCorporateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Corporates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Corporates</SelectItem>
                {corporatesLoading ? (
                  <SelectItem value="loading" disabled>Loading corporates...</SelectItem>
                ) : availableCorporates && availableCorporates.length > 0 ? (
                  availableCorporates.map((corporate) => (
                    <SelectItem key={corporate.id} value={corporate.name}>
                      {corporate.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No corporates found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range & Sort Options - Single Row */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Date Range Filter */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">From:</span>
                <EnhancedDatePicker
                  value={fromDate ? new Date(fromDate) : undefined}
                  onChange={(date) => setFromDate(date ? format(date, 'yyyy-MM-dd') : '')}
                  placeholder="From Date"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">To:</span>
                <EnhancedDatePicker
                  value={toDate ? new Date(toDate) : undefined}
                  onChange={(date) => setToDate(date ? format(date, 'yyyy-MM-dd') : '')}
                  placeholder="To Date"
                />
              </div>
              {(fromDate || toDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateParams({ from: null, to: null, page: '1' })}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear Dates
                </Button>
              )}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discharged_sr_no">Discharged Sr. No</SelectItem>
                  <SelectItem value="discharge_date">Discharge Date</SelectItem>
                  <SelectItem value="visit_date">Visit Date</SelectItem>
                  <SelectItem value="patients.name">Patient Name</SelectItem>
                  <SelectItem value="billing_status">Billing Status</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Discharged Patients List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading discharged patients...</span>
            </div>
          ) : filteredVisits?.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No discharged patients found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || patientTypeFilter !== 'all' || billingStatusFilter !== 'all' || corporateFilter !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'No discharged inpatients (IPD/Emergency) found.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Discharged Sr. No</TableHead>
                    <TableHead>Patient Details</TableHead>
                    <TableHead>Visit Info</TableHead>
                    <TableHead>Admission Date</TableHead>
                    <TableHead>Discharge Date</TableHead>
                    <TableHead>Days Admitted</TableHead>
                    <TableHead>Billing Status</TableHead>
                    <TableHead>Corporate</TableHead>
                    {/* Only show referral-related columns for marketing managers */}
                    {isMarketingManager && <TableHead>Referral Doctor/Relationship Manager</TableHead>}
                    {isMarketingManager && <TableHead>Discharge Amt Paid</TableHead>}
                    {isMarketingManager && <TableHead>Referral Payment</TableHead>}
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedVisits.map((visit, index) => (
                    <TableRow key={visit.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-center">
                        {visit.discharged_sr_no || '-'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {visit.patients?.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {visit.patients?.patients_id}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {visit.patients?.age}Y, {visit.patients?.gender}
                          </div>
                          {visit.patients?.phone && (
                            <div className="text-sm text-muted-foreground">
                              📱 {visit.patients.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {visit.visit_id}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Visit: {formatDate(visit.visit_date)}
                          </div>
                          {visit.patient_type && (
                            <Badge variant="outline" className="text-xs">
                              {visit.patient_type}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-700">
                            {visit.admission_date ? formatDateTime(visit.admission_date) : 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-700">
                            {formatDateTime(visit.discharge_date)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-purple-700">
                            {calculateDaysAdmitted(visit.admission_date, visit.discharge_date)}
                            {calculateDaysAdmitted(visit.admission_date, visit.discharge_date) !== 'N/A' && (
                              <span className="text-sm text-muted-foreground ml-1">
                                {calculateDaysAdmitted(visit.admission_date, visit.discharge_date) === 1 ? 'day' : 'days'}
                              </span>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <CascadingBillingStatusDropdown
                          visit={visit}
                          queryKey={['discharged-patients']}
                          onUpdate={() => refetch()}
                        />
                      </TableCell>
                      <TableCell>
                        {visit.patients?.corporate || '—'}
                      </TableCell>
                      {/* Only show referral-related cells for marketing managers */}
                      {isMarketingManager && (
                        <TableCell>
                          <div>{visit.referees?.name || '—'}</div>
                          {visit.relationship_managers?.name && (
                            <div>{visit.relationship_managers.name}</div>
                          )}
                        </TableCell>
                      )}
                      {isMarketingManager && (
                        <TableCell>
                          <RefereeAmountCell visit={visit} onUpdate={() => refetch()} isAdmin={user?.role === 'admin' || user?.role === 'marketing_manager'} />
                        </TableCell>
                      )}
                      {isMarketingManager && (
                        <TableCell>
                          <ReferralPaymentStatusCell visit={visit} />
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedVisitForGatePass(visit);
                              setIsGatePassModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Gate Pass
                          </Button>
                          {user?.role === 'admin' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUndischargeClick(visit)}
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              disabled={undischargeMutation.isPending}
                            >
                              {undischargeMutation.isPending && selectedVisitForUndischarge?.id === visit.id ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <RotateCcw className="h-4 w-4 mr-1" />
                              )}
                              Revoke Discharge
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Showing {startIndex + 1} to {Math.min(endIndex, totalCount)} of {totalCount} patients</span>
                    <span className="text-gray-400">|</span>
                    <span>Page {currentPage} of {totalPages}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={goToFirstPage} disabled={currentPage === 1}>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {getPageNumbers().map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    ))}
                    <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToLastPage} disabled={currentPage === totalPages}>
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Undischarge Confirmation Dialog */}
      <AlertDialog open={isUndischargeDialogOpen} onOpenChange={setIsUndischargeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Discharge?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3 mt-4">
                <p>You are about to move this patient back to the Currently Admitted dashboard:</p>

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Patient:</span>
                    <span>{selectedVisitForUndischarge?.patients?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Visit ID:</span>
                    <span>{selectedVisitForUndischarge?.visit_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Discharge Date:</span>
                    <span>{selectedVisitForUndischarge?.discharge_date && formatDateTime(selectedVisitForUndischarge.discharge_date)}</span>
                  </div>
                </div>

                <p className="text-orange-600 font-medium">
                  ⚠️ This will:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Remove the patient from Discharged Patients</li>
                  <li>Move the patient to Currently Admitted</li>
                  <li>Mark their bed as occupied again</li>
                  <li>Set discharge date to NULL</li>
                </ul>

                <p className="text-sm text-muted-foreground">
                  Are you sure you want to proceed?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedVisitForUndischarge(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUndischarge}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={undischargeMutation.isPending}
            >
              {undischargeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Revoke Discharge'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Gate Pass Modal */}
      <Dialog open={isGatePassModalOpen} onOpenChange={(open) => {
        setIsGatePassModalOpen(open);
        if (!open) setSelectedVisitForGatePass(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gate Pass - {selectedVisitForGatePass?.patients?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Visit ID:</span>
                <span>{selectedVisitForGatePass?.visit_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Patient ID:</span>
                <span>{selectedVisitForGatePass?.patients?.insurance_person_no || selectedVisitForGatePass?.patients?.patients_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Discharge Date:</span>
                <span>{selectedVisitForGatePass?.discharge_date && formatDateTime(selectedVisitForGatePass.discharge_date)}</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Notifications</h4>
              {notificationsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : gatePassNotifications && gatePassNotifications.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reason</TableHead>
                      <TableHead>Pending Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gatePassNotifications.map((notification: any) => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          {notification.reason === 'Other' ? notification.custom_reason : notification.reason}
                        </TableCell>
                        <TableCell>₹{notification.pending_amount || 0}</TableCell>
                        <TableCell>
                          <Badge variant={notification.resolved ? "default" : "destructive"}>
                            {notification.resolved ? "Resolved" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {notification.resolved ? (
                            <span className="text-green-600 text-sm">✓ Done</span>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markResolvedMutation.mutate(notification.id)}
                              disabled={markResolvedMutation.isPending}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              {markResolvedMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Mark Resolved'
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm py-4 text-center">No notifications found for this patient.</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              {gatePassNotifications && gatePassNotifications.length > 0 && !gatePassNotifications.every((n: any) => n.resolved) && (
                <p className="text-sm text-orange-600">⚠️ Resolve all notifications to enable printing</p>
              )}
              {(!gatePassNotifications || gatePassNotifications.length === 0 || gatePassNotifications.every((n: any) => n.resolved)) && (
                <div></div>
              )}
              <Button
                onClick={handlePrintGatePass}
                disabled={gatePassNotifications && gatePassNotifications.length > 0 && !gatePassNotifications.every((n: any) => n.resolved)}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Print Gate Pass
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Referral Report Preview Modal */}
      <Dialog open={isReferralReportOpen} onOpenChange={setIsReferralReportOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Referral Amount Summary</DialogTitle>
          </DialogHeader>

          <div id="referral-report-content">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date of Admission</TableHead>
                  <TableHead>Visit ID</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Referral Doctor/Relationship Manager</TableHead>
                  <TableHead>Referee DOA Amt Paid</TableHead>
                  <TableHead>Total Amount Paid</TableHead>
                  <TableHead>Payment Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referralReportVisits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell>{visit.admission_date || '-'}</TableCell>
                    <TableCell>{visit.visit_id || '-'}</TableCell>
                    <TableCell>{visit.patients?.name || '-'}</TableCell>
                    <TableCell>
                      <div>{visit.referees?.name || '-'}</div>
                      {visit.relationship_managers?.name && (
                        <div>{visit.relationship_managers.name}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {doaPayments[visit.id]?.length > 0 ? (
                        <div className="space-y-1">
                          {doaPayments[visit.id].map((payment, idx) => (
                            <div key={idx} className="text-sm">
                              ₹{payment.amount.toLocaleString()} ({format(new Date(payment.payment_date), 'dd MMM')})
                            </div>
                          ))}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {doaPayments[visit.id]?.length > 0
                        ? `₹${doaPayments[visit.id].reduce((sum, p) => sum + p.amount, 0).toLocaleString()}`
                        : '-'}
                    </TableCell>
                    <TableCell>{doaPayments[visit.id]?.[0]?.referral_payment_status || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              Total: {referralReportVisits.length} records
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsReferralReportOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePrintReferralReport} className="bg-blue-600 hover:bg-blue-700">
                <Printer className="mr-2 h-4 w-4" />
                Print Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unpaid Referral Report Modal */}
      <Dialog open={isUnpaidReportOpen} onOpenChange={setIsUnpaidReportOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-red-600">Unpaid Referral Amount Summary</DialogTitle>
          </DialogHeader>

          <div id="unpaid-report-content">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date of Admission</TableHead>
                  <TableHead>Visit ID</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Referral Doctor/Relationship Manager</TableHead>
                  <TableHead>Referee DOA Amt Paid</TableHead>
                  <TableHead>Total Amount Paid</TableHead>
                  <TableHead>Payment Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unpaidReferralVisits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell>{visit.admission_date || '-'}</TableCell>
                    <TableCell>{visit.visit_id || '-'}</TableCell>
                    <TableCell>{visit.patients?.name || '-'}</TableCell>
                    <TableCell>
                      <div>{visit.referees?.name || '-'}</div>
                      {visit.relationship_managers?.name && (
                        <div>{visit.relationship_managers.name}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {doaPayments[visit.id]?.length > 0 ? (
                        <div className="space-y-1">
                          {doaPayments[visit.id].map((payment, idx) => (
                            <div key={idx} className="text-sm">
                              ₹{payment.amount.toLocaleString()} ({format(new Date(payment.payment_date), 'dd MMM')})
                            </div>
                          ))}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {doaPayments[visit.id]?.length > 0
                        ? `₹${doaPayments[visit.id].reduce((sum, p) => sum + p.amount, 0).toLocaleString()}`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-red-600 font-medium">{doaPayments[visit.id]?.[0]?.referral_payment_status || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              Total Unpaid: {unpaidReferralVisits.length} records
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsUnpaidReportOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePrintUnpaidReport} className="bg-red-600 hover:bg-red-700">
                <Printer className="mr-2 h-4 w-4" />
                Print Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DischargedPatients;
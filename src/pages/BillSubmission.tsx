import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Receipt, Pencil, Trash2, Search, User, Loader2, Download, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import BillSubmissionForm, { BillSubmission, PatientData } from '@/components/BillSubmissionForm';
import {
  useBillSubmissions,
  useCreateBillSubmission,
  useUpdateBillSubmission,
  useDeleteBillSubmission,
} from '@/hooks/useBillSubmissions';
import * as XLSX from 'xlsx';

const BillSubmissionPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editData, setEditData] = useState<BillSubmission | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [corporateFilter, setCorporateFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Fetch bill submissions from Supabase
  const { data: submissions = [], isLoading } = useBillSubmissions();

  // Get unique corporate values for filter dropdown
  const uniqueCorporates = useMemo(() => {
    const corporates = submissions
      .map((s: any) => s.patient_corporate)
      .filter((c: string) => c && c.trim() !== '');
    return [...new Set(corporates)].sort();
  }, [submissions]);

  // Filter submissions based on filters
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission: any) => {
      // Corporate filter
      if (corporateFilter !== 'all' && submission.patient_corporate !== corporateFilter) {
        return false;
      }

      // Date filter
      if (dateFrom && submission.date_of_submission) {
        if (submission.date_of_submission < dateFrom) {
          return false;
        }
      }
      if (dateTo && submission.date_of_submission) {
        if (submission.date_of_submission > dateTo) {
          return false;
        }
      }

      return true;
    });
  }, [submissions, corporateFilter, dateFrom, dateTo]);

  // Export to Excel function
  const handleExportExcel = () => {
    const exportData = filteredSubmissions.map((s: any) => ({
      'Visit ID': s.visit_id,
      'Patient Name': s.patient_name,
      'Corporate': s.patient_corporate || '-',
      'Bill Amount': s.bill_amount || 0,
      'Submitted By': s.executive_who_submitted || '-',
      'Submission Date': s.date_of_submission || '-',
      'Expected Payment Date': s.expected_payment_date || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bill Submissions');
    XLSX.writeFile(wb, `Bill_Submissions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setCorporateFilter('all');
    setDateFrom('');
    setDateTo('');
  };
  const createMutation = useCreateBillSubmission();
  const updateMutation = useUpdateBillSubmission();
  const deleteMutation = useDeleteBillSubmission();

  // Search visits from database with patient info
  const { data: visits = [], isLoading: isSearching } = useQuery({
    queryKey: ['visits-search', searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          id,
          visit_id,
          patients!inner(
            id,
            name,
            corporate
          )
        `)
        .ilike('patients.name', `%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: searchTerm.length >= 2,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePatientSelect = (visit: any) => {
    setSelectedPatient({
      visitId: visit.visit_id || '',
      patientName: visit.patients?.name || '',
      corporate: visit.patients?.corporate || '',
    });
    setEditData(null);
    setIsFormOpen(true);
    setShowDropdown(false);
    setSearchTerm('');
  };

  const handleEdit = (submission: any) => {
    setSelectedPatient(null);
    // Map database fields to form fields
    setEditData({
      id: submission.id,
      visitId: submission.visit_id,
      patientName: submission.patient_name,
      corporate: submission.corporate || '',
      billAmount: submission.bill_amount || 0,
      submittedBy: submission.executive_who_submitted || '',
      submissionDate: submission.date_of_submission || '',
      expectedPaymentDate: submission.expected_payment_date || '',
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSave = (data: BillSubmission) => {
    // Map form fields to database fields (patient_name comes via join, not stored)
    const dbData = {
      visit_id: data.visitId,
      corporate: data.corporate,
      bill_amount: data.billAmount,
      executive_who_submitted: data.submittedBy,
      date_of_submission: data.submissionDate,
      expected_payment_date: data.expectedPaymentDate,
    };

    if (editData) {
      updateMutation.mutate({ id: data.id, ...dbData });
    } else {
      createMutation.mutate(dbData);
    }
    setSelectedPatient(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedPatient(null);
    setEditData(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Receipt className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">Bill Submission</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bill Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Patient Search */}
          <div className="relative mb-4" ref={searchRef}>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search patient by name to add bill submission..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(e.target.value.length >= 2);
                }}
                onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
                className="max-w-md"
              />
            </div>

            {/* Search Results Dropdown */}
            {showDropdown && (
              <div className="absolute z-50 mt-1 w-full max-w-md bg-white border rounded-md shadow-lg">
                {isSearching ? (
                  <div className="p-3 text-center text-gray-500">Searching...</div>
                ) : visits.length === 0 ? (
                  <div className="p-3 text-center text-gray-500">No visits found</div>
                ) : (
                  <ul className="max-h-60 overflow-auto">
                    {visits.map((visit) => (
                      <li
                        key={visit.id}
                        className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                        onClick={() => handlePatientSelect(visit)}
                      >
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium">{visit.patients?.name}</div>
                            <div className="text-sm text-gray-500">
                              Visit ID: {visit.visit_id || 'N/A'} | Corporate: {visit.patients?.corporate || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Filters Section */}
          <div className="flex flex-wrap items-end gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Corporate</Label>
              <Select value={corporateFilter} onValueChange={setCorporateFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Corporates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Corporates</SelectItem>
                  {uniqueCorporates.map((corporate: string) => (
                    <SelectItem key={corporate} value={corporate}>
                      {corporate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[150px]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[150px]"
              />
            </div>

            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear Filters
            </Button>

            <div className="ml-auto">
              <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visit ID</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Corporate</TableHead>
                  <TableHead className="text-right">Bill Amount</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Submission Date</TableHead>
                  <TableHead>Expect to Receive Payment</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {submissions.length === 0
                        ? 'No bill submissions yet. Search for a patient above to create one.'
                        : 'No records match the selected filters.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((submission: any) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">{submission.visit_id}</TableCell>
                      <TableCell>{submission.patient_name}</TableCell>
                      <TableCell>{submission.patient_corporate || '-'}</TableCell>
                      <TableCell className="text-right">{formatAmount(submission.bill_amount)}</TableCell>
                      <TableCell>{submission.executive_who_submitted || '-'}</TableCell>
                      <TableCell>{formatDate(submission.date_of_submission)}</TableCell>
                      <TableCell>{formatDate(submission.expected_payment_date)}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(submission)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {submissions.length > 0 && (
            <div className="mt-4 text-sm text-gray-500">
              Showing {filteredSubmissions.length} of {submissions.length} records
            </div>
          )}
        </CardContent>
      </Card>

      <BillSubmissionForm
        open={isFormOpen}
        onClose={handleFormClose}
        onSave={handleSave}
        editData={editData}
        prefilledPatient={selectedPatient}
      />
    </div>
  );
};

export default BillSubmissionPage;

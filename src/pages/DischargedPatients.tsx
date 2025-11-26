import React, { useState } from 'react';
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
import { Loader2, Search, Users, Calendar, Clock, UserCheck, Shield, AlertTriangle, Filter, RotateCcw } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { toast } from "@/hooks/use-toast";
import { CascadingBillingStatusDropdown } from '@/components/shared/CascadingBillingStatusDropdown';

interface Visit {
  id: string;
  visit_id: string;
  visit_date: string;
  admission_date: string | null;
  discharge_date: string | null;
  surgery_date: string | null;
  sr_no: string | null;
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

const DischargedPatients = () => {
  const navigate = useNavigate();
  const { user, hospitalConfig } = useAuth();
  const queryClient = useQueryClient();

  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [patientTypeFilter, setPatientTypeFilter] = useState<string>('all');
  const [billingStatusFilter, setBillingStatusFilter] = useState<string>('all');
  const [corporateFilter, setCorporateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('discharge_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // State for undischarge functionality
  const [isUndischargeDialogOpen, setIsUndischargeDialogOpen] = useState(false);
  const [selectedVisitForUndischarge, setSelectedVisitForUndischarge] = useState<Visit | null>(null);

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
    queryKey: ['discharged-patients', searchTerm, statusFilter, patientTypeFilter, billingStatusFilter, corporateFilter, sortBy, sortOrder, hospitalConfig?.name, availableCorporates?.length],
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
  const filteredVisits = visits?.filter(visit => {
    // Filter 1: Only show fully discharged patients
    // Patient automatically gets discharge_date and status='discharged' when Final Payment is completed
    if (visit.status?.toLowerCase() !== 'discharged') return false;

    // Filter 2: Apply search if provided
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      visit.visit_id?.toLowerCase().includes(searchLower) ||
      visit.patients?.patients_id?.toLowerCase().includes(searchLower) ||
      visit.patients?.name?.toLowerCase().includes(searchLower) ||
      visit.patients?.phone?.toLowerCase().includes(searchLower) ||
      visit.patients?.insurance_person_no?.toLowerCase().includes(searchLower)
    );
  }) || [];

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

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
                    <TableHead>Patient Details</TableHead>
                    <TableHead>Visit Info</TableHead>
                    <TableHead>Admission Date</TableHead>
                    <TableHead>Discharge Date</TableHead>
                    <TableHead>Days Admitted</TableHead>
                    <TableHead>Billing Status</TableHead>
                    <TableHead>Corporate</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits?.map((visit) => (
                    <TableRow key={visit.id} className="hover:bg-muted/50">
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
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
    </div>
  );
};

export default DischargedPatients;
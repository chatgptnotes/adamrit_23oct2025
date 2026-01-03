import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Printer, Search, ClipboardList, Download } from 'lucide-react';
import { OpdStatisticsCards } from '@/components/opd/OpdStatisticsCards';
import { OpdPatientTable } from '@/components/opd/OpdPatientTable';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

const TodaysOpd = () => {
  const { hospitalConfig } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-persisted state
  const searchTerm = searchParams.get('search') || '';
  const corporateFilter = searchParams.get('corporate') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  // Helper to update URL params
  const updateParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams, { replace: true });
  };

  // Setter functions
  const setSearchTerm = (value: string) => updateParams({ search: value });
  const setCorporateFilter = (value: string) => updateParams({ corporate: value });

  // Date range state
  const dateRange: DateRange | undefined = useMemo(() => {
    if (!startDate && !endDate) return undefined;
    return {
      from: startDate ? new Date(startDate) : undefined,
      to: endDate ? new Date(endDate) : undefined,
    };
  }, [startDate, endDate]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    updateParams({
      startDate: range?.from ? format(range.from, 'yyyy-MM-dd') : null,
      endDate: range?.to ? format(range.to, 'yyyy-MM-dd') : null,
    });
  };

  // Fetch corporates from corporate table
  const { data: corporates = [] } = useQuery({
    queryKey: ['corporates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('corporate')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching corporates:', error);
        return [];
      }

      return data || [];
    }
  });

  // Fetch OPD patients
  const { data: opdPatients = [], isLoading, refetch } = useQuery({
    queryKey: ['opd-patients', hospitalConfig?.name],
    queryFn: async () => {
      console.log('Fetching OPD patients...');
      console.log('Hospital config:', hospitalConfig);

      // First, let's get all OPD patients without date filter to see if there are any
      let query = supabase
        .from('visits')
        .select(`
          *,
          patients!inner (
            id,
            name,
            gender,
            age,
            date_of_birth,
            patients_id,
            insurance_person_no,
            corporate,
            phone
          )
        `)
        .eq('patient_type', 'OPD')
        .order('created_at', { ascending: false })
        .limit(50); // Get latest 50 OPD visits

      // Only apply hospital filter if hospitalConfig exists
      if (hospitalConfig?.name) {
        console.log('Applying hospital filter:', hospitalConfig.name);
        query = query.eq('patients.hospital_name', hospitalConfig.name);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching OPD patients:', error);
        throw error;
      }

      console.log('OPD Patients fetched:', data);
      console.log('Total OPD patients found:', data?.length || 0);

      // Debug: Check comments in fetched data
      console.log('📊 Sample OPD patient data (first patient):', data?.[0]);
      console.log('💬 Comments in first patient:', data?.[0]?.comments);

      // Log all patients with comments
      const patientsWithComments = data?.filter(v => v.comments) || [];
      console.log(`📝 Found ${patientsWithComments.length} patients with comments out of ${data?.length || 0} total patients`);
      if (patientsWithComments.length > 0) {
        console.log('💭 Patients with comments:', patientsWithComments.map(v => ({
          id: v.id,
          visit_id: v.visit_id,
          patient_name: v.patients?.name,
          comments: v.comments
        })));
      }

      // If you want to filter by today only, uncomment this:
      // const today = new Date();
      // today.setHours(0, 0, 0, 0);
      // const todayPatients = data?.filter(patient => {
      //   const visitDate = new Date(patient.created_at || patient.visit_date);
      //   visitDate.setHours(0, 0, 0, 0);
      //   return visitDate.getTime() === today.getTime();
      // }) || [];
      // return todayPatients;

      return data || [];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Filter patients based on search term, corporate, and date range
  const filteredPatients = opdPatients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      patient.patients?.name?.toLowerCase().includes(searchLower) ||
      patient.patients?.patients_id?.toLowerCase().includes(searchLower) ||
      patient.visit_id?.toLowerCase().includes(searchLower) ||
      patient.token_number?.toString().includes(searchLower)
    );

    const matchesCorporate = !corporateFilter ||
      patient.patients?.corporate?.trim().toLowerCase() === corporateFilter.trim().toLowerCase();

    // Date range filter - default to today if no date range selected
    let matchesDate = true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const visitDateTime = new Date(patient.created_at || patient.visit_date);

    if (startDate || endDate) {
      // Use selected date range
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (visitDateTime < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (visitDateTime > end) matchesDate = false;
      }
    } else {
      // Default to today's date
      matchesDate = visitDateTime >= today && visitDateTime <= todayEnd;
    }

    // If search term is entered, ignore date filter to show all visits for that patient
    if (searchTerm.trim()) {
      return matchesSearch && matchesCorporate;
    }
    return matchesSearch && matchesCorporate && matchesDate;
  });

  // Calculate statistics from filtered patients (to match displayed data)
  const statistics = {
    waiting: filteredPatients.filter(p => p.status === 'waiting').length,
    inProgress: filteredPatients.filter(p => p.status === 'in_progress').length,
    completed: filteredPatients.filter(p => p.status === 'completed').length,
    total: filteredPatients.length
  };

  const handlePrintList = () => {
    window.print();
  };

  const handleExportToExcel = () => {
    const excelData = filteredPatients.map(patient => ({
      'Name': patient.patients?.name || '',
      'Phone number': patient.patients?.phone || ''
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'OPD Patients');
    XLSX.writeFile(wb, `OPD_Patients_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Debug: Check if there are any visits in the database
  useEffect(() => {
    const checkVisits = async () => {
      const { data: allVisits, error } = await supabase
        .from('visits')
        .select('id, visit_id, patient_type, created_at')
        .limit(10);

      console.log('Sample visits from database:', allVisits);

      const { data: opdVisits, error: opdError } = await supabase
        .from('visits')
        .select('id, visit_id, patient_type')
        .eq('patient_type', 'OPD')
        .limit(5);

      console.log('OPD visits in database:', opdVisits);
    };

    checkVisits();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl font-bold">OPD PATIENT DASHBOARD</CardTitle>
                <p className="text-sm text-muted-foreground">Total OPD Patients: {statistics.total}</p>
                {/* Date display for print */}
                <p className="hidden print:block text-sm text-gray-700 mt-1">
                  Date: {startDate ? new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'All'}
                  {endDate ? ` - ${new Date(endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintList}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print List
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportToExcel}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export XLS
              </Button>
              <DateRangePicker
                date={dateRange}
                onDateChange={handleDateRangeChange}
              />
              <select
                value={corporateFilter}
                onChange={(e) => setCorporateFilter(e.target.value)}
                className="h-10 text-sm border border-gray-300 rounded-md px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Corporates</option>
                {corporates.map((corporate) => (
                  <option key={corporate.id} value={corporate.name}>
                    {corporate.name}
                  </option>
                ))}
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[250px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Cards */}
      <div className="print:hidden">
        <OpdStatisticsCards statistics={statistics} />
      </div>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>OPD PATIENTS</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <OpdPatientTable patients={filteredPatients} refetch={refetch} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TodaysOpd;
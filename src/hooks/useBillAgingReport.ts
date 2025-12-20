import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, parseISO } from 'date-fns';
import { AgingBucket } from '@/types/accounting';
import {
  BillAgingRecord,
  BillAgingFilters,
  BillAgingSortConfig,
  BillAgingReportSummary,
  BillAgingStatus,
  AgingBucketSummary,
  CorporateSummary,
  defaultBillAgingFilters,
} from '@/types/billAging';

// Calculate days from submission date
const calculateDaysOutstanding = (
  submissionDate: string | null,
  receivedDate: string | null
): number => {
  if (!submissionDate) return 0;

  const startDate = parseISO(submissionDate);
  const endDate = receivedDate ? parseISO(receivedDate) : new Date();

  return differenceInDays(endDate, startDate);
};

// Get aging bucket based on days
const getAgingBucket = (days: number): AgingBucket => {
  if (days <= 30) return '0-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  if (days <= 180) return '91-180';
  if (days <= 365) return '181-365';
  return '365+';
};

// Determine bill status
const determineStatus = (
  receivedDate: string | null,
  billAmount: number,
  receivedAmount: number,
  expectedPaymentDate: string | null
): BillAgingStatus => {
  if (receivedDate) {
    if (receivedAmount >= billAmount) return 'Received';
    return 'Partial';
  }

  if (expectedPaymentDate) {
    const expected = parseISO(expectedPaymentDate);
    if (expected < new Date()) return 'Overdue';
  }

  return 'Pending';
};

// Fetch and process bill aging data
const fetchBillAgingData = async (hospitalName?: string): Promise<BillAgingRecord[]> => {
  let query = supabase
    .from('bill_preparation' as any)
    .select(`
      id,
      visit_id,
      corporate,
      bill_amount,
      received_amount,
      deduction_amount,
      date_of_submission,
      expected_payment_date,
      received_date,
      created_at,
      visits!inner!visit_id(
        admission_date,
        discharge_date,
        patients!inner(id, name, hospital_name)
      )
    `)
    .not('date_of_submission', 'is', null)
    .order('date_of_submission', { ascending: false });

  // Filter by hospital if provided
  if (hospitalName && hospitalName !== 'all') {
    query = query.eq('visits.patients.hospital_name', hospitalName);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Map and calculate aging fields
  return (data || []).map((item: any) => {
    const billAmount = Number(item.bill_amount) || 0;
    const receivedAmount = Number(item.received_amount) || 0;
    const deductionAmount = Number(item.deduction_amount) || 0;
    const outstandingAmount = billAmount - receivedAmount - deductionAmount;
    const daysOutstanding = calculateDaysOutstanding(
      item.date_of_submission,
      item.received_date
    );

    return {
      id: item.id,
      visit_id: item.visit_id,
      patient_name: item.visits?.patients?.name || '',
      patient_id: item.visits?.patients?.id || '',
      corporate: item.corporate || '',
      hospital_name: item.visits?.patients?.hospital_name || '',
      admission_date: item.visits?.admission_date || null,
      discharge_date: item.visits?.discharge_date || null,
      bill_amount: billAmount,
      received_amount: receivedAmount,
      deduction_amount: deductionAmount,
      outstanding_amount: Math.max(0, outstandingAmount),
      date_of_submission: item.date_of_submission,
      expected_payment_date: item.expected_payment_date,
      received_date: item.received_date,
      days_outstanding: daysOutstanding,
      aging_bucket: getAgingBucket(daysOutstanding),
      status: determineStatus(
        item.received_date,
        billAmount,
        receivedAmount,
        item.expected_payment_date
      ),
    };
  });
};

// Calculate summary statistics
const calculateSummary = (records: BillAgingRecord[]): BillAgingReportSummary => {
  const bucketMap: Record<AgingBucket, AgingBucketSummary> = {
    '0-30': { bucket: '0-30', count: 0, total_bill_amount: 0, total_received_amount: 0, total_outstanding_amount: 0 },
    '31-60': { bucket: '31-60', count: 0, total_bill_amount: 0, total_received_amount: 0, total_outstanding_amount: 0 },
    '61-90': { bucket: '61-90', count: 0, total_bill_amount: 0, total_received_amount: 0, total_outstanding_amount: 0 },
    '91-180': { bucket: '91-180', count: 0, total_bill_amount: 0, total_received_amount: 0, total_outstanding_amount: 0 },
    '181-365': { bucket: '181-365', count: 0, total_bill_amount: 0, total_received_amount: 0, total_outstanding_amount: 0 },
    '365+': { bucket: '365+', count: 0, total_bill_amount: 0, total_received_amount: 0, total_outstanding_amount: 0 },
  };

  const corporateMap: Record<string, CorporateSummary> = {};

  let totalPending = 0;
  let totalReceived = 0;
  let totalOverdue = 0;
  let totalPartial = 0;
  let totalBillAmount = 0;
  let totalReceivedAmount = 0;
  let totalOutstandingAmount = 0;
  let totalDaysForReceived = 0;
  let receivedCount = 0;

  records.forEach((record) => {
    // Bucket summary
    const bucket = bucketMap[record.aging_bucket];
    bucket.count++;
    bucket.total_bill_amount += record.bill_amount;
    bucket.total_received_amount += record.received_amount;
    bucket.total_outstanding_amount += record.outstanding_amount;

    // Corporate summary
    if (record.corporate) {
      if (!corporateMap[record.corporate]) {
        corporateMap[record.corporate] = {
          corporate: record.corporate,
          total_bills: 0,
          total_bill_amount: 0,
          total_received: 0,
          total_outstanding: 0,
          average_days_to_payment: 0,
        };
      }
      const corp = corporateMap[record.corporate];
      corp.total_bills++;
      corp.total_bill_amount += record.bill_amount;
      corp.total_received += record.received_amount;
      corp.total_outstanding += record.outstanding_amount;
    }

    // Status counts
    switch (record.status) {
      case 'Pending':
        totalPending++;
        break;
      case 'Received':
        totalReceived++;
        totalDaysForReceived += record.days_outstanding;
        receivedCount++;
        break;
      case 'Overdue':
        totalOverdue++;
        break;
      case 'Partial':
        totalPartial++;
        break;
    }

    // Totals
    totalBillAmount += record.bill_amount;
    totalReceivedAmount += record.received_amount;
    totalOutstandingAmount += record.outstanding_amount;
  });

  return {
    total_bills: records.length,
    total_pending: totalPending,
    total_received: totalReceived,
    total_overdue: totalOverdue,
    total_partial: totalPartial,
    total_bill_amount: totalBillAmount,
    total_received_amount: totalReceivedAmount,
    total_outstanding_amount: totalOutstandingAmount,
    average_days_to_payment: receivedCount > 0 ? Math.round(totalDaysForReceived / receivedCount) : 0,
    buckets: Object.values(bucketMap),
    by_corporate: Object.values(corporateMap),
  };
};

// Main hook
export const useBillAgingReport = (hospitalName?: string) => {
  const [filters, setFilters] = useState<BillAgingFilters>(defaultBillAgingFilters);
  const [sortConfig, setSortConfig] = useState<BillAgingSortConfig>({
    column: 'date_of_submission',
    direction: 'desc',
  });

  // Fetch data
  const { data: rawData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['bill-aging-report', hospitalName],
    queryFn: () => fetchBillAgingData(hospitalName),
  });

  // Apply filters
  const filteredData = useMemo(() => {
    return rawData.filter((record) => {
      // Hospital filter
      if (filters.hospital !== 'all' && record.hospital_name !== filters.hospital) {
        return false;
      }

      // Corporate filter
      if (filters.corporate !== 'all' && record.corporate !== filters.corporate) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && record.status !== filters.status) {
        return false;
      }

      // Aging bucket filter
      if (filters.agingBucket !== 'all' && record.aging_bucket !== filters.agingBucket) {
        return false;
      }

      // Date from filter
      if (filters.dateFrom && record.date_of_submission) {
        if (record.date_of_submission < filters.dateFrom) {
          return false;
        }
      }

      // Date to filter
      if (filters.dateTo && record.date_of_submission) {
        if (record.date_of_submission > filters.dateTo) {
          return false;
        }
      }

      // Search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesVisitId = record.visit_id?.toLowerCase().includes(searchLower);
        const matchesPatientName = record.patient_name?.toLowerCase().includes(searchLower);
        const matchesCorporate = record.corporate?.toLowerCase().includes(searchLower);
        if (!matchesVisitId && !matchesPatientName && !matchesCorporate) {
          return false;
        }
      }

      return true;
    });
  }, [rawData, filters]);

  // Apply sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.column) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.column as keyof BillAgingRecord];
      const bVal = b[sortConfig.column as keyof BillAgingRecord];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  // Calculate summary for filtered data
  const summary = useMemo(() => calculateSummary(filteredData), [filteredData]);

  // Get unique corporates for filter dropdown
  const corporates = useMemo(() => {
    const uniqueCorporates = [...new Set(rawData.map((r) => r.corporate).filter(Boolean))];
    return uniqueCorporates.sort();
  }, [rawData]);

  // Get unique hospitals for filter dropdown
  const hospitals = useMemo(() => {
    const uniqueHospitals = [...new Set(rawData.map((r) => r.hospital_name).filter(Boolean))];
    return uniqueHospitals.sort();
  }, [rawData]);

  // Handle sort
  const handleSort = (column: keyof BillAgingRecord) => {
    setSortConfig((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters(defaultBillAgingFilters);
  };

  return {
    data: sortedData,
    rawData,
    isLoading,
    error,
    refetch,
    filters,
    setFilters,
    sortConfig,
    handleSort,
    resetFilters,
    summary,
    corporates,
    hospitals,
  };
};

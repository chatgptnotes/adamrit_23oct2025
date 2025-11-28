import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAllBatchInventory,
  getMedicineBatches,
  getMedicineBatchSummary,
  adjustBatchStock,
  getBatchMovementHistory,
  getNearExpiryAlerts,
  getLowStockAlerts,
  markBatchExpired,
  allocateStockForSale,
  transferStock,
  type BatchFilters,
  type StockAdjustment,
} from '@/lib/batch-inventory-service';

// Query keys for React Query
export const batchInventoryKeys = {
  all: ['batch-inventory'] as const,
  lists: () => [...batchInventoryKeys.all, 'list'] as const,
  list: (hospital: string, filters?: BatchFilters) =>
    [...batchInventoryKeys.lists(), hospital, filters] as const,
  medicine: (medicineId: string, hospital: string) =>
    [...batchInventoryKeys.all, 'medicine', medicineId, hospital] as const,
  medicineSummary: (medicineId: string, hospital: string) =>
    [...batchInventoryKeys.all, 'summary', medicineId, hospital] as const,
  movements: (batchId: string) =>
    [...batchInventoryKeys.all, 'movements', batchId] as const,
  alerts: (hospital: string) =>
    [...batchInventoryKeys.all, 'alerts', hospital] as const,
  expiryAlerts: (hospital: string, days: number) =>
    [...batchInventoryKeys.alerts(hospital), 'expiry', days] as const,
  lowStockAlerts: (hospital: string) =>
    [...batchInventoryKeys.alerts(hospital), 'low-stock'] as const,
};

/**
 * Hook to fetch all batch inventory with filters
 */
export function useBatchInventory(filters?: BatchFilters) {
  const { selectedHospital } = useAuth();
  const hospitalName = selectedHospital?.name || '';

  return useQuery({
    queryKey: batchInventoryKeys.list(hospitalName, filters),
    queryFn: () => getAllBatchInventory(hospitalName, filters),
    enabled: !!hospitalName,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch batches for a specific medicine
 */
export function useMedicineBatches(medicineId: string | null, filters?: BatchFilters) {
  const { selectedHospital } = useAuth();
  const hospitalName = selectedHospital?.name || '';

  return useQuery({
    queryKey: batchInventoryKeys.medicine(medicineId || '', hospitalName),
    queryFn: () => getMedicineBatches(medicineId!, hospitalName, filters),
    enabled: !!medicineId && !!hospitalName,
    staleTime: 30000,
  });
}

/**
 * Hook to fetch batch summary for a medicine
 */
export function useMedicineBatchSummary(medicineId: string | null) {
  const { selectedHospital } = useAuth();
  const hospitalName = selectedHospital?.name || '';

  return useQuery({
    queryKey: batchInventoryKeys.medicineSummary(medicineId || '', hospitalName),
    queryFn: () => getMedicineBatchSummary(medicineId!, hospitalName),
    enabled: !!medicineId && !!hospitalName,
    staleTime: 30000,
  });
}

/**
 * Hook to fetch stock movement history for a batch
 */
export function useBatchMovementHistory(batchId: string | null) {
  return useQuery({
    queryKey: batchInventoryKeys.movements(batchId || ''),
    queryFn: () => getBatchMovementHistory(batchId!),
    enabled: !!batchId,
    staleTime: 10000, // 10 seconds
  });
}

/**
 * Hook to fetch near expiry alerts
 */
export function useNearExpiryAlerts(daysThreshold: number = 90) {
  const { selectedHospital } = useAuth();
  const hospitalName = selectedHospital?.name || '';

  return useQuery({
    queryKey: batchInventoryKeys.expiryAlerts(hospitalName, daysThreshold),
    queryFn: () => getNearExpiryAlerts(hospitalName, daysThreshold),
    enabled: !!hospitalName,
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

/**
 * Hook to fetch low stock alerts
 */
export function useLowStockAlerts() {
  const { selectedHospital } = useAuth();
  const hospitalName = selectedHospital?.name || '';

  return useQuery({
    queryKey: batchInventoryKeys.lowStockAlerts(hospitalName),
    queryFn: () => getLowStockAlerts(hospitalName),
    enabled: !!hospitalName,
    staleTime: 60000,
    refetchInterval: 300000,
  });
}

/**
 * Hook to adjust batch stock
 */
export function useAdjustBatchStock() {
  const queryClient = useQueryClient();
  const { selectedHospital } = useAuth();
  const hospitalName = selectedHospital?.name || '';

  return useMutation({
    mutationFn: (adjustment: StockAdjustment) =>
      adjustBatchStock(adjustment, hospitalName),
    onSuccess: () => {
      // Invalidate all batch inventory queries to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: batchInventoryKeys.all
      });
    },
  });
}

/**
 * Hook to mark batch as expired
 */
export function useMarkBatchExpired() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      batchId,
      reason,
      performedBy
    }: {
      batchId: string;
      reason: string;
      performedBy?: string;
    }) => markBatchExpired(batchId, reason, performedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: batchInventoryKeys.all
      });
    },
  });
}

/**
 * Hook to allocate stock for sale (FEFO)
 */
export function useAllocateStock() {
  const { selectedHospital } = useAuth();
  const hospitalName = selectedHospital?.name || '';

  return useMutation({
    mutationFn: ({
      medicineId,
      quantity
    }: {
      medicineId: string;
      quantity: number;
    }) => allocateStockForSale(medicineId, quantity, hospitalName),
  });
}

/**
 * Hook to transfer stock between batches
 */
export function useTransferStock() {
  const queryClient = useQueryClient();
  const { selectedHospital } = useAuth();
  const hospitalName = selectedHospital?.name || '';

  return useMutation({
    mutationFn: ({
      fromBatchId,
      toBatchId,
      quantity,
      reason,
      performedBy,
    }: {
      fromBatchId: string;
      toBatchId: string;
      quantity: number;
      reason: string;
      performedBy?: string;
    }) => transferStock(
      fromBatchId,
      toBatchId,
      quantity,
      reason,
      hospitalName,
      performedBy
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: batchInventoryKeys.all
      });
    },
  });
}

/**
 * Combined hook for all alerts
 */
export function useAllAlerts(expiryThreshold: number = 90) {
  const nearExpiryQuery = useNearExpiryAlerts(expiryThreshold);
  const lowStockQuery = useLowStockAlerts();

  return {
    alerts: [
      ...(nearExpiryQuery.data || []),
      ...(lowStockQuery.data || []),
    ].sort((a, b) => {
      // Sort by severity: CRITICAL > HIGH > MEDIUM > LOW
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }),
    isLoading: nearExpiryQuery.isLoading || lowStockQuery.isLoading,
    isError: nearExpiryQuery.isError || lowStockQuery.isError,
    error: nearExpiryQuery.error || lowStockQuery.error,
    refetch: () => {
      nearExpiryQuery.refetch();
      lowStockQuery.refetch();
    },
  };
}

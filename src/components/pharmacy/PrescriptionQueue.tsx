// Prescription Queue - Pharmacist view for dispensing prescriptions
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Search,
  Eye,
  Package,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pill,
  Stethoscope,
  User,
  Calendar,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrescriptionItem {
  id: string;
  medicine_id: string | null;
  medicine_name?: string; // joined from medicines table
  quantity_prescribed: number;
  quantity_dispensed: number;
  dosage_frequency: string | null;
  dosage_timing: string | null;
  duration_days: number | null;
  special_instructions: string | null;
}

interface Prescription {
  id: string;
  prescription_number: string;
  patient_id: string | null;
  patient_name?: string; // joined from patients table
  doctor_name: string | null;
  prescription_date: string | null;
  status: string;
  notes: string | null;
  prescription_items: PrescriptionItem[];
}

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'PARTIALLY_DISPENSED', 'DISPENSED'] as const;
type StatusTab = (typeof STATUS_TABS)[number];

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'APPROVED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'PARTIALLY_DISPENSED':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'DISPENSED':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'PENDING':
      return <Clock className="h-3 w-3" />;
    case 'APPROVED':
      return <CheckCircle className="h-3 w-3" />;
    case 'DISPENSED':
      return <CheckCircle className="h-3 w-3" />;
    case 'CANCELLED':
      return <XCircle className="h-3 w-3" />;
    default:
      return <AlertCircle className="h-3 w-3" />;
  }
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, ' ');
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function fetchPrescriptions(): Promise<Prescription[]> {
  // Fetch prescriptions
  const { data: prescriptions, error } = await (supabase as any)
    .from('prescriptions')
    .select('*')
    .order('prescription_date', { ascending: false });

  if (error) throw error;
  if (!prescriptions || prescriptions.length === 0) return [];

  // Fetch prescription items for all prescriptions
  const prescriptionIds = prescriptions.map((p: any) => p.id);
  const { data: items, error: itemsError } = await (supabase as any)
    .from('prescription_items')
    .select('*')
    .in('prescription_id', prescriptionIds);

  if (itemsError) throw itemsError;

  // Fetch patient names
  const patientIds = [...new Set(prescriptions.map((p: any) => p.patient_id).filter(Boolean))];
  let patientMap: Record<string, string> = {};
  if (patientIds.length > 0) {
    const { data: patients } = await (supabase as any)
      .from('patients')
      .select('id, name')
      .in('id', patientIds);
    if (patients) {
      patientMap = Object.fromEntries(patients.map((p: any) => [p.id, p.name]));
    }
  }

  // Fetch medicine names
  const medicineIds = [...new Set((items || []).map((i: any) => i.medicine_id).filter(Boolean))];
  let medicineMap: Record<string, string> = {};
  if (medicineIds.length > 0) {
    const { data: medicines } = await (supabase as any)
      .from('medicines')
      .select('id, name')
      .in('id', medicineIds);
    if (medicines) {
      medicineMap = Object.fromEntries(medicines.map((m: any) => [m.id, m.name]));
    }
  }

  // Join items onto prescriptions
  const itemsByPrescription: Record<string, PrescriptionItem[]> = {};
  for (const item of items || []) {
    const key = item.prescription_id;
    if (!itemsByPrescription[key]) itemsByPrescription[key] = [];
    itemsByPrescription[key].push({
      ...item,
      medicine_name: item.medicine_id ? medicineMap[item.medicine_id] || item.medicine_name || 'Unknown Medicine' : item.medicine_name || 'Unknown Medicine',
    });
  }

  return prescriptions.map((p: any) => ({
    ...p,
    patient_name: p.patient_id ? patientMap[p.patient_id] || 'Unknown Patient' : 'Unknown Patient',
    prescription_items: itemsByPrescription[p.id] || [],
  }));
}

// ─── Dispense Modal ────────────────────────────────────────────────────────────

interface DispenseModalProps {
  prescription: Prescription;
  onClose: () => void;
}

const DispenseModal: React.FC<DispenseModalProps> = ({ prescription, onClose }) => {
  const { toast } = useToast();
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(
      prescription.prescription_items.map((item) => [
        item.id,
        item.quantity_prescribed - item.quantity_dispensed,
      ])
    )
  );

  const handleQuantityChange = (itemId: string, value: number) => {
    const item = prescription.prescription_items.find((i) => i.id === itemId);
    if (!item) return;
    const maxQty = item.quantity_prescribed - item.quantity_dispensed;
    const clamped = Math.max(0, Math.min(value, maxQty));
    setQuantities((prev) => ({ ...prev, [itemId]: clamped }));
  };

  const handleCreateSaleBill = () => {
    toast({
      title: 'Redirecting to billing...',
      description: `Creating sale bill for prescription ${prescription.prescription_number}`,
    });
    onClose();
  };

  return (
    <div className="space-y-4">
      {/* Patient & Doctor info */}
      <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Patient</p>
            <p className="font-medium text-sm">{prescription.patient_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Doctor</p>
            <p className="font-medium text-sm">{prescription.doctor_name || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Prescription #</p>
            <p className="font-medium text-sm font-mono">{prescription.prescription_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="font-medium text-sm">{prescription.prescription_date || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Medicines list */}
      <div>
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Pill className="h-4 w-4" />
          Medicines to Dispense
        </h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medicine</TableHead>
              <TableHead className="text-center">Prescribed</TableHead>
              <TableHead className="text-center">Already Dispensed</TableHead>
              <TableHead className="text-center">Qty to Dispense</TableHead>
              <TableHead>Instructions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prescription.prescription_items.map((item) => {
              const remaining = item.quantity_prescribed - item.quantity_dispensed;
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium text-sm">{item.medicine_name}</p>
                    {item.dosage_frequency && (
                      <p className="text-xs text-muted-foreground">{item.dosage_frequency}</p>
                    )}
                    {item.duration_days && (
                      <p className="text-xs text-muted-foreground">{item.duration_days} days</p>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{item.quantity_prescribed}</TableCell>
                  <TableCell className="text-center">{item.quantity_dispensed}</TableCell>
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      min={0}
                      max={remaining}
                      value={quantities[item.id] ?? remaining}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                      className="w-20 text-center mx-auto"
                      disabled={remaining === 0}
                    />
                    {remaining === 0 && (
                      <p className="text-xs text-green-600 mt-1">Fully dispensed</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-muted-foreground">
                      {item.dosage_timing || ''}
                      {item.special_instructions ? ` · ${item.special_instructions}` : ''}
                    </p>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleCreateSaleBill}>
          <Package className="h-4 w-4 mr-2" />
          Create Sale Bill
        </Button>
      </div>
    </div>
  );
};

// ─── Detail Modal ──────────────────────────────────────────────────────────────

interface DetailModalProps {
  prescription: Prescription;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ prescription, onClose }) => {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs text-muted-foreground">Patient</p>
          <p className="font-medium">{prescription.patient_name}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Doctor</p>
          <p className="font-medium">{prescription.doctor_name || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Prescription #</p>
          <p className="font-mono font-medium">{prescription.prescription_number}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Date</p>
          <p className="font-medium">{prescription.prescription_date || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <Badge className={`${getStatusBadgeClass(prescription.status)} border text-xs flex items-center gap-1 w-fit`}>
            {getStatusIcon(prescription.status)}
            {formatStatusLabel(prescription.status)}
          </Badge>
        </div>
        {prescription.notes && (
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground">Notes</p>
            <p className="text-sm">{prescription.notes}</p>
          </div>
        )}
      </div>

      {/* Items */}
      <div>
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Pill className="h-4 w-4" />
          Prescription Items ({prescription.prescription_items.length})
        </h4>
        {prescription.prescription_items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No items found</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-center">Prescribed</TableHead>
                <TableHead className="text-center">Dispensed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescription.prescription_items.map((item) => {
                const isComplete = item.quantity_dispensed >= item.quantity_prescribed;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{item.medicine_name}</p>
                      {item.special_instructions && (
                        <p className="text-xs text-muted-foreground">{item.special_instructions}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.dosage_frequency || '—'}
                      {item.dosage_timing && (
                        <p className="text-xs text-muted-foreground">{item.dosage_timing}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.duration_days ? `${item.duration_days} days` : '—'}
                    </TableCell>
                    <TableCell className="text-center">{item.quantity_prescribed}</TableCell>
                    <TableCell className="text-center">{item.quantity_dispensed}</TableCell>
                    <TableCell>
                      <Badge variant={isComplete ? 'default' : 'secondary'} className="text-xs">
                        {isComplete ? 'Complete' : 'Pending'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex justify-end border-t pt-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const PrescriptionQueue: React.FC = () => {
  const [activeStatusTab, setActiveStatusTab] = useState<StatusTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewPrescription, setViewPrescription] = useState<Prescription | null>(null);
  const [dispensePrescription, setDispensePrescription] = useState<Prescription | null>(null);

  const {
    data: prescriptions = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Prescription[]>({
    queryKey: ['prescription-queue'],
    queryFn: fetchPrescriptions,
    refetchInterval: 30000, // auto-refresh every 30 seconds
  });

  // Filter by status tab
  const statusFiltered =
    activeStatusTab === 'ALL'
      ? prescriptions
      : prescriptions.filter((p) => p.status === activeStatusTab);

  // Filter by search term
  const filtered = statusFiltered.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.prescription_number.toLowerCase().includes(term) ||
      (p.patient_name || '').toLowerCase().includes(term) ||
      (p.doctor_name || '').toLowerCase().includes(term)
    );
  });

  // Count per status for badges
  const countByStatus = (status: string) =>
    prescriptions.filter((p) => p.status === status).length;

  const pendingCount = countByStatus('PENDING');
  const approvedCount = countByStatus('APPROVED');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              Prescription Queue
              {(pendingCount + approvedCount) > 0 && (
                <span className="bg-orange-100 text-orange-700 text-sm font-semibold px-2 py-0.5 rounded-full">
                  {pendingCount + approvedCount} action{pendingCount + approvedCount !== 1 ? 's' : ''} needed
                </span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              View and dispense prescriptions from patients
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 border-b pb-2 flex-wrap">
        {STATUS_TABS.map((tab) => {
          const count =
            tab === 'ALL'
              ? prescriptions.length
              : countByStatus(tab);
          const isActive = activeStatusTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveStatusTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-white text-muted-foreground border-gray-200 hover:border-gray-300 hover:text-foreground'
              }`}
            >
              {formatStatusLabel(tab)}
              {count > 0 && (
                <span className={`ml-1.5 text-xs font-semibold ${isActive ? 'opacity-80' : 'text-muted-foreground'}`}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by patient name or prescription number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Prescriptions
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filtered.length} result{filtered.length !== 1 ? 's' : ''})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isError && (
            <div className="text-center py-8 text-red-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load prescriptions. Please refresh.</p>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <p>Loading prescriptions...</p>
            </div>
          )}

          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prescription #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <FileText className="h-8 w-8" />
                          <p>
                            {searchTerm
                              ? 'No prescriptions match your search.'
                              : 'No prescriptions found.'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((prescription) => (
                      <TableRow key={prescription.id}>
                        <TableCell>
                          <p className="font-mono font-medium text-sm">
                            {prescription.prescription_number}
                          </p>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm">{prescription.patient_name}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Stethoscope className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm">{prescription.doctor_name || '—'}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm">{prescription.prescription_date || '—'}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge
                              className={`${getStatusBadgeClass(prescription.status)} border text-xs flex items-center gap-1 w-fit`}
                            >
                              {getStatusIcon(prescription.status)}
                              {formatStatusLabel(prescription.status)}
                            </Badge>
                            {prescription.status === 'PENDING' && (
                              <span className="text-xs text-yellow-600 font-medium">
                                Awaiting Doctor Approval
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Pill className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {prescription.prescription_items.length}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            {/* View button — always visible */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewPrescription(prescription)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>

                            {/* Dispense button — only for APPROVED & PARTIALLY_DISPENSED */}
                            {(prescription.status === 'APPROVED' ||
                              prescription.status === 'PARTIALLY_DISPENSED') && (
                              <Button
                                size="sm"
                                onClick={() => setDispensePrescription(prescription)}
                              >
                                <Package className="h-3 w-3 mr-1" />
                                Dispense
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Detail Modal */}
      <Dialog open={!!viewPrescription} onOpenChange={() => setViewPrescription(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Prescription Details — {viewPrescription?.prescription_number}
            </DialogTitle>
          </DialogHeader>
          {viewPrescription && (
            <DetailModal
              prescription={viewPrescription}
              onClose={() => setViewPrescription(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dispense Modal */}
      <Dialog open={!!dispensePrescription} onOpenChange={() => setDispensePrescription(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Dispense Prescription — {dispensePrescription?.prescription_number}
            </DialogTitle>
          </DialogHeader>
          {dispensePrescription && (
            <DispenseModal
              prescription={dispensePrescription}
              onClose={() => setDispensePrescription(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrescriptionQueue;

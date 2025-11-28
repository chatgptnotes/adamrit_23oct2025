// Prescription Management Component
import React, { useState } from 'react';
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
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle,
  Clock,
  CheckCircle,
  User,
  Stethoscope,
  Pill,
  Edit,
  Eye,
  Package,
  Printer,
  RefreshCw,
  Calendar,
  Users,
  Activity
} from 'lucide-react';

interface Prescription {
  id: string;
  prescription_number: string;
  patient_id: string;
  patient_name: string;
  patient_phone?: string;
  doctor_id?: string;
  doctor_name: string;
  prescription_date: string;
  diagnosis?: string;
  symptoms?: string;
  status: 'PENDING' | 'PARTIALLY_DISPENSED' | 'DISPENSED' | 'CANCELLED';
  priority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  total_amount: number;
  final_amount: number;
  dispensed_at?: string;
  dispensed_by?: string;
  notes?: string;
  prescription_items: PrescriptionItem[];
}

interface PrescriptionItem {
  id: string;
  medicine_name: string;
  generic_name?: string;
  strength?: string;
  dosage_form?: string;
  quantity_prescribed: number;
  quantity_dispensed: number;
  dosage_frequency?: string;
  dosage_timing?: string;
  duration_days?: number;
  special_instructions?: string;
  unit_price?: number;
  total_price?: number;
  is_substituted: boolean;
  substitute_reason?: string;
}

const PrescriptionManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isNewPrescriptionOpen, setIsNewPrescriptionOpen] = useState(false);

  // Mock data - will be replaced with real data from hooks
  const prescriptions: Prescription[] = [
    {
      id: '1',
      prescription_number: 'RX2025001',
      patient_id: 'pat_001',
      patient_name: 'John Doe',
      patient_phone: '+91 9876543210',
      doctor_id: 'doc_001',
      doctor_name: 'Dr. Smith',
      prescription_date: '2025-06-13',
      diagnosis: 'Hypertension, Type 2 Diabetes',
      symptoms: 'High blood pressure, fatigue',
      status: 'PENDING',
      priority: 'NORMAL',
      total_amount: 450.00,
      final_amount: 450.00,
      notes: 'Regular follow-up required',
      prescription_items: [
        {
          id: '1',
          medicine_name: 'Amlodipine',
          generic_name: 'Amlodipine Besylate',
          strength: '5mg',
          dosage_form: 'Tablet',
          quantity_prescribed: 30,
          quantity_dispensed: 0,
          dosage_frequency: 'Once daily',
          dosage_timing: 'Morning',
          duration_days: 30,
          special_instructions: 'Take with food',
          unit_price: 8.50,
          total_price: 255.00,
          is_substituted: false
        },
        {
          id: '2',
          medicine_name: 'Metformin',
          generic_name: 'Metformin HCl',
          strength: '500mg',
          dosage_form: 'Tablet',
          quantity_prescribed: 60,
          quantity_dispensed: 0,
          dosage_frequency: 'Twice daily',
          dosage_timing: 'After meals',
          duration_days: 30,
          special_instructions: 'Take after breakfast and dinner',
          unit_price: 3.25,
          total_price: 195.00,
          is_substituted: false
        }
      ]
    },
    {
      id: '2',
      prescription_number: 'RX2025002',
      patient_id: 'pat_002',
      patient_name: 'Jane Smith',
      patient_phone: '+91 9876543211',
      doctor_id: 'doc_002',
      doctor_name: 'Dr. Johnson',
      prescription_date: '2025-06-13',
      diagnosis: 'Respiratory tract infection',
      symptoms: 'Cough, fever, congestion',
      status: 'PARTIALLY_DISPENSED',
      priority: 'URGENT',
      total_amount: 325.00,
      final_amount: 325.00,
      dispensed_at: '2025-06-13T10:30:00Z',
      dispensed_by: 'pharmacist_001',
      prescription_items: [
        {
          id: '3',
          medicine_name: 'Azithromycin',
          generic_name: 'Azithromycin',
          strength: '500mg',
          dosage_form: 'Tablet',
          quantity_prescribed: 6,
          quantity_dispensed: 6,
          dosage_frequency: 'Once daily',
          dosage_timing: 'After meals',
          duration_days: 6,
          unit_price: 25.00,
          total_price: 150.00,
          is_substituted: false
        },
        {
          id: '4',
          medicine_name: 'Dextromethorphan',
          generic_name: 'Dextromethorphan HBr',
          strength: '10mg/5ml',
          dosage_form: 'Syrup',
          quantity_prescribed: 1,
          quantity_dispensed: 0,
          dosage_frequency: 'Thrice daily',
          dosage_timing: 'As needed',
          duration_days: 7,
          special_instructions: '5ml thrice daily for cough',
          unit_price: 175.00,
          total_price: 175.00,
          is_substituted: false
        }
      ]
    },
    {
      id: '3',
      prescription_number: 'RX2025003',
      patient_id: 'pat_003',
      patient_name: 'Robert Wilson',
      patient_phone: '+91 9876543212',
      doctor_id: 'doc_001',
      doctor_name: 'Dr. Smith',
      prescription_date: '2025-06-12',
      diagnosis: 'Migraine',
      status: 'DISPENSED',
      priority: 'EMERGENCY',
      total_amount: 180.00,
      final_amount: 180.00,
      dispensed_at: '2025-06-12T15:45:00Z',
      dispensed_by: 'pharmacist_002',
      prescription_items: [
        {
          id: '5',
          medicine_name: 'Sumatriptan',
          strength: '50mg',
          dosage_form: 'Tablet',
          quantity_prescribed: 6,
          quantity_dispensed: 6,
          dosage_frequency: 'As needed',
          special_instructions: 'Take at onset of migraine',
          unit_price: 30.00,
          total_price: 180.00,
          is_substituted: false
        }
      ]
    }
  ];

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PARTIALLY_DISPENSED': return 'bg-blue-100 text-blue-800';
      case 'DISPENSED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY': return 'bg-red-100 text-red-800';
      case 'URGENT': return 'bg-orange-100 text-orange-800';
      case 'NORMAL': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = prescription.prescription_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || prescription.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const prescriptionStats = {
    totalPrescriptions: prescriptions.length,
    pendingPrescriptions: prescriptions.filter(p => p.status === 'PENDING').length,
    dispensedToday: prescriptions.filter(p => 
      p.status === 'DISPENSED' && 
      p.dispensed_at?.startsWith('2025-06-13')
    ).length,
    emergencyPrescriptions: prescriptions.filter(p => p.priority === 'EMERGENCY').length
  };

  const getCompletionPercentage = (prescription: Prescription) => {
    const totalItems = prescription.prescription_items.length;
    const dispensedItems = prescription.prescription_items.filter(item => 
      item.quantity_dispensed >= item.quantity_prescribed
    ).length;
    return Math.round((dispensedItems / totalItems) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Prescription Management</h2>
            <p className="text-sm text-muted-foreground">
              Manage digital prescriptions, dispensing, and patient medication records
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isNewPrescriptionOpen} onOpenChange={setIsNewPrescriptionOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Prescription
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create New Prescription</DialogTitle>
              </DialogHeader>
              <NewPrescriptionForm onSuccess={() => setIsNewPrescriptionOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Prescriptions</p>
                <p className="text-2xl font-bold">{prescriptionStats.totalPrescriptions}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{prescriptionStats.pendingPrescriptions}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dispensed Today</p>
                <p className="text-2xl font-bold text-green-600">{prescriptionStats.dispensedToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emergency</p>
                <p className="text-2xl font-bold text-red-600">{prescriptionStats.emergencyPrescriptions}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by prescription number, patient, doctor, or diagnosis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              className="px-3 py-2 border rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIALLY_DISPENSED">Partially Dispensed</option>
              <option value="DISPENSED">Dispensed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              className="px-3 py-2 border rounded-md"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priority</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="URGENT">Urgent</option>
              <option value="NORMAL">Normal</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Prescriptions ({filteredPrescriptions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prescription Details</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrescriptions.map((prescription) => {
                  const completionPercentage = getCompletionPercentage(prescription);
                  
                  return (
                    <TableRow key={prescription.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{prescription.prescription_number}</div>
                          <div className="text-sm text-muted-foreground">
                            Date: {prescription.prescription_date}
                          </div>
                          {prescription.diagnosis && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {prescription.diagnosis}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{prescription.patient_name}</div>
                          {prescription.patient_phone && (
                            <div className="text-sm text-muted-foreground">
                              {prescription.patient_phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Stethoscope className="h-3 w-3" />
                          <span className="text-sm">{prescription.doctor_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(prescription.status)}>
                          {prescription.status.replace('_', ' ')}
                        </Badge>
                        {prescription.status === 'PARTIALLY_DISPENSED' && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {completionPercentage}% complete
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(prescription.priority)}>
                          {prescription.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Pill className="h-3 w-3" />
                          <span className="text-sm">{prescription.prescription_items.length} items</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(prescription.final_amount)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedPrescription(prescription)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {prescription.status === 'PENDING' && (
                            <Button size="sm" variant="outline">
                              <Package className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Printer className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredPrescriptions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                            ? 'No prescriptions found matching your criteria.'
                            : 'No prescriptions available.'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Prescription Details Dialog */}
      <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Prescription Details - {selectedPrescription?.prescription_number}
            </DialogTitle>
          </DialogHeader>
          {selectedPrescription && (
            <PrescriptionDetailsView 
              prescription={selectedPrescription} 
              onClose={() => setSelectedPrescription(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// New Prescription Form Component
const NewPrescriptionForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_name: '',
    prescription_date: new Date().toISOString().split('T')[0],
    diagnosis: '',
    symptoms: '',
    priority: 'NORMAL' as const,
    notes: '',
    prescription_items: [
      {
        medicine_id: '',
        quantity_prescribed: 1,
        dosage_frequency: '',
        dosage_timing: '',
        duration_days: 7,
        special_instructions: ''
      }
    ]
  });

  const addPrescriptionItem = () => {
    setFormData(prev => ({
      ...prev,
      prescription_items: [
        ...prev.prescription_items,
        {
          medicine_id: '',
          quantity_prescribed: 1,
          dosage_frequency: '',
          dosage_timing: '',
          duration_days: 7,
          special_instructions: ''
        }
      ]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating prescription:', formData);
    alert('Prescription created successfully! (Demo mode)');
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Patient ID *</label>
          <Input
            required
            value={formData.patient_id}
            onChange={(e) => setFormData(prev => ({ ...prev, patient_id: e.target.value }))}
            placeholder="Enter patient ID"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Doctor Name *</label>
          <Input
            required
            value={formData.doctor_name}
            onChange={(e) => setFormData(prev => ({ ...prev, doctor_name: e.target.value }))}
            placeholder="Enter doctor name"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Prescription Date *</label>
          <Input
            type="date"
            required
            value={formData.prescription_date}
            onChange={(e) => setFormData(prev => ({ ...prev, prescription_date: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Priority</label>
          <select
            className="w-full p-2 border rounded"
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
          >
            <option value="NORMAL">Normal</option>
            <option value="URGENT">Urgent</option>
            <option value="EMERGENCY">Emergency</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium">Diagnosis</label>
        <Input
          value={formData.diagnosis}
          onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
          placeholder="Enter diagnosis"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Notes</label>
        <textarea
          className="w-full p-2 border rounded"
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={addPrescriptionItem}>
          Add Medicine
        </Button>
        <Button type="submit">Create Prescription</Button>
      </div>
    </form>
  );
};

// Prescription Details View Component
const PrescriptionDetailsView: React.FC<{ 
  prescription: Prescription; 
  onClose: () => void; 
}> = ({ prescription, onClose }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PARTIALLY_DISPENSED': return 'bg-blue-100 text-blue-800';
      case 'DISPENSED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  return (
    <Tabs defaultValue="details" className="space-y-4">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="medicines">Medicines</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Prescription Number</label>
            <p className="font-mono">{prescription.prescription_number}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Date</label>
            <p>{prescription.prescription_date}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Patient</label>
            <p className="font-medium">{prescription.patient_name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Doctor</label>
            <p>{prescription.doctor_name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Diagnosis</label>
            <p>{prescription.diagnosis || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <Badge className={getStatusColor(prescription.status)}>
              {prescription.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="medicines">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medicine</TableHead>
              <TableHead>Prescribed</TableHead>
              <TableHead>Dispensed</TableHead>
              <TableHead>Instructions</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prescription.prescription_items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{item.medicine_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.strength} • {item.dosage_form}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{item.quantity_prescribed}</TableCell>
                <TableCell>{item.quantity_dispensed}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{item.dosage_frequency}</div>
                    <div className="text-muted-foreground">{item.dosage_timing}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={item.quantity_dispensed >= item.quantity_prescribed ? "default" : "secondary"}>
                    {item.quantity_dispensed >= item.quantity_prescribed ? "Complete" : "Pending"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>

      <TabsContent value="history">
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
            <Activity className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium">Prescription Created</p>
              <p className="text-xs text-muted-foreground">{prescription.prescription_date}</p>
            </div>
          </div>
          {prescription.dispensed_at && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Dispensed</p>
                <p className="text-xs text-muted-foreground">{prescription.dispensed_at}</p>
              </div>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default PrescriptionManagement;
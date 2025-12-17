// Medicine Items Management Component - Medicine Master
import React, { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Package,
  Edit,
  Trash2,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MedicineMaster, ManufacturerCompany, Supplier } from '@/types/medicine';
import { useAuth } from '@/contexts/AuthContext';

const MedicineItems: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineMaster | null>(null);
  const [medicines, setMedicines] = useState<MedicineMaster[]>([]);
  const [batchStockMap, setBatchStockMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { toast } = useToast();
  const { hospitalConfig } = useAuth();

  const fetchMedicines = async () => {
    setLoading(true);

    // Fetch medicines from medicine_master with manufacturer and supplier
    const { data, error } = await supabase
      .from('medicine_master')
      .select(`
        *,
        manufacturer:manufacturer_companies(id, name),
        supplier:suppliers(id, supplier_name)
      `)
      .eq('is_deleted', false)
      .eq('hospital_name', hospitalConfig.fullName)
      .order('medicine_name');

    if (error) {
      console.error('Error fetching medicines:', error);
      toast({
        title: "Error",
        description: "Failed to fetch medicines",
        variant: "destructive"
      });
      setMedicines([]);
    } else {
      setMedicines(data || []);

      // Fetch batch inventory stock for all medicines
      const { data: batchData, error: batchError } = await supabase
        .from('medicine_batch_inventory')
        .select('medicine_id, current_stock')
        .eq('is_active', true);

      if (!batchError && batchData) {
        // Aggregate stock by medicine_id
        const stockMap: Record<string, number> = {};
        batchData.forEach((batch) => {
          if (batch.medicine_id) {
            stockMap[batch.medicine_id] = (stockMap[batch.medicine_id] || 0) + (batch.current_stock || 0);
          }
        });
        setBatchStockMap(stockMap);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    // Hard delete - permanently remove from database
    const { error } = await supabase
      .from('medicine_master')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting medicine:', error);
      toast({
        title: "Error",
        description: "Failed to delete medicine",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Medicine deleted successfully"
      });
      fetchMedicines();
    }
  };

  const handleEdit = (medicine: MedicineMaster) => {
    setSelectedMedicine(medicine);
    setIsEditDialogOpen(true);
  };

  const filteredMedicines = medicines.filter(medicine => {
    const searchLower = searchTerm.toLowerCase();
    return medicine.medicine_name?.toLowerCase().includes(searchLower) ||
           medicine.generic_name?.toLowerCase().includes(searchLower);
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMedicines = filteredMedicines.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Medicine Items</h2>
            <p className="text-sm text-muted-foreground">
              Manage medicine items - Add, Edit, and Delete medicines
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Medicine
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Medicine</DialogTitle>
              </DialogHeader>
              <AddMedicineForm
                hospitalName={hospitalConfig.fullName}
                onSuccess={() => {
                  setIsAddDialogOpen(false);
                  fetchMedicines();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Medicines</p>
              <p className="text-2xl font-bold">{medicines.length}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search medicines by name or generic name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Medicines Table */}
      <Card>
        <CardHeader>
          <CardTitle>Medicines ({filteredMedicines.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine Name</TableHead>
                  <TableHead>Generic Name</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading medicines...
                    </TableCell>
                  </TableRow>
                ) : paginatedMedicines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {searchTerm
                            ? 'No medicines found matching your search.'
                            : 'No medicines added yet. Click "Add Medicine" to get started.'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedMedicines.map((medicine) => {
                    const batchStock = batchStockMap[medicine.id] || 0;

                    return (
                      <TableRow key={medicine.id}>
                        <TableCell className="font-medium">{medicine.medicine_name}</TableCell>
                        <TableCell>{medicine.generic_name || 'N/A'}</TableCell>
                        <TableCell>{medicine.manufacturer?.name || 'N/A'}</TableCell>
                        <TableCell>{medicine.supplier?.supplier_name || 'N/A'}</TableCell>
                        <TableCell>{medicine.type || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={batchStock < 50 ? "destructive" : "outline"}>
                            {batchStock}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(medicine)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(medicine.id, medicine.medicine_name)}
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {filteredMedicines.length > 0 && (
            <div className="flex items-center justify-between px-2 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredMedicines.length)} of {filteredMedicines.length} medicines
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    const showPage =
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1);

                    if (!showPage) {
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2">...</span>;
                      }
                      return null;
                    }

                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="min-w-[40px]"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Medicine Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Medicine</DialogTitle>
          </DialogHeader>
          {selectedMedicine && (
            <EditMedicineForm
              medicine={selectedMedicine}
              hospitalName={hospitalConfig.fullName}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedMedicine(null);
                fetchMedicines();
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedMedicine(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Add Medicine Form Component
const AddMedicineForm: React.FC<{ hospitalName: string; onSuccess: () => void }> = ({ hospitalName, onSuccess }) => {
  const { toast } = useToast();
  const [manufacturers, setManufacturers] = useState<ManufacturerCompany[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState({
    medicine_name: '',
    generic_name: '',
    manufacturer_id: '',
    supplier_id: '',
    type: '',
  });

  useEffect(() => {
    // Fetch manufacturers
    const fetchManufacturers = async () => {
      const { data, error } = await supabase
        .from('manufacturer_companies')
        .select('*')
        .order('name');
      if (!error && data) {
        setManufacturers(data);
      }
    };

    // Fetch suppliers
    const fetchSuppliers = async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('supplier_name');
      if (!error && data) {
        setSuppliers(data);
      }
    };

    fetchManufacturers();
    fetchSuppliers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('medicine_master')
      .insert([
        {
          medicine_name: formData.medicine_name,
          generic_name: formData.generic_name || null,
          manufacturer_id: formData.manufacturer_id ? parseInt(formData.manufacturer_id) : null,
          supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
          type: formData.type || null,
          hospital_name: hospitalName,
        }
      ]);

    if (error) {
      console.error('Error adding medicine:', error);
      toast({
        title: "Error",
        description: `Failed to add medicine: ${error.message}`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Medicine added successfully!"
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Medicine Name *</label>
            <Input
              required
              value={formData.medicine_name}
              onChange={(e) => setFormData(prev => ({ ...prev, medicine_name: e.target.value }))}
              placeholder="Enter medicine name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Generic Name</label>
            <Input
              value={formData.generic_name}
              onChange={(e) => setFormData(prev => ({ ...prev, generic_name: e.target.value }))}
              placeholder="Enter generic name"
            />
          </div>
        </div>
      </div>

      {/* Manufacturer & Supplier */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Manufacturer & Supplier</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Manufacturer</label>
            <Select
              value={formData.manufacturer_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, manufacturer_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select manufacturer" />
              </SelectTrigger>
              <SelectContent>
                {manufacturers.map((manufacturer) => (
                  <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                    {manufacturer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Supplier</label>
            <Select
              value={formData.supplier_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.supplier_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Medicine Type */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Medicine Type</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Type</label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Injection">Injection</SelectItem>
                <SelectItem value="Vial">Vial</SelectItem>
                <SelectItem value="Syrup">Syrup</SelectItem>
                <SelectItem value="Syringe">Syringe</SelectItem>
                <SelectItem value="Tablets">Tablets</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="submit">Add Medicine</Button>
      </div>
    </form>
  );
};

// Edit Medicine Form Component
const EditMedicineForm: React.FC<{
  medicine: MedicineMaster;
  hospitalName: string;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ medicine, hospitalName, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const [manufacturers, setManufacturers] = useState<ManufacturerCompany[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState({
    medicine_name: medicine.medicine_name || '',
    generic_name: medicine.generic_name || '',
    manufacturer_id: medicine.manufacturer_id?.toString() || '',
    supplier_id: medicine.supplier_id?.toString() || '',
    type: medicine.type || '',
  });

  useEffect(() => {
    // Fetch manufacturers
    const fetchManufacturers = async () => {
      const { data, error } = await supabase
        .from('manufacturer_companies')
        .select('*')
        .order('name');
      if (!error && data) {
        setManufacturers(data);
      }
    };

    // Fetch suppliers
    const fetchSuppliers = async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('supplier_name');
      if (!error && data) {
        setSuppliers(data);
      }
    };

    fetchManufacturers();
    fetchSuppliers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('medicine_master')
      .update({
        medicine_name: formData.medicine_name,
        generic_name: formData.generic_name || null,
        manufacturer_id: formData.manufacturer_id ? parseInt(formData.manufacturer_id) : null,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
        type: formData.type || null,
        hospital_name: hospitalName,
      })
      .eq('id', medicine.id);

    if (error) {
      console.error('Error updating medicine:', error);
      toast({
        title: "Error",
        description: `Failed to update medicine: ${error.message}`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Medicine updated successfully!"
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Medicine Name *</label>
            <Input
              required
              value={formData.medicine_name}
              onChange={(e) => setFormData(prev => ({ ...prev, medicine_name: e.target.value }))}
              placeholder="Enter medicine name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Generic Name</label>
            <Input
              value={formData.generic_name}
              onChange={(e) => setFormData(prev => ({ ...prev, generic_name: e.target.value }))}
              placeholder="Enter generic name"
            />
          </div>
        </div>
      </div>

      {/* Manufacturer & Supplier */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Manufacturer & Supplier</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Manufacturer</label>
            <Select
              value={formData.manufacturer_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, manufacturer_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select manufacturer" />
              </SelectTrigger>
              <SelectContent>
                {manufacturers.map((manufacturer) => (
                  <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                    {manufacturer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Supplier</label>
            <Select
              value={formData.supplier_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.supplier_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Medicine Type */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Medicine Type</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Type</label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Injection">Injection</SelectItem>
                <SelectItem value="Vial">Vial</SelectItem>
                <SelectItem value="Syrup">Syrup</SelectItem>
                <SelectItem value="Syringe">Syringe</SelectItem>
                <SelectItem value="Tablets">Tablets</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Update Medicine</Button>
      </div>
    </form>
  );
};

export default MedicineItems;

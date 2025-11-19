import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Building2, Eye, Edit, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Ward {
  id: string;
  ward_type: string;
  location: string;
  ward_id: string;
  maximum_rooms: number;
  hospital_name?: string;
  created_at: string;
  updated_at: string;
}

interface WardFormData {
  ward_type: string;
  location: string;
  ward_id: string;
  maximum_rooms: string;
}

const RoomManagement: React.FC = () => {
  const { hospitalConfig } = useAuth();
  const navigate = useNavigate();
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [formData, setFormData] = useState<WardFormData>({
    ward_type: '',
    location: '',
    ward_id: '',
    maximum_rooms: ''
  });

  // Fetch wards data
  const fetchWards = async () => {
    try {
      setLoading(true);

      console.log('🔍 DEBUG - Hospital Config:', hospitalConfig);
      console.log('🔍 DEBUG - Hospital Name for Filter:', hospitalConfig?.name);

      let query = supabase
        .from('room_management')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply hospital filter - only show wards for logged-in hospital
      if (hospitalConfig?.name) {
        console.log('✅ Applying hospital filter:', hospitalConfig.name);
        query = query.eq('hospital_name', hospitalConfig.name);
      } else {
        console.log('⚠️ No hospital config - fetching all wards');
      }

      const { data, error } = await query;

      console.log('📊 Query Result - Data:', data);
      console.log('📊 Query Result - Error:', error);
      console.log('📊 Number of wards fetched:', data?.length || 0);

      if (error) {
        console.error('❌ Error fetching wards:', error);
        throw error;
      }

      setWards(data || []);
    } catch (error) {
      console.error('❌ Error fetching wards:', error);
      toast.error('Failed to fetch wards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWards();
  }, [hospitalConfig?.name]);

  // Filter wards based on search term
  const filteredWards = wards.filter(ward =>
    ward.ward_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ward.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ward.ward_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle add ward
  const handleAddWard = async () => {
    try {
      if (!formData.ward_type || !formData.location || !formData.ward_id || !formData.maximum_rooms) {
        toast.error('Please fill in all required fields');
        return;
      }

      const { data, error } = await supabase
        .from('room_management')
        .insert([{
          ward_type: formData.ward_type,
          location: formData.location,
          ward_id: formData.ward_id,
          maximum_rooms: parseInt(formData.maximum_rooms),
          hospital_name: hospitalConfig?.name || null
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding ward:', error);
        throw error;
      }

      toast.success('Ward added successfully');
      setIsAddDialogOpen(false);
      setFormData({ ward_type: '', location: '', ward_id: '', maximum_rooms: '' });
      fetchWards();
    } catch (error: any) {
      console.error('Error adding ward:', error);
      if (error.code === '23505') {
        toast.error('Ward ID already exists');
      } else {
        toast.error('Failed to add ward');
      }
    }
  };

  // Handle edit ward
  const handleEditWard = async () => {
    try {
      if (!selectedWard || !formData.ward_type || !formData.location || !formData.ward_id || !formData.maximum_rooms) {
        toast.error('Please fill in all required fields');
        return;
      }

      const { data, error } = await supabase
        .from('room_management')
        .update({
          ward_type: formData.ward_type,
          location: formData.location,
          ward_id: formData.ward_id,
          maximum_rooms: parseInt(formData.maximum_rooms),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedWard.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating ward:', error);
        throw error;
      }

      toast.success('Ward updated successfully');
      setIsEditDialogOpen(false);
      setSelectedWard(null);
      setFormData({ ward_type: '', location: '', ward_id: '', maximum_rooms: '' });
      fetchWards();
    } catch (error: any) {
      console.error('Error updating ward:', error);
      if (error.code === '23505') {
        toast.error('Ward ID already exists');
      } else {
        toast.error('Failed to update ward');
      }
    }
  };

  // Handle delete ward
  const handleDeleteWard = async () => {
    try {
      if (!selectedWard) return;

      const { error } = await supabase
        .from('room_management')
        .delete()
        .eq('id', selectedWard.id);

      if (error) {
        console.error('Error deleting ward:', error);
        throw error;
      }

      toast.success('Ward deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedWard(null);
      fetchWards();
    } catch (error) {
      console.error('Error deleting ward:', error);
      toast.error('Failed to delete ward');
    }
  };

  // Open edit dialog with selected ward data
  const openEditDialog = (ward: Ward) => {
    setSelectedWard(ward);
    setFormData({
      ward_type: ward.ward_type,
      location: ward.location,
      ward_id: ward.ward_id,
      maximum_rooms: ward.maximum_rooms.toString()
    });
    setIsEditDialogOpen(true);
  };

  // Open view dialog
  const openViewDialog = (ward: Ward) => {
    setSelectedWard(ward);
    setIsViewDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (ward: Ward) => {
    setSelectedWard(ward);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-green-700">
              <Building2 className="h-8 w-8" />
              Ward Management
            </h1>
            <p className="text-gray-600 mt-2">Manage hospital wards and rooms</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              Add Ward
            </Button>
            <Button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by ward type, location, or ward ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={fetchWards}>Refresh</Button>
          </div>
        </CardContent>
      </Card>

      {/* Wards Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredWards.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No wards found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-400">
                  <TableRow>
                    <TableHead className="font-bold text-black">Ward Type</TableHead>
                    <TableHead className="font-bold text-black">Location</TableHead>
                    <TableHead className="font-bold text-black">Ward ID</TableHead>
                    <TableHead className="font-bold text-black">Maximum Beds</TableHead>
                    <TableHead className="font-bold text-black">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWards.map((ward, index) => (
                    <TableRow
                      key={ward.id}
                      className={index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}
                    >
                      <TableCell className="font-medium">{ward.ward_type}</TableCell>
                      <TableCell>{ward.location}</TableCell>
                      <TableCell>{ward.ward_id}</TableCell>
                      <TableCell>{ward.maximum_rooms}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openViewDialog(ward)}
                            className="p-2 hover:bg-gray-200"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(ward)}
                            className="p-2 hover:bg-gray-200"
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDeleteDialog(ward)}
                            className="p-2 hover:bg-gray-200"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Ward Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Ward</DialogTitle>
            <DialogDescription>
              Enter the details for the new ward
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ward_type">Ward Type *</Label>
              <Input
                id="ward_type"
                placeholder="e.g., Delux Room - FIRST FLOOR"
                value={formData.ward_type}
                onChange={(e) => setFormData({ ...formData, ward_type: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="e.g., Hope Group"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ward_id">Ward ID *</Label>
              <Input
                id="ward_id"
                placeholder="e.g., VIPHOP980"
                value={formData.ward_id}
                onChange={(e) => setFormData({ ...formData, ward_id: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="maximum_rooms">Maximum Beds *</Label>
              <Input
                id="maximum_rooms"
                type="number"
                placeholder="e.g., 4"
                value={formData.maximum_rooms}
                onChange={(e) => setFormData({ ...formData, maximum_rooms: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddWard} className="bg-blue-600 hover:bg-blue-700">
                Add Ward
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Ward Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ward</DialogTitle>
            <DialogDescription>
              Update the ward details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_ward_type">Ward Type *</Label>
              <Input
                id="edit_ward_type"
                placeholder="e.g., Delux Room - FIRST FLOOR"
                value={formData.ward_type}
                onChange={(e) => setFormData({ ...formData, ward_type: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_location">Location *</Label>
              <Input
                id="edit_location"
                placeholder="e.g., Hope Group"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_ward_id">Ward ID *</Label>
              <Input
                id="edit_ward_id"
                placeholder="e.g., VIPHOP980"
                value={formData.ward_id}
                onChange={(e) => setFormData({ ...formData, ward_id: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_maximum_rooms">Maximum Beds *</Label>
              <Input
                id="edit_maximum_rooms"
                type="number"
                placeholder="e.g., 4"
                value={formData.maximum_rooms}
                onChange={(e) => setFormData({ ...formData, maximum_rooms: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditWard} className="bg-blue-600 hover:bg-blue-700">
                Update Ward
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Ward Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ward Details</DialogTitle>
          </DialogHeader>
          {selectedWard && (
            <div className="space-y-4">
              <div>
                <Label>Ward Type</Label>
                <p className="font-medium mt-1">{selectedWard.ward_type}</p>
              </div>
              <div>
                <Label>Location</Label>
                <p className="font-medium mt-1">{selectedWard.location}</p>
              </div>
              <div>
                <Label>Ward ID</Label>
                <p className="font-medium mt-1">{selectedWard.ward_id}</p>
              </div>
              <div>
                <Label>Maximum Beds</Label>
                <p className="font-medium mt-1">{selectedWard.maximum_rooms}</p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Ward Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ward</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this ward? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedWard && (
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded">
                <p><strong>Ward Type:</strong> {selectedWard.ward_type}</p>
                <p><strong>Ward ID:</strong> {selectedWard.ward_id}</p>
                <p><strong>Location:</strong> {selectedWard.location}</p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteWard}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Ward
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomManagement;

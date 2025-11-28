import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Building2, Plus, Edit, Trash2, Search } from 'lucide-react';
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
  DialogTrigger,
} from '@/components/ui/dialog';

interface CorporateData {
  id: string;
  name: string;
  description?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

const Corporate: React.FC = () => {
  const { hospitalConfig } = useAuth();
  const [corporateData, setCorporateData] = useState<CorporateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCorporate, setEditingCorporate] = useState<CorporateData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: ''
  });

  // Fetch corporate data
  const fetchCorporateData = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('corporate')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching corporate data:', error);
        throw error;
      }

      setCorporateData(data || []);
    } catch (error) {
      console.error('Error fetching corporate data:', error);
      toast.error('Failed to fetch corporate data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorporateData();
  }, []);

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Corporate name is required');
      return;
    }

    console.log('🚀 Starting corporate save process...');
    console.log('📝 Form data:', { name: formData.name.trim() });
    console.log('🔄 Edit mode:', !!editingCorporate);

    try {
      // Check authentication state (both Supabase and HMIS)
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      console.log('🔐 Supabase Auth session:', session?.user?.id ? 'Authenticated' : 'Not authenticated');
      console.log('🔐 Supabase User ID:', session?.user?.id);

      // Check HMIS authentication from context
      console.log('🏥 HMIS Auth user:', hospitalConfig ? 'Authenticated' : 'Not authenticated');
      console.log('🏥 HMIS User:', {
        isAuthenticated: !!hospitalConfig,
        hospitalType: hospitalConfig?.type,
        hospitalName: hospitalConfig?.name
      });

      if (authError) {
        console.error('❌ Supabase Auth error:', authError);
      }

      // For now, we'll bypass Supabase Auth and rely on HMIS authentication
      // This is because the system uses custom HMIS auth, not Supabase Auth
      if (!hospitalConfig) {
        console.error('❌ No HMIS user found');
        toast.error('Please log in to the HMIS system to save corporate data');
        return;
      }

      // Log that we're proceeding with HMIS auth instead of Supabase auth
      console.log('✅ Proceeding with HMIS authentication instead of Supabase auth');
      console.log('📝 Note: RLS should be disabled on corporate table for this to work');

      if (editingCorporate) {
        // Update existing corporate
        console.log('📝 Updating corporate with ID:', editingCorporate.id);
        const { data, error } = await supabase
          .from('corporate')
          .update({
            name: formData.name.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCorporate.id)
          .select();

        console.log('📊 Update response data:', data);
        console.log('❌ Update error:', error);

        if (error) {
          console.error('❌ Supabase update error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }
        toast.success('Corporate updated successfully');
      } else {
        // Create new corporate
        console.log('➕ Creating new corporate...');
        const insertData = {
          name: formData.name.trim()
        };
        console.log('📝 Insert data:', insertData);

        const { data, error } = await supabase
          .from('corporate')
          .insert(insertData)
          .select();

        console.log('📊 Insert response data:', data);
        console.log('❌ Insert error:', error);

        if (error) {
          console.error('❌ Supabase insert error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }
        console.log('✅ Corporate added successfully!');
        toast.success('Corporate added successfully');
      }

      // Reset form and close dialog
      setFormData({
        name: ''
      });
      setEditingCorporate(null);
      setIsDialogOpen(false);

      // Refresh data
      console.log('🔄 Refreshing corporate data...');
      fetchCorporateData();
    } catch (error: any) {
      console.error('❌ Complete error object:', error);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error details:', error?.details);
      console.error('❌ Error hint:', error?.hint);
      console.error('❌ Error code:', error?.code);

      // More specific error messages
      if (error?.message?.includes('permission denied')) {
        toast.error('Permission denied: Check database access policies');
      } else if (error?.message?.includes('relation') && error?.message?.includes('does not exist')) {
        toast.error('Database table not found: Please create corporate table');
      } else if (error?.message?.includes('duplicate key')) {
        toast.error('Corporate name already exists');
      } else {
        toast.error(`Failed to save: ${error?.message || 'Unknown error'}`);
      }
    }
  };

  // Handle edit
  const handleEdit = (corporate: CorporateData) => {
    setEditingCorporate(corporate);
    setFormData({
      name: corporate.name || ''
    });
    setIsDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this corporate?')) return;

    try {
      const { error } = await supabase
        .from('corporate')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Corporate deleted successfully');
      fetchCorporateData();
    } catch (error) {
      console.error('Error deleting corporate:', error);
      toast.error('Failed to delete corporate');
    }
  };

  // Filter corporate data based on search
  const filteredCorporateData = corporateData.filter(corporate =>
    corporate.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset form when dialog closes
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingCorporate(null);
    setFormData({
      name: ''
    });
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              Corporate Management
            </h1>
            <p className="text-gray-600 mt-2">Manage corporate details and information</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Corporate
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingCorporate ? 'Edit Corporate' : 'Add New Corporate'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Corporate Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter corporate name"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCorporate ? 'Update' : 'Submit'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by corporate name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Corporate Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Corporate Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredCorporateData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No corporate records found</div>
          ) : (
            <div className="space-y-3">
              {filteredCorporateData.map((corporate) => (
                <div key={corporate.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="font-medium text-lg">{corporate.name}</div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(corporate)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(corporate.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Corporate;
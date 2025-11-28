import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Syringe, Trash2, Edit } from 'lucide-react';
import { AddItemDialog } from '@/components/AddItemDialog';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

interface AyushmanAnaesthetist {
  name: string;
  specialty?: string;
  general_rate?: number;
  spinal_rate?: number;
  contact_info?: string;
}

const AyushmanAnaesthetists = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAnaesthetist, setEditingAnaesthetist] = useState<AyushmanAnaesthetist | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canEditMasters } = usePermissions();

  const { data: ayushmanAnaesthetists = [], isLoading } = useQuery({
    queryKey: ['ayushman-anaesthetists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ayushman_anaesthetists')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching Ayushman anaesthetists:', error);
        throw error;
      }

      return data || [];
    }
  });

  const addMutation = useMutation({
    mutationFn: async (newAnaesthetist: AyushmanAnaesthetist) => {
      const { data, error } = await supabase
        .from('ayushman_anaesthetists')
        .insert([newAnaesthetist])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ayushman-anaesthetists'] });
      queryClient.invalidateQueries({ queryKey: ['ayushman-anaesthetists-count'] });
      toast({
        title: "Success",
        description: "Ayushman anaesthetist added successfully",
      });
    },
    onError: (error) => {
      console.error('Add Ayushman anaesthetist error:', error);
      toast({
        title: "Error",
        description: "Failed to add Ayushman anaesthetist",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from('ayushman_anaesthetists')
        .delete()
        .eq('name', name);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ayushman-anaesthetists'] });
      queryClient.invalidateQueries({ queryKey: ['ayushman-anaesthetists-count'] });
      toast({
        title: "Success",
        description: "Ayushman anaesthetist deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete Ayushman anaesthetist error:', error);
      toast({
        title: "Error",
        description: "Failed to delete Ayushman anaesthetist",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ oldName, updates }: { oldName: string; updates: AyushmanAnaesthetist }) => {
      const { data, error } = await supabase
        .from('ayushman_anaesthetists')
        .update(updates)
        .eq('name', oldName)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ayushman-anaesthetists'] });
      toast({
        title: "Success",
        description: "Ayushman anaesthetist updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingAnaesthetist(null);
    },
    onError: (error) => {
      console.error('Update Ayushman anaesthetist error:', error);
      toast({
        title: "Error",
        description: "Failed to update Ayushman anaesthetist",
        variant: "destructive"
      });
    }
  });

  const filteredAnaesthetists = ayushmanAnaesthetists.filter(anaesthetist =>
    anaesthetist.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    anaesthetist.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = (formData: Record<string, string>) => {
    console.log('Submitting form data:', formData);

    // Create the data object with simplified fields
    const anaesthetistData: any = {
      name: formData.name,
      specialty: formData.specialty || undefined,
      contact_info: formData.contact_info || undefined
    };

    // Only add rate fields if they have values
    if (formData.general_rate && formData.general_rate.trim() !== '') {
      anaesthetistData.general_rate = parseFloat(formData.general_rate);
    }
    if (formData.spinal_rate && formData.spinal_rate.trim() !== '') {
      anaesthetistData.spinal_rate = parseFloat(formData.spinal_rate);
    }

    console.log('Final anaesthetist data:', anaesthetistData);
    addMutation.mutate(anaesthetistData);
  };

  const handleEdit = (anaesthetist: AyushmanAnaesthetist) => {
    setEditingAnaesthetist(anaesthetist);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (formData: Record<string, string>) => {
    if (editingAnaesthetist) {
      const updates: AyushmanAnaesthetist = {
        name: formData.name,
        specialty: formData.specialty || undefined,
        general_rate: formData.general_rate && formData.general_rate.trim() !== '' ? parseFloat(formData.general_rate) : undefined,
        spinal_rate: formData.spinal_rate && formData.spinal_rate.trim() !== '' ? parseFloat(formData.spinal_rate) : undefined,
        contact_info: formData.contact_info || undefined
      };

      updateMutation.mutate({
        oldName: editingAnaesthetist.name,
        updates: updates
      });
    }
  };

  const handleDelete = (name: string) => {
    if (confirm('Are you sure you want to delete this Ayushman anaesthetist?')) {
      deleteMutation.mutate(name);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading Ayushman anaesthetists...</div>
        </div>
      </div>
    );
  }

  const fields = [
    { key: 'name', label: 'Name', type: 'text' as const, required: true },
    { key: 'specialty', label: 'Specialty', type: 'text' as const },
    { key: 'general_rate', label: 'General Rate', type: 'number' as const },
    { key: 'spinal_rate', label: 'Spinal Rate', type: 'number' as const },
    { key: 'contact_info', label: 'Contact Info', type: 'text' as const }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Syringe className="h-8 w-8 text-green-600" />
            <h1 className="text-4xl font-bold text-green-600">
              Ayushman Anaesthetists Master List
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Manage Ayushman hospital anaesthetists
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search Ayushman anaesthetists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Ayushman Anaesthetist
          </Button>
        </div>

        <div className="grid gap-4">
          {filteredAnaesthetists.map((anaesthetist) => (
            <Card key={anaesthetist.name} className="hover:shadow-md transition-shadow border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-xl text-green-700">{anaesthetist.name}</span>
                  <div className="flex gap-2">
                    {anaesthetist.specialty && (
                      <Badge variant="outline" className="border-green-300 text-green-700">{anaesthetist.specialty}</Badge>
                    )}
                    {anaesthetist.general_rate && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">General: ₹{anaesthetist.general_rate}</Badge>
                    )}
                    {anaesthetist.spinal_rate && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">Spinal: ₹{anaesthetist.spinal_rate}</Badge>
                    )}
                    {canEditMasters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(anaesthetist)}
                        className="text-blue-600 hover:text-blue-700 border-blue-300"
                        title="Edit anaesthetist"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canEditMasters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(anaesthetist.name)}
                        className="text-red-600 hover:text-red-700 border-red-300"
                        title="Delete anaesthetist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              {(anaesthetist.general_rate || anaesthetist.spinal_rate) && (
                <CardContent>
                  <div className="text-sm space-y-1">
                    {anaesthetist.general_rate && (
                      <div><span className="font-semibold">General Rate:</span> ₹{anaesthetist.general_rate}</div>
                    )}
                    {anaesthetist.spinal_rate && (
                      <div><span className="font-semibold">Spinal Rate:</span> ₹{anaesthetist.spinal_rate}</div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {filteredAnaesthetists.length === 0 && (
          <div className="text-center py-12">
            <Syringe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              {searchTerm ? 'No Ayushman anaesthetists found matching your search.' : 'No Ayushman anaesthetists available.'}
            </p>
          </div>
        )}

        <AddItemDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAdd={handleAdd}
          title="Add Ayushman Anaesthetist"
          fields={fields}
        />

        <AddItemDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingAnaesthetist(null);
          }}
          onAdd={handleUpdate}
          title="Edit Ayushman Anaesthetist"
          fields={fields}
          initialData={{
            name: editingAnaesthetist?.name || '',
            specialty: editingAnaesthetist?.specialty || '',
            general_rate: editingAnaesthetist?.general_rate?.toString() || '',
            spinal_rate: editingAnaesthetist?.spinal_rate?.toString() || '',
            contact_info: editingAnaesthetist?.contact_info || ''
          }}
        />
      </div>
    </div>
  );
};

export default AyushmanAnaesthetists;
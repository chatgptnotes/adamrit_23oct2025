
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Syringe, Trash2, Edit } from 'lucide-react';
import { AddItemDialog } from '@/components/AddItemDialog';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

interface Implant {
  id: string;
  name: string;
  nabh_nabl_rate?: number;
  non_nabh_nabl_rate?: number;
  private_rate?: number;
  bhopal_nabh_rate?: number;
  bhopal_non_nabh_rate?: number;
  created_at: string;
  updated_at: string;
}

const ImplantMaster = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedImplant, setSelectedImplant] = useState<Implant | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canEditMasters } = usePermissions();

  const { data: implants = [], isLoading } = useQuery({
    queryKey: ['implants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('implants')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching implants:', error);
        throw error;
      }

      return data || [];
    }
  });

  const addMutation = useMutation({
    mutationFn: async (newImplant: {
      name: string;
      nabh_nabl_rate?: number;
      non_nabh_nabl_rate?: number;
      private_rate?: number;
      bhopal_nabh_rate?: number;
      bhopal_non_nabh_rate?: number;
    }) => {
      const { data, error } = await supabase
        .from('implants')
        .insert([newImplant])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['implants'] });
      toast({
        title: "Success",
        description: "Implant added successfully",
      });
    },
    onError: (error) => {
      console.error('Add implant error:', error);
      toast({
        title: "Error",
        description: "Failed to add implant",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('implants')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['implants'] });
      toast({
        title: "Success",
        description: "Implant deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete implant error:', error);
      toast({
        title: "Error",
        description: "Failed to delete implant",
        variant: "destructive"
      });
    }
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: {
      id: string;
      data: {
        name: string;
        nabh_nabl_rate?: number;
        non_nabh_nabl_rate?: number;
        private_rate?: number;
        bhopal_nabh_rate?: number;
        bhopal_non_nabh_rate?: number;
      }
    }) => {
      const { error } = await supabase
        .from('implants')
        .update({
          name: data.name,
          nabh_nabl_rate: data.nabh_nabl_rate,
          non_nabh_nabl_rate: data.non_nabh_nabl_rate,
          private_rate: data.private_rate,
          bhopal_nabh_rate: data.bhopal_nabh_rate,
          bhopal_non_nabh_rate: data.bhopal_non_nabh_rate,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['implants'] });
      toast({
        title: "Success",
        description: "Implant updated successfully",
      });
    },
    onError: (error) => {
      console.error('Edit implant error:', error);
      toast({
        title: "Error",
        description: "Failed to update implant",
        variant: "destructive"
      });
    }
  });

  const filteredImplants = implants.filter(implant =>
    implant.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = (formData: Record<string, string>) => {
    addMutation.mutate({
      name: formData.name,
      nabh_nabl_rate: formData.nabh_nabl_rate ? parseFloat(formData.nabh_nabl_rate) : undefined,
      non_nabh_nabl_rate: formData.non_nabh_nabl_rate ? parseFloat(formData.non_nabh_nabl_rate) : undefined,
      private_rate: formData.private_rate ? parseFloat(formData.private_rate) : undefined,
      bhopal_nabh_rate: formData.bhopal_nabh_rate ? parseFloat(formData.bhopal_nabh_rate) : undefined,
      bhopal_non_nabh_rate: formData.bhopal_non_nabh_rate ? parseFloat(formData.bhopal_non_nabh_rate) : undefined,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this implant?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (formData: Record<string, string>) => {
    if (selectedImplant) {
      editMutation.mutate({
        id: selectedImplant.id,
        data: {
          name: formData.name,
          nabh_nabl_rate: formData.nabh_nabl_rate ? parseFloat(formData.nabh_nabl_rate) : undefined,
          non_nabh_nabl_rate: formData.non_nabh_nabl_rate ? parseFloat(formData.non_nabh_nabl_rate) : undefined,
          private_rate: formData.private_rate ? parseFloat(formData.private_rate) : undefined,
          bhopal_nabh_rate: formData.bhopal_nabh_rate ? parseFloat(formData.bhopal_nabh_rate) : undefined,
          bhopal_non_nabh_rate: formData.bhopal_non_nabh_rate ? parseFloat(formData.bhopal_non_nabh_rate) : undefined,
        }
      });
    }
    setIsEditDialogOpen(false);
    setSelectedImplant(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading implants...</div>
        </div>
      </div>
    );
  }

  const fields = [
    { key: 'name', label: 'Name', type: 'text' as const, required: true },
    { key: 'nabh_nabl_rate', label: 'NABH/NABL Rate', type: 'number' as const },
    { key: 'non_nabh_nabl_rate', label: 'Non-NABH/NABL Rate', type: 'number' as const },
    { key: 'private_rate', label: 'Private Rate', type: 'number' as const },
    { key: 'bhopal_nabh_rate', label: 'Bhopal NABH Rate', type: 'number' as const },
    { key: 'bhopal_non_nabh_rate', label: 'Bhopal Non-NABH Rate', type: 'number' as const },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Syringe className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-primary">
              Implant Master List
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Manage implants
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search implants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Implant
          </Button>
        </div>

        <div className="grid gap-4">
          {filteredImplants.map((implant) => (
            <Card key={implant.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-xl">{implant.name}</span>
                  <div className="flex gap-2">
                    {canEditMasters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedImplant(implant);
                          setIsEditDialogOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                        title="Edit implant"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canEditMasters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(implant.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete implant"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">NABH/NABL Rate:</span>
                    <p className="font-medium">{implant.nabh_nabl_rate ?? '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Non-NABH/NABL Rate:</span>
                    <p className="font-medium">{implant.non_nabh_nabl_rate ?? '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Private Rate:</span>
                    <p className="font-medium">{implant.private_rate ?? '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bhopal NABH Rate:</span>
                    <p className="font-medium">{implant.bhopal_nabh_rate ?? '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bhopal Non-NABH Rate:</span>
                    <p className="font-medium">{implant.bhopal_non_nabh_rate ?? '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredImplants.length === 0 && (
          <div className="text-center py-12">
            <Syringe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              {searchTerm ? 'No implants found matching your search.' : 'No implants available.'}
            </p>
          </div>
        )}

        <AddItemDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAdd={handleAdd}
          title="Add Implant"
          fields={fields}
        />

        <AddItemDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedImplant(null);
          }}
          onAdd={handleEdit}
          title="Edit Implant"
          fields={fields}
          initialData={selectedImplant ? {
            name: selectedImplant.name || '',
            nabh_nabl_rate: selectedImplant.nabh_nabl_rate?.toString() || '',
            non_nabh_nabl_rate: selectedImplant.non_nabh_nabl_rate?.toString() || '',
            private_rate: selectedImplant.private_rate?.toString() || '',
            bhopal_nabh_rate: selectedImplant.bhopal_nabh_rate?.toString() || '',
            bhopal_non_nabh_rate: selectedImplant.bhopal_non_nabh_rate?.toString() || '',
          } : undefined}
        />
      </div>
    </div>
  );
};

export default ImplantMaster;

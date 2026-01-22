import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, Trash2, Phone, Edit } from 'lucide-react';
import { AddItemDialog } from '@/components/AddItemDialog';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

interface RelationshipManagerType {
  id: string;
  name: string;
  contact_no?: string;
  created_at: string;
  updated_at: string;
}

const RelationshipManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<RelationshipManagerType | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canEditMasters } = usePermissions();

  const { data: managers = [], isLoading } = useQuery({
    queryKey: ['relationship-managers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('relationship_managers')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching relationship managers:', error);
        throw error;
      }

      return data || [];
    }
  });

  const addMutation = useMutation({
    mutationFn: async (newManager: Omit<RelationshipManagerType, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('relationship_managers')
        .insert([newManager])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationship-managers'] });
      queryClient.invalidateQueries({ queryKey: ['relationship-managers-count'] });
      toast({
        title: "Success",
        description: "Relationship Manager added successfully",
      });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      console.error('Add relationship manager error:', error);
      toast({
        title: "Error",
        description: "Failed to add relationship manager",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('relationship_managers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationship-managers'] });
      queryClient.invalidateQueries({ queryKey: ['relationship-managers-count'] });
      toast({
        title: "Success",
        description: "Relationship Manager deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete relationship manager error:', error);
      toast({
        title: "Error",
        description: "Failed to delete relationship manager",
        variant: "destructive"
      });
    }
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RelationshipManagerType> }) => {
      const { error } = await supabase
        .from('relationship_managers')
        .update({
          name: data.name,
          contact_no: data.contact_no || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationship-managers'] });
      queryClient.invalidateQueries({ queryKey: ['relationship-managers-count'] });
      toast({
        title: "Success",
        description: "Relationship Manager updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedManager(null);
    },
    onError: (error: any) => {
      console.error('Edit relationship manager error:', error);
      toast({
        title: "Error",
        description: "Failed to update relationship manager",
        variant: "destructive"
      });
    }
  });

  const filteredManagers = managers.filter((manager: RelationshipManagerType) =>
    manager.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.contact_no?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = (formData: Record<string, string>) => {
    addMutation.mutate({
      name: formData.name,
      contact_no: formData.contact_no || undefined
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this relationship manager?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (formData: Record<string, string>) => {
    if (selectedManager) {
      editMutation.mutate({
        id: selectedManager.id,
        data: { name: formData.name, contact_no: formData.contact_no }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading relationship managers...</div>
        </div>
      </div>
    );
  }

  const fields = [
    { key: 'name', label: 'Name', type: 'text' as const, required: true },
    { key: 'contact_no', label: 'Contact No', type: 'text' as const }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-primary">
              Relationship Manager
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Manage relationship managers
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Relationship Manager
          </Button>
        </div>

        <div className="grid gap-4">
          {filteredManagers.map((manager: RelationshipManagerType) => (
            <Card key={manager.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-xl">{manager.name}</span>
                  <div className="flex gap-2 items-center">
                    {manager.contact_no && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {manager.contact_no}
                      </div>
                    )}
                    {canEditMasters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedManager(manager);
                          setIsEditDialogOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 ml-2"
                        title="Edit relationship manager"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canEditMasters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(manager.id)}
                        className="text-red-600 hover:text-red-700 ml-2"
                        title="Delete relationship manager"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {filteredManagers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              {searchTerm ? 'No relationship managers found matching your search.' : 'No relationship managers available.'}
            </p>
          </div>
        )}

        <AddItemDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAdd={handleAdd}
          title="Add Relationship Manager"
          fields={fields}
        />

        <AddItemDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedManager(null);
          }}
          onAdd={handleEdit}
          title="Edit Relationship Manager"
          fields={fields}
          initialData={selectedManager ? {
            name: selectedManager.name || '',
            contact_no: selectedManager.contact_no || ''
          } : undefined}
        />
      </div>
    </div>
  );
};

export default RelationshipManager;

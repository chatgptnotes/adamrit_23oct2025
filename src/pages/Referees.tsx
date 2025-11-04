
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Building2, Trash2 } from 'lucide-react';
import { AddItemDialog } from '@/components/AddItemDialog';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

interface Referee {
  id: string;
  name: string;
  specialty?: string;
  institution?: string;
  contact_info?: string;
  created_at: string;
  updated_at: string;
}

const Referees = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canEditMasters } = usePermissions();

  const { data: referees = [], isLoading } = useQuery({
    queryKey: ['referees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referees')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching referees:', error);
        throw error;
      }
      
      return data || [];
    }
  });

  const addMutation = useMutation({
    mutationFn: async (newReferee: Omit<Referee, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('referees')
        .insert([newReferee])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referees'] });
      queryClient.invalidateQueries({ queryKey: ['referees-count'] });
      toast({
        title: "Success",
        description: "Referee added successfully",
      });
    },
    onError: (error) => {
      console.error('Add referee error:', error);
      toast({
        title: "Error",
        description: "Failed to add referee",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('referees')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referees'] });
      queryClient.invalidateQueries({ queryKey: ['referees-count'] });
      toast({
        title: "Success",
        description: "Referee deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete referee error:', error);
      toast({
        title: "Error",
        description: "Failed to delete referee",
        variant: "destructive"
      });
    }
  });

  const filteredReferees = referees.filter(referee =>
    referee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referee.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referee.institution?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = (formData: Record<string, string>) => {
    addMutation.mutate({
      name: formData.name,
      specialty: formData.specialty || undefined,
      institution: formData.institution || undefined,
      contact_info: formData.contact_info || undefined
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this referee?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading referees...</div>
        </div>
      </div>
    );
  }

  const fields = [
    { key: 'name', label: 'Name', type: 'text' as const, required: true },
    { key: 'specialty', label: 'Specialty', type: 'text' as const },
    { key: 'institution', label: 'Institution', type: 'text' as const },
    { key: 'contact_info', label: 'Contact Info', type: 'text' as const }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-primary">
              Referees Master List
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Manage medical referees
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search referees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Referee
          </Button>
        </div>

        <div className="grid gap-4">
          {filteredReferees.map((referee) => (
            <Card key={referee.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-xl">{referee.name}</span>
                  <div className="flex gap-2">
                    {referee.specialty && (
                      <Badge variant="outline">{referee.specialty}</Badge>
                    )}
                    {referee.institution && (
                      <Badge variant="secondary">{referee.institution}</Badge>
                    )}
                    {canEditMasters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(referee.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete referee"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              {referee.contact_info && (
                <CardContent>
                  <div className="text-sm">
                    <span className="font-semibold">Contact:</span> {referee.contact_info}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {filteredReferees.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              {searchTerm ? 'No referees found matching your search.' : 'No referees available.'}
            </p>
          </div>
        )}

        <AddItemDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAdd={handleAdd}
          title="Add Referee"
          fields={fields}
        />
      </div>
    </div>
  );
};

export default Referees;

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AddItemDialog } from '@/components/AddItemDialog';

const Complications = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: complications = [], isLoading } = useQuery({
    queryKey: ['complications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('complications')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching complications:', error);
        throw error;
      }
      
      return data;
    }
  });

  const addComplicationMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('complications')
        .insert({ name, description })
        .select()
        .single();

      if (error) {
        console.error('Error adding complication:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complications'] });
      toast({
        title: "Success",
        description: "Complication added successfully",
      });
    },
    onError: (error) => {
      console.error('Add complication error:', error);
      toast({
        title: "Error",
        description: "Failed to add complication",
        variant: "destructive"
      });
    }
  });

  const filteredComplications = complications.filter(complication =>
    complication.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (complication.description && complication.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading complications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-16 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <AlertTriangle className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-primary">
              Complications Master List
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Manage all medical complications
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search complications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Complication
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredComplications.map((complication) => (
            <Card key={complication.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{complication.name}</CardTitle>
              </CardHeader>
              {complication.description && (
                <CardContent>
                  <p className="text-muted-foreground">{complication.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {filteredComplications.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              {searchTerm ? 'No complications found matching your search.' : 'No complications available.'}
            </p>
          </div>
        )}

        <AddItemDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAdd={(formData) => 
            addComplicationMutation.mutate({ 
              name: formData.name, 
              description: formData.description 
            })
          }
          title="Add New Complication"
          fields={[
            {
              key: 'name',
              label: 'Complication Name',
              type: 'text',
              required: true,
              placeholder: 'Enter complication name'
            },
            {
              key: 'description',
              label: 'Description (Optional)',
              type: 'textarea',
              placeholder: 'Enter description'
            }
          ]}
        />
      </div>
    </div>
  );
};

export default Complications;

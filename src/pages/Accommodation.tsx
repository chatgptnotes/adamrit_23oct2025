import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Bed, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AddItemDialog } from '@/components/AddItemDialog';

const Accommodation = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAccommodation, setEditingAccommodation] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accommodations = [], isLoading } = useQuery({
    queryKey: ['accommodations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accommodations')
        .select('*')
        .order('room_type');

      if (error) {
        console.error('Error fetching accommodations:', error);
        throw error;
      }

      return data;
    }
  });

  const addAccommodationMutation = useMutation({
    mutationFn: async ({ room_type, private_rate, nabh_rate, nabh_bhopal, non_nabh_rate, non_nabh_bhopal, tpa_rate }: {
      room_type: string;
      private_rate?: number;
      nabh_rate?: number;
      nabh_bhopal?: number;
      non_nabh_rate?: number;
      non_nabh_bhopal?: number;
      tpa_rate?: number;
    }) => {
      const { data, error } = await supabase
        .from('accommodations')
        .insert({ room_type, private_rate, nabh_rate, nabh_bhopal, non_nabh_rate, non_nabh_bhopal, tpa_rate })
        .select()
        .single();

      if (error) {
        console.error('Error adding accommodation:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodations'] });
      toast({
        title: "Success",
        description: "Accommodation added successfully",
      });
    },
    onError: (error) => {
      console.error('Add accommodation error:', error);
      toast({
        title: "Error",
        description: "Failed to add accommodation",
        variant: "destructive"
      });
    }
  });

  const updateAccommodationMutation = useMutation({
    mutationFn: async ({ id, room_type, private_rate, nabh_rate, nabh_bhopal, non_nabh_rate, non_nabh_bhopal, tpa_rate }: {
      id: string;
      room_type: string;
      private_rate?: number;
      nabh_rate?: number;
      nabh_bhopal?: number;
      non_nabh_rate?: number;
      non_nabh_bhopal?: number;
      tpa_rate?: number;
    }) => {
      const { data, error } = await supabase
        .from('accommodations')
        .update({ room_type, private_rate, nabh_rate, nabh_bhopal, non_nabh_rate, non_nabh_bhopal, tpa_rate })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating accommodation:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodations'] });
      setIsEditDialogOpen(false);
      setEditingAccommodation(null);
      toast({
        title: "Success",
        description: "Accommodation updated successfully",
      });
    },
    onError: (error) => {
      console.error('Update accommodation error:', error);
      toast({
        title: "Error",
        description: "Failed to update accommodation",
        variant: "destructive"
      });
    }
  });

  const deleteAccommodationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accommodations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting accommodation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodations'] });
      toast({
        title: "Success",
        description: "Accommodation deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete accommodation error:', error);
      toast({
        title: "Error",
        description: "Failed to delete accommodation",
        variant: "destructive"
      });
    }
  });

  const filteredAccommodations = accommodations.filter(accommodation =>
    (accommodation.room_type && accommodation.room_type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading accommodations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-16 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bed className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-primary">
              Accommodation Management
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Manage all hospital accommodations and rooms
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search accommodations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Accommodation
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAccommodations.map((accommodation) => (
            <Card key={accommodation.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5" />
                    {accommodation.room_type}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingAccommodation(accommodation);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this accommodation?')) {
                          deleteAccommodationMutation.mutate(accommodation.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {accommodation.private_rate && (
                    <p><span className="font-medium">Private Rate:</span> ₹{accommodation.private_rate}</p>
                  )}
                  {accommodation.nabh_rate && (
                    <p><span className="font-medium">NABH Rate:</span> ₹{accommodation.nabh_rate}</p>
                  )}
                  {accommodation.nabh_bhopal && (
                    <p><span className="font-medium">NABH Bhopal:</span> ₹{accommodation.nabh_bhopal}</p>
                  )}
                  {accommodation.non_nabh_rate && (
                    <p><span className="font-medium">Non-NABH Rate:</span> ₹{accommodation.non_nabh_rate}</p>
                  )}
                  {accommodation.non_nabh_bhopal && (
                    <p><span className="font-medium">NonNABH Bhopal:</span> ₹{accommodation.non_nabh_bhopal}</p>
                  )}
                  {accommodation.tpa_rate && (
                    <p><span className="font-medium">TPA Rate:</span> ₹{accommodation.tpa_rate}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAccommodations.length === 0 && (
          <div className="text-center py-12">
            <Bed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              {searchTerm ? 'No accommodations found matching your search.' : 'No accommodations available.'}
            </p>
          </div>
        )}

        <AddItemDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAdd={(formData) =>
            addAccommodationMutation.mutate({
              room_type: formData.room_type,
              private_rate: formData.private_rate ? parseFloat(formData.private_rate) : undefined,
              nabh_rate: formData.nabh_rate ? parseFloat(formData.nabh_rate) : undefined,
              nabh_bhopal: formData.nabh_bhopal ? parseFloat(formData.nabh_bhopal) : undefined,
              non_nabh_rate: formData.non_nabh_rate ? parseFloat(formData.non_nabh_rate) : undefined,
              non_nabh_bhopal: formData.non_nabh_bhopal ? parseFloat(formData.non_nabh_bhopal) : undefined,
              tpa_rate: formData.tpa_rate ? parseFloat(formData.tpa_rate) : undefined
            })
          }
          title="Add New Accommodation"
          fields={[
            {
              key: 'room_type',
              label: 'Room Type',
              type: 'text',
              required: true,
              placeholder: 'e.g., Private, Semi-private, Ward'
            },
            {
              key: 'private_rate',
              label: 'Private Rate',
              type: 'number',
              placeholder: 'Enter private rate'
            },
            {
              key: 'nabh_rate',
              label: 'NABH Rate',
              type: 'number',
              placeholder: 'Enter NABH rate'
            },
            {
              key: 'nabh_bhopal',
              label: 'NABH Bhopal',
              type: 'number',
              placeholder: 'Enter NABH Bhopal rate'
            },
            {
              key: 'non_nabh_rate',
              label: 'Non-NABH Rate',
              type: 'number',
              placeholder: 'Enter non-NABH rate'
            },
            {
              key: 'non_nabh_bhopal',
              label: 'NonNABH Bhopal',
              type: 'number',
              placeholder: 'Enter NonNABH Bhopal rate'
            },
            {
              key: 'tpa_rate',
              label: 'TPA Rate',
              type: 'number',
              placeholder: 'Enter TPA rate'
            }
          ]}
        />

        <AddItemDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingAccommodation(null);
          }}
          onAdd={(formData) =>
            updateAccommodationMutation.mutate({
              id: editingAccommodation.id,
              room_type: formData.room_type,
              private_rate: formData.private_rate ? parseFloat(formData.private_rate) : undefined,
              nabh_rate: formData.nabh_rate ? parseFloat(formData.nabh_rate) : undefined,
              nabh_bhopal: formData.nabh_bhopal ? parseFloat(formData.nabh_bhopal) : undefined,
              non_nabh_rate: formData.non_nabh_rate ? parseFloat(formData.non_nabh_rate) : undefined,
              non_nabh_bhopal: formData.non_nabh_bhopal ? parseFloat(formData.non_nabh_bhopal) : undefined,
              tpa_rate: formData.tpa_rate ? parseFloat(formData.tpa_rate) : undefined
            })
          }
          title="Edit Accommodation"
          fields={[
            {
              key: 'room_type',
              label: 'Room Type',
              type: 'text',
              required: true,
              placeholder: 'e.g., Private, Semi-private, Ward',
              defaultValue: editingAccommodation?.room_type
            },
            {
              key: 'private_rate',
              label: 'Private Rate',
              type: 'number',
              placeholder: 'Enter private rate',
              defaultValue: editingAccommodation?.private_rate?.toString()
            },
            {
              key: 'nabh_rate',
              label: 'NABH Rate',
              type: 'number',
              placeholder: 'Enter NABH rate',
              defaultValue: editingAccommodation?.nabh_rate?.toString()
            },
            {
              key: 'nabh_bhopal',
              label: 'NABH Bhopal',
              type: 'number',
              placeholder: 'Enter NABH Bhopal rate',
              defaultValue: editingAccommodation?.nabh_bhopal?.toString()
            },
            {
              key: 'non_nabh_rate',
              label: 'Non-NABH Rate',
              type: 'number',
              placeholder: 'Enter non-NABH rate',
              defaultValue: editingAccommodation?.non_nabh_rate?.toString()
            },
            {
              key: 'non_nabh_bhopal',
              label: 'NonNABH Bhopal',
              type: 'number',
              placeholder: 'Enter NonNABH Bhopal rate',
              defaultValue: editingAccommodation?.non_nabh_bhopal?.toString()
            },
            {
              key: 'tpa_rate',
              label: 'TPA Rate',
              type: 'number',
              placeholder: 'Enter TPA rate',
              defaultValue: editingAccommodation?.tpa_rate?.toString()
            }
          ]}
        />
      </div>
    </div>
  );
};

export default Accommodation;

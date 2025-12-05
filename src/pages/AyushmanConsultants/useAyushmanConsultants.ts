import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AyushmanConsultant } from './types';

export const useAyushmanConsultants = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState<AyushmanConsultant | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ayushmanConsultants = [], isLoading } = useQuery({
    queryKey: ['ayushman-consultants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ayushman_consultants')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching Ayushman consultants:', error);
        throw error;
      }

      return data || [];
    }
  });

  const addMutation = useMutation({
    mutationFn: async (newConsultant: Omit<AyushmanConsultant, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('ayushman_consultants')
        .insert([newConsultant])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ayushman-consultants'] });
      queryClient.invalidateQueries({ queryKey: ['ayushman-consultants-count'] });
      toast({
        title: "Success",
        description: "Ayushman consultant added successfully",
      });
    },
    onError: (error) => {
      console.error('Add Ayushman consultant error:', error);
      toast({
        title: "Error",
        description: "Failed to add Ayushman consultant",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AyushmanConsultant> }) => {
      const { data, error } = await supabase
        .from('ayushman_consultants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ayushman-consultants'] });
      toast({
        title: "Success",
        description: "Ayushman consultant updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingConsultant(null);
    },
    onError: (error) => {
      console.error('Update Ayushman consultant error:', error);
      toast({
        title: "Error",
        description: "Failed to update Ayushman consultant",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ayushman_consultants')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ayushman-consultants'] });
      queryClient.invalidateQueries({ queryKey: ['ayushman-consultants-count'] });
      toast({
        title: "Success",
        description: "Ayushman consultant deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete Ayushman consultant error:', error);
      toast({
        title: "Error",
        description: "Failed to delete Ayushman consultant",
        variant: "destructive"
      });
    }
  });

  const filteredConsultants = ayushmanConsultants.filter(consultant =>
    consultant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consultant.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consultant.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = (formData: Record<string, string>) => {
    addMutation.mutate({
      name: formData.name,
      specialty: formData.specialty || undefined,
      department: formData.department || undefined,
      contact_info: formData.contact_info || undefined,
      tpa_rate: formData.tpa_rate ? parseFloat(formData.tpa_rate) : undefined,
      non_nabh_rate: formData.non_nabh_rate ? parseFloat(formData.non_nabh_rate) : undefined,
      nabh_rate: formData.nabh_rate ? parseFloat(formData.nabh_rate) : undefined,
      private_rate: formData.private_rate ? parseFloat(formData.private_rate) : undefined
    });
  };

  const handleEdit = (consultant: AyushmanConsultant) => {
    setEditingConsultant(consultant);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (formData: Record<string, string>) => {
    if (editingConsultant) {
      updateMutation.mutate({
        id: editingConsultant.id,
        updates: {
          name: formData.name,
          specialty: formData.specialty || undefined,
          department: formData.department || undefined,
          contact_info: formData.contact_info || undefined,
          tpa_rate: formData.tpa_rate ? parseFloat(formData.tpa_rate) : undefined,
          non_nabh_rate: formData.non_nabh_rate ? parseFloat(formData.non_nabh_rate) : undefined,
          nabh_rate: formData.nabh_rate ? parseFloat(formData.nabh_rate) : undefined,
          private_rate: formData.private_rate ? parseFloat(formData.private_rate) : undefined
        }
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this Ayushman consultant?')) {
      deleteMutation.mutate(id);
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    isAddDialogOpen,
    setIsAddDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    editingConsultant,
    setEditingConsultant,
    ayushmanConsultants,
    isLoading,
    filteredConsultants,
    handleAdd,
    handleEdit,
    handleUpdate,
    handleDelete
  };
};
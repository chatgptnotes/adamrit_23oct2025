
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { HopeConsultant } from './types';

export const useHopeConsultants = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState<HopeConsultant | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: hopeConsultants = [], isLoading } = useQuery({
    queryKey: ['hope-consultants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hope_consultants')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching Hope consultants:', error);
        throw error;
      }
      
      return data || [];
    }
  });

  const addMutation = useMutation({
    mutationFn: async (newConsultant: Omit<HopeConsultant, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('hope_consultants')
        .insert([newConsultant])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hope-consultants'] });
      queryClient.invalidateQueries({ queryKey: ['hope-consultants-count'] });
      toast({
        title: "Success",
        description: "Hope consultant added successfully",
      });
    },
    onError: (error) => {
      console.error('Add Hope consultant error:', error);
      toast({
        title: "Error",
        description: "Failed to add Hope consultant",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HopeConsultant> }) => {
      const { data, error } = await supabase
        .from('hope_consultants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hope-consultants'] });
      toast({
        title: "Success",
        description: "Hope consultant updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingConsultant(null);
    },
    onError: (error) => {
      console.error('Update Hope consultant error:', error);
      toast({
        title: "Error",
        description: "Failed to update Hope consultant",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('hope_consultants')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hope-consultants'] });
      queryClient.invalidateQueries({ queryKey: ['hope-consultants-count'] });
      toast({
        title: "Success",
        description: "Hope consultant deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete Hope consultant error:', error);
      toast({
        title: "Error",
        description: "Failed to delete Hope consultant",
        variant: "destructive"
      });
    }
  });

  const filteredConsultants = hopeConsultants.filter(consultant =>
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

  const handleEdit = (consultant: HopeConsultant) => {
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
    if (confirm('Are you sure you want to delete this Hope consultant?')) {
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
    hopeConsultants,
    isLoading,
    filteredConsultants,
    handleAdd,
    handleEdit,
    handleUpdate,
    handleDelete
  };
};

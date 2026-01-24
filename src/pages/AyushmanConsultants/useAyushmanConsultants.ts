import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import * as XLSX from 'xlsx';
import { AyushmanConsultant } from './types';

export const useAyushmanConsultants = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState<AyushmanConsultant | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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

  // Pagination calculations
  const totalCount = filteredConsultants.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedConsultants = filteredConsultants.slice(startIndex, endIndex);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

  // Export function - downloads all consultants as Excel
  const handleExport = async () => {
    try {
      const { data, error } = await supabase
        .from('ayushman_consultants')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        sonnerToast.error('Failed to export data');
        return;
      }

      const headers = ['name', 'specialty', 'department', 'contact_info', 'tpa_rate', 'non_nabh_rate', 'nabh_rate', 'private_rate'];
      const headerLabels = ['Name', 'Specialty', 'Department', 'Contact Info', 'TPA Rate', 'Non-NABH Rate', 'NABH Rate', 'Private Rate'];

      const excelData = data
        .filter(row => row.name && row.name.trim())
        .map((row, index) => {
          const obj: any = { 'Sr No': index + 1 };
          headers.forEach((h, i) => {
            obj[headerLabels[i]] = (row as any)[h] || '';
          });
          return obj;
        });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'Ayushman Consultants');
      XLSX.writeFile(wb, `ayushman_consultants_export_${new Date().toISOString().split('T')[0]}.xlsx`);

      sonnerToast.success(`Exported ${data.length} records`);
    } catch (err) {
      sonnerToast.error('Export failed');
    }
  };

  // Import function - uploads Excel file and adds records
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const records = jsonData.map((row: any) => ({
          name: row['Name'] || row['name'] || null,
          specialty: row['Specialty'] || row['specialty'] || null,
          department: row['Department'] || row['department'] || null,
          contact_info: row['Contact Info'] || row['contact_info'] || null,
          tpa_rate: row['TPA Rate'] || row['tpa_rate'] || null,
          non_nabh_rate: row['Non-NABH Rate'] || row['non_nabh_rate'] || null,
          nabh_rate: row['NABH Rate'] || row['nabh_rate'] || null,
          private_rate: row['Private Rate'] || row['private_rate'] || null,
        })).filter((r: any) => r.name && r.name.trim());

        if (records.length === 0) {
          sonnerToast.error('No valid records found in file');
          return;
        }

        const { error } = await supabase.from('ayushman_consultants').insert(records);

        if (error) {
          sonnerToast.error('Failed to import: ' + error.message);
        } else {
          sonnerToast.success(`Imported ${records.length} records`);
          queryClient.invalidateQueries({ queryKey: ['ayushman-consultants'] });
        }
      } catch (err) {
        sonnerToast.error('Import failed - invalid file format');
      }
    };

    reader.readAsArrayBuffer(file);
    event.target.value = '';
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
    paginatedConsultants,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCount,
    itemsPerPage,
    handleAdd,
    handleEdit,
    handleUpdate,
    handleDelete,
    handleExport,
    handleImport
  };
};
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Syringe, Trash2, Edit, Download, Upload } from 'lucide-react';
import { AddItemDialog } from '@/components/AddItemDialog';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { toast as sonnerToast } from 'sonner';
import * as XLSX from 'xlsx';

interface HopeAnaesthetist {
  name: string;
  specialty?: string;
  general_rate?: number;
  spinal_rate?: number;
  contact_info?: string;
}

const HopeAnaesthetists = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAnaesthetist, setEditingAnaesthetist] = useState<HopeAnaesthetist | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canEditMasters } = usePermissions();

  const { data: hopeAnaesthetists = [], isLoading } = useQuery({
    queryKey: ['hope-anaesthetists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hope_anaesthetists')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching Hope anaesthetists:', error);
        throw error;
      }

      return data || [];
    }
  });

  const addMutation = useMutation({
    mutationFn: async (newAnaesthetist: HopeAnaesthetist) => {
      const { data, error } = await supabase
        .from('hope_anaesthetists')
        .insert([newAnaesthetist])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hope-anaesthetists'] });
      queryClient.invalidateQueries({ queryKey: ['hope-anaesthetists-count'] });
      toast({
        title: "Success",
        description: "Hope anaesthetist added successfully",
      });
    },
    onError: (error) => {
      console.error('Add Hope anaesthetist error:', error);
      toast({
        title: "Error",
        description: "Failed to add Hope anaesthetist",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from('hope_anaesthetists')
        .delete()
        .eq('name', name);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hope-anaesthetists'] });
      queryClient.invalidateQueries({ queryKey: ['hope-anaesthetists-count'] });
      toast({
        title: "Success",
        description: "Hope anaesthetist deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete Hope anaesthetist error:', error);
      toast({
        title: "Error",
        description: "Failed to delete Hope anaesthetist",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ oldName, updates }: { oldName: string; updates: HopeAnaesthetist }) => {
      const { data, error } = await supabase
        .from('hope_anaesthetists')
        .update(updates)
        .eq('name', oldName)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hope-anaesthetists'] });
      toast({
        title: "Success",
        description: "Hope anaesthetist updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingAnaesthetist(null);
    },
    onError: (error) => {
      console.error('Update Hope anaesthetist error:', error);
      toast({
        title: "Error",
        description: "Failed to update Hope anaesthetist",
        variant: "destructive"
      });
    }
  });

  const filteredAnaesthetists = hopeAnaesthetists.filter(anaesthetist =>
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

  const handleEdit = (anaesthetist: HopeAnaesthetist) => {
    setEditingAnaesthetist(anaesthetist);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (formData: Record<string, string>) => {
    if (editingAnaesthetist) {
      const updates: HopeAnaesthetist = {
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
    if (confirm('Are you sure you want to delete this Hope anaesthetist?')) {
      deleteMutation.mutate(name);
    }
  };

  // Export function - downloads all anaesthetists as Excel
  const handleExport = async () => {
    try {
      const { data, error } = await supabase
        .from('hope_anaesthetists')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        sonnerToast.error('Failed to export data');
        return;
      }

      const headers = ['name', 'specialty', 'general_rate', 'spinal_rate', 'contact_info'];
      const headerLabels = ['Name', 'Specialty', 'General Rate', 'Spinal Rate', 'Contact Info'];

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
      XLSX.utils.book_append_sheet(wb, ws, 'Hope Anaesthetists');
      XLSX.writeFile(wb, `hope_anaesthetists_export_${new Date().toISOString().split('T')[0]}.xlsx`);

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
          general_rate: row['General Rate'] || row['general_rate'] || null,
          spinal_rate: row['Spinal Rate'] || row['spinal_rate'] || null,
          contact_info: row['Contact Info'] || row['contact_info'] || null,
        })).filter((r: any) => r.name && r.name.trim());

        if (records.length === 0) {
          sonnerToast.error('No valid records found in file');
          return;
        }

        const { error } = await supabase.from('hope_anaesthetists').insert(records);

        if (error) {
          sonnerToast.error('Failed to import: ' + error.message);
        } else {
          sonnerToast.success(`Imported ${records.length} records`);
          queryClient.invalidateQueries({ queryKey: ['hope-anaesthetists'] });
        }
      } catch (err) {
        sonnerToast.error('Import failed - invalid file format');
      }
    };

    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading Hope anaesthetists...</div>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Syringe className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-primary">
              Hope Anaesthetists Master List
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Manage Hope hospital anaesthetists
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search Hope anaesthetists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </span>
              </Button>
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleImport} className="hidden" />
            </label>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Hope Anaesthetist
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredAnaesthetists.map((anaesthetist) => (
            <Card key={anaesthetist.name} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-xl">{anaesthetist.name}</span>
                  <div className="flex gap-2">
                    {anaesthetist.specialty && (
                      <Badge variant="outline">{anaesthetist.specialty}</Badge>
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
                        className="text-blue-600 hover:text-blue-700"
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
                        className="text-red-600 hover:text-red-700"
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
              {searchTerm ? 'No Hope anaesthetists found matching your search.' : 'No Hope anaesthetists available.'}
            </p>
          </div>
        )}

        <AddItemDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAdd={handleAdd}
          title="Add Hope Anaesthetist"
          fields={fields}
        />

        <AddItemDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingAnaesthetist(null);
          }}
          onAdd={handleUpdate}
          title="Edit Hope Anaesthetist"
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

export default HopeAnaesthetists;
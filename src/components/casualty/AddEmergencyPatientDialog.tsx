import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';
import { VisitRegistrationForm } from '@/components/VisitRegistrationForm';

interface Patient {
  id: string;
  name: string;
  patients_id: string;
}

interface AddEmergencyPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddEmergencyPatientDialog: React.FC<AddEmergencyPatientDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { toast } = useToast();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('id, name, patients_id')
          .ilike('name', `%${search.trim()}%`)
          .limit(10);
        if (error) throw error;
        setResults((data as Patient[]) || []);
      } catch (err: any) {
        toast({ title: 'Search failed', description: err.message, variant: 'destructive' });
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [search]);

  const handleClose = () => {
    setSearch('');
    setResults([]);
    setSelectedPatient(null);
    onOpenChange(false);
  };

  if (selectedPatient) {
    return (
      <VisitRegistrationForm
        isOpen={true}
        onClose={handleClose}
        patient={selectedPatient}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Emergency Patient</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Type patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {results.length > 0 && (
            <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
              {results.map((patient) => (
                <button
                  key={patient.id}
                  className="w-full text-left px-4 py-3 hover:bg-muted transition-colors"
                  onClick={() => setSelectedPatient(patient)}
                >
                  <p className="font-medium">{patient.name}</p>
                  <p className="text-sm text-muted-foreground">ID: {patient.patients_id}</p>
                </button>
              ))}
            </div>
          )}

          {!searching && search.trim() && results.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No patients found for "{search}"
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmergencyPatientDialog;

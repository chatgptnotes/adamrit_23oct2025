import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity, getDeviceInfo } from '@/lib/activity-logger';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText, Trash2, Edit, Save, X } from 'lucide-react';
import { format } from 'date-fns';

interface Patient {
  id: string;
  patients_id?: string;
  name: string;
  created_at: string;
  admission_date?: string;
  insurance_person_no?: string;
  age?: number;
  gender?: string;
  phone?: string;
  date_of_birth?: string;
  corporate?: string;
  relationship_manager?: string;
}

interface PatientsTableProps {
  patients: Patient[];
  onViewPatient: (patient: { id: string; name: string }) => void;
  onVisitRegistration: (patient: { id: string; name: string }) => void;
  onDeletePatient: (patient: { id: string; name: string }) => void;
  onEditPatient?: (patient: Patient) => void;
}

interface RmMaster {
  id: string;
  name: string;
  code: string | null;
}

export const PatientsTable: React.FC<PatientsTableProps> = ({
  patients,
  onViewPatient,
  onVisitRegistration,
  onDeletePatient,
  onEditPatient
}) => {
  const queryClient = useQueryClient();
  const [editingRmFor, setEditingRmFor] = useState<string | null>(null);
  const [draftRm, setDraftRm] = useState<string>('');

  const rmMasterQuery = useQuery({
    queryKey: ['patientsTableRmMaster'],
    queryFn: async (): Promise<RmMaster[]> => {
      const { data, error } = await supabase
        .from('relationship_managers' as never)
        .select('id, name, code')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as RmMaster[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Lookup: lowercase name → auto-generated code, so a saved
  // relationship_manager text on patients can be displayed with its code.
  const codeByName = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const m of rmMasterQuery.data ?? []) {
      if (m.code) map.set(m.name.trim().toLowerCase(), m.code);
    }
    return map;
  }, [rmMasterQuery.data]);

  // Also resolve a saved value that is itself already a code (e.g. "1037").
  const knownCodes = React.useMemo(() => {
    const set = new Set<string>();
    for (const m of rmMasterQuery.data ?? []) {
      if (m.code) set.add(m.code);
    }
    return set;
  }, [rmMasterQuery.data]);

  // Show ONLY the auto-generated code (e.g., "1103") when available.
  // Falls back to the raw value if a code isn't yet known (e.g., master list
  // hasn't loaded), and to "Direct" when no RM is assigned at all.
  const formatRmDisplay = (rmName: string | undefined): string => {
    if (!rmName) return 'Direct';
    const trimmed = rmName.trim();
    if (trimmed.toLowerCase() === 'direct') return 'Direct';
    if (knownCodes.has(trimmed)) return trimmed;
    const code = codeByName.get(trimmed.toLowerCase());
    return code || trimmed;
  };

  // Save handler that auto-creates the RM in the master if the typed name
  // doesn't match any existing entry (case-insensitive). Then saves the
  // resolved canonical name onto the patient and returns the assigned code.
  const saveRmSmartMutation = useMutation({
    mutationFn: async ({ patientId, typedName }: { patientId: string; typedName: string }) => {
      const trimmed = typedName.trim();
      // Empty or "Direct" → unset RM (patient becomes Direct).
      if (!trimmed || trimmed.toLowerCase() === 'direct') {
        const { error } = await supabase
          .from('patients')
          .update({ relationship_manager: null } as never)
          .eq('id', patientId);
        if (error) throw error;
        return { savedName: '', savedCode: '', created: false };
      }
      // Try case-insensitive match against master.
      const masters = rmMasterQuery.data ?? [];
      const match = masters.find((m) => m.name.trim().toLowerCase() === trimmed.toLowerCase());
      let canonicalName = match?.name;
      let canonicalCode: string | null = match?.code ?? null;
      let created = false;
      if (!canonicalName) {
        // Auto-create in master. Trigger auto-generates `code`; we read it back.
        const { data: inserted, error: insertErr } = await supabase
          .from('relationship_managers' as never)
          .insert([{ name: trimmed } as never])
          .select('name, code')
          .single();
        if (insertErr) throw insertErr;
        const row = inserted as unknown as { name: string; code: string | null };
        canonicalName = row.name;
        canonicalCode = row.code;
        created = true;
      }
      const { error } = await supabase
        .from('patients')
        .update({ relationship_manager: canonicalName } as never)
        .eq('id', patientId);
      if (error) throw error;
      return { savedName: canonicalName, savedCode: canonicalCode ?? '', created };
    },
    onSuccess: ({ savedName, savedCode, created }) => {
      // Audit: when a brand-new RM is added to the master from this table,
      // record who/which device created it (visible on the Activity Log page).
      if (created) {
        logActivity('relationship_manager_create', {
          name: savedName,
          code: savedCode || null,
          source: 'patients_table_inline',
          device: getDeviceInfo(),
        });
      }
      // Refresh every consumer of the RM master + patient lists, including
      // the /relationship-manager admin page so the new entry shows there too.
      queryClient.invalidateQueries({ queryKey: ['patientsTableRmMaster'] });
      queryClient.invalidateQueries({ queryKey: ['relationship-managers'] });
      queryClient.invalidateQueries({ queryKey: ['relationship-managers-count'] });
      queryClient.invalidateQueries({ queryKey: ['dailyRevenueRmMaster'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient-data'] });
      const codeStr = savedCode ? ` (code ${savedCode})` : '';
      if (!savedName) toast.success('RM cleared (Direct)');
      else if (created) toast.success(`Added "${savedName}"${codeStr} to Relationship Manager master + assigned to patient`);
      else toast.success(`RM set to "${savedName}"${codeStr}`);
      setEditingRmFor(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to save RM');
    },
  });

  const startEditRm = (patient: Patient) => {
    setEditingRmFor(patient.id);
    setDraftRm(patient.relationship_manager ?? '');
  };

  const cancelEditRm = () => {
    setEditingRmFor(null);
    setDraftRm('');
  };

  const saveEditRm = (patientId: string) => {
    saveRmSmartMutation.mutate({ patientId, typedName: draftRm });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return '-';
    }
  };

  const getInsuranceStatus = (insurancePersonNo?: string) => {
    return insurancePersonNo ? 'Active' : '-';
  };

  const getAgeGender = (age?: number, gender?: string) => {
    const ageStr = age ? age.toString() : '-';
    const genderStr = gender || '-';
    return `${ageStr} / ${genderStr}`;
  };

  const getPhone = (phone?: string) => {
    return phone || '-';
  };

  // Check if patient was recently created (within last 5 minutes)
  const isRecentlyCreated = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffInMinutes = (now.getTime() - created.getTime()) / (1000 * 60);
    return diffInMinutes <= 5;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Shared datalist for the inline RM typeable picker — supplies
          autocomplete suggestions to every row's input simultaneously. */}
      <datalist id="rm-master-datalist">
        {(rmMasterQuery.data ?? []).map((m) => (
          <option key={m.id} value={m.name}>{m.code ? `Code ${m.code}` : 'New'}</option>
        ))}
      </datalist>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold">Unique ID</TableHead>
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Age/Gender</TableHead>
            <TableHead className="font-semibold">Phone</TableHead>
            <TableHead className="font-semibold">Corporate</TableHead>
            <TableHead className="font-semibold">Relationship Manager</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Registration</TableHead>
            <TableHead className="font-semibold">Insurance</TableHead>
            <TableHead className="font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => {
            const isNewPatient = isRecentlyCreated(patient.created_at);
            const isEditing = editingRmFor === patient.id;

            return (
              <TableRow
                key={patient.id}
                className={`hover:bg-gray-50 ${isNewPatient ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}
              >
                <TableCell className="font-medium text-blue-600">
                  {patient.patients_id || 'Not assigned'}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {patient.name}
                    {isNewPatient && (
                      <Badge variant="outline" className="text-green-600 border-green-500 bg-green-50">
                        New
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getAgeGender(patient.age, patient.gender)}</TableCell>
                <TableCell>{getPhone(patient.phone)}</TableCell>
                <TableCell>{patient.corporate || '-'}</TableCell>
                <TableCell>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        list="rm-master-datalist"
                        value={draftRm}
                        onChange={(e) => setDraftRm(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditRm(patient.id);
                          else if (e.key === 'Escape') cancelEditRm();
                        }}
                        autoFocus
                        placeholder="Type RM name or 'Direct'"
                        className="h-8 w-48 border border-gray-300 rounded px-2 text-sm bg-white"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-green-600"
                        onClick={() => saveEditRm(patient.id)}
                        disabled={saveRmSmartMutation.isPending}
                        title="Save (Enter)"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-gray-500"
                        onClick={cancelEditRm}
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditRm(patient)}
                      className="text-left hover:bg-gray-100 px-2 py-0.5 rounded text-sm"
                      title="Click to change RM"
                    >
                      {formatRmDisplay(patient.relationship_manager)}
                    </button>
                  )}
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    Pending
                  </span>
                </TableCell>
                <TableCell>{formatDate(patient.created_at)}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    {getInsuranceStatus(patient.insurance_person_no)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewPatient({ id: patient.id, name: patient.name })}
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                      title="View patient details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onVisitRegistration({ id: patient.id, name: patient.name })}
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-800 animate-pulse hover:scale-110 transition-transform duration-200 relative before:absolute before:inset-0 before:rounded-full before:bg-green-500/20 before:animate-ping before:duration-1000 after:absolute after:inset-0 after:rounded-full after:bg-green-500/10 after:blur-sm hover:shadow-lg hover:shadow-green-500/50"
                      title="Register visit"
                    >
                      <FileText className="h-4 w-4 relative z-10" />
                    </Button>
                    {onEditPatient && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditPatient(patient)}
                        className="h-8 w-8 p-0 text-orange-600 hover:text-orange-800"
                        title="Edit patient"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeletePatient({ id: patient.id, name: patient.name })}
                      className="h-8 w-8 p-0 text-orange-600 hover:text-orange-800"
                      title="Mark patient inactive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

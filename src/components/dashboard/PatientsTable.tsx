
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText, Trash2, Edit } from 'lucide-react';
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
  // Read-only RM master lookup — purely so the table can resolve a saved RM
  // value (which may be a code OR a name) to its display form. No inline edit.
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

  // Build a single source of truth for "what to display for a given saved
  // relationship_manager value". The saved value may be either a code (e.g.
  // "1037") or a free-text name. We always render the code when we can.
  const rmIndex = React.useMemo(() => {
    const byCode = new Map<string, RmMaster>();
    const byLowerName = new Map<string, RmMaster>();
    for (const m of rmMasterQuery.data ?? []) {
      if (m.code) byCode.set(m.code, m);
      byLowerName.set(m.name.trim().toLowerCase(), m);
    }
    return { byCode, byLowerName };
  }, [rmMasterQuery.data]);

  const formatRmDisplay = (rmValue: string | undefined): string => {
    if (!rmValue) return 'Direct';
    const trimmed = rmValue.trim();
    if (trimmed.toLowerCase() === 'direct') return 'Direct';
    // Saved value is the code → use it as-is.
    if (rmIndex.byCode.has(trimmed)) return trimmed;
    // Saved value is a name → map back to its code if we can.
    const byName = rmIndex.byLowerName.get(trimmed.toLowerCase());
    if (byName?.code) return byName.code;
    // Last resort: show whatever's stored verbatim.
    return trimmed;
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
                  <span className="text-sm">
                    {formatRmDisplay(patient.relationship_manager)}
                  </span>
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


import React from 'react';
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
}

interface PatientsTableProps {
  patients: Patient[];
  onViewPatient: (patient: { id: string; name: string }) => void;
  onVisitRegistration: (patient: { id: string; name: string }) => void;
  onDeletePatient: (patient: { id: string; name: string }) => void;
  onEditPatient?: (patient: Patient) => void;
}

export const PatientsTable: React.FC<PatientsTableProps> = ({
  patients,
  onViewPatient,
  onVisitRegistration,
  onDeletePatient,
  onEditPatient
}) => {
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
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                      title="Delete patient"
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

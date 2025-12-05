
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Calendar, User, MapPin, Stethoscope, UserCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getVisitMedicalData } from '@/utils/medicalJunctionHelpers';

interface PatientInfoCardsProps {
  patient: any;
  formatDate: (dateString: string) => string;
  visits: any[];
}

const PatientInfoCards = ({ patient, formatDate, visits }: PatientInfoCardsProps) => {
  const latestVisitId = visits.length > 0 ? visits[0]?.id : null;

  // Fetch medical data for the latest visit
  const { data: medicalData } = useQuery({
    queryKey: ['visit-medical-data', latestVisitId],
    queryFn: () => getVisitMedicalData(latestVisitId!),
    enabled: !!latestVisitId
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-muted-foreground">Phone</span>
          </div>
          <p className="font-medium">{patient?.phone || 'Not provided'}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-muted-foreground">Last Visit</span>
          </div>
          <p className="font-medium">{visits.length > 0 ? formatDate(visits[0]?.visit_date) : 'No visits'} (IPD)</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-muted-foreground">Age/Gender</span>
          </div>
          <p className="font-medium">
            {patient?.age ? `${patient.age} years` : 'Unknown'} / {patient?.gender || 'Unknown'}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-muted-foreground">Status</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Admission: {formatDate(patient?.admission_date)} (IPD)
            </Badge>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-muted-foreground">Hope Surgeon</span>
          </div>
          <p className="font-medium">
            {medicalData?.hopeSurgeons?.length > 0 
              ? medicalData.hopeSurgeons.join(', ') 
              : 'Not assigned'
            }
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-indigo-600" />
            <span className="text-sm text-muted-foreground">Hope Consultants for IPD visits</span>
          </div>
          <p className="font-medium">
            {medicalData?.hopeConsultants?.length > 0 
              ? medicalData.hopeConsultants.join(', ') 
              : 'Not assigned'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientInfoCards;

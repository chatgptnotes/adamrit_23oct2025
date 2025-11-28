import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import PatientClinicalSidebar from '@/components/PatientClinicalSidebar';
import PatientHeader from '@/components/patient/PatientHeader';
import PatientInfoCards from '@/components/patient/PatientInfoCards';
import DischargeInfo from '@/components/patient/DischargeInfo';
import PatientTabs from '@/components/patient/PatientTabs';

const PatientProfile = () => {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');
  const [activeSection, setActiveSection] = useState('clinical-mgmt');

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      if (!patientId) return null;
      
      console.log('Fetching patient with ID:', patientId);
      
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          diagnoses!inner(name)
        `)
        .eq('id', patientId)
        .single();
      
      if (error) {
        console.error('Error fetching patient:', error);
        throw error;
      }
      
      console.log('Fetched patient data:', data);
      console.log('Patient patients_id:', data?.patients_id);
      
      return data;
    },
    enabled: !!patientId
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['patient-visits', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching visits:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!patientId
  });

  // Function removed - not needed anymore

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not provided';
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  const calculateAge = (admissionDate: string) => {
    if (!admissionDate) return 'Unknown';
    const today = new Date();
    const admission = new Date(admissionDate);
    const ageInYears = Math.floor((today.getTime() - admission.getTime()) / (1000 * 60 * 60 * 24 * 365));
    return `${ageInYears} years`;
  };

  if (patientLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading patient profile...</div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Patient not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6 print-hidden">
        {/* Header */}
        <PatientHeader 
          patient={patient} 
          patientId={patientId} 
          calculateAge={calculateAge}
          visits={visits}
        />

        {/* Patient Info Cards */}
        <PatientInfoCards 
          patient={patient} 
          formatDate={formatDate} 
          visits={visits} 
        />

        <DischargeInfo patient={patient} formatDate={formatDate} />
      </div>

      {/* Main Content Area with Sidebar and Tabs - Full Height Below Patient Details */}
      <div className="flex h-screen print-hidden">
        {/* Clinical Sidebar - Fixed Position */}
        <div className="flex-shrink-0 print-hidden">
          <PatientClinicalSidebar
            onSectionChange={setActiveSection}
            activeSection={activeSection}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 p-6">
          <PatientTabs patient={patient} visitId={visits.length > 0 ? visits[0].id : undefined} />
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;

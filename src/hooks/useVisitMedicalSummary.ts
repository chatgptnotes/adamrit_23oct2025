
// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VisitMedicalSummary {
  labs: string;
  radiology: string;
  medications: string;
  antibiotics: string;
  surgeries: string;
  sanctionStatus: string;
}

export const useVisitMedicalSummary = (visitId: string | undefined) => {
  return useQuery({
    queryKey: ['visit-medical-summary', visitId],
    queryFn: async (): Promise<VisitMedicalSummary> => {
      if (!visitId) {
        return {
          labs: '',
          radiology: '',
          medications: '',
          antibiotics: '',
          surgeries: '',
          sanctionStatus: ''
        };
      }

      // Check if visitId is a TEXT visit_id (like "IH25D26002") or UUID
      let actualVisitUUID = visitId;
      
      // If visitId looks like a TEXT visit_id (starts with "IH"), get the UUID
      if (visitId.startsWith('IH')) {
        console.log('Converting TEXT visit_id to UUID:', visitId);
        const { data: visitData } = await supabase
          .from('visits')
          .select('id')
          .eq('visit_id', visitId)
          .single();
        
        if (visitData) {
          actualVisitUUID = visitData.id;
          console.log('Found UUID for visit:', actualVisitUUID);
        } else {
          console.log('No visit found for visit_id:', visitId);
          return {
            labs: '',
            radiology: '',
            medications: '',
            antibiotics: '',
            surgeries: '',
            sanctionStatus: ''
          };
        }
      }

      // Fetch labs for this visit
      const { data: labs } = await supabase
        .from('visit_labs')
        .select(`
          lab:lab_id (name)
        `)
        .eq('visit_id', actualVisitUUID);

      // Fetch radiology for this visit  
      const { data: radiology } = await supabase
        .from('visit_radiology')
        .select(`
          radiology:radiology_id (name)
        `)
        .eq('visit_id', actualVisitUUID);

      // Fetch medications for this visit
      const { data: medications } = await supabase
        .from('visit_medications')
        .select(`
          medication:medication_id (name),
          medication_type
        `)
        .eq('visit_id', actualVisitUUID);

      // Fetch surgeries for this visit
      const { data: surgeries } = await supabase
        .from('visit_surgeries')
        .select(`
          surgery:surgery_id (name, code),
          sanction_status,
          status
        `)
        .eq('visit_id', actualVisitUUID);

      // Aggregate lab names
      const labNames = (labs || [])
        .map(l => (l.lab && typeof l.lab === 'object' && 'name' in l.lab) ? l.lab.name as string : null)
        .filter(Boolean);
      const aggregatedLabs = labNames.length > 0 ? labNames.join('; ') : '';

      // Aggregate radiology names
      const radiologyNames = (radiology || [])
        .map(r => (r.radiology && typeof r.radiology === 'object' && 'name' in r.radiology) ? r.radiology.name as string : null)
        .filter(Boolean);
      const aggregatedRadiology = radiologyNames.length > 0 ? radiologyNames.join('; ') : '';

      // Separate antibiotics and other medications
      const antibiotics = (medications || []).filter(m => 
        m.medication_type === 'antibiotic' || 
        (m.medication && typeof m.medication === 'object' && 'name' in m.medication && 
         typeof m.medication.name === 'string' && 
         (m.medication.name.toLowerCase().includes('antibiotic') ||
          m.medication.name.toLowerCase().includes('amoxicillin') ||
          m.medication.name.toLowerCase().includes('ceftriaxone')))
      );

      const otherMeds = (medications || []).filter(m => 
        m.medication_type !== 'antibiotic' && 
        !(m.medication && typeof m.medication === 'object' && 'name' in m.medication && 
          typeof m.medication.name === 'string' && 
          (m.medication.name.toLowerCase().includes('antibiotic') ||
           m.medication.name.toLowerCase().includes('amoxicillin') ||
           m.medication.name.toLowerCase().includes('ceftriaxone')))
      );

      const antibioticNames = antibiotics
        .map(a => (a.medication && typeof a.medication === 'object' && 'name' in a.medication) ? a.medication.name as string : null)
        .filter(Boolean);
      const otherMedNames = otherMeds
        .map(o => (o.medication && typeof o.medication === 'object' && 'name' in o.medication) ? o.medication.name as string : null)
        .filter(Boolean);

      // Aggregate surgery names with codes
      const surgeryNames = (surgeries || []).map(s => {
        const surgeryData = s.surgery;
        if (surgeryData && typeof surgeryData === 'object' && 'name' in surgeryData) {
          const name = surgeryData.name as string;
          const code = ('code' in surgeryData) ? surgeryData.code as string : null;
          return code ? `${name} (${code})` : name;
        }
        return null;
      }).filter(Boolean);
      const aggregatedSurgeries = surgeryNames.length > 0 ? surgeryNames.join('; ') : '';

      // Aggregate sanction statuses
      const sanctionStatuses = (surgeries || [])
        .map(s => s.sanction_status)
        .filter(Boolean);
      const aggregatedSanctionStatus = sanctionStatuses.length > 0 ? sanctionStatuses.join('; ') : '';

      return {
        labs: aggregatedLabs,
        radiology: aggregatedRadiology,
        medications: otherMedNames.length > 0 ? otherMedNames.join('; ') : '',
        antibiotics: antibioticNames.length > 0 ? antibioticNames.join('; ') : '',
        surgeries: aggregatedSurgeries,
        sanctionStatus: aggregatedSanctionStatus
      };
    },
    enabled: !!visitId,
  });
};

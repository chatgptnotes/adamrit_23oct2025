import { useState, useMemo } from 'react';
import { SearchAndControls } from '@/components/SearchAndControls';
import { DiagnosisCard } from '@/components/DiagnosisCard';
import { StatisticsCards } from '@/components/StatisticsCards';
import { AddPatientDialog } from '@/components/AddPatientDialog';
import { AddDiagnosisDialog } from '@/components/AddDiagnosisDialog';
import { NoResultsCard } from '@/components/NoResultsCard';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { usePatients } from '@/hooks/usePatients';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { hospitalConfig } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);
  const [isAddDiagnosisDialogOpen, setIsAddDiagnosisDialogOpen] = useState(false);
  const [selectedSurgery, setSelectedSurgery] = useState<string>();
  const [expandedSurgeries, setExpandedSurgeries] = useState<Record<string, boolean>>({});
  
  const {
    diagnoses,
    patients,
    isLoading,
    addPatient,
    updatePatient,
    deletePatient,
    addDiagnosis,
    isUpdatingPatient,
    isDeletingPatient
  } = usePatients();

  const { toast } = useToast();

  // 🚨 DEBUG: Check hospital config in Index
  console.log('📊 INDEX DEBUG: hospitalConfig =', hospitalConfig);
  console.log('📊 INDEX DEBUG: hospitalConfig.name =', hospitalConfig.name);

  // 🏥 EXPLICIT HOSPITAL FILTERING - If-Else Condition for Patient Data
  let currentHospital = '';
  if (hospitalConfig.name === 'hope') {
    currentHospital = 'hope';
    console.log('📊 HOPE Hospital - fetching patient_data records');
  } else if (hospitalConfig.name === 'ayushman') {
    currentHospital = 'ayushman';
    console.log('📊 AYUSHMAN Hospital - fetching patient_data records');
  } else {
    currentHospital = 'hope'; // default fallback
    console.log('📊 Unknown hospital, defaulting to hope patient_data records');
    console.log('📊 DEBUG: hospitalConfig.name was:', hospitalConfig.name);
  }

  // Fetch patient_data table data with hospital filtering
  const { data: patientDataRecords = [] } = useQuery({
    queryKey: ['patient-data-records', currentHospital, hospitalConfig.name], // Include hospital name in cache key
    queryFn: async () => {
      console.log('🚨 INDEX QUERY DEBUG: currentHospital =', currentHospital);
      console.log('🚨 INDEX QUERY DEBUG: About to query patients for hospital:', currentHospital);
      
      // Get patient IDs based on hospital_name column
      let patientsQuery = supabase
        .from('patients')
        .select('patients_id, hospital_name')
        .eq('hospital_name', currentHospital);
      
      console.log('🏥 Filtering patients by hospital_name =', currentHospital);
      
      const { data: patientsData, error: patientsError } = await patientsQuery;
      
      if (patientsError) {
        console.error('Error fetching patients for hospital filtering:', patientsError);
        return [];
      }
      
      const patientIds = patientsData?.map(p => p.patients_id) || [];
      
      console.log('🚨 INDEX QUERY RESULT: Found patients for hospital filtering:', patientsData);
      console.log('🚨 INDEX QUERY RESULT: Patient IDs for', currentHospital, ':', patientIds.slice(0, 5));
      
      if (patientIds.length === 0) {
        console.log('🚨 INDEX QUERY RESULT: No patients found for hospital:', currentHospital);
        return []; // Return empty if no patients for this hospital
      }
      
      // Then get patient_data for those hospital-specific patient IDs only
      const { data, error } = await supabase
        .from('patient_data')
        .select('*')
        .in('patient_id', patientIds)
        .order('sr_no', { ascending: false });

      if (error) {
        console.error('Error fetching patient_data:', error);
        throw error;
      }

      console.log(`Found ${data?.length || 0} patient_data records for hospital: ${hospitalConfig.name}`);
      return data || [];
    }
  });

  // Combine and deduplicate patients from both sources
  const combinedPatients = useMemo(() => {
    const combined = {};
    const seenPatientIds = new Set();

    // Add patients from main patients table
    if (patients && typeof patients === 'object') {
      Object.entries(patients).forEach(([surgery, patientList]) => {
        if (!combined[surgery]) combined[surgery] = [];

        if (Array.isArray(patientList)) {
          patientList.forEach(patient => {
            const uniqueId = patient.patients_id || patient.id || patient.name;
            if (!seenPatientIds.has(uniqueId)) {
              seenPatientIds.add(uniqueId);
              combined[surgery].push({
                ...patient,
                source: 'patients_table'
              });
            }
          });
        }
      });
    }

    // Add patients from patient_data table (if not already present)
    if (patientDataRecords && patientDataRecords.length > 0) {
      patientDataRecords.forEach(record => {
        const uniqueId = record.patient_id || record.mrn || record.patient_name;
        if (!seenPatientIds.has(uniqueId)) {
          seenPatientIds.add(uniqueId);

          // Determine surgery category and filter out unwanted categories
          const rawCategory = record.sst_or_secondary_treatment || 'Patient Data Records';

          // Skip unwanted categories
          const unwantedCategories = [
            'ESIC', 'Private', 'Patient Data Records', 'SST', '-',
            'Superspeciality Treatmention 2', 'Secondary (ST)', 'Secondary ( ST)',
            'Superspeciality Treatment 2', 'Superspeciality Treatmention', 'Superspeciality Treatment',
            'SST Treatment'
          ];

          if (unwantedCategories.includes(rawCategory)) {
            return; // Skip this record
          }

          const surgeryCategory = rawCategory;
          if (!combined[surgeryCategory]) combined[surgeryCategory] = [];

          // Transform patient_data format to match patients table format with ALL fields
          combined[surgeryCategory].push({
            id: record.patient_uuid || record.sr_no,
            patients_id: record.patient_id,
            name: record.patient_name,
            age: record.age,
            gender: record.sex,
            surgery: surgeryCategory,
            primaryDiagnosis: record.diagnosis_and_surgery_performed || record.sst_or_secondary_treatment || 'General',
            complications: 'None',
            labsRadiology: '',
            antibiotics: '',
            otherMedications: '',
            surgeon: record.surgery_performed_by || record.reff_dr_name || '',
            consultant: '',
            source: 'patient_data_table',

            // All patient_data table fields
            srNo: record.sr_no,
            patientUuid: record.patient_uuid,
            mrn: record.mrn,
            referralOriginalYesNo: record.referral_original_yes_no,
            ePahachanCardYesNo: record.e_pahachan_card_yes_no,
            hitlabhOrEntitelmentBenefitsYesNo: record.hitlabh_or_entitelment_benefits_yes_no,
            adharCardYesNo: record.adhar_card_yes_no,
            patientType: record.patient_type,
            reffDrName: record.reff_dr_name,
            dateOfAdmission: record.date_of_admission,
            dateOfDischarge: record.date_of_discharge,
            claimId: record.claim_id,
            intimationDoneNotDone: record.intimation_done_not_done,
            cghsSurgeryEsicReferral: record.cghs_surgery_esic_referral,
            diagnosisAndSurgeryPerformed: record.diagnosis_and_surgery_performed,
            totalPackageAmount: record.total_package_amount,
            billAmount: record.bill_amount,
            surgeryPerformedBy: record.surgery_performed_by,
            surgeryNameWithCghsAmountWithCghsCode: record.surgery_name_with_cghs_amount_with_cghs_code,
            surgery1InReferralLetter: record.surgery1_in_referral_letter,
            surgery2: record.surgery2,
            surgery3: record.surgery3,
            surgery4: record.surgery4,
            dateOfSurgery: record.date_of_surgery,
            cghsCodeUnlistedWithApprovalFromEsic: record.cghs_code_unlisted_with_approval_from_esic,
            cghsPackageAmountApprovedUnlistedAmount: record.cghs_package_amount_approved_unlisted_amount,
            paymentStatus: record.payment_status,
            onPortalSubmissionDate: record.on_portal_submission_date,
            billMadeByNameOfBillingExecutive: record.bill_made_by_name_of_billing_executive,
            extensionTakenNotTakenNotRequired: record.extension_taken_not_taken_not_required,
            delayWaiverForIntimationBillSubmissionTakenNotRequired: record.delay_waiver_for_intimation_bill_submission_taken_not_required,
            surgicalAdditionalApprovalTakenNotTakenNotRequiredBoth: record.surgical_additional_approval_taken_not_taken_not_required_both_,
            remark1: record.remark_1,
            remark2: record.remark_2
          });
        }
      });
    }

    return combined;
  }, [patients, patientDataRecords]);

  // Define static surgery categories that should always be displayed
  const staticCategories = [
    'No Surgery Assigned',  // Show patients without surgeries
    'HERNIA SURGERIES',
    'UROLOGICAL -Circumcision related',
    'UROLOGICAL - stones related',
    'UROLOGICAL - urethra related',
    'UROLOGICAL - Scrotum related',
    'VASCULAR PROCEDURES',
    'PLASTIC/RECONSTRUCTIVE SURGERY',
    'ORTHOPEDIC PROCEDURES',
    'GENERAL SURGERY',
    'WOUND CARE & DEBRIDEMENT',
    'COLORECTAL PROCEDURES'
  ];

  // Filter patients based on search term with improved search logic
  const filteredPatients = useMemo(() => {
    console.log('Filtering patients with search term:', searchTerm);
    console.log('Total combined patients before filtering:', combinedPatients);

    // Start with static categories
    const result: Record<string, any[]> = {};
    staticCategories.forEach(category => {
      result[category] = combinedPatients[category] || [];
    });

    // Add any existing categories that are not in static list and not in unwanted list
    const unwantedCategories = [
      'ESIC', 'Private', 'Patient Data Records', 'SST', '-',
      'Superspeciality Treatmention 2', 'Secondary (ST)', 'Secondary ( ST)',
      'Superspeciality Treatment 2', 'Superspeciality Treatmention', 'Superspeciality Treatment',
      'SST Treatment'
    ];

    Object.entries(combinedPatients).forEach(([surgery, patientList]) => {
      if (!staticCategories.includes(surgery) && !unwantedCategories.includes(surgery)) {
        result[surgery] = Array.isArray(patientList) ? patientList : [];
      }
    });

    if (!searchTerm || searchTerm.trim() === '') {
      console.log('No search term, returning all patients with static categories');
      return result;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    const filtered: Record<string, any[]> = {};

    Object.entries(result).forEach(([surgery, patientList]) => {
      const patientArray = Array.isArray(patientList) ? patientList : [];
      console.log(`Searching in surgery "${surgery}" with ${patientArray.length} patients`);

      const matchingPatients = patientArray.filter((patient: any) => {
        const matches = [
          patient.name?.toLowerCase().includes(searchLower),
          patient.primaryDiagnosis?.toLowerCase().includes(searchLower),
          patient.surgeon?.toLowerCase().includes(searchLower),
          patient.consultant?.toLowerCase().includes(searchLower),
          patient.hopeSurgeon?.toLowerCase().includes(searchLower),
          patient.hopeConsultants?.toLowerCase().includes(searchLower),
          patient.surgery?.toLowerCase().includes(searchLower),
          patient.complications?.toLowerCase().includes(searchLower),
          surgery.toLowerCase().includes(searchLower)
        ].some(match => match === true);

        if (matches) {
          console.log('Found matching patient:', patient.name);
        }
        return matches;
      });

      // Include category if it has matching patients OR if it's a static category OR if surgery name matches search
      // But exclude unwanted categories
      const unwantedCategories = [
        'ESIC', 'Private', 'Patient Data Records', 'SST', '-',
        'Superspeciality Treatmention 2', 'Secondary (ST)', 'Secondary ( ST)',
        'Superspeciality Treatment 2', 'Superspeciality Treatmention', 'Superspeciality Treatment',
        'SST Treatment'
      ];

      if (!unwantedCategories.includes(surgery) &&
          (matchingPatients.length > 0 || staticCategories.includes(surgery) || surgery.toLowerCase().includes(searchLower))) {
        filtered[surgery] = matchingPatients;
        console.log(`Added ${matchingPatients.length} patients to filtered results for surgery "${surgery}"`);
      }
    });

    console.log('Filtered results:', filtered);
    return filtered;
  }, [combinedPatients, searchTerm]);

  // Initialize expanded state for all surgeries
  useMemo(() => {
    const initialExpanded: Record<string, boolean> = {};
    Object.keys(filteredPatients).forEach(surgery => {
      if (!(surgery in expandedSurgeries)) {
        initialExpanded[surgery] = true;
      }
    });
    if (Object.keys(initialExpanded).length > 0) {
      setExpandedSurgeries(prev => ({ ...prev, ...initialExpanded }));
    }
  }, [filteredPatients, expandedSurgeries]);

  // Calculate statistics from combined patients
  const totalPatients: number = Object.values(combinedPatients).reduce<number>((sum: number, patientList) => {
    const patientArray = Array.isArray(patientList) ? patientList : [];
    return sum + patientArray.length;
  }, 0);
  
  const handleAddPatient = (surgery: string, patient: any) => {
    addPatient({ diagnosisName: surgery, patient });
  };

  const handleEditPatient = (patientId: string, updatedPatient: any) => {
    updatePatient({ patientId, updatedData: updatedPatient });
  };

  const handleDeletePatient = (patientId: string) => {
    deletePatient(patientId);
  };

  const handleAddPatientClick = (surgery?: string) => {
    setSelectedSurgery(surgery);
    setIsAddPatientDialogOpen(true);
  };

  const handleToggleSurgery = (surgery: string) => {
    setExpandedSurgeries(prev => ({
      ...prev,
      [surgery]: !prev[surgery]
    }));
  };

  const handleCollapseAll = () => {
    const collapsed: Record<string, boolean> = {};
    Object.keys(filteredPatients).forEach(surgery => {
      collapsed[surgery] = false;
    });
    setExpandedSurgeries(collapsed);
  };

  const handleImportPatients = async (importData: any[]) => {
    try {
      // Process each patient import
      for (const item of importData) {
        await new Promise(resolve => {
          addPatient({ diagnosisName: item.diagnosis, patient: item.patient });
          // Add a small delay to prevent overwhelming the system
          setTimeout(resolve, 100);
        });
      }
      
      toast({
        title: "Import Complete",
        description: `Successfully imported ${importData.length} patients`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Error",
        description: "Some patients could not be imported. Please check the data and try again.",
        variant: "destructive"
      });
    }
  };

  const handleSearchChange = (value: string) => {
    console.log('Search term updated in Index:', value);
    setSearchTerm(value);
  };

  const diagnosisNames = diagnoses.map(d => d.name);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-4">
            ESIC IPD Patient Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage and track patients across different medical specialties
          </p>
        </div>

        <StatisticsCards 
          totalPatients={totalPatients}
        />

        <SearchAndControls
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onAddPatientClick={() => handleAddPatientClick()}
          onAddDiagnosisClick={() => setIsAddDiagnosisDialogOpen(true)}
          patientData={filteredPatients}
          diagnoses={diagnosisNames}
          onImportPatients={handleImportPatients}
        />

        {Object.keys(filteredPatients).length > 0 && (
          <div className="mb-4 flex justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCollapseAll}
              className="flex items-center gap-2"
            >
              <ChevronDown className="h-4 w-4" />
              Collapse All
            </Button>
          </div>
        )}

         <div className="grid gap-6">
          {Object.keys(filteredPatients).length === 0 ? (
            <NoResultsCard searchTerm={searchTerm} />
          ) : (
            Object.entries(filteredPatients).map(([surgery, patientList]) => (
              <DiagnosisCard
                key={surgery}
                diagnosis={surgery}
                patients={Array.isArray(patientList) ? patientList : []}
                onAddPatient={() => handleAddPatientClick(surgery)}
                onEditPatient={handleEditPatient}
                onDeletePatient={handleDeletePatient}
                isUpdatingPatient={isUpdatingPatient}
                isDeletingPatient={isDeletingPatient}
                isExpanded={expandedSurgeries[surgery] !== false}
                onToggleExpanded={() => handleToggleSurgery(surgery)}
              />
            ))
          )}
        </div>

        <AddPatientDialog
          isOpen={isAddPatientDialogOpen}
          onClose={() => {
            setIsAddPatientDialogOpen(false);
            setSelectedSurgery(undefined);
          }}
          onPatientAdded={(patient) => {
            if (selectedSurgery) {
              handleAddPatient(selectedSurgery, patient);
            }
          }}
        />

        <AddDiagnosisDialog
          isOpen={isAddDiagnosisDialogOpen}
          onClose={() => setIsAddDiagnosisDialogOpen(false)}
          onAddDiagnosis={(name: string, description?: string) => 
            addDiagnosis({ name, description })
          }
        />
      </div>
    </div>
  );
};

export default Index;

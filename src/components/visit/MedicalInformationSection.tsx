import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import SearchableCghsSurgerySelect from '@/components/SearchableCghsSurgerySelect';
import SearchableLabSelect from '@/components/SearchableLabSelect';
import SearchableRadiologySelect from '@/components/SearchableRadiologySelect';
import SearchableMedicationSelect from '@/components/SearchableMedicationSelect';
import { useDiagnoses } from '@/hooks/useDiagnoses';

interface MedicalInformationSectionProps {
  formData: {
    diagnosis: string;
    surgery: string;
    referringDoctor: string;
    claimId: string;
    labs: string;
    radiology: string;
    otherMedications: string;
  };
  handleInputChange: (field: string, value: string) => void;
  onDiagnosisChange?: (diagnosisString: string, diagnosisIds: string[]) => void;
  onSurgeryChange?: (surgeryString: string, surgeryIds: string[], surgeryStatuses: { [surgeryId: string]: 'Sanctioned' | 'Not Sanctioned' }, surgeryDetails?: { [surgeryId: string]: { implant?: string; anaesthetistName?: string; anaesthesiaType?: string; } }) => void;
  onLabsChange?: (labsString: string, labIds: string[]) => void;
  onRadiologyChange?: (radiologyString: string, radiologyIds: string[]) => void;
  onMedicationsChange?: (medicationsString: string, medicationIds: string[]) => void;
}

export const MedicalInformationSection: React.FC<MedicalInformationSectionProps> = ({
  formData,
  handleInputChange,
  onDiagnosisChange,
  onSurgeryChange,
  onLabsChange,
  onRadiologyChange,
  onMedicationsChange
}) => {
  const { diagnoses, isLoading: diagnosesLoading } = useDiagnoses();
  const [referees, setReferees] = useState<Array<{ id: string; name: string; specialty?: string; institution?: string }>>([]);
  const [anaesthetists, setAnaesthetists] = useState<Array<{ id: string; name: string; specialty?: string }>>([]);
  const [isLoadingAnaesthetists, setIsLoadingAnaesthetists] = useState(true);
  const [isLoadingReferees, setIsLoadingReferees] = useState(true);
  const [refereesError, setRefereesError] = useState<string | null>(null);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedSurgeries, setSelectedSurgeries] = useState<Array<{
    id: string;
    name: string;
    code?: string;
    sanctionStatus?: 'Sanctioned' | 'Not Sanctioned';
    implant?: string;
    anaesthetistName?: string;
    anaesthesiaType?: string;
  }>>([]);
  const [selectedLabs, setSelectedLabs] = useState<Array<{ id: string; name: string; description?: string; category?: string }>>([]);
  const [selectedRadiology, setSelectedRadiology] = useState<Array<{ id: string; name: string; description?: string; category?: string }>>([]);
  const [selectedMedications, setSelectedMedications] = useState<Array<{ id: string; name: string; generic_name?: string; category?: string }>>([]);
  const [showDiagnosisDropdown, setShowDiagnosisDropdown] = useState(false);
  const [diagnosisSearchTerm, setDiagnosisSearchTerm] = useState('');

  useEffect(() => {
    const fetchReferees = async () => {
      try {
        setIsLoadingReferees(true);
        setRefereesError(null);
        console.log('Fetching referees from referees table...');
        
        // First, let's check if we can connect to the database at all
        const { data: testData, error: testError } = await supabase
          .from('referees')
          .select('count', { count: 'exact', head: true });
        
        console.log('Table count check:', { testData, testError });
        
        const { data, error } = await supabase
          .from('referees')
          .select('id, name, specialty, institution')
          .order('name');
        
        console.log('Raw query response:', { data, error });
        console.log('Data type:', typeof data);
        console.log('Data length:', data?.length);
        console.log('Individual records:', data);
        
        if (error) {
          console.error('Error fetching referees:', error);
          setRefereesError(`Failed to load referring doctors: ${error.message}`);
          setReferees([]);
        } else {
          console.log('Referees fetched successfully:', data);
          console.log('Setting referees state with:', data || []);
          setReferees(data || []);
        }
      } catch (error) {
        console.error('Exception while fetching referees:', error);
        setRefereesError(`Failed to load referring doctors: ${error}`);
        setReferees([]);
      } finally {
        setIsLoadingReferees(false);
      }
    };

    fetchReferees();

    // Fetch anaesthetists from hope_consultants table
    const fetchAnaesthetists = async () => {
      try {
        setIsLoadingAnaesthetists(true);
        const { data, error } = await supabase
          .from('hope_consultants')
          .select('id, name, specialty')
          .or('specialty.ilike.%anaesth%,specialty.ilike.%anesthes%')
          .order('name');

        if (error) {
          console.error('Error fetching anaesthetists:', error);
          setAnaesthetists([]);
        } else {
          // If no anaesthetists found with specialty filter, fetch all consultants
          if (!data || data.length === 0) {
            const { data: allConsultants, error: allError } = await supabase
              .from('hope_consultants')
              .select('id, name, specialty')
              .order('name');

            if (!allError) {
              setAnaesthetists(allConsultants || []);
            }
          } else {
            setAnaesthetists(data);
          }
        }
      } catch (error) {
        console.error('Exception while fetching anaesthetists:', error);
        setAnaesthetists([]);
      } finally {
        setIsLoadingAnaesthetists(false);
      }
    };

    fetchAnaesthetists();
  }, []);

  // Initialize selected diagnoses from formData
  useEffect(() => {
    if (formData.diagnosis) {
      const diagnosisNames = formData.diagnosis.split(', ').filter(name => name.trim());
      const selected = diagnosisNames.map(name => ({ id: name, name }));
      setSelectedDiagnoses(selected);
    }
  }, []);

  // Initialize selected surgeries from formData
  useEffect(() => {
    if (formData.surgery) {
      const surgeryNames = formData.surgery.split(', ').filter(name => name.trim());
      const selected = surgeryNames.map(name => ({ id: name, name }));
      setSelectedSurgeries(selected);
    }
  }, []);

  // Update formData when selectedDiagnoses changes
  useEffect(() => {
    const diagnosisString = selectedDiagnoses.map(d => d.name).join(', ');
    const diagnosisIds = selectedDiagnoses.map(d => d.id);
    handleInputChange('diagnosis', diagnosisString);
    onDiagnosisChange?.(diagnosisString, diagnosisIds);
  }, [selectedDiagnoses, handleInputChange, onDiagnosisChange]);

  // Update formData when selectedSurgeries changes
  useEffect(() => {
    const surgeryString = selectedSurgeries.map(s => s.name).join(', ');
    const surgeryIds = selectedSurgeries.map(s => s.id);
    const surgeryStatuses = selectedSurgeries.reduce((acc, surgery) => {
      acc[surgery.id] = surgery.sanctionStatus || 'Not Sanctioned';
      return acc;
    }, {} as { [surgeryId: string]: 'Sanctioned' | 'Not Sanctioned' });

    const surgeryDetails = selectedSurgeries.reduce((acc, surgery) => {
      acc[surgery.id] = {
        implant: surgery.implant,
        anaesthetistName: surgery.anaesthetistName,
        anaesthesiaType: surgery.anaesthesiaType
      };
      return acc;
    }, {} as { [surgeryId: string]: { implant?: string; anaesthetistName?: string; anaesthesiaType?: string; } });

    handleInputChange('surgery', surgeryString);
    onSurgeryChange?.(surgeryString, surgeryIds, surgeryStatuses, surgeryDetails);
  }, [selectedSurgeries, handleInputChange, onSurgeryChange]);

  // Update formData when selectedLabs changes
  useEffect(() => {
    const labsString = selectedLabs.map(l => l.name).join(', ');
    const labIds = selectedLabs.map(l => l.id);
    handleInputChange('labs', labsString);
    onLabsChange?.(labsString, labIds);
  }, [selectedLabs, handleInputChange, onLabsChange]);

  // Update formData when selectedRadiology changes
  useEffect(() => {
    const radiologyString = selectedRadiology.map(r => r.name).join(', ');
    const radiologyIds = selectedRadiology.map(r => r.id);
    handleInputChange('radiology', radiologyString);
    onRadiologyChange?.(radiologyString, radiologyIds);
  }, [selectedRadiology, handleInputChange, onRadiologyChange]);

  // Update formData when selectedMedications changes
  useEffect(() => {
    const medicationsString = selectedMedications.map(m => m.name).join(', ');
    const medicationIds = selectedMedications.map(m => m.id);
    handleInputChange('otherMedications', medicationsString);
    onMedicationsChange?.(medicationsString, medicationIds);
  }, [selectedMedications, handleInputChange, onMedicationsChange]);

  const handleDiagnosisSelect = (diagnosis: { id: string; name: string }) => {
    if (!selectedDiagnoses.some(selected => selected.id === diagnosis.id)) {
      setSelectedDiagnoses(prev => [...prev, diagnosis]);
    }
    setDiagnosisSearchTerm('');
    setShowDiagnosisDropdown(false);
  };

  const handleRemoveDiagnosis = (diagnosisId: string) => {
    setSelectedDiagnoses(prev => prev.filter(d => d.id !== diagnosisId));
  };

  const handleAddSurgery = (surgery: { id: string; name: string; code?: string }) => {
    if (!selectedSurgeries.some(selected => selected.id === surgery.id)) {
      setSelectedSurgeries(prev => [...prev, { ...surgery, sanctionStatus: 'Not Sanctioned' }]);
    }
  };

  const handleSurgeryStatusChange = (surgeryId: string, status: 'Sanctioned' | 'Not Sanctioned') => {
    setSelectedSurgeries(prev =>
      prev.map(surgery =>
        surgery.id === surgeryId
          ? { ...surgery, sanctionStatus: status }
          : surgery
      )
    );
  };

  const handleSurgeryFieldChange = (surgeryId: string, field: 'implant' | 'anaesthetistName' | 'anaesthesiaType', value: string) => {
    setSelectedSurgeries(prev =>
      prev.map(surgery =>
        surgery.id === surgeryId
          ? { ...surgery, [field]: value }
          : surgery
      )
    );
  };

  const handleRemoveSurgery = (surgeryId: string) => {
    setSelectedSurgeries(prev => prev.filter(s => s.id !== surgeryId));
  };

  const handleAddLab = (lab: { id: string; name: string; description?: string; category?: string }) => {
    if (!selectedLabs.some(selected => selected.id === lab.id)) {
      setSelectedLabs(prev => [...prev, lab]);
    }
  };

  const handleRemoveLab = (labId: string) => {
    setSelectedLabs(prev => prev.filter(l => l.id !== labId));
  };

  const handleAddRadiology = (radiology: { id: string; name: string; description?: string; category?: string }) => {
    if (!selectedRadiology.some(selected => selected.id === radiology.id)) {
      setSelectedRadiology(prev => [...prev, radiology]);
    }
  };

  const handleRemoveRadiology = (radiologyId: string) => {
    setSelectedRadiology(prev => prev.filter(r => r.id !== radiologyId));
  };

  const handleAddMedication = (medication: { id: string; name: string; generic_name?: string; category?: string }) => {
    if (!selectedMedications.some(selected => selected.id === medication.id)) {
      setSelectedMedications(prev => [...prev, medication]);
    }
  };

  const handleRemoveMedication = (medicationId: string) => {
    setSelectedMedications(prev => prev.filter(m => m.id !== medicationId));
  };

  const filteredDiagnoses = diagnoses.filter(diagnosis => 
    diagnosis.name.toLowerCase().includes(diagnosisSearchTerm.toLowerCase()) &&
    !selectedDiagnoses.some(selected => selected.id === diagnosis.id)
  );

  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-blue-700 mb-4">Medical Information</h3>
      
      <div className="grid grid-cols-1 gap-4">
        {/* Diagnosis Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-blue-600">
              <Search className="h-5 w-5" />
            </div>
            <Label className="text-blue-600 font-medium">
              Diagnosis
            </Label>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Search and add diagnosis, view related complications
          </p>
          
          <div className="relative">
            <Input
              placeholder="Search"
              value={diagnosisSearchTerm}
              onChange={(e) => {
                setDiagnosisSearchTerm(e.target.value);
                setShowDiagnosisDropdown(e.target.value.length > 0);
              }}
              onFocus={() => setShowDiagnosisDropdown(diagnosisSearchTerm.length > 0)}
              className="pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            
            {showDiagnosisDropdown && diagnosisSearchTerm && (
              <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {diagnosesLoading ? (
                  <div className="p-2 text-sm text-gray-500">Loading...</div>
                ) : filteredDiagnoses.length > 0 ? (
                  filteredDiagnoses.map((diagnosis) => (
                    <button
                      key={diagnosis.id}
                      className="w-full text-left p-2 hover:bg-gray-100 text-sm"
                      onClick={() => handleDiagnosisSelect(diagnosis)}
                    >
                      <div className="font-medium">{diagnosis.name}</div>
                      {diagnosis.description && (
                        <div className="text-gray-500 text-xs">{diagnosis.description}</div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500">No diagnoses found</div>
                )}
              </div>
            )}
          </div>

          {/* Selected Diagnoses */}
          {selectedDiagnoses.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 text-black">Selected Diagnoses</h4>
              <div className="flex flex-wrap gap-2">
                {selectedDiagnoses.map((diagnosis) => (
                  <Badge key={diagnosis.id} className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white">
                    {diagnosis.name}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleRemoveDiagnosis(diagnosis.id)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Surgery - Multi Select from CGHS Surgery procedures table */}
        <div className="space-y-2">
          <Label htmlFor="surgery" className="text-sm font-medium">
            Surgery (if applicable)
          </Label>
          
          {/* Selected Surgeries with Sanction Status */}
          {selectedSurgeries.length > 0 && (
            <div className="space-y-3 mb-2">
              {selectedSurgeries.map((surgery) => (
                <div key={surgery.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500 text-white">
                      {surgery.name} {surgery.code && `(${surgery.code})`}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Sanction Status:</Label>
                    <Select
                      value={surgery.sanctionStatus || 'Not Sanctioned'}
                      onValueChange={(value) => handleSurgeryStatusChange(surgery.id, value as 'Sanctioned' | 'Not Sanctioned')}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sanctioned">
                          <span className="text-green-600 font-medium">✓ Sanctioned</span>
                        </SelectItem>
                        <SelectItem value="Not Sanctioned">
                          <span className="text-red-600 font-medium">✗ Not Sanctioned</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveSurgery(surgery.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* New fields below sanction status */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 pl-4 border-l-2 border-blue-200">
                    {/* Anaesthetist name field */}
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-700">Anaesthetist name</Label>
                      <Select
                        value={surgery.anaesthetistName || ''}
                        onValueChange={(value) => handleSurgeryFieldChange(surgery.id, 'anaesthetistName', value)}
                        disabled={isLoadingAnaesthetists}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder={isLoadingAnaesthetists ? "Loading..." : "Select anaesthetist"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {!isLoadingAnaesthetists && anaesthetists.map((anaesthetist) => (
                            <SelectItem key={anaesthetist.id} value={anaesthetist.name}>
                              {anaesthetist.name}
                              {anaesthetist.specialty && ` (${anaesthetist.specialty})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Type of anaesthesia service field */}
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-700">Type of anes.Service</Label>
                      <Select
                        value={surgery.anaesthesiaType || ''}
                        onValueChange={(value) => handleSurgeryFieldChange(surgery.id, 'anaesthesiaType', value)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Regional">Regional</SelectItem>
                          <SelectItem value="Local">Local</SelectItem>
                          <SelectItem value="Sedation">Sedation</SelectItem>
                          <SelectItem value="Spinal">Spinal</SelectItem>
                          <SelectItem value="Epidural">Epidural</SelectItem>
                          <SelectItem value="Combined Spinal-Epidural">Combined Spinal-Epidural</SelectItem>
                          <SelectItem value="Monitored Anesthesia Care">Monitored Anesthesia Care</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Implant field */}
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-700">Implant</Label>
                      <Input
                        type="text"
                        placeholder="Enter implant details"
                        value={surgery.implant || ''}
                        onChange={(e) => handleSurgeryFieldChange(surgery.id, 'implant', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <SearchableCghsSurgerySelect
            selectedSurgeries={selectedSurgeries}
            onAddSurgery={handleAddSurgery}
          />
        </div>

        {/* Labs - Multi Select from Lab table */}
        <div className="space-y-2">
          <Label htmlFor="labs" className="text-sm font-medium">
            Labs
          </Label>
          
          {/* Selected Labs */}
          {selectedLabs.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedLabs.map((lab) => (
                <Badge key={lab.id} className="flex items-center gap-1 bg-purple-500 hover:bg-purple-600 text-white">
                  {lab.name} {lab.category && `(${lab.category})`}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleRemoveLab(lab.id)}
                  />
                </Badge>
              ))}
            </div>
          )}

          <SearchableLabSelect
            selectedLabs={selectedLabs}
            onAddLab={handleAddLab}
          />
        </div>

        {/* Radiology - Multi Select from Radiology table */}
        <div className="space-y-2">
          <Label htmlFor="radiology" className="text-sm font-medium">
            Radiology
          </Label>
          
          {/* Selected Radiology */}
          {selectedRadiology.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedRadiology.map((radiology) => (
                <Badge key={radiology.id} className="flex items-center gap-1 bg-indigo-500 hover:bg-indigo-600 text-white">
                  {radiology.name} {radiology.category && `(${radiology.category})`}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleRemoveRadiology(radiology.id)}
                  />
                </Badge>
              ))}
            </div>
          )}

          <SearchableRadiologySelect
            selectedRadiology={selectedRadiology}
            onAddRadiology={handleAddRadiology}
          />
        </div>

        {/* Other Medications - Multi Select from Medication table */}
        <div className="space-y-2">
          <Label htmlFor="otherMedications" className="text-sm font-medium">
            Other Medications
          </Label>
          
          {/* Selected Medications */}
          {selectedMedications.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedMedications.map((medication) => (
                <Badge key={medication.id} className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white">
                  {medication.name} {medication.category && `(${medication.category})`}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleRemoveMedication(medication.id)}
                  />
                </Badge>
              ))}
            </div>
          )}

          <SearchableMedicationSelect
            selectedMedications={selectedMedications}
            onAddMedication={handleAddMedication}
          />
        </div>

        {/* Referring Doctor */}
        <div className="space-y-2">
          <Label htmlFor="referringDoctor" className="text-sm font-medium">
            Referring Doctor
          </Label>
          <Select 
            value={formData.referringDoctor} 
            onValueChange={(value) => handleInputChange('referringDoctor', value)}
            disabled={isLoadingReferees}
          >
            <SelectTrigger className="bg-white">
              <SelectValue 
                placeholder={
                  isLoadingReferees 
                    ? "Loading referring doctors..." 
                    : refereesError 
                    ? "Error loading referring doctors"
                    : referees.length === 0 
                    ? "No referring doctors available" 
                    : "Select Referring Doctor"
                } 
              />
            </SelectTrigger>
            <SelectContent className="bg-white z-50 max-h-60 overflow-y-auto">
              {!isLoadingReferees && !refereesError && referees.length > 0 && referees.map((referee) => (
                <SelectItem key={referee.id} value={referee.name} className="hover:bg-gray-100">
                  <div className="flex flex-col">
                    <span className="font-medium">{referee.name}</span>
                    {(referee.specialty || referee.institution) && (
                      <span className="text-sm text-gray-500">
                        {referee.specialty && referee.institution 
                          ? `${referee.specialty} - ${referee.institution}`
                          : referee.specialty || referee.institution
                        }
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
              {!isLoadingReferees && !refereesError && referees.length === 0 && (
                <div className="p-2 text-sm text-gray-500">No referring doctors found</div>
              )}
              {refereesError && (
                <div className="p-2 text-sm text-red-500">{refereesError}</div>
              )}
            </SelectContent>
          </Select>
          
          {/* Debug info - remove in production */}
          <div className="text-xs text-gray-400">
            Debug: {referees.length} referees loaded, Loading: {isLoadingReferees.toString()}, Error: {refereesError || 'none'}
          </div>
        </div>

        {/* Claim ID */}
        <div className="space-y-2">
          <Label htmlFor="claimId" className="text-sm font-medium">
            Claim ID
          </Label>
          <Input
            id="claimId"
            placeholder="Enter Claim ID"
            value={formData.claimId}
            onChange={(e) => handleInputChange('claimId', e.target.value)}
            className="bg-gray-50"
          />
        </div>
      </div>
    </div>
  );
};

export default MedicalInformationSection;

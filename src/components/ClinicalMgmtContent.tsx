import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, X } from 'lucide-react';
import SearchableDiagnosisSelect from './SearchableDiagnosisSelect';
import SearchableCghsSurgerySelect from './SearchableCghsSurgerySelect';

const ClinicalMgmtContent = () => {
  const [selectedDiagnoses, setSelectedDiagnoses] = useState([
    {
      id: '1',
      name: 'Acute Appendicitis',
      diagnosed_date: '10/06/2025'
    }
  ]);

  const [selectedSurgeries, setSelectedSurgeries] = useState([]);
  const [selectedComplications, setSelectedComplications] = useState([]);
  const [complicationSearch, setComplicationSearch] = useState('');

  // Sample data for complications based on diagnosis
  const diagnosisComplications = {
    'Acute Appendicitis': ['Perforation', 'Abscess Formation', 'Sepsis', 'Bowel Obstruction'],
    'Inguinal Hernia': ['Bowel Obstruction', 'Incarceration', 'Strangulation', 'Chronic Pain'],
    'Gallbladder Disease': ['Cholangitis', 'Pancreatitis', 'Perforation', 'Common Bile Duct Injury']
  };

  // Sample data for labs, radiology and medications based on complications
  const complicationResources = {
    'Perforation': {
      labs: ['CBC', 'ESR'],
      radiology: ['X-Ray', 'CT Scan'],
      medications: ['Paracetamol', 'Amoxicillin', 'Ibuprofen', 'Omeprazole']
    },
    'Abscess Formation': {
      labs: ['CBC', 'CRP'],
      radiology: ['CT Scan', 'Ultrasound'],
      medications: ['Paracetamol', 'Ceftriaxone', 'Metronidazole', 'Pantoprazole']
    },
    'Sepsis': {
      labs: ['Blood Culture', 'Procalcitonin'],
      radiology: ['Chest X-Ray', 'CT Abdomen'],
      medications: ['Piperacillin-Tazobactam', 'Vancomycin', 'Noradrenaline', 'Hydrocortisone']
    },
    'Bowel Obstruction': {
      labs: ['CBC', 'Electrolytes'],
      radiology: ['X-Ray', 'CT Abdomen'],
      medications: ['IV Fluids', 'Nasogastric Decompression', 'Prokinetics', 'Analgesics']
    },
    'Incarceration': {
      labs: ['CBC', 'Lactate'],
      radiology: ['X-Ray Abdomen', 'CT Scan'],
      medications: ['Analgesics', 'Muscle Relaxants', 'IV Fluids', 'Antibiotics']
    },
    'Strangulation': {
      labs: ['CBC', 'Lactate'],
      radiology: ['CT Scan', 'Doppler Study'],
      medications: ['IV Antibiotics', 'Analgesics', 'IV Fluids', 'Anticoagulants']
    },
    'Chronic Pain': {
      labs: ['Blood Tests', 'Inflammatory Markers'],
      radiology: ['MRI', 'X-Ray'],
      medications: ['NSAIDs', 'Gabapentin', 'Tramadol', 'Muscle Relaxants']
    }
  };

  const handleAddDiagnosis = (diagnosis: { id: string; name: string }) => {
    setSelectedDiagnoses(prev => [
      ...prev,
      {
        ...diagnosis,
        diagnosed_date: new Date().toLocaleDateString('en-GB')
      }
    ]);
    // Reset complications when diagnosis changes
    setSelectedComplications([]);
  };

  const handleRemoveDiagnosis = (diagnosisId: string) => {
    setSelectedDiagnoses(prev => prev.filter(d => d.id !== diagnosisId));
    setSelectedComplications([]);
  };

  const handleAddSurgery = (surgery: { id: string; name: string; code?: string }) => {
    setSelectedSurgeries(prev => [...prev, surgery]);
  };

  const handleComplicationSelect = (complication: string) => {
    if (!selectedComplications.includes(complication)) {
      setSelectedComplications(prev => [...prev, complication]);
    }
  };

  const handleRemoveComplication = (complication: string) => {
    setSelectedComplications(prev => prev.filter(c => c !== complication));
  };

  const getAvailableComplications = () => {
    const allComplications: string[] = [];
    selectedDiagnoses.forEach(diagnosis => {
      const complications = diagnosisComplications[diagnosis.name] || [];
      allComplications.push(...complications);
    });
    return [...new Set(allComplications)].filter(comp => 
      comp.toLowerCase().includes(complicationSearch.toLowerCase())
    );
  };

  const getAllInvestigationsForComplications = (): string[] => {
    const investigations = new Set<string>();
    selectedComplications.forEach(complication => {
      const resources = complicationResources[complication];
      if (resources) {
        resources.labs.forEach(inv => investigations.add(inv));
        resources.radiology.forEach(rad => investigations.add(rad));
      }
    });
    return Array.from(investigations);
  };

  const getAllMedicationsForComplications = (): string[] => {
    const medications = new Set<string>();
    selectedComplications.forEach(complication => {
      const resources = complicationResources[complication];
      if (resources) {
        resources.medications.forEach(med => medications.add(med));
      }
    });
    return Array.from(medications);
  };

  const getLabsForComplication = (complication: string): string[] => {
    const resources = complicationResources[complication];
    return resources ? resources.labs : [];
  };

  const getRadiologyForComplication = (complication: string): string[] => {
    const resources = complicationResources[complication];
    return resources ? resources.radiology : [];
  };

  const getMedicationsForComplication = (complication: string): string[] => {
    const resources = complicationResources[complication];
    return resources ? resources.medications : [];
  };

  const handleSaveClinicalData = () => {
    const summary = {
      diagnoses: selectedDiagnoses.length,
      surgeries: selectedSurgeries.length,
      complications: selectedComplications.length
    };
    console.log('Saving clinical data:', summary);
    alert('Clinical data saved successfully!');
  };

  return (
    <div className="space-y-4 p-4">
      {/* Diagnosis Section */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-600 text-lg">
            🩺 Diagnosis
          </CardTitle>
          <p className="text-sm text-gray-600">Search and add diagnosis, view related complications</p>
        </CardHeader>
        <CardContent>
          <SearchableDiagnosisSelect
            selectedDiagnoses={selectedDiagnoses}
            onAddDiagnosis={handleAddDiagnosis}
            onRemoveDiagnosis={handleRemoveDiagnosis}
          />
        </CardContent>
      </Card>

      {/* CGHS Surgery Section */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-600 text-lg">
            📦 CGHS SURGERY
          </CardTitle>
          <p className="text-sm text-gray-600">Select CGHS surgeries for the patient</p>
        </CardHeader>
        <CardContent>
          <SearchableCghsSurgerySelect
            selectedSurgeries={selectedSurgeries}
            onAddSurgery={handleAddSurgery}
          />
        </CardContent>
      </Card>

      {/* Complications mapped to diagnosis */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-600 text-lg">
            ⚠️ Complications mapped to diagnosis
          </CardTitle>
          <p className="text-sm text-gray-600">Monitor and manage potential complications</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Search complications..." 
              className="pl-10 border-gray-300"
              value={complicationSearch}
              onChange={(e) => setComplicationSearch(e.target.value)}
            />
          </div>

          {/* Available Complications */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-black">Available Complications:</h4>
            <div className="flex flex-wrap gap-2">
              {getAvailableComplications()
                .filter(comp => !selectedComplications.includes(comp))
                .map((complication, index) => (
                  <Badge 
                    key={index} 
                    className="bg-gray-100 text-gray-700 border border-gray-300 cursor-pointer hover:bg-blue-100 hover:text-blue-800"
                    onClick={() => handleComplicationSelect(complication)}
                  >
                    {complication}
                  </Badge>
                ))
              }
            </div>
          </div>

          {/* Selected Complications */}
          {selectedComplications.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-black">Selected Complications:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedComplications.map((complication, index) => (
                  <Badge key={index} className="bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                    {complication}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleRemoveComplication(complication)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Show labs, radiology and medications for each selected complication */}
          {selectedComplications.length > 0 && (
            <div className="space-y-6">
              {selectedComplications.map((complication, compIndex) => (
                <div key={compIndex} className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-lg text-gray-800 mb-4">{complication}</h3>
                  
                  {/* Labs for this complication */}
                  <div className="space-y-3 mb-4">
                    <h4 className="font-medium text-sm text-black">Labs:</h4>
                    <div className="space-y-2">
                      {getLabsForComplication(complication).map((lab, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Badge className="bg-purple-100 text-purple-800 border border-purple-300 min-w-[100px]">
                            {lab}
                          </Badge>
                          <Input 
                            placeholder="Enter details..." 
                            className="flex-1 h-8 text-xs" 
                          />
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Radiology for this complication */}
                  <div className="space-y-3 mb-4">
                    <h4 className="font-medium text-sm text-black">Radiology:</h4>
                    <div className="space-y-2">
                      {getRadiologyForComplication(complication).map((radiology, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Badge className="bg-orange-100 text-orange-800 border border-orange-300 min-w-[100px]">
                            {radiology}
                          </Badge>
                          <Input 
                            placeholder="Enter details..." 
                            className="flex-1 h-8 text-xs" 
                          />
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Medications for this complication */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-black">Medications:</h4>
                    <div className="space-y-2">
                      {getMedicationsForComplication(complication).map((medication, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800 border border-green-300 min-w-[120px]">
                            {medication}
                          </Badge>
                          <span className="text-xs text-gray-600">Day</span>
                          <Input type="number" defaultValue="1" className="w-12 h-8 text-xs" />
                          <span className="text-xs text-gray-600">to</span>
                          <Input type="number" defaultValue="7" className="w-12 h-8 text-xs" />
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0 bg-green-100">
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Clinical Data Section */}
      <Card className="border border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-700 text-lg">
            💾 Save Clinical Data
          </CardTitle>
          <p className="text-sm text-green-600">Save all selected diagnoses, surgeries, and complications</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm">
              <p><strong>Summary to be saved:</strong></p>
              <p>Diagnoses: <span className="font-bold">{selectedDiagnoses.length} selected</span></p>
              <p>Surgeries: <span className="font-bold">{selectedSurgeries.length} selected</span></p>
              <p>Complications: <span className="font-bold">{selectedComplications.length} active</span></p>
            </div>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white w-full"
              onClick={handleSaveClinicalData}
            >
              💾 Save Clinical Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClinicalMgmtContent;

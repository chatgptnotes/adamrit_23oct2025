
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableFieldSelect } from './SearchableFieldSelect';

interface Patient {
  id: string;
  name: string;
  patients_id: string;
  insurance_person_no?: string;
  surgery?: string;
}

interface PatientFormFieldsProps {
  formData: {
    name: string;
    diagnosis: string;
    primaryDiagnosis: string;
    surgery: string;
    labs: string;
    radiology: string;
    labsRadiology: string;
    antibiotics: string;
    otherMedications: string;
    surgeon: string;
    consultant: string;
    hopeSurgeon?: string;
    hopeConsultants?: string;
  };
  diagnoses: string[];
  selectedPatient: Patient | null;
  onFormDataChange: (field: string, value: string) => void;
  onDiagnosisChange: (diagnosis: string) => void;
  onPatientSelect: (patient: Patient | null) => void;
  onIdMapping?: (tableName: string, fieldName: string, value: string, idField: string) => void;
}

export const PatientFormFields: React.FC<PatientFormFieldsProps> = ({
  formData,
  diagnoses,
  selectedPatient,
  onFormDataChange,
  onDiagnosisChange,
  onIdMapping
}) => {
  console.log('PatientFormFields - formData.labs:', formData.labs);
  console.log('PatientFormFields - formData.radiology:', formData.radiology);
  console.log('PatientFormFields - formData.surgeon:', formData.surgeon);
  console.log('PatientFormFields - formData.hopeSurgeon:', formData.hopeSurgeon);
  
  const handleFieldChange = (field: string, value: string, tableName?: string, fieldName?: string, idField?: string) => {
    onFormDataChange(field, value);
    
    // Handle foreign key mapping if provided
    if (onIdMapping && tableName && fieldName && idField) {
      onIdMapping(tableName, fieldName, value, idField);
    }
  };
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="diagnosis">Diagnosis Category *</Label>
          <Select 
            value={formData.diagnosis} 
            onValueChange={onDiagnosisChange}
          >
            <SelectTrigger className="border-2 border-gray-300 focus:border-primary">
              <SelectValue placeholder="Select diagnosis category" />
            </SelectTrigger>
            <SelectContent>
              {diagnoses.map(diagnosis => (
                <SelectItem key={diagnosis} value={diagnosis}>{diagnosis}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="primaryDiagnosis">Primary Diagnosis Details</Label>
        <Input
          id="primaryDiagnosis"
          value={formData.primaryDiagnosis}
          onChange={(e) => onFormDataChange('primaryDiagnosis', e.target.value)}
          placeholder="Specific diagnosis details"
          className="border-2 border-gray-300 focus:border-primary"
        />
      </div>

      <div>
        <Label htmlFor="surgery">Surgery/Procedure</Label>
        {selectedPatient && formData.surgery ? (
          <div className="border-2 border-gray-300 rounded-md p-2 bg-gray-50">
            <span className="text-sm font-medium text-blue-600">{formData.surgery}</span>
            <p className="text-xs text-gray-500 mt-1">Fetched from patient visits</p>
          </div>
        ) : (
          <SearchableFieldSelect
            tableName="cghs_surgery"
            fieldName="name"
            value={formData.surgery}
            onChange={(value) => handleFieldChange('surgery', value, 'cghs_surgery', 'name', 'surgeryId')}
            placeholder="Search surgery/procedure"
            displayField="name"
            searchFields={['name', 'description']}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="labs">Labs</Label>
          <SearchableFieldSelect
            tableName="lab"
            fieldName="name"
            value={formData.labs}
            onChange={(value) => {
              console.log('Labs field changed to:', value);
              handleFieldChange('labs', value, 'lab', 'name', 'labId');
            }}
            placeholder="Search laboratory tests"
            displayField="name"
            searchFields={['name', 'description', 'category']}
          />
        </div>
        
        <div>
          <Label htmlFor="radiology">Radiology</Label>
          <SearchableFieldSelect
            tableName="radiology"
            fieldName="name"
            value={formData.radiology}
            onChange={(value) => {
              console.log('Radiology field changed to:', value);
              handleFieldChange('radiology', value, 'radiology', 'name', 'radiologyId');
            }}
            placeholder="Search radiology studies"
            displayField="name"
            searchFields={['name', 'description', 'category']}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="antibiotics">Main Antibiotics</Label>
          <SearchableFieldSelect
            tableName="medication"
            fieldName="name"
            value={formData.antibiotics}
            onChange={(value) => handleFieldChange('antibiotics', value, 'medication', 'name', 'antibioticId')}
            placeholder="Search main antibiotics"
            displayField="name"
            searchFields={['name', 'generic_name', 'category']}
          />
        </div>
        
        <div>
          <Label htmlFor="otherMedications">Other Medications</Label>
          <SearchableFieldSelect
            tableName="medication"
            fieldName="name"
            value={formData.otherMedications}
            onChange={(value) => onFormDataChange('otherMedications', value)}
            placeholder="Search other medications"
            displayField="name"
            searchFields={['name', 'generic_name', 'category']}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="surgeon">Esic surgeon for follow up</Label>
          <SearchableFieldSelect
            tableName="esic_surgeons"
            fieldName="name"
            value={formData.surgeon}
            onChange={(value) => {
              console.log('ESIC Surgeon field changed to:', value);
              handleFieldChange('surgeon', value, 'esic_surgeons', 'name', 'esicSurgeonId');
            }}
            placeholder="Search ESIC surgeon"
            displayField="name"
            searchFields={['name', 'specialty', 'department']}
          />
        </div>
        
        <div>
          <Label htmlFor="consultant">Referee</Label>
          <SearchableFieldSelect
            tableName="referees"
            fieldName="name"
            value={formData.consultant}
            onChange={(value) => handleFieldChange('consultant', value, 'referees', 'name', 'consultantId')}
            placeholder="Search referee"
            displayField="name"
            searchFields={['name', 'specialty', 'institution']}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hopeSurgeon">Hope Surgeon</Label>
          <SearchableFieldSelect
            tableName="hope_surgeons"
            fieldName="name"
            value={formData.hopeSurgeon || ''}
            onChange={(value) => {
              console.log('Hope Surgeon field changed to:', value);
              handleFieldChange('hopeSurgeon', value, 'hope_surgeons', 'name', 'hopeSurgeonId');
            }}
            placeholder="Search Hope surgeon"
            displayField="name"
            searchFields={['name', 'specialty', 'department']}
          />
        </div>
        
        <div>
          <Label htmlFor="hopeConsultants">Hope Consultants for IPD visits</Label>
          <SearchableFieldSelect
            tableName="hope_consultants"
            fieldName="name"
            value={formData.hopeConsultants || ''}
            onChange={(value) => handleFieldChange('hopeConsultants', value, 'hope_consultants', 'name', 'hopeConsultantId')}
            placeholder="Search Hope consultants"
            displayField="name"
            searchFields={['name', 'specialty', 'department']}
          />
        </div>
      </div>
    </>
  );
};


import React from 'react';
import { Label } from '@/components/ui/label';
import { SearchableFieldSelect } from '@/components/AddPatientDialog/SearchableFieldSelect';
import { MultiSelectDropdown } from './MultiSelectDropdown';

interface MedicalInfoFieldsProps {
  formData: any;
  onSelectChange: (field: string) => (value: string) => void;
  selectedLabs: string[];
  onLabsSelect: (option: string) => void;
  onLabsRemove: (option: string) => void;
  selectedRadiology: string[];
  onRadiologySelect: (option: string) => void;
  onRadiologyRemove: (option: string) => void;
  selectedOtherMedications: string[];
  onOtherMedicationsSelect: (option: string) => void;
  onOtherMedicationsRemove: (option: string) => void;
}

export const MedicalInfoFields: React.FC<MedicalInfoFieldsProps> = ({
  formData,
  onSelectChange,
  selectedLabs,
  onLabsSelect,
  onLabsRemove,
  selectedRadiology,
  onRadiologySelect,
  onRadiologyRemove,
  selectedOtherMedications,
  onOtherMedicationsSelect,
  onOtherMedicationsRemove
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Surgery/Procedure</Label>
          <SearchableFieldSelect
            tableName="cghs_surgery"
            fieldName="surgery"
            value={formData.surgery || ''}
            onChange={onSelectChange('surgery')}
            placeholder="Search for surgery/procedure..."
            displayField="name"
            searchFields={['name', 'description', 'code']}
          />
        </div>

        <div className="space-y-2">
          <Label>Main Antibiotics</Label>
          <SearchableFieldSelect
            tableName="medication"
            fieldName="antibiotics"
            value={formData.antibiotics || ''}
            onChange={onSelectChange('antibiotics')}
            placeholder="Search for antibiotics..."
            displayField="name"
            searchFields={['name', 'generic_name']}
            additionalFilter={{ category: 'Antibiotics' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Labs</Label>
          {selectedLabs.length === 0 && (
            <p className="text-sm text-muted-foreground">Search and select lab tests below. Selected items will appear as tags.</p>
          )}
          <div className="flex flex-wrap gap-1 min-h-[2rem]">
            {selectedLabs.map((lab, index) => (
              <div key={index} className="flex items-center space-x-1 bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-sm">
                <span>{lab}</span>
                <button type="button" onClick={() => onLabsRemove(lab)} className="hover:text-blue-900">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <SearchableFieldSelect
            tableName="lab"
            fieldName="labs"
            value=""
            onChange={onLabsSelect}
            placeholder="Type to search: CBC, blood, chemistry, etc..."
            displayField="name"
            searchFields={['name', 'description', 'category']}
          />
        </div>

        <div className="space-y-2">
          <Label>Radiology</Label>
          {selectedRadiology.length === 0 && (
            <p className="text-sm text-muted-foreground">Search and select radiology procedures below. Selected items will appear as tags.</p>
          )}
          <div className="flex flex-wrap gap-1 min-h-[2rem]">
            {selectedRadiology.map((radiology, index) => (
              <div key={index} className="flex items-center space-x-1 bg-purple-100 text-purple-700 rounded-full px-3 py-1 text-sm">
                <span>{radiology}</span>
                <button type="button" onClick={() => onRadiologyRemove(radiology)} className="hover:text-purple-900">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <SearchableFieldSelect
            tableName="radiology"
            fieldName="radiology"
            value=""
            onChange={onRadiologySelect}
            placeholder="Type to search: X-ray, CT, MRI, ultrasound, etc..."
            displayField="name"
            searchFields={['name', 'description', 'category']}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Other Medications</Label>
        <div className="flex flex-wrap gap-1">
          {selectedOtherMedications.map((medication, index) => (
            <div key={index} className="flex items-center space-x-1 bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-sm">
              <span>{medication}</span>
              <button type="button" onClick={() => onOtherMedicationsRemove(medication)} className="hover:text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <SearchableFieldSelect
          tableName="medication"
          fieldName="otherMedications"
          value=""
          onChange={onOtherMedicationsSelect}
          placeholder="Search for other medications..."
          displayField="name"
          searchFields={['name', 'generic_name', 'description']}
        />
      </div>
    </div>
  );
};

// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import {
  ValidatedPatientNameInput,
  ValidatedPhoneInput,
  ValidatedEmailInput,
  ValidatedInsuranceInput,
  ValidatedInput
} from '@/components/ui/validated-input';
import { baseValidation } from '@/lib/validation';
import { usePatientValidation } from '@/hooks/useValidation';

interface ValidatedPatientInfoSectionProps {
  formData: {
    name: string;
    age: number | string;
    gender: string;
    phone: string;
    email: string;
    address: string;
    insurance_person_no: string;
    patient_type: string;
    blood_group: string;
  };
  onDataChange: (data: Partial<typeof formData>, isValid: boolean) => void;
  onValidationChange: (isValid: boolean) => void;
}

export const ValidatedPatientInfoSection: React.FC<ValidatedPatientInfoSectionProps> = ({
  formData,
  onDataChange,
  onValidationChange
}) => {
  const { validationState, validate } = usePatientValidation();
  const [fieldValidations, setFieldValidations] = useState<Record<string, boolean>>({});

  const handleFieldChange = (field: string, value: string, isValid: boolean) => {
    const updatedData = { ...formData, [field]: value };
    const updatedValidations = { ...fieldValidations, [field]: isValid };
    
    setFieldValidations(updatedValidations);
    
    // Check if all fields are valid
    const overallValid = Object.values(updatedValidations).every(valid => valid);
    
    onDataChange(updatedData, overallValid);
    onValidationChange(overallValid);
  };

  const handleSelectChange = (field: string, value: string) => {
    handleFieldChange(field, value, true); // Select values are pre-validated
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Patient Information
          {validationState.hasErrors && (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {validationState.hasErrors && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please correct the errors below before proceeding.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Patient Name */}
          <ValidatedPatientNameInput
            label="Full Name"
            value={formData.name}
            onChange={(value, isValid) => handleFieldChange('name', value, isValid)}
            placeholder="Enter patient's full name"
            required
            helperText="Enter the patient's complete legal name"
          />

          {/* Age */}
          <ValidatedInput
            label="Age"
            schema={baseValidation.age}
            value={formData.age.toString()}
            onChange={(value, isValid) => handleFieldChange('age', value, isValid)}
            type="number"
            min="0"
            max="150"
            placeholder="Enter age"
            required
            helperText="Age in years (0-150)"
          />

          {/* Gender */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Gender <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleSelectChange('gender', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Phone Number */}
          <ValidatedPhoneInput
            label="Phone Number"
            value={formData.phone}
            onChange={(value, isValid) => handleFieldChange('phone', value, isValid)}
            placeholder="+1-234-567-8900"
            required
            helperText="Include country code for international numbers"
          />

          {/* Email */}
          <ValidatedEmailInput
            label="Email Address"
            value={formData.email}
            onChange={(value, isValid) => handleFieldChange('email', value, isValid)}
            placeholder="patient@example.com"
            helperText="Optional - for appointment reminders and reports"
          />

          {/* Patient Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Patient Type <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={formData.patient_type}
              onValueChange={(value) => handleSelectChange('patient_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select patient type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ESIC">ESIC</SelectItem>
                <SelectItem value="CGHS">CGHS</SelectItem>
                <SelectItem value="Private">Private</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Insurance Number */}
          {(formData.patient_type === 'ESIC' || formData.patient_type === 'CGHS') && (
            <ValidatedInsuranceInput
              label="Insurance Person Number"
              value={formData.insurance_person_no}
              onChange={(value, isValid) => handleFieldChange('insurance_person_no', value, isValid)}
              placeholder="ABC123456789"
              required
              helperText="Enter the insurance identification number"
            />
          )}

          {/* Blood Group */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Blood Group</Label>
            <Select
              value={formData.blood_group}
              onValueChange={(value) => handleSelectChange('blood_group', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A-">A-</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B-">B-</SelectItem>
                <SelectItem value="AB+">AB+</SelectItem>
                <SelectItem value="AB-">AB-</SelectItem>
                <SelectItem value="O+">O+</SelectItem>
                <SelectItem value="O-">O-</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Address - Full Width */}
        <div className="space-y-2">
          <ValidatedInput
            label="Address"
            schema={baseValidation.address}
            value={formData.address}
            onChange={(value, isValid) => handleFieldChange('address', value, isValid)}
            placeholder="Enter complete address"
            required
            helperText="Include street, city, state, and postal code"
          />
        </div>

        {/* Validation Summary */}
        {Object.keys(fieldValidations).length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700">Validation Status:</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {Object.entries(fieldValidations).map(([field, isValid]) => (
                <div key={field} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="capitalize">{field.replace('_', ' ')}: {isValid ? 'Valid' : 'Invalid'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
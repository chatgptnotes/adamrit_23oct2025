import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface FormData {
  name: string;
  age: string;
  gender: string;
  phone: string;
  address: string;
  emergency_contact: string;
  emergency_phone: string;
  blood_group: string;
  allergies: string;
  medical_history: string;
  current_medications: string;
  insurance_provider: string;
  policy_number: string;
  group_code: string;
  relationship_with_employee: string;
  employee_name: string;
  employee_id: string;
  employee_department: string;
  employee_designation: string;
  employee_phone: string;
  employee_email: string;
  employee_address: string;
  employee_blood_group: string;
  employee_allergies: string;
  employee_medical_history: string;
  employee_current_medications: string;
  employee_insurance_provider: string;
  employee_policy_number: string;
  employee_group_code: string;
  employee_relationship_with_patient: string;
}

interface ValidatedFormSubmissionProps {
  formData: FormData;
  onValidationComplete: (result: ValidationResult) => void;
  onSubmissionComplete: (success: boolean) => void;
}

export const ValidatedFormSubmission: React.FC<ValidatedFormSubmissionProps> = ({
  formData,
  onValidationComplete,
  onSubmissionComplete
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [submissionResult, setSubmissionResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const validateForm = async (): Promise<ValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validations
    if (!formData.name.trim()) {
      errors.push('Patient name is required');
    }

    if (!formData.age.trim()) {
      errors.push('Age is required');
    } else {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 0 || age > 150) {
        errors.push('Please enter a valid age (0-150)');
      }
    }

    if (!formData.gender.trim()) {
      errors.push('Gender is required');
    }

    if (!formData.phone.trim()) {
      errors.push('Phone number is required');
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.push('Please enter a valid 10-digit phone number');
    }

    if (!formData.emergency_contact.trim()) {
      errors.push('Emergency contact name is required');
    }

    if (!formData.emergency_phone.trim()) {
      errors.push('Emergency phone number is required');
    } else if (!/^\d{10}$/.test(formData.emergency_phone.replace(/\D/g, ''))) {
      errors.push('Please enter a valid 10-digit emergency phone number');
    }

    // Warning validations
    if (!formData.address.trim()) {
      warnings.push('Address is recommended');
    }

    if (!formData.blood_group.trim()) {
      warnings.push('Blood group is recommended');
    }

    if (!formData.allergies.trim()) {
      warnings.push('Allergies information is recommended (enter "None" if no allergies)');
    }

    // Employee information validations
    if (formData.relationship_with_employee.trim()) {
      if (!formData.employee_name.trim()) {
        errors.push('Employee name is required when relationship is specified');
      }
      if (!formData.employee_id.trim()) {
        errors.push('Employee ID is required when relationship is specified');
      }
      if (!formData.employee_phone.trim()) {
        errors.push('Employee phone is required when relationship is specified');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  const submitForm = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const patientData = {
        name: formData.name.trim(),
        age: parseInt(formData.age),
        gender: formData.gender.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        emergency_contact: formData.emergency_contact.trim(),
        emergency_phone: formData.emergency_phone.trim(),
        blood_group: formData.blood_group.trim(),
        allergies: formData.allergies.trim(),
        medical_history: formData.medical_history.trim(),
        current_medications: formData.current_medications.trim(),
        insurance_provider: formData.insurance_provider.trim(),
        policy_number: formData.policy_number.trim(),
        group_code: formData.group_code.trim(),
        relationship_with_employee: formData.relationship_with_employee.trim(),
        employee_name: formData.employee_name.trim(),
        employee_id: formData.employee_id.trim(),
        employee_department: formData.employee_department.trim(),
        employee_designation: formData.employee_designation.trim(),
        employee_phone: formData.employee_phone.trim(),
        employee_email: formData.employee_email.trim(),
        employee_address: formData.employee_address.trim(),
        employee_blood_group: formData.employee_blood_group.trim(),
        employee_allergies: formData.employee_allergies.trim(),
        employee_medical_history: formData.employee_medical_history.trim(),
        employee_current_medications: formData.employee_current_medications.trim(),
        employee_insurance_provider: formData.employee_insurance_provider.trim(),
        employee_policy_number: formData.employee_policy_number.trim(),
        employee_group_code: formData.employee_group_code.trim(),
        employee_relationship_with_patient: formData.employee_relationship_with_patient.trim()
      };

      const { data, error } = await supabase
        .from('patients')
        .insert([patientData])
        .select()
        .single();

      if (error) {
        console.error('Error creating patient:', error);
        return {
          success: false,
          message: `Failed to create patient: ${error.message}`
        };
      }

      return {
        success: true,
        message: 'Patient created successfully!'
      };
    } catch (error) {
      console.error('Error in submitForm:', error);
      return {
        success: false,
        message: 'An unexpected error occurred. Please try again.'
      };
    }
  };

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const result = await validateForm();
      setValidationResult(result);
      onValidationComplete(result);
      
      if (result.isValid) {
        toast({
          title: "Validation Successful",
          description: "Form is ready for submission",
        });
      } else {
        toast({
          title: "Validation Failed",
          description: `Found ${result.errors.length} error(s)`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error during validation:', error);
      toast({
        title: "Validation Error",
        description: "An error occurred during validation",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async () => {
    if (!validationResult?.isValid) {
      toast({
        title: "Cannot Submit",
        description: "Please fix validation errors first",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitForm();
      setSubmissionResult(result);
      onSubmissionComplete(result.success);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        toast({
          title: "Submission Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error during submission:', error);
      toast({
        title: "Submission Error",
        description: "An error occurred during submission",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Form Validation & Submission
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={handleValidate}
              disabled={isValidating}
              variant="outline"
              className="flex-1"
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Validate Form
                </>
              )}
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={!validationResult?.isValid || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Submit Form
                </>
              )}
            </Button>
          </div>

          {validationResult && (
            <div className="space-y-2">
              {validationResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Validation Errors:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {validationResult.warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Warnings:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {validationResult.isValid && validationResult.warnings.length === 0 && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Form validation passed! All required fields are complete.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {submissionResult && (
            <Alert variant={submissionResult.success ? "default" : "destructive"}>
              {submissionResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {submissionResult.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
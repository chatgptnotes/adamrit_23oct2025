
import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Patient {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  phone?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  blood_group?: string;
  allergies?: string;
  medical_history?: string;
  current_medications?: string;
  insurance_provider?: string;
  policy_number?: string;
  group_code?: string;
  relationship_with_employee?: string;
  employee_name?: string;
  employee_id?: string;
  employee_department?: string;
  employee_designation?: string;
  employee_phone?: string;
  employee_email?: string;
  employee_address?: string;
  employee_blood_group?: string;
  employee_allergies?: string;
  employee_medical_history?: string;
  employee_current_medications?: string;
  employee_insurance_provider?: string;
  employee_policy_number?: string;
  employee_group_code?: string;
  employee_relationship_with_patient?: string;
  created_at?: string;
  updated_at?: string;
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

interface ValidationErrors {
  [key: string]: string;
}

interface UsePatientDialogStateReturn {
  formData: FormData;
  validationErrors: ValidationErrors;
  isSubmitting: boolean;
  handleInputChange: (field: keyof FormData, value: string) => void;
  validateForm: () => boolean;
  resetForm: () => void;
  submitForm: () => Promise<Patient | null>;
}

export const usePatientDialogState = (): UsePatientDialogStateReturn => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    age: '',
    gender: '',
    phone: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    blood_group: '',
    allergies: '',
    medical_history: '',
    current_medications: '',
    insurance_provider: '',
    policy_number: '',
    group_code: '',
    relationship_with_employee: '',
    employee_name: '',
    employee_id: '',
    employee_department: '',
    employee_designation: '',
    employee_phone: '',
    employee_email: '',
    employee_address: '',
    employee_blood_group: '',
    employee_allergies: '',
    employee_medical_history: '',
    employee_current_medications: '',
    employee_insurance_provider: '',
    employee_policy_number: '',
    employee_group_code: '',
    employee_relationship_with_patient: ''
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [validationErrors]);

  const validateForm = useCallback((): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Patient name is required';
    }

    if (!formData.age.trim()) {
      errors.age = 'Age is required';
    } else {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 0 || age > 150) {
        errors.age = 'Please enter a valid age';
      }
    }

    if (!formData.gender.trim()) {
      errors.gender = 'Gender is required';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.emergency_contact.trim()) {
      errors.emergency_contact = 'Emergency contact name is required';
    }

    if (!formData.emergency_phone.trim()) {
      errors.emergency_phone = 'Emergency phone number is required';
    } else if (!/^\d{10}$/.test(formData.emergency_phone.replace(/\D/g, ''))) {
      errors.emergency_phone = 'Please enter a valid 10-digit phone number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      age: '',
      gender: '',
      phone: '',
      address: '',
      emergency_contact: '',
      emergency_phone: '',
      blood_group: '',
      allergies: '',
      medical_history: '',
      current_medications: '',
      insurance_provider: '',
      policy_number: '',
      group_code: '',
      relationship_with_employee: '',
      employee_name: '',
      employee_id: '',
      employee_department: '',
      employee_designation: '',
      employee_phone: '',
      employee_email: '',
      employee_address: '',
      employee_blood_group: '',
      employee_allergies: '',
      employee_medical_history: '',
      employee_current_medications: '',
      employee_insurance_provider: '',
      employee_policy_number: '',
      employee_group_code: '',
      employee_relationship_with_patient: ''
    });
    setValidationErrors({});
  }, []);

  const submitForm = useCallback(async (): Promise<Patient | null> => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return null;
    }

    setIsSubmitting(true);

    try {
      const patientData: Partial<Patient> = {
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
        toast({
          title: "Error",
          description: "Failed to create patient. Please try again.",
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Success",
        description: "Patient created successfully!",
      });

      resetForm();
      return data as Patient;
    } catch (error) {
      console.error('Error in submitForm:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, toast, resetForm]);

  return {
    formData,
    validationErrors,
    isSubmitting,
    handleInputChange,
    validateForm,
    resetForm,
    submitForm
  };
};

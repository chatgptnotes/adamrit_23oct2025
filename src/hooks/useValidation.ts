import { useState, useCallback } from 'react';
import { z } from 'zod';
import { validateInput } from '@/lib/validation';

interface ValidationState {
  errors: Record<string, string>;
  isValid: boolean;
  hasErrors: boolean;
}

interface UseValidationReturn<T> {
  validationState: ValidationState;
  validate: (data: unknown) => { success: boolean; data?: T; errors?: string[] };
  validateField: (fieldName: string, value: unknown, fieldSchema: z.ZodSchema) => boolean;
  clearErrors: () => void;
  clearFieldError: (fieldName: string) => void;
  setFieldError: (fieldName: string, error: string) => void;
}

export function useValidation<T>(schema: z.ZodSchema<T>): UseValidationReturn<T> {
  const [validationState, setValidationState] = useState<ValidationState>({
    errors: {},
    isValid: true,
    hasErrors: false,
  });

  const validate = useCallback((data: unknown) => {
    const result = validateInput(schema, data);
    
    if (result.success) {
      setValidationState({
        errors: {},
        isValid: true,
        hasErrors: false,
      });
      return result;
    } else {
      const errorMap: Record<string, string> = {};
      result.errors?.forEach(error => {
        const [field, message] = error.split(': ');
        errorMap[field] = message;
      });
      
      setValidationState({
        errors: errorMap,
        isValid: false,
        hasErrors: true,
      });
      return result;
    }
  }, [schema]);

  const validateField = useCallback((fieldName: string, value: unknown, fieldSchema: z.ZodSchema) => {
    try {
      fieldSchema.parse(value);
      setValidationState(prev => ({
        ...prev,
        errors: { ...prev.errors, [fieldName]: '' },
        hasErrors: Object.keys({ ...prev.errors, [fieldName]: '' }).some(key => prev.errors[key]),
      }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0]?.message || 'Invalid value';
        setValidationState(prev => ({
          ...prev,
          errors: { ...prev.errors, [fieldName]: errorMessage },
          hasErrors: true,
          isValid: false,
        }));
        return false;
      }
      return false;
    }
  }, []);

  const clearErrors = useCallback(() => {
    setValidationState({
      errors: {},
      isValid: true,
      hasErrors: false,
    });
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setValidationState(prev => {
      const newErrors = { ...prev.errors };
      delete newErrors[fieldName];
      const hasErrors = Object.keys(newErrors).some(key => newErrors[key]);
      
      return {
        errors: newErrors,
        hasErrors,
        isValid: !hasErrors,
      };
    });
  }, []);

  const setFieldError = useCallback((fieldName: string, error: string) => {
    setValidationState(prev => ({
      ...prev,
      errors: { ...prev.errors, [fieldName]: error },
      hasErrors: true,
      isValid: false,
    }));
  }, []);

  return {
    validationState,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    setFieldError,
  };
}

// Specialized hooks for common schemas
export const usePatientValidation = () => {
  const { patientRegistrationSchema } = require('@/lib/validation');
  return useValidation(patientRegistrationSchema);
};

export const useVisitValidation = () => {
  const { visitRegistrationSchema } = require('@/lib/validation');
  return useValidation(visitRegistrationSchema);
};

export const useMedicalDataValidation = () => {
  const { medicalDataSchema } = require('@/lib/validation');
  return useValidation(medicalDataSchema);
};

export const useBillingValidation = () => {
  const { billingSchema } = require('@/lib/validation');
  return useValidation(billingSchema);
};
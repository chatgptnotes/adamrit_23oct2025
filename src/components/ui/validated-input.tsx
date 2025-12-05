import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidatedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string;
  schema: z.ZodSchema;
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  onValidationError?: (error: string) => void;
  showValidIcon?: boolean;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  required?: boolean;
  helperText?: string;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  schema,
  value,
  onChange,
  onValidationError,
  showValidIcon = true,
  validateOnBlur = true,
  validateOnChange = false,
  required = false,
  helperText,
  className,
  ...props
}) => {
  const [error, setError] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);
  const [touched, setTouched] = useState<boolean>(false);

  const validateValue = (inputValue: string) => {
    try {
      schema.parse(inputValue);
      setError('');
      setIsValid(true);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errorMessage = err.errors[0]?.message || 'Invalid input';
        setError(errorMessage);
        setIsValid(false);
        onValidationError?.(errorMessage);
        return false;
      }
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const valid = validateOnChange ? validateValue(newValue) : true;
    onChange(newValue, valid);
  };

  const handleBlur = () => {
    setTouched(true);
    if (validateOnBlur) {
      validateValue(value);
    }
  };

  useEffect(() => {
    if (touched && value) {
      validateValue(value);
    }
  }, [value, touched, schema]);

  const showError = touched && error && !isValid;
  const showSuccess = touched && !error && isValid && value;

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          {...props}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            className,
            showError && "border-red-500 focus:border-red-500 focus:ring-red-500",
            showSuccess && showValidIcon && "border-green-500 focus:border-green-500 focus:ring-green-500 pr-10"
          )}
        />
        
        {showSuccess && showValidIcon && (
          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
        )}
      </div>

      {showError && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {helperText && !showError && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
};

// Specialized validated inputs for common healthcare data
export const ValidatedPatientNameInput: React.FC<Omit<ValidatedInputProps, 'schema'>> = (props) => {
  const { baseValidation } = require('@/lib/validation');
  return <ValidatedInput schema={baseValidation.name} {...props} />;
};

export const ValidatedPhoneInput: React.FC<Omit<ValidatedInputProps, 'schema'>> = (props) => {
  const { baseValidation } = require('@/lib/validation');
  return <ValidatedInput schema={baseValidation.phone} placeholder="e.g., +1-234-567-8900" {...props} />;
};

export const ValidatedEmailInput: React.FC<Omit<ValidatedInputProps, 'schema'>> = (props) => {
  const { baseValidation } = require('@/lib/validation');
  return <ValidatedInput schema={baseValidation.email} type="email" {...props} />;
};

export const ValidatedInsuranceInput: React.FC<Omit<ValidatedInputProps, 'schema'>> = (props) => {
  const { baseValidation } = require('@/lib/validation');
  return <ValidatedInput schema={baseValidation.insuranceNumber} placeholder="e.g., ABC123456789" {...props} />;
};

export const ValidatedPatientIdInput: React.FC<Omit<ValidatedInputProps, 'schema'>> = (props) => {
  const { baseValidation } = require('@/lib/validation');
  return <ValidatedInput schema={baseValidation.patientId} placeholder="e.g., PAT-001" {...props} />;
};

export const ValidatedDiagnosisInput: React.FC<Omit<ValidatedInputProps, 'schema'>> = (props) => {
  const { baseValidation } = require('@/lib/validation');
  return <ValidatedInput schema={baseValidation.diagnosis} {...props} />;
};

export const ValidatedMedicationInput: React.FC<Omit<ValidatedInputProps, 'schema'>> = (props) => {
  const { baseValidation } = require('@/lib/validation');
  return <ValidatedInput schema={baseValidation.medication} {...props} />;
};

export const ValidatedDosageInput: React.FC<Omit<ValidatedInputProps, 'schema'>> = (props) => {
  const { baseValidation } = require('@/lib/validation');
  return <ValidatedInput schema={baseValidation.dosage} placeholder="e.g., 500mg twice daily" {...props} />;
};
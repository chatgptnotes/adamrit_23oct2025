
import React from 'react';
import { Label } from '@/components/ui/label';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  placeholder
}) => {
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      // Format date as YYYY-MM-DD for consistency with existing data format
      const formattedDate = date.toISOString().split('T')[0];
      onChange(formattedDate);
    } else {
      onChange('');
    }
  };

  const dateValue = value ? new Date(value) : undefined;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <EnhancedDatePicker
        value={dateValue}
        onChange={handleDateChange}
        placeholder={placeholder}
        isDOB={false} // These are medical dates, not DOB, so start with day view
      />
    </div>
  );
};

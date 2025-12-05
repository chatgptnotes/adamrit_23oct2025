import React from 'react';
import { SearchableFieldSelect } from '@/components/AddPatientDialog/SearchableFieldSelect';

type TableName = 'cghs_surgery' | 'complications' | 'medication' | 'lab' | 'radiology' | 'esic_surgeons' | 'referees' | 'hope_surgeons' | 'hope_consultants';

interface SingleSelectFieldSelectProps {
  tableName: TableName;
  fieldName: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  displayField: string;
  searchFields: string[];
  additionalFilter?: Record<string, any>;
}

export const SingleSelectFieldSelect: React.FC<SingleSelectFieldSelectProps> = ({
  tableName,
  fieldName,
  value,
  onChange,
  placeholder,
  displayField,
  searchFields,
  additionalFilter
}) => {
  const handleChange = (newValue: string) => {
    // For single select, we only want the first item if multiple are selected
    const items = newValue.split(', ').filter(item => item.trim());
    if (items.length > 0) {
      onChange(items[0]); // Only take the first item for single select
    } else {
      onChange('');
    }
  };

  return (
    <SearchableFieldSelect
      tableName={tableName}
      fieldName={fieldName}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      displayField={displayField}
      searchFields={searchFields}
      additionalFilter={additionalFilter}
    />
  );
}; 
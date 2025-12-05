
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'tel' | 'email' | 'number' | 'date';
  required?: boolean;
  placeholder?: string;
  value?: string;
  options?: { value: string; label: string }[];
}

export interface ExtendedFormField extends FormField {
  type: 'text' | 'textarea' | 'select' | 'tel' | 'email' | 'number' | 'date';
  defaultValue?: string;
}

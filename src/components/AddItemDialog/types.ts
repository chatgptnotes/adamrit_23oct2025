
export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'date';
  required?: boolean;
  options?: string[] | { label: string; value: string }[];
  placeholder?: string;
  group?: string;
  colSpan?: number; // 1, 2, 3, or 'full'
}

export interface AddItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (formData: Record<string, string>) => void;
  title: string;
  fields: FormField[];
  initialData?: Record<string, string>;
  defaultValues?: Record<string, string>;
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TaskSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const TaskSelector = ({ value, onValueChange }: TaskSelectorProps) => {
  const tasks = [
    { value: 'consultation', label: 'Consultation' },
    { value: 'lab_test', label: 'Lab Test' },
    { value: 'radiology', label: 'Radiology' },
    { value: 'pharmacy', label: 'Pharmacy' },
    { value: 'billing', label: 'Billing' },
    { value: 'discharge', label: 'Discharge' },
    { value: 'followup', label: 'Follow-up' },
    { value: 'referral', label: 'Referral' },
  ];

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Select Task" />
      </SelectTrigger>
      <SelectContent>
        {tasks.map((task) => (
          <SelectItem key={task.value} value={task.value}>
            {task.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
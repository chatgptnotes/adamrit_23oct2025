
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';

interface HopeConsultantsControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
}

export const HopeConsultantsControls = ({ 
  searchTerm, 
  onSearchChange, 
  onAddClick 
}: HopeConsultantsControlsProps) => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search Hope consultants..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Button onClick={onAddClick}>
        <Plus className="h-4 w-4 mr-2" />
        Add Hope Consultant
      </Button>
    </div>
  );
};

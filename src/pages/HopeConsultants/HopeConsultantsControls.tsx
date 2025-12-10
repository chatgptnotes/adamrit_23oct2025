
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Download, Upload } from 'lucide-react';

interface HopeConsultantsControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const HopeConsultantsControls = ({
  searchTerm,
  onSearchChange,
  onAddClick,
  onExport,
  onImport
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
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <label className="cursor-pointer">
          <Button variant="outline" size="sm" asChild>
            <span>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </span>
          </Button>
          <input type="file" accept=".csv,.xlsx,.xls" onChange={onImport} className="hidden" />
        </label>
        <Button onClick={onAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add Hope Consultant
        </Button>
      </div>
    </div>
  );
};

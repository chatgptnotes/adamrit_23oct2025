
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const DashboardHeader = ({ searchTerm, onSearchChange }: DashboardHeaderProps) => {
  const { hospitalConfig } = useAuth();
  
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-primary" style={{ color: hospitalConfig.primaryColor }}>
          {hospitalConfig.fullName}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-80"
          />
        </div>
      </div>
    </div>
  );
};

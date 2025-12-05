
import { Heart } from 'lucide-react';
import { HopeConsultant } from './types';
import { HopeConsultantCard } from './HopeConsultantCard';

interface HopeConsultantsListProps {
  consultants: HopeConsultant[];
  searchTerm: string;
  onEdit: (consultant: HopeConsultant) => void;
  onDelete: (id: string) => void;
}

export const HopeConsultantsList = ({ 
  consultants, 
  searchTerm, 
  onEdit, 
  onDelete 
}: HopeConsultantsListProps) => {
  if (consultants.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">
          {searchTerm ? 'No Hope consultants found matching your search.' : 'No Hope consultants available.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {consultants.map((consultant) => (
        <HopeConsultantCard
          key={consultant.id}
          consultant={consultant}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

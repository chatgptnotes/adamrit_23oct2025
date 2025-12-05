import { Heart } from 'lucide-react';
import { AyushmanConsultant } from './types';
import { AyushmanConsultantCard } from './AyushmanConsultantCard';

interface AyushmanConsultantsListProps {
  consultants: AyushmanConsultant[];
  searchTerm: string;
  onEdit: (consultant: AyushmanConsultant) => void;
  onDelete: (id: string) => void;
}

export const AyushmanConsultantsList = ({
  consultants,
  searchTerm,
  onEdit,
  onDelete
}: AyushmanConsultantsListProps) => {
  if (consultants.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">
          {searchTerm ? 'No Ayushman consultants found matching your search.' : 'No Ayushman consultants available.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {consultants.map((consultant) => (
        <AyushmanConsultantCard
          key={consultant.id}
          consultant={consultant}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
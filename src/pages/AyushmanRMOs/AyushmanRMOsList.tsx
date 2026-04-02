import { Heart } from 'lucide-react';
import { AyushmanRMO } from './types';
import { AyushmanRMOCard } from './AyushmanRMOCard';

interface AyushmanRMOsListProps {
  rmos: AyushmanRMO[];
  searchTerm: string;
  onEdit: (rmo: AyushmanRMO) => void;
  onDelete: (id: string) => void;
}

export const AyushmanRMOsList = ({ rmos, searchTerm, onEdit, onDelete }: AyushmanRMOsListProps) => {
  if (rmos.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">
          {searchTerm ? 'No Ayushman RMOs found matching your search.' : 'No Ayushman RMOs available.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {rmos.map((rmo) => (
        <AyushmanRMOCard
          key={rmo.id}
          rmo={rmo}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

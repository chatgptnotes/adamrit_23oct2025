import { Heart } from 'lucide-react';
import { HopeRMO } from './types';
import { HopeRMOCard } from './HopeRMOCard';

interface HopeRMOsListProps {
  rmos: HopeRMO[];
  searchTerm: string;
  onEdit: (rmo: HopeRMO) => void;
  onDelete: (id: string) => void;
}

export const HopeRMOsList = ({ rmos, searchTerm, onEdit, onDelete }: HopeRMOsListProps) => {
  if (rmos.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">
          {searchTerm ? 'No Hope RMOs found matching your search.' : 'No Hope RMOs available.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {rmos.map((rmo) => (
        <HopeRMOCard
          key={rmo.id}
          rmo={rmo}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

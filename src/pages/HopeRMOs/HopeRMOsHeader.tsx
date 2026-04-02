import { Heart } from 'lucide-react';

export const HopeRMOsHeader = () => {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-3 mb-4">
        <Heart className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-bold text-primary">
          Hope RMOs Master List
        </h1>
      </div>
      <p className="text-lg text-muted-foreground">
        Manage Hope Resident Medical Officers
      </p>
    </div>
  );
};

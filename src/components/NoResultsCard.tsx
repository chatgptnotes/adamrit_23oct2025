
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';

interface NoResultsCardProps {
  searchTerm: string;
}

export const NoResultsCard: React.FC<NoResultsCardProps> = ({ searchTerm }) => {
  return (
    <Card className="text-center py-8">
      <CardContent>
        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
          No results found
        </h3>
        <p className="text-muted-foreground">
          No patients found matching "{searchTerm}". Try adjusting your search terms.
        </p>
      </CardContent>
    </Card>
  );
};

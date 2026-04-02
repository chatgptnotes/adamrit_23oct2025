import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { AyushmanRMO } from './types';
import { usePermissions } from '@/hooks/usePermissions';

interface AyushmanRMOCardProps {
  rmo: AyushmanRMO;
  onEdit: (rmo: AyushmanRMO) => void;
  onDelete: (id: string) => void;
}

export const AyushmanRMOCard = ({ rmo, onEdit, onDelete }: AyushmanRMOCardProps) => {
  const { canEditMasters } = usePermissions();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl">{rmo.name}</span>
          <div className="flex gap-2">
            {rmo.specialty && (
              <Badge variant="outline">{rmo.specialty}</Badge>
            )}
            {rmo.department && (
              <Badge variant="secondary">{rmo.department}</Badge>
            )}
            {canEditMasters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(rmo)}
                className="text-blue-600 hover:text-blue-700"
                title="Edit RMO"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canEditMasters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(rmo.id)}
                className="text-red-600 hover:text-red-700"
                title="Delete RMO"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      {rmo.contact_info && (
        <CardContent>
          <div className="text-sm">
            <span className="font-semibold">Contact:</span> {rmo.contact_info}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

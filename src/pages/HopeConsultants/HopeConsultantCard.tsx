
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { HopeConsultant } from './types';
import { usePermissions } from '@/hooks/usePermissions';

interface HopeConsultantCardProps {
  consultant: HopeConsultant;
  onEdit: (consultant: HopeConsultant) => void;
  onDelete: (id: string) => void;
}

export const HopeConsultantCard = ({ consultant, onEdit, onDelete }: HopeConsultantCardProps) => {
  const { canEditMasters } = usePermissions();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl">{consultant.name}</span>
          <div className="flex gap-2">
            {consultant.specialty && (
              <Badge variant="outline">{consultant.specialty}</Badge>
            )}
            {consultant.department && (
              <Badge variant="secondary">{consultant.department}</Badge>
            )}
            {canEditMasters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(consultant)}
                className="text-blue-600 hover:text-blue-700"
                title="Edit consultant"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canEditMasters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(consultant.id)}
                className="text-red-600 hover:text-red-700"
                title="Delete consultant"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      {consultant.contact_info && (
        <CardContent>
          <div className="text-sm">
            <span className="font-semibold">Contact:</span> {consultant.contact_info}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

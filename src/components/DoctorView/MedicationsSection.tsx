import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MedicationsSectionProps {
  patientId: string;
}

export const MedicationsSection = ({ patientId }: MedicationsSectionProps) => {
  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ['medications', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'active')
        .order('prescription_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) return <div className="text-center py-8">Loading medications...</div>;

  return (
    <div className="space-y-4">
      {prescriptions.length > 0 ? (
        <>
          {prescriptions.map((rx) => (
            <Card key={rx.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Prescription #{rx.prescription_number}</h3>
                    <p className="text-sm text-gray-600">Date: {rx.prescription_date}</p>
                    <p className="text-sm text-gray-600">Doctor: {rx.doctor_name}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                  <p>{rx.notes || 'No specific notes'}</p>
                </div>
                <div className="mt-3 text-xs text-gray-600">
                  Total: {rx.final_amount || 0} | Discount: {rx.discount_amount || 0}
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No active medications for this patient
        </div>
      )}
    </div>
  );
};

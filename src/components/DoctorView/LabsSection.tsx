import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';

interface LabsSectionProps {
  patientId: string;
}

export const LabsSection = ({ patientId }: LabsSectionProps) => {
  const { data: labs = [], isLoading } = useQuery({
    queryKey: ['labs', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctor_visits')
        .select('*')
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) return <div className="text-center py-8">Loading labs...</div>;

  return (
    <div className="space-y-4">
      {labs.length > 0 ? (
        labs.map((lab) => (
          <Card key={lab.id}>
            <CardContent className="pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Test Date: {lab.visit_date}</h3>
                <p className="text-sm text-gray-600">Doctor: {lab.doctor_name || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(lab.test_data, null, 2)}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          No lab results available for this patient
        </div>
      )}
    </div>
  );
};

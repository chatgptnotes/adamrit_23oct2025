import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer, Eye } from 'lucide-react';

interface RadiologySectionProps {
  patientId: string;
}

export const RadiologySection = ({ patientId }: RadiologySectionProps) => {
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['radiology', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radiology_reports')
        .select('*')
        .eq('patient_id', patientId)
        .order('report_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) return <div className="text-center py-8">Loading radiology reports...</div>;

  return (
    <div className="space-y-4">
      {reports.length > 0 ? (
        reports.map((report) => (
          <Card key={report.id}>
            <CardContent className="pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {report.imaging_type || 'Imaging Report'}
                </h3>
                <p className="text-sm text-gray-600">Report Date: {report.report_date}</p>
                <p className="text-sm text-gray-600">Radiologist: {report.radiologist_name || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700">{report.findings || 'No findings documented'}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  View
                </Button>
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
          No radiology reports available for this patient
        </div>
      )}
    </div>
  );
};

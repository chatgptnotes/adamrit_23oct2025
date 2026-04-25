import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';

interface PrintRxSectionProps {
  patientId: string;
  patient: any;
}

export const PrintRxSection = ({ patientId, patient }: PrintRxSectionProps) => {
  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ['print-rx', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'active')
        .limit(1)
        .order('prescription_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const latestRx = prescriptions[0];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    alert('PDF download functionality coming soon');
  };

  if (isLoading) return <div className="text-center py-8">Loading prescription...</div>;

  return (
    <div className="space-y-4">
      {latestRx ? (
        <Card className="border-2 border-blue-200">
          <CardContent className="pt-6">
            <div className="bg-white p-8 border border-dashed border-gray-300 rounded-lg">
              {/* Hospital Header */}
              <div className="text-center mb-6 pb-4 border-b-2 border-gray-300">
                <h1 className="text-2xl font-bold text-blue-600">HOPE HOSPITAL</h1>
                <p className="text-sm text-gray-600">Healthcare Excellence</p>
              </div>

              {/* Rx Symbol */}
              <div className="text-6xl text-blue-400 text-center mb-4">℞</div>

              {/* Patient Details */}
              <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold">Patient Name:</p>
                  <p>{patient.name}</p>
                </div>
                <div>
                  <p className="font-semibold">Age:</p>
                  <p>{patient.age} years</p>
                </div>
                <div>
                  <p className="font-semibold">Date of Birth:</p>
                  <p>{patient.date_of_birth}</p>
                </div>
                <div>
                  <p className="font-semibold">Patient ID:</p>
                  <p>{patient.patients_id}</p>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-b border-gray-300 py-2 mb-4"></div>

              {/* Medications */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3">MEDICATIONS:</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {latestRx.notes || 'No medications specified'}
                </p>
              </div>

              {/* Separator */}
              <div className="border-t border-gray-300 py-2 mb-4"></div>

              {/* Doctor Signature Section */}
              <div className="mt-8 grid grid-cols-2 gap-8">
                <div>
                  <p className="border-t border-gray-400 pt-2 text-center font-semibold">
                    Doctor Signature
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date: {latestRx.prescription_date}</p>
                  <p className="text-sm font-semibold text-gray-700">Dr. {latestRx.doctor_name}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-gray-500 mt-6 pt-4 border-t border-gray-200">
                <p>This is a digitally generated prescription. For authentic verification, contact the hospital.</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <Button onClick={handlePrint} className="flex items-center gap-2 flex-1 bg-blue-600 hover:bg-blue-700">
                <Printer className="h-4 w-4" />
                Print Prescription
              </Button>
              <Button onClick={handleDownloadPDF} variant="outline" className="flex items-center gap-2 flex-1">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No active prescriptions available for this patient
        </div>
      )}
    </div>
  );
};

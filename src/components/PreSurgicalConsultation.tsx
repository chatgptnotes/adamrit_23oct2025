
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, User, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EsicSurgeon {
  id: string;
  name: string;
  specialty: string;
  department: string;
  contact_info: string;
}

interface ConsultationEntry {
  id: number;
  selectedDoctor: string;
  dateFrom: string;
  dateTo: string;
}

const PreSurgicalConsultation: React.FC = () => {
  const [esicSurgeons, setEsicSurgeons] = useState<EsicSurgeon[]>([]);
  const [consultationEntries, setConsultationEntries] = useState<ConsultationEntry[]>([
    { id: 1, selectedDoctor: '', dateFrom: '', dateTo: '' }
  ]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEsicSurgeons();
  }, [fetchEsicSurgeons]);

  const fetchEsicSurgeons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('esic_surgeons')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching ESIC surgeons:', error);
        toast({
          title: "Error",
          description: "Failed to fetch ESIC surgeons data",
          variant: "destructive"
        });
        return;
      }

      setEsicSurgeons(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSelect = (entryId: number, doctorId: string) => {
    setConsultationEntries(prev =>
      prev.map(entry =>
        entry.id === entryId
          ? { ...entry, selectedDoctor: doctorId }
          : entry
      )
    );
  };

  const handleDateChange = (entryId: number, field: 'dateFrom' | 'dateTo', value: string) => {
    setConsultationEntries(prev =>
      prev.map(entry =>
        entry.id === entryId
          ? { ...entry, [field]: value }
          : entry
      )
    );
  };

  const addNewEntry = () => {
    const newId = Math.max(...consultationEntries.map(e => e.id)) + 1;
    setConsultationEntries(prev => [
      ...prev,
      { id: newId, selectedDoctor: '', dateFrom: '', dateTo: '' }
    ]);
  };

  const removeEntry = (entryId: number) => {
    if (consultationEntries.length > 1) {
      setConsultationEntries(prev => prev.filter(entry => entry.id !== entryId));
    }
  };

  const getSelectedDoctorInfo = (doctorId: string) => {
    return esicSurgeons.find(surgeon => surgeon.id === doctorId);
  };

  const formatDateRange = (dateFrom: string, dateTo: string) => {
    if (!dateFrom || !dateTo) return '';
    
    const fromDate = new Date(dateFrom).toLocaleDateString('en-GB');
    const toDate = new Date(dateTo).toLocaleDateString('en-GB');
    return `Dt.(${fromDate} TO ${toDate})`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading ESIC surgeons...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Pre-Surgical Consultation for Inpatients
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {consultationEntries.map((entry, index) => (
            <div key={entry.id} className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{index + 1}) Pre-Surgical Consultation for Inpatients</h3>
                {consultationEntries.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeEntry(entry.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>i) Select Doctor</Label>
                  <Select
                    value={entry.selectedDoctor}
                    onValueChange={(value) => handleDoctorSelect(entry.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Doctor" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg max-h-60 overflow-y-auto z-50">
                      {esicSurgeons.map((surgeon) => (
                        <SelectItem key={surgeon.id} value={surgeon.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{surgeon.name}</span>
                            {surgeon.specialty && (
                              <span className="text-sm text-gray-600">{surgeon.specialty}</span>
                            )}
                            {surgeon.department && (
                              <span className="text-xs text-gray-500">{surgeon.department}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Date Range
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">From</Label>
                      <Input
                        type="date"
                        value={entry.dateFrom}
                        onChange={(e) => handleDateChange(entry.id, 'dateFrom', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">To</Label>
                      <Input
                        type="date"
                        value={entry.dateTo}
                        onChange={(e) => handleDateChange(entry.id, 'dateTo', e.target.value)}
                      />
                    </div>
                  </div>
                  {entry.dateFrom && entry.dateTo && (
                    <p className="text-sm text-gray-600">
                      {formatDateRange(entry.dateFrom, entry.dateTo)}
                    </p>
                  )}
                </div>
              </div>

              {entry.selectedDoctor && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Selected Doctor Details:</h4>
                  {(() => {
                    const doctor = getSelectedDoctorInfo(entry.selectedDoctor);
                    return doctor ? (
                      <div className="text-sm space-y-1">
                        <p><strong>Name:</strong> {doctor.name}</p>
                        {doctor.specialty && <p><strong>Specialty:</strong> {doctor.specialty}</p>}
                        {doctor.department && <p><strong>Department:</strong> {doctor.department}</p>}
                        {doctor.contact_info && <p><strong>Contact:</strong> {doctor.contact_info}</p>}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-2">
            <Button onClick={addNewEntry} variant="outline">
              Add Another Consultation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Consultation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {consultationEntries.filter(entry => entry.selectedDoctor).length === 0 ? (
            <p className="text-gray-500">No consultations selected yet.</p>
          ) : (
            <div className="space-y-3">
              {consultationEntries
                .filter(entry => entry.selectedDoctor)
                .map((entry, index) => {
                  const doctor = getSelectedDoctorInfo(entry.selectedDoctor);
                  return (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">
                          {index + 1}. {doctor?.name || 'Unknown Doctor'}
                        </p>
                        {doctor?.specialty && (
                          <p className="text-sm text-gray-600">{doctor.specialty}</p>
                        )}
                        {entry.dateFrom && entry.dateTo && (
                          <p className="text-sm text-gray-500">
                            {formatDateRange(entry.dateFrom, entry.dateTo)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PreSurgicalConsultation;


import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MedicationSectionProps {
  selectedOtherMedications: string[];
  onOtherMedicationsSelect: (item: string) => void;
  onOtherMedicationsRemove: (item: string) => void;
}

interface Medication {
  id: string;
  name: string;
  dosage?: string;
  category?: string;
}

export const MedicationSection: React.FC<MedicationSectionProps> = ({
  selectedOtherMedications,
  onOtherMedicationsSelect,
  onOtherMedicationsRemove
}) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDay, setFromDay] = useState<string>('');
  const [toDay, setToDay] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchMedications = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('medication')
        .select('id, name, dosage, category')
        .order('name');

      if (error) {
        console.error('Error fetching medications:', error);
      } else {
        setMedications((data as Medication[]) || []);
      }
      setIsLoading(false);
    };

    fetchMedications();
  }, []);

  const filteredMedications = medications.filter(med =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedOtherMedications.includes(med.name)
  );

  const handleMedicationToggle = (medicationName: string) => {
    if (selectedOtherMedications.includes(medicationName)) {
      onOtherMedicationsRemove(medicationName);
    } else {
      onOtherMedicationsSelect(medicationName);
    }
  };

  const showingMedicationsFor = fromDay && toDay ? `D${fromDay}` : 'D1';
  const noMedicationsMessage = selectedOtherMedications.length === 0
    ? "No medications saved for this day."
    : null;

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-blue-50">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-lg font-semibold text-blue-700">Medications</Label>
          <p className="text-sm text-muted-foreground">To be given</p>
        </div>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
          Add Med
        </Button>
      </div>

      {/* Day Range Selector */}
      <div className="flex items-center gap-2 text-sm">
        <span>Showing medications for:</span>
        <span className="font-medium text-blue-700">{showingMedicationsFor}</span>
        <div className="flex items-center gap-1 ml-4">
          <span>Day</span>
          <Input
            type="number"
            value={fromDay}
            onChange={(e) => setFromDay(e.target.value)}
            className="w-16 h-8"
            placeholder="1"
          />
          <span>to</span>
          <Input
            type="number"
            value={toDay}
            onChange={(e) => setToDay(e.target.value)}
            className="w-16 h-8"
            placeholder="7"
          />
        </div>
      </div>

      {/* No medications message */}
      {noMedicationsMessage && (
        <p className="text-sm text-muted-foreground">{noMedicationsMessage}</p>
      )}

      {/* Selected Medications */}
      {selectedOtherMedications.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Selected Medications:</Label>
          <div className="flex flex-wrap gap-2">
            {selectedOtherMedications.map((medication) => (
              <Badge key={medication} className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200">
                {medication}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => onOtherMedicationsRemove(medication)}
                />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="space-y-2">
        <Input
          placeholder="Search medicine..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Medications List */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Select from all medications:</Label>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading medications...</p>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-2 border rounded p-2 bg-white">
            {filteredMedications.length > 0 ? (
              filteredMedications.map((medication) => (
                <div key={medication.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={medication.id}
                    checked={selectedOtherMedications.includes(medication.name)}
                    onCheckedChange={() => handleMedicationToggle(medication.name)}
                  />
                  <label htmlFor={medication.id} className="text-sm cursor-pointer flex-1">
                    {medication.name} {medication.dosage && `(${medication.dosage})`}
                    {medication.category && (
                      <span className="text-xs text-muted-foreground ml-2">- {medication.category}</span>
                    )}
                  </label>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No medications found</p>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      <Button className="w-full bg-blue-600 hover:bg-blue-700">
        Save
      </Button>
    </div>
  );
};

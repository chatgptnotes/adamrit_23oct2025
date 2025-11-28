import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useSearchableMedication } from '@/hooks/useSearchableMedication';

interface SelectedMedication {
  id: string;
  name: string;
  generic_name?: string;
  category?: string;
}

interface SearchableMedicationSelectProps {
  selectedMedications: SelectedMedication[];
  onAddMedication: (medication: { id: string; name: string; generic_name?: string; category?: string }) => void;
}

const SearchableMedicationSelect = ({ 
  selectedMedications, 
  onAddMedication 
}: SearchableMedicationSelectProps) => {
  const { medications, isLoading, searchTerm, setSearchTerm } = useSearchableMedication();
  const [showResults, setShowResults] = useState(false);

  const handleMedicationSelect = (medication: { id: string; name: string; generic_name?: string | null; category?: string | null }) => {
    onAddMedication({
      id: medication.id,
      name: medication.name,
      generic_name: medication.generic_name || undefined,
      category: medication.category || undefined
    });
    setSearchTerm('');
    setShowResults(false);
  };

  const filteredMedications = medications.filter(medication => 
    !selectedMedications.some(selected => selected.id === medication.id)
  );

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        placeholder="Search medications by name, generic name, or category..."
        className="pl-10 border-gray-300"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setShowResults(e.target.value.length > 0);
        }}
        onFocus={() => setShowResults(searchTerm.length > 0)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
      />
      
      {showResults && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-center text-gray-500">Loading medications...</div>
          ) : filteredMedications.length > 0 ? (
            filteredMedications.map((medication) => (
              <div
                key={medication.id}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                onClick={() => handleMedicationSelect(medication)}
              >
                <div className="font-medium text-gray-900">{medication.name}</div>
                {medication.generic_name && (
                  <div className="text-sm text-gray-600">Generic: {medication.generic_name}</div>
                )}
                {medication.category && (
                  <div className="text-xs text-gray-500">Category: {medication.category}</div>
                )}
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-gray-500">No medications found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableMedicationSelect;
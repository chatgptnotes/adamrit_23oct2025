
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useSearchableHopeSurgery } from '@/hooks/useSearchableHopeSurgery';

interface SelectedSurgery {
  id: string;
  name: string;
  specialty?: string;
}

interface SearchableHopeSurgerySelectProps {
  selectedSurgeries: SelectedSurgery[];
  onAddSurgery: (surgery: { id: string; name: string; specialty?: string }) => void;
}

const SearchableHopeSurgerySelect = ({ 
  selectedSurgeries, 
  onAddSurgery 
}: SearchableHopeSurgerySelectProps) => {
  const { surgeries, isLoading, searchTerm, setSearchTerm } = useSearchableHopeSurgery();
  const [showResults, setShowResults] = useState(false);

  const handleSurgerySelect = (surgery: { id: string; name: string; specialty?: string | null }) => {
    onAddSurgery({
      id: surgery.id,
      name: surgery.name,
      specialty: surgery.specialty || undefined
    });
    setSearchTerm('');
    setShowResults(false);
  };

  const filteredSurgeries = surgeries.filter(surgery => 
    !selectedSurgeries.some(selected => selected.id === surgery.id)
  );

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        placeholder="Search hope surgeons by name or specialty..."
        className="pl-10 border-gray-300"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setShowResults(e.target.value.length > 0);
        }}
        onFocus={() => setShowResults(searchTerm.length > 0)}
      />
      {showResults && searchTerm && (
        <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {isLoading ? (
            <div className="p-2 text-sm text-gray-500">Loading...</div>
          ) : filteredSurgeries.length > 0 ? (
            filteredSurgeries.map((surgery) => (
              <button
                key={surgery.id}
                className="w-full text-left p-2 hover:bg-gray-100 text-sm"
                onClick={() => handleSurgerySelect(surgery)}
              >
                <div className="font-medium">{surgery.name}</div>
                {surgery.specialty && (
                  <div className="text-gray-500 text-xs">Specialty: {surgery.specialty}</div>
                )}
                {surgery.department && (
                  <div className="text-gray-500 text-xs">Department: {surgery.department}</div>
                )}
              </button>
            ))
          ) : (
            <div className="p-2 text-sm text-gray-500">No surgeons found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableHopeSurgerySelect;


import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useSearchableCghsSurgery } from '@/hooks/useSearchableCghsSurgery';

interface SelectedSurgery {
  id: string;
  name: string;
  code?: string;
}

interface SearchableCghsSurgerySelectProps {
  selectedSurgeries: SelectedSurgery[];
  onAddSurgery: (surgery: { id: string; name: string; code?: string }) => void;
  patientCorporate?: string;
}

const SearchableCghsSurgerySelect = ({
  selectedSurgeries,
  onAddSurgery,
  patientCorporate
}: SearchableCghsSurgerySelectProps) => {
  const { surgeries, isLoading, searchTerm, setSearchTerm } = useSearchableCghsSurgery(patientCorporate);
  const [showResults, setShowResults] = useState(false);

  const handleSurgerySelect = (surgery: { id: string; name: string; code?: string | null }) => {
    onAddSurgery({
      id: surgery.id,
      name: surgery.name,
      code: surgery.code || undefined
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
        placeholder="Search surgeries by name, code, or category..."
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
                {surgery.code && (
                  <div className="text-gray-500 text-xs">Code: {surgery.code}</div>
                )}
                {surgery.category && (
                  <div className="text-blue-600 text-xs font-medium">Category: {surgery.category}</div>
                )}
                {surgery.selectedRate !== undefined && (
                  <div className="text-green-600 text-xs font-semibold">
                    Rate: ₹{surgery.selectedRate}
                    {surgery.rateSource === 'bhopal_nabh' && <span className="ml-1 text-purple-600">(Bhopal NABH)</span>}
                  </div>
                )}
                {surgery.description && (
                  <div className="text-gray-500 text-xs">{surgery.description}</div>
                )}
              </button>
            ))
          ) : (
            <div className="p-2 text-sm text-gray-500">No surgeries found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableCghsSurgerySelect;

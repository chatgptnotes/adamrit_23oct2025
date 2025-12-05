import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useSearchableLab } from '@/hooks/useSearchableLab';

interface SelectedLab {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

interface SearchableLabSelectProps {
  selectedLabs: SelectedLab[];
  onAddLab: (lab: { id: string; name: string; description?: string; category?: string }) => void;
}

const SearchableLabSelect = ({ 
  selectedLabs, 
  onAddLab 
}: SearchableLabSelectProps) => {
  const { labs, isLoading, searchTerm, setSearchTerm } = useSearchableLab();
  const [showResults, setShowResults] = useState(false);

  const handleLabSelect = (lab: { id: string; name: string; description?: string | null; category?: string | null }) => {
    onAddLab({
      id: lab.id,
      name: lab.name,
      description: lab.description || undefined,
      category: lab.category || undefined
    });
    setSearchTerm('');
    setShowResults(false);
  };

  const filteredLabs = labs.filter(lab => 
    !selectedLabs.some(selected => selected.id === lab.id)
  );

  console.log('Lab component state:', { searchTerm, showResults, isLoading, labs: labs.length, filteredLabs: filteredLabs.length });

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        placeholder="Search lab tests by name, description, or category..."
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
            <div className="p-3 text-center text-gray-500">Loading lab tests...</div>
          ) : filteredLabs.length > 0 ? (
            filteredLabs.map((lab) => (
              <div
                key={lab.id}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                onClick={() => handleLabSelect(lab)}
              >
                <div className="font-medium text-gray-900">{lab.name}</div>
                {lab.description && (
                  <div className="text-sm text-gray-600">{lab.description}</div>
                )}
                {lab.category && (
                  <div className="text-xs text-gray-500">Category: {lab.category}</div>
                )}
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-gray-500">No lab tests found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableLabSelect;
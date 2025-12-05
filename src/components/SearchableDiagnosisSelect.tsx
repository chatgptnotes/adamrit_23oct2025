
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, X } from 'lucide-react';
import { useSearchableDiagnoses } from '@/hooks/useSearchableDiagnoses';

interface SelectedDiagnosis {
  id: string;
  name: string;
  diagnosed_date?: string;
}

interface SearchableDiagnosisSelectProps {
  selectedDiagnoses: SelectedDiagnosis[];
  onAddDiagnosis: (diagnosis: { id: string; name: string }) => void;
  onRemoveDiagnosis: (diagnosisId: string) => void;
}

const SearchableDiagnosisSelect = ({ 
  selectedDiagnoses, 
  onAddDiagnosis, 
  onRemoveDiagnosis 
}: SearchableDiagnosisSelectProps) => {
  const { diagnoses, isLoading, searchTerm, setSearchTerm } = useSearchableDiagnoses();
  const [showResults, setShowResults] = useState(false);

  const handleDiagnosisSelect = (diagnosis: { id: string; name: string }) => {
    onAddDiagnosis(diagnosis);
    setSearchTerm('');
    setShowResults(false);
  };

  const filteredDiagnoses = diagnoses.filter(diagnosis => 
    !selectedDiagnoses.some(selected => selected.id === diagnosis.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search diagnoses by name, ICD code, or category..."
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
              ) : filteredDiagnoses.length > 0 ? (
                filteredDiagnoses.map((diagnosis) => (
                  <button
                    key={diagnosis.id}
                    className="w-full text-left p-2 hover:bg-gray-100 text-sm"
                    onClick={() => handleDiagnosisSelect(diagnosis)}
                  >
                    <div className="font-medium">{diagnosis.name}</div>
                    {diagnosis.description && (
                      <div className="text-gray-500 text-xs">{diagnosis.description}</div>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-2 text-sm text-gray-500">No diagnoses found</div>
              )}
            </div>
          )}
        </div>
        <Button className="bg-gray-600 hover:bg-gray-700">
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      <div>
        <h4 className="font-medium mb-3 text-black">Selected Diagnoses</h4>
        <div className="space-y-2">
          {selectedDiagnoses.map((diagnosis) => (
            <Card key={diagnosis.id} className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-semibold text-black text-base mb-1">{diagnosis.name}</h5>
                    <p className="text-sm text-gray-600 mb-3">Related complications available</p>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-blue-100 text-blue-800 border-0 px-3 py-1">active</Badge>
                      <span className="text-sm text-gray-600">
                        Diagnosed: {diagnosis.diagnosed_date || '10/06/2025'}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                    onClick={() => onRemoveDiagnosis(diagnosis.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchableDiagnosisSelect;


import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  totalResults: number;
  currentResult: number;
  onPrevious: () => void;
  onNext: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  totalResults,
  currentResult,
  onPrevious,
  onNext
}) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-white">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search in spreadsheet..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4"
        />
      </div>
      
      {searchTerm && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>
            {totalResults > 0 ? `${currentResult + 1} of ${totalResults}` : 'No results'}
          </span>
          
          {totalResults > 0 && (
            <div className="flex gap-1">
              <button
                onClick={onPrevious}
                disabled={totalResults === 0}
                className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ↑
              </button>
              <button
                onClick={onNext}
                disabled={totalResults === 0}
                className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ↓
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

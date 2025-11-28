
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface SearchableFieldSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: Array<{ id: string; name: string; description?: string; category?: string }>;
  placeholder?: string;
  className?: string;
  maxSelections?: number;
  showDescriptions?: boolean;
  showCategories?: boolean;
  allowCustom?: boolean;
  onCustomAdd?: (value: string) => void;
}

export const SearchableFieldSelect: React.FC<SearchableFieldSelectProps> = ({
  value = [],
  onChange,
  options = [],
  placeholder = "Search and select...",
  className = "",
  maxSelections,
  showDescriptions = false,
  showCategories = false,
  allowCustom = false,
  onCustomAdd
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customValue, setCustomValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.description && option.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (option.category && option.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (optionId: string) => {
    if (maxSelections && value.length >= maxSelections) {
      return;
    }
    
    if (!value.includes(optionId)) {
      onChange([...value, optionId]);
    }
    setSearchTerm('');
  };

  const handleRemove = (optionId: string) => {
    onChange(value.filter(id => id !== optionId));
  };

  const handleCustomAdd = () => {
    if (customValue.trim() && onCustomAdd) {
      onCustomAdd(customValue.trim());
      setCustomValue('');
    }
  };

  const selectedOptions = options.filter(option => value.includes(option.id));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex flex-wrap gap-1 p-2 border border-gray-300 rounded-md bg-white min-h-[40px]">
        {selectedOptions.map(option => (
          <Badge key={option.id} variant="secondary" className="flex items-center gap-1">
            {option.name}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => handleRemove(option.id)}
            />
          </Badge>
        ))}
        
        <div className="flex-1 min-w-0">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={selectedOptions.length === 0 ? placeholder : "Add more..."}
            className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            onFocus={() => setIsOpen(true)}
          />
        </div>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-6 w-6 p-0"
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          <ScrollArea className="max-h-60">
            {filteredOptions.length > 0 && (
              <div className="p-2">
                {filteredOptions.map(option => (
                  <div
                    key={option.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded"
                    onClick={() => handleSelect(option.id)}
                  >
                    <Checkbox
                      checked={value.includes(option.id)}
                      onChange={() => {}} // Controlled by onClick
                      className="pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{option.name}</div>
                      {showDescriptions && option.description && (
                        <div className="text-sm text-gray-600 truncate">{option.description}</div>
                      )}
                      {showCategories && option.category && (
                        <div className="text-xs text-gray-500">{option.category}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {allowCustom && onCustomAdd && (
              <div className="border-t p-2">
                <div className="flex gap-2">
                  <Input
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder="Add custom value..."
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomAdd()}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCustomAdd}
                    disabled={!customValue.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
            
            {filteredOptions.length === 0 && !allowCustom && (
              <div className="p-4 text-center text-gray-500">
                No options found
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
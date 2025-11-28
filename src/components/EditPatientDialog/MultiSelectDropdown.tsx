
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface MultiSelectDropdownProps {
  label: string;
  placeholder: string;
  options: string[];
  selectedItems: string[];
  onItemSelect: (item: string) => void;
  onItemRemove: (item: string) => void;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  placeholder,
  options,
  selectedItems,
  onItemSelect,
  onItemRemove
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedItems.includes(option)
  );

  const handleSelect = (option: string) => {
    onItemSelect(option);
    setSearchTerm('');
    setShowDropdown(false);
  };

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [showDropdown]);

  return (
    <div ref={dropdownRef}>
      <Label>{label}</Label>
      <div className="space-y-2">
        {/* Selected items display */}
        {selectedItems.length > 0 && (
          <div className="flex flex-wrap gap-1 p-2 border-2 border-gray-400 rounded-md min-h-[40px]">
            {selectedItems.map((item) => (
              <Badge key={item} variant="secondary" className="flex items-center gap-1">
                {item}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onItemRemove(item)}
                />
              </Badge>
            ))}
          </div>
        )}
        
        {/* Search input and dropdown */}
        <div className="relative">
          <Input
            className="border-2 border-gray-400 focus:border-gray-600"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
          />
          
          {showDropdown && filteredOptions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border-2 border-gray-400 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredOptions.map((option) => (
                <div
                  key={option}
                  className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm"
                  onClick={() => handleSelect(option)}
                >
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

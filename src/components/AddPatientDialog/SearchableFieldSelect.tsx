
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type TableName = 'cghs_surgery' | 'complications' | 'medication' | 'lab' | 'radiology' |
                 'esic_surgeons' | 'referees' | 'hope_surgeons' | 'hope_consultants' |
                 'diagnoses' | 'sst_treatments';

interface SearchableFieldSelectProps {
  // Option 1: Pass options directly (original interface)
  options?: Array<{ id: string; name: string; description?: string; category?: string }>;

  // Option 2: Fetch from database using tableName
  tableName?: TableName;
  displayField?: string;
  searchFields?: string[];
  fieldName?: string;
  additionalFilter?: Record<string, any>;

  // Value can be string or string[]
  value: string | string[];
  // onChange can accept string or string[]
  onChange: ((value: string) => void) | ((value: string[]) => void);

  placeholder?: string;
  className?: string;
  maxSelections?: number;
  showDescriptions?: boolean;
  showCategories?: boolean;
  allowCustom?: boolean;
  onCustomAdd?: (value: string) => void;
}

export const SearchableFieldSelect: React.FC<SearchableFieldSelectProps> = ({
  options: providedOptions,
  tableName,
  displayField = 'name',
  searchFields = ['name'],
  value = '',
  onChange,
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

  // Fetch options from database if tableName is provided
  const { data: fetchedOptions = [], isLoading } = useQuery({
    queryKey: ['searchable-field', tableName, searchTerm],
    queryFn: async () => {
      if (!tableName) return [];

      try {
        let query = supabase
          .from(tableName)
          .select('*')
          .order(displayField);

        if (searchTerm && searchTerm.length > 0) {
          const searchConditions = searchFields
            .map(field => `${field}.ilike.%${searchTerm}%`)
            .join(',');
          query = query.or(searchConditions);
        }

        const { data, error } = await query.limit(100);

        if (error) {
          console.error(`Error fetching ${tableName}:`, error);
          return [];
        }

        return (data || []).map(item => ({
          id: item.id?.toString() || item.name,
          name: item[displayField] || item.name || '',
          description: item.specialty || item.description || '',
          category: item.department || item.category || ''
        }));
      } catch (err) {
        console.error(`Exception fetching ${tableName}:`, err);
        return [];
      }
    },
    enabled: !!tableName,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Use provided options or fetched options
  const options = providedOptions || fetchedOptions;

  // Normalize value to array for internal handling
  const valueArray: string[] = Array.isArray(value)
    ? value
    : (typeof value === 'string' && value ? value.split(', ').filter(v => v.trim()) : []);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.description && option.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (option.category && option.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle selection - call onChange with the option name
  const handleSelect = (optionName: string) => {
    if (maxSelections && valueArray.length >= maxSelections) {
      return;
    }

    // For database-backed selects, pass the name as string
    if (tableName) {
      (onChange as (value: string) => void)(optionName);
    } else {
      // For options-based selects (original behavior), pass as array
      if (!valueArray.includes(optionName)) {
        (onChange as (value: string[]) => void)([...valueArray, optionName]);
      }
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleRemove = (optionName: string) => {
    const newValues = valueArray.filter(v => v !== optionName);
    if (tableName) {
      (onChange as (value: string) => void)(newValues.join(', '));
    } else {
      (onChange as (value: string[]) => void)(newValues);
    }
  };

  const handleCustomAdd = () => {
    if (customValue.trim() && onCustomAdd) {
      onCustomAdd(customValue.trim());
      setCustomValue('');
    }
  };

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
        {/* Show selected values as badges directly from valueArray */}
        {valueArray.filter(v => v && v.trim()).map((val, index) => (
          <Badge key={`selected-${index}`} variant="secondary" className="flex items-center gap-1">
            {val}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => handleRemove(val)}
            />
          </Badge>
        ))}

        <div className="flex-1 min-w-0">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={valueArray.length === 0 ? placeholder : "Add more..."}
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
            {isLoading && tableName && (
              <div className="p-4 text-center text-gray-500">
                Loading...
              </div>
            )}

            {!isLoading && filteredOptions.length > 0 && (
              <div className="p-2">
                {filteredOptions.map((option, index) => (
                  <div
                    key={`${option.id}-${index}`}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded"
                    onClick={() => handleSelect(option.name)}
                  >
                    <Checkbox
                      checked={valueArray.some(v =>
                        v?.toLowerCase().trim() === option.name?.toLowerCase().trim() ||
                        v === option.id
                      )}
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

            {!isLoading && filteredOptions.length === 0 && !allowCustom && (
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

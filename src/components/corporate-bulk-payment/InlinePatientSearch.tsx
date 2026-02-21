import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PatientResult {
  id: string;
  name: string;
  patients_id: string | null;
  age?: number;
  gender?: string;
  phone?: string;
}

interface InlinePatientSearchProps {
  onSelect: (patient: PatientResult) => void;
  selectedName?: string;
  placeholder?: string;
}

const InlinePatientSearch: React.FC<InlinePatientSearchProps> = ({
  onSelect,
  selectedName = '',
  placeholder = 'Search patient...',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { hospitalConfig } = useAuth();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['inline-patient-search', searchTerm, hospitalConfig.name],
    queryFn: async (): Promise<PatientResult[]> => {
      if (!searchTerm || searchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('patients')
        .select('id, name, patients_id, age, gender, phone')
        .eq('hospital_name', hospitalConfig.name)
        .or(`name.ilike.%${searchTerm}%,patients_id.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .order('name')
        .limit(10);

      if (error) {
        console.error('Patient search error:', error);
        return [];
      }
      return (data || []) as PatientResult[];
    },
    enabled: searchTerm.length >= 2,
  });

  // Calculate fixed position for dropdown
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed' as const,
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 320),
        zIndex: 9999,
      });
    }
  }, [isOpen, searchTerm]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (patient: PatientResult) => {
    onSelect(patient);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      {selectedName ? (
        <div className="text-sm font-medium truncate py-1">{selectedName}</div>
      ) : (
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(e.target.value.length >= 2);
          }}
          className="h-8 text-sm"
        />
      )}

      {isOpen && searchTerm.length >= 2 && (
        <div
          className="bg-white border rounded-md shadow-lg max-h-52 overflow-y-auto"
          style={dropdownStyle}
        >
          {isLoading ? (
            <div className="p-3 text-sm text-gray-500 text-center">Searching...</div>
          ) : patients.length === 0 ? (
            <div className="p-3 text-sm text-gray-500 text-center">No patients found</div>
          ) : (
            patients.map((patient) => (
              <div
                key={patient.id}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(patient)}
              >
                <div className="font-medium text-sm">{patient.name}</div>
                <div className="text-xs text-gray-500">
                  {patient.patients_id && `ID: ${patient.patients_id}`}
                  {patient.age && ` | ${patient.age}y`}
                  {patient.gender && ` | ${patient.gender}`}
                  {patient.phone && ` | ${patient.phone}`}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default InlinePatientSearch;

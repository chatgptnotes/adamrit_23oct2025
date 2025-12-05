
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Patient {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  phone?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

interface PatientSearchSelectProps {
  value: Patient | null;
  onChange: (patient: Patient | null) => void;
  placeholder?: string;
  className?: string;
}

export const PatientSearchSelect: React.FC<PatientSearchSelectProps> = ({
  value,
  onChange,
  placeholder = "Search patients...",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { hospitalConfig } = useAuth();

  const { data: patients = [], isLoading, error } = useQuery({
    queryKey: ['patient-search', searchTerm, hospitalConfig.name],
    queryFn: async (): Promise<Patient[]> => {
      if (!searchTerm || searchTerm.length < 2) return [];
      
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('id, name, age, gender, phone, address, created_at, updated_at')
          .eq('hospital_name', hospitalConfig.name)
          .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
          .order('name')
          .limit(10);

        if (error) {
          console.error('Error searching patients:', error);
          throw error;
        }

        return data || [];
      } catch (error) {
        console.error('Error in patient search queryFn:', error);
        return [];
      }
    },
    enabled: searchTerm.length >= 2
  });

  const handlePatientSelect = (patient: Patient) => {
    onChange(patient);
    setSearchTerm('');
    setIsSearching(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearchTerm('');
    setIsSearching(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsSearching(value.length >= 2);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Selected Patient */}
      {value && (
        <div className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
          <div className="flex-1">
            <div className="font-medium">{value.name}</div>
            <div className="text-sm text-gray-600">
              {value.age && `${value.age} years`} {value.gender && `• ${value.gender}`}
              {value.phone && ` • ${value.phone}`}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClear}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Search Input */}
      <div className="space-y-2">
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleSearchChange}
          className="border-2 border-gray-300 focus:border-primary"
        />

        {isSearching && searchTerm.length >= 2 && (
          <Card className="max-h-60 overflow-y-auto z-50">
            <CardContent className="p-2">
              {isLoading ? (
                <p className="text-center py-4 text-muted-foreground">Searching...</p>
              ) : error ? (
                <p className="text-center py-4 text-red-500">
                  Error loading patients: {error instanceof Error ? error.message : 'Unknown error'}
                </p>
              ) : patients.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  No patients found. Try a different search term.
                </p>
              ) : (
                <div className="space-y-1">
                  {patients.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-gray-100 cursor-pointer"
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{patient.name}</p>
                        <div className="text-sm text-muted-foreground">
                          {patient.age && `${patient.age} years`} {patient.gender && `• ${patient.gender}`}
                          {patient.phone && ` • ${patient.phone}`}
                        </div>
                        {patient.address && (
                          <p className="text-xs text-gray-500 truncate">{patient.address}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, User, Phone, FileText } from 'lucide-react';
import { SearchCriteria } from './types/patientLookup';

interface PatientSearchFormProps {
  searchCriteria: SearchCriteria;
  onSearchChange: (criteria: SearchCriteria) => void;
  onSearch: () => void;
  isLoading: boolean;
}

export const PatientSearchForm: React.FC<PatientSearchFormProps> = ({
  searchCriteria,
  onSearchChange,
  onSearch,
  isLoading
}) => {
  const handleMobileChange = (value: string) => {
    onSearchChange({ ...searchCriteria, mobile: value });
  };

  const handleNameChange = (value: string) => {
    onSearchChange({ ...searchCriteria, name: value });
  };

  const handlePatientIdChange = (value: string) => {
    onSearchChange({ ...searchCriteria, patientId: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Search Criteria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number</Label>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <Input
                id="mobile"
                placeholder="Enter mobile number"
                value={searchCriteria.mobile}
                onChange={(e) => handleMobileChange(e.target.value)}
                maxLength={10}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Primary search method - most reliable
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Patient Name</Label>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="Enter patient name"
                value={searchCriteria.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Alternative search method
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="patientId">Patient ID</Label>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Input
                id="patientId"
                placeholder="Enter patient ID"
                value={searchCriteria.patientId}
                onChange={(e) => handlePatientIdChange(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              If patient remembers their ID
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onSearch} disabled={isLoading}>
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? 'Searching...' : 'Search Patients'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};


import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { SearchableFieldSelect } from '@/components/AddPatientDialog/SearchableFieldSelect';
import { SingleSelectFieldSelect } from './SingleSelectFieldSelect';
import { primaryDiagnosisOptions, complicationOptions } from './options';
import { Patient } from '@/types/patient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import SearchableCghsSurgerySelect from '@/components/SearchableCghsSurgerySelect';

interface BasicInfoFieldsProps {
  formData: Patient;
  onFieldChange: (field: keyof Patient, value: string) => void;
  onSelectChange: (field: keyof Patient) => (value: string) => void;
}

export const BasicInfoFields: React.FC<BasicInfoFieldsProps> = ({
  formData,
  onFieldChange,
  onSelectChange
}) => {
  // Handle multi-select fields (surgeons, consultants, surgeries)
  const handleEsicSurgeonAdd = (surgeon: string) => {
    const current = formData.surgeon || '';
    const surgeons = current ? current.split(', ') : [];
    if (!surgeons.includes(surgeon)) {
      surgeons.push(surgeon);
      onFieldChange('surgeon', surgeons.join(', '));
    }
  };

  const handleEsicSurgeonRemove = (surgeonToRemove: string) => {
    const current = formData.surgeon || '';
    const surgeons = current.split(', ').filter(s => s !== surgeonToRemove);
    onFieldChange('surgeon', surgeons.join(', '));
  };

  const handleHopeConsultantAdd = (consultant: string) => {
    const current = formData.hopeConsultants || '';
    const consultants = current ? current.split(', ') : [];
    if (!consultants.includes(consultant)) {
      consultants.push(consultant);
      onFieldChange('hopeConsultants', consultants.join(', '));
    }
  };

  const handleHopeConsultantRemove = (consultantToRemove: string) => {
    const current = formData.hopeConsultants || '';
    const consultants = current.split(', ').filter(c => c !== consultantToRemove);
    onFieldChange('hopeConsultants', consultants.join(', '));
  };

  // Handle Surgery Assigned multi-select
  const handleSurgeryAdd = (surgery: { id: string; name: string; code?: string }) => {
    const current = formData.surgery || '';
    const surgeries = current ? current.split(', ') : [];
    if (!surgeries.includes(surgery.name)) {
      surgeries.push(surgery.name);
      onFieldChange('surgery', surgeries.join(', '));
    }
  };

  const handleSurgeryRemove = (surgeryToRemove: string) => {
    console.log('Removing surgery:', surgeryToRemove);
    console.log('Current surgery string:', formData.surgery);
    
    const current = formData.surgery || '';
    // Try different separators
    let surgeries = [];
    if (current.includes(', ')) {
      surgeries = current.split(', ');
    } else if (current.includes(',')) {
      surgeries = current.split(',');
    } else {
      surgeries = [current];
    }
    
    console.log('Parsed surgeries:', surgeries);
    const filtered = surgeries.filter(s => s.trim() !== surgeryToRemove.trim());
    console.log('After removal:', filtered);
    
    onFieldChange('surgery', filtered.join(', '));
  };

  const esicSurgeons = formData.surgeon ? formData.surgeon.split(', ') : [];
  const hopeConsultants = formData.hopeConsultants ? formData.hopeConsultants.split(', ') : [];
  // Handle different separators for surgeries
  const assignedSurgeries = formData.surgery ? 
    (formData.surgery.includes(', ') ? 
      formData.surgery.split(', ') : 
      formData.surgery.split(',').map(s => s.trim()).filter(s => s.length > 0)
    ) : [];
  
  console.log('BasicInfoFields formData.surgery:', formData.surgery);
  console.log('BasicInfoFields assignedSurgeries:', assignedSurgeries);

  return (
    <div className="space-y-6">
      {/* Basic Patient Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Patient Name *</Label>
          <Input
            id="name"
            className="border-2 border-gray-400 focus:border-gray-600 bg-gray-100 cursor-not-allowed"
            value={formData.name || ''}
            readOnly
            disabled
          />
          <p className="text-xs text-muted-foreground mt-1">Patient name cannot be edited</p>
        </div>

        <div>
          <Label htmlFor="insurance_person_no">Insurance Person No</Label>
          <Input
            id="insurance_person_no"
            className="border-2 border-gray-400 focus:border-gray-600"
            value={formData.insurance_person_no || ''}
            onChange={(e) => onFieldChange('insurance_person_no' as keyof Patient, e.target.value)}
            placeholder="Enter insurance person number"
          />
        </div>
      </div>

      {/* Primary Diagnosis */}
      <div>
        <Label htmlFor="primaryDiagnosis">Primary Diagnosis</Label>
        <Input
          id="primaryDiagnosis"
          className="border-2 border-gray-400 focus:border-gray-600"
          value={formData.primaryDiagnosis || 'No diagnosis'}
          onChange={(e) => onFieldChange('primaryDiagnosis' as keyof Patient, e.target.value)}
          placeholder="Enter primary diagnosis"
        />
      </div>

      {/* Surgery Assigned with Individual Status */}
      <div>
        <Label htmlFor="surgery">Surgery Assigned</Label>
        <div className="space-y-3">
          {assignedSurgeries.length > 0 && (
            <div className="space-y-3">
              {assignedSurgeries.map((surgery, index) => {
                // Parse surgery status from stored format "Surgery Name [Status]"
                const statusMatch = surgery.match(/^(.+?)\s*\[([^\]]+)\]$/);
                const surgeryName = statusMatch ? statusMatch[1].trim() : surgery;
                const currentStatus = statusMatch ? statusMatch[2] : 'Not Sanctioned';
                
                return (
                  <div key={index} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{surgeryName}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleSurgeryRemove(surgery)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Status:</Label>
                      <Select 
                        value={currentStatus} 
                        onValueChange={(status) => {
                          // Update this surgery's status
                          const updatedSurgery = `${surgeryName} [${status}]`;
                          const updatedSurgeries = assignedSurgeries.map((s, i) => 
                            i === index ? updatedSurgery : s
                          );
                          onFieldChange('surgery', updatedSurgeries.join(', '));
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sanctioned">Sanctioned</SelectItem>
                          <SelectItem value="Not Sanctioned">Not Sanctioned</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFieldChange('surgery', '')}
              >
                Clear All
              </Button>
            </div>
          )}
          <SearchableCghsSurgerySelect
            selectedSurgeries={assignedSurgeries.map((name, index) => ({ id: index.toString(), name }))}
            onAddSurgery={(surgery) => {
              // Add surgery with default status
              const surgeryWithStatus = `${surgery.name} [Not Sanctioned]`;
              handleSurgeryAdd({...surgery, name: surgeryWithStatus});
            }}
          />
        </div>
      </div>

      {/* Complications */}
      <div>
        <Label htmlFor="complications">Complications</Label>
        <Input
          id="complications"
          className="border-2 border-gray-400 focus:border-gray-600"
          value={formData.complications || ''}
          onChange={(e) => onFieldChange('complications' as keyof Patient, e.target.value)}
          placeholder="Enter complications (comma separated)"
        />
      </div>

      {/* Admission, Surgery, Discharge Dates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="admissionDate">Admission Date</Label>
          <Input
            id="admissionDate"
            type="date"
            className="border-2 border-gray-400 focus:border-gray-600"
            value={formData.admissionDate || ''}
            onChange={(e) => onFieldChange('admissionDate' as keyof Patient, e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="surgeryDate">Surgery Date</Label>
          <Input
            id="surgeryDate"
            type="date"
            className="border-2 border-gray-400 focus:border-gray-600"
            value={formData.surgeryDate || ''}
            onChange={(e) => onFieldChange('surgeryDate' as keyof Patient, e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="dischargeDate">Discharge Date</Label>
          <Input
            id="dischargeDate"
            type="date"
            className="border-2 border-gray-400 focus:border-gray-600"
            value={formData.dischargeDate || ''}
            onChange={(e) => onFieldChange('dischargeDate' as keyof Patient, e.target.value)}
          />
        </div>
      </div>

      {/* ESIC Surgeon for follow up */}
      <div>
        <Label htmlFor="surgeon">ESIC surgeon for follow up</Label>
        <div className="space-y-2">
          {esicSurgeons.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {esicSurgeons.map((surgeon, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {surgeon}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleEsicSurgeonRemove(surgeon)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFieldChange('surgeon', '')}
              >
                Clear All
              </Button>
            </div>
          )}
          <SearchableFieldSelect
            tableName="esic_surgeons"
            fieldName="surgeon"
            value=""
            onChange={(value) => handleEsicSurgeonAdd(value)}
            placeholder="Search for ESIC surgeons..."
            displayField="name"
            searchFields={['name', 'specialty', 'department']}
          />
        </div>
      </div>

      {/* Referee */}
      <div>
        <Label htmlFor="consultant">Referee</Label>
        <SingleSelectFieldSelect
          tableName="referees"
          fieldName="consultant"
          value={formData.consultant || ''}
          onChange={onSelectChange('consultant' as keyof Patient)}
          placeholder="Search for referee..."
          displayField="name"
          searchFields={['name', 'specialty', 'institution']}
        />
      </div>

      {/* Relationship Manager */}
      <div>
        <Label htmlFor="relationshipManager">Relationship Manager</Label>
        <SingleSelectFieldSelect
          tableName="relationship_managers"
          fieldName="relationshipManager"
          value={formData.relationshipManager || ''}
          onChange={onSelectChange('relationshipManager' as keyof Patient)}
          placeholder="Search for relationship manager..."
          displayField="name"
          searchFields={['name', 'contact_no']}
        />
      </div>

      {/* Hope Surgeon */}
      <div>
        <Label htmlFor="hopeSurgeon">Hope Surgeon</Label>
        <SingleSelectFieldSelect
          tableName="hope_surgeons"
          fieldName="hopeSurgeon"
          value={formData.hopeSurgeon || ''}
          onChange={onSelectChange('hopeSurgeon' as keyof Patient)}
          placeholder="Search for Hope surgeon..."
          displayField="name"
          searchFields={['name', 'specialty', 'department']}
        />
      </div>

      {/* Hope Consultants for IPD visits */}
      <div>
        <Label htmlFor="hopeConsultants">Hope Consultants for IPD visits</Label>
        <div className="space-y-2">
          {hopeConsultants.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {hopeConsultants.map((consultant, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {consultant}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleHopeConsultantRemove(consultant)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFieldChange('hopeConsultants', '')}
              >
                Clear All
              </Button>
            </div>
          )}
          <SearchableFieldSelect
            tableName="hope_consultants"
            fieldName="hopeConsultants"
            value=""
            onChange={(value) => handleHopeConsultantAdd(value)}
            placeholder="Search for Hope consultants..."
            displayField="name"
            searchFields={['name', 'specialty', 'department']}
          />
        </div>
      </div>
    </div>
  );
};

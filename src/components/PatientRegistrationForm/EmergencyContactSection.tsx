
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface EmergencyContactSectionProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
}

export const EmergencyContactSection: React.FC<EmergencyContactSectionProps> = ({
  formData,
  onInputChange
}) => {
  return (
    <div className="bg-red-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-red-700 mb-4">Emergency Contacts</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="emergencyContactName" className="text-sm font-medium">
            Emergency Contact Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="emergencyContactName"
            placeholder="Emergency Contact Name"
            value={formData.emergencyContactName}
            onChange={(e) => onInputChange('emergencyContactName', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergencyContactMobile" className="text-sm font-medium">
            Emergency Contact Mobile <span className="text-red-500">*</span>
          </Label>
          <Input
            id="emergencyContactMobile"
            placeholder="Mobile Number"
            value={formData.emergencyContactMobile}
            onChange={(e) => onInputChange('emergencyContactMobile', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondEmergencyContactName" className="text-sm font-medium">
            Second Emergency Contact Name
          </Label>
          <Input
            id="secondEmergencyContactName"
            placeholder="Second Emergency Contact Name"
            value={formData.secondEmergencyContactName}
            onChange={(e) => onInputChange('secondEmergencyContactName', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondEmergencyContactMobile" className="text-sm font-medium">
            Second Emergency Contact Mobile
          </Label>
          <Input
            id="secondEmergencyContactMobile"
            placeholder="Mobile Number"
            value={formData.secondEmergencyContactMobile}
            onChange={(e) => onInputChange('secondEmergencyContactMobile', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="relativePhoneNo" className="text-sm font-medium">
            Relative Phone No.
          </Label>
          <Input
            id="relativePhoneNo"
            placeholder="Relative Phone No."
            value={formData.relativePhoneNo}
            onChange={(e) => onInputChange('relativePhoneNo', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

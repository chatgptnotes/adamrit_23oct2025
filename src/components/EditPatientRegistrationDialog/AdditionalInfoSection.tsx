
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface AdditionalInfoSectionProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
}

export const AdditionalInfoSection: React.FC<AdditionalInfoSectionProps> = ({
  formData,
  onInputChange
}) => {
  return (
    <div className="bg-green-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-green-700 mb-4">Additional Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="aadharPassport" className="text-sm font-medium">
            Aadhar/Passport No.
          </Label>
          <Input
            id="aadharPassport"
            placeholder="Aadhar/Passport No."
            value={formData.aadharPassport}
            onChange={(e) => onInputChange('aadharPassport', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quarterPlotNo" className="text-sm font-medium">
            Quarter/Plot No.
          </Label>
          <Input
            id="quarterPlotNo"
            placeholder="Quarter/Plot No."
            value={formData.quarterPlotNo}
            onChange={(e) => onInputChange('quarterPlotNo', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ward" className="text-sm font-medium">
            Ward
          </Label>
          <Input
            id="ward"
            placeholder="Ward"
            value={formData.ward}
            onChange={(e) => onInputChange('ward', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="panchayat" className="text-sm font-medium">
            Panchayat
          </Label>
          <Input
            id="panchayat"
            placeholder="Panchayat"
            value={formData.panchayat}
            onChange={(e) => onInputChange('panchayat', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="relationshipManager" className="text-sm font-medium">
            Relationship Manager
          </Label>
          <Input
            id="relationshipManager"
            placeholder="Relationship Manager"
            value={formData.relationshipManager}
            onChange={(e) => onInputChange('relationshipManager', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="privilegeCardNumber" className="text-sm font-medium">
            Privilege Card Number
          </Label>
          <Input
            id="privilegeCardNumber"
            placeholder="Privilege Card Number"
            value={formData.privilegeCardNumber}
            onChange={(e) => onInputChange('privilegeCardNumber', e.target.value)}
          />
        </div>



        <div className="space-y-2 col-span-2">
          <Label htmlFor="allergies" className="text-sm font-medium">
            Allergies
          </Label>
          <Textarea
            id="allergies"
            placeholder="Known Allergies"
            value={formData.allergies}
            onChange={(e) => onInputChange('allergies', e.target.value)}
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="instructions" className="text-sm font-medium">
            Special Instructions
          </Label>
          <Textarea
            id="instructions"
            placeholder="Special Instructions"
            value={formData.instructions}
            onChange={(e) => onInputChange('instructions', e.target.value)}
          />
        </div>

        <div className="space-y-2 col-span-4">
          <Label htmlFor="billingLink" className="text-sm font-medium">
            Billing Link
          </Label>
          <Input
            id="billingLink"
            placeholder="Billing Link"
            value={formData.billingLink}
            onChange={(e) => onInputChange('billingLink', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

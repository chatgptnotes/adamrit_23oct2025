
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
    <div className="bg-blue-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-blue-700 mb-4">Other Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="allergies" className="text-sm font-medium">
            Allergies
          </Label>
          <Input
            id="allergies"
            placeholder="Allergies"
            value={formData.allergies}
            onChange={(e) => onInputChange('allergies', e.target.value)}
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

        <div className="space-y-2">
          <Label htmlFor="instructions" className="text-sm font-medium">
            Instructions
          </Label>
          <Textarea
            id="instructions"
            placeholder="Instructions"
            value={formData.instructions}
            onChange={(e) => onInputChange('instructions', e.target.value)}
            className="min-h-[40px]"
          />
        </div>

        <div className="space-y-2">
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

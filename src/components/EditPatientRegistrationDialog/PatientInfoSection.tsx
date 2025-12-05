
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';
import { Upload } from 'lucide-react';

interface PatientInfoSectionProps {
  formData: any;
  dateOfBirth?: Date;
  onInputChange: (field: string, value: string) => void;
  onDateChange: (date: Date | undefined) => void;
}

export const PatientInfoSection: React.FC<PatientInfoSectionProps> = ({
  formData,
  dateOfBirth,
  onInputChange,
  onDateChange
}) => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-blue-700 mb-4">UID Patient Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Patient Name */}
        <div className="space-y-2">
          <Label htmlFor="patientName" className="text-sm font-medium">
            Patient Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="patientName"
            placeholder="Patient Name"
            value={formData.patientName}
            onChange={(e) => onInputChange('patientName', e.target.value)}
            className="w-full"
            required
          />
        </div>

        {/* Corporate */}
        <div className="space-y-2">
          <Label htmlFor="corporate" className="text-sm font-medium">
            Corporate <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.corporate} onValueChange={(value) => onInputChange('corporate', value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Corporate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="esic">ESIC</SelectItem>
              <SelectItem value="cghs">CGHS</SelectItem>
              <SelectItem value="echs">ECHS</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Age */}
        <div className="space-y-2">
          <Label htmlFor="age" className="text-sm font-medium">
            Age <span className="text-red-500">*</span>
          </Label>
          <Input
            id="age"
            type="number"
            placeholder="Age"
            value={formData.age}
            onChange={(e) => onInputChange('age', e.target.value)}
            className="w-full"
            min="0"
            max="150"
          />
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label htmlFor="gender" className="text-sm font-medium">
            Gender <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.gender} onValueChange={(value) => onInputChange('gender', value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">
            Phone <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={(e) => onInputChange('phone', e.target.value)}
            className="w-full"
            pattern="[0-9]{10}"
          />
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm font-medium">
            Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="address"
            placeholder="Address"
            value={formData.address}
            onChange={(e) => onInputChange('address', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <EnhancedDatePicker
            label="Date of Birth"
            value={dateOfBirth}
            onChange={onDateChange}
            placeholder="Select date of birth"
            isDOB={true}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {/* Patient's Photo */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Patient's Photo</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <Upload className="mx-auto h-6 w-6 text-gray-400 mb-2" />
            <div className="text-sm text-gray-500">Choose file</div>
            <div className="text-xs text-gray-400 mt-1">No file chosen</div>
          </div>
        </div>

        {/* Aadhar/Passport */}
        <div className="space-y-2">
          <Label htmlFor="aadharPassport" className="text-sm font-medium">
            Aadhar/Passport
          </Label>
          <Input
            id="aadharPassport"
            placeholder="Aadhar/Passport"
            value={formData.aadharPassport}
            onChange={(e) => onInputChange('aadharPassport', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Quarter/Plot No. */}
        <div className="space-y-2">
          <Label htmlFor="quarterPlotNo" className="text-sm font-medium">
            Quarter/Plot No.
          </Label>
          <Input
            id="quarterPlotNo"
            placeholder="Quarter/Plot No."
            value={formData.quarterPlotNo}
            onChange={(e) => onInputChange('quarterPlotNo', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Ward */}
        <div className="space-y-2">
          <Label htmlFor="ward" className="text-sm font-medium">
            Ward
          </Label>
          <Input
            id="ward"
            placeholder="Ward"
            value={formData.ward}
            onChange={(e) => onInputChange('ward', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Panchayat */}
        <div className="space-y-2">
          <Label htmlFor="panchayat" className="text-sm font-medium">
            Panchayat
          </Label>
          <Input
            id="panchayat"
            placeholder="Panchayat"
            value={formData.panchayat}
            onChange={(e) => onInputChange('panchayat', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Relationship Manager */}
        <div className="space-y-2">
          <Label htmlFor="relationshipManager" className="text-sm font-medium">
            Relationship Manager
          </Label>
          <Input
            id="relationshipManager"
            placeholder="Relationship Manager"
            value={formData.relationshipManager}
            onChange={(e) => onInputChange('relationshipManager', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Pin Code */}
        <div className="space-y-2">
          <Label htmlFor="pinCode" className="text-sm font-medium">
            Pin Code
          </Label>
          <Input
            id="pinCode"
            placeholder="Pin Code"
            value={formData.pinCode}
            onChange={(e) => onInputChange('pinCode', e.target.value)}
            className="w-full"
            pattern="[0-9]{6}"
          />
        </div>

        {/* State */}
        <div className="space-y-2">
          <Label htmlFor="state" className="text-sm font-medium">
            State
          </Label>
          <Input
            id="state"
            placeholder="State"
            value={formData.state}
            onChange={(e) => onInputChange('state', e.target.value)}
            className="w-full"
          />
        </div>

        {/* City/Town */}
        <div className="space-y-2">
          <Label htmlFor="cityTown" className="text-sm font-medium">
            City/Town
          </Label>
          <Input
            id="cityTown"
            placeholder="City/Town"
            value={formData.cityTown}
            onChange={(e) => onInputChange('cityTown', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Blood Group */}
        <div className="space-y-2">
          <Label htmlFor="bloodGroup" className="text-sm font-medium">
            Blood Group
          </Label>
          <Select value={formData.bloodGroup} onValueChange={(value) => onInputChange('bloodGroup', value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Blood Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A+">A+</SelectItem>
              <SelectItem value="A-">A-</SelectItem>
              <SelectItem value="B+">B+</SelectItem>
              <SelectItem value="B-">B-</SelectItem>
              <SelectItem value="AB+">AB+</SelectItem>
              <SelectItem value="AB-">AB-</SelectItem>
              <SelectItem value="O+">O+</SelectItem>
              <SelectItem value="O-">O-</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Spouse Name */}
        <div className="space-y-2">
          <Label htmlFor="spouseName" className="text-sm font-medium">
            Spouse Name
          </Label>
          <Input
            id="spouseName"
            placeholder="Spouse Name"
            value={formData.spouseName}
            onChange={(e) => onInputChange('spouseName', e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* ESIC Insurance Person No - Only show if Corporate is ESIC */}
      {formData.corporate === 'esic' && (
        <div className="mt-4">
          <div className="space-y-2">
            <Label htmlFor="insurancePersonNo" className="text-sm font-medium">
              ESIC Insurance Person No. <span className="text-red-500">*</span>
            </Label>
            <Input
              id="insurancePersonNo"
              placeholder="Insurance Person No."
              value={formData.insurancePersonNo}
              onChange={(e) => onInputChange('insurancePersonNo', e.target.value)}
              className="w-full md:w-1/3"
              required
            />
          </div>
        </div>
      )}
    </div>
  );
};

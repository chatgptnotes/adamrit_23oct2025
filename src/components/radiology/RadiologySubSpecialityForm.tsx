import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface RadiologySubSpecialityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (specialityName: string) => void;
}

const RadiologySubSpecialityForm: React.FC<RadiologySubSpecialityFormProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit 
}) => {
  const [specialityName, setSpecialityName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (specialityName.trim()) {
      onSubmit(specialityName.trim());
      setSpecialityName('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Add Sub Speciality</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Sub Specialty Name Field */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 min-w-[120px]">
                Sub Specialty Name:<span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={specialityName}
                onChange={(e) => setSpecialityName(e.target.value)}
                placeholder="Enter sub specialty name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2"
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RadiologySubSpecialityForm; 
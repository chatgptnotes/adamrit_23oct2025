
import React from 'react';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';

export const DocumentUploadSection: React.FC = () => {
  return (
    <div className="bg-yellow-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-yellow-700 mb-4">Document Upload</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Upload Identity Document</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <Upload className="mx-auto h-6 w-6 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Upload Medical Records</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <Upload className="mx-auto h-6 w-6 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
          </div>
        </div>
      </div>
    </div>
  );
};

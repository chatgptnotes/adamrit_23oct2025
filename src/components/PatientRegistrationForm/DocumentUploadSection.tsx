
import React, { useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';

export const DocumentUploadSection: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-green-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-green-700 mb-4">Document Upload</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Referral Letter</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            {selectedFile ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm text-gray-700">📄 {selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={handleFileRemove}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <Button variant="outline" className="w-full" type="button" onClick={handleUploadClick}>
                  <Upload className="mr-2 h-4 w-4" />
                  Change file
                </Button>
              </div>
            ) : (
              <>
                <Button variant="outline" className="w-full" type="button" onClick={handleUploadClick}>
                  <Upload className="mr-2 h-4 w-4" />
                  Choose file
                </Button>
                <p className="text-xs text-gray-500 mt-1">No file chosen</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};

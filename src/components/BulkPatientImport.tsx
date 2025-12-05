
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { importBulkPatientData } from '@/utils/bulkPatientDataImporter';

interface BulkPatientImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const BulkPatientImport: React.FC<BulkPatientImportProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: boolean;
    inserted: number;
    errors: string[];
    total: number;
  } | null>(null);
  
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to import",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    try {
      const fileContent = await file.text();
      const results = await importBulkPatientData(fileContent);
      
      setImportResults(results);
      
      toast({
        title: "Import Successful",
        description: `Imported ${results.inserted} patients successfully`,
      });

      onImportComplete();
      
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import patients",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportResults(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Patient Data Import</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Upload className="h-5 w-5 text-gray-600" />
              <label htmlFor="bulk-import-file" className="font-medium">
                Upload Patient Data File (TSV/CSV)
              </label>
            </div>
            <input
              id="bulk-import-file"
              type="file"
              accept=".tsv,.csv,.txt"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            
            {file && (
              <div className="text-sm text-green-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          {/* Import Results */}
          {importResults && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium text-green-900">Import Results</h3>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p>Total records processed: {importResults.total}</p>
                  <p>Successfully imported: {importResults.inserted}</p>
                  {importResults.errors.length > 0 && (
                    <p>Warnings: {importResults.errors.length}</p>
                  )}
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-medium text-yellow-900">Import Warnings</h3>
                  </div>
                  <div className="text-sm text-yellow-700 max-h-40 overflow-y-auto">
                    <ul className="space-y-1">
                      {importResults.errors.slice(0, 10).map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                      {importResults.errors.length > 10 && (
                        <li>... and {importResults.errors.length - 10} more warnings</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Import Instructions</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• The file should be tab-separated (TSV) or comma-separated (CSV)</li>
              <li>• First row should contain column headers</li>
              <li>• Required fields: name, primary_diagnosis</li>
              <li>• Date fields should be in YYYY-MM-DD format</li>
              <li>• Existing records with the same ID will be updated</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              {importResults ? 'Close' : 'Cancel'}
            </Button>
            {!importResults && (
              <Button 
                onClick={handleImport} 
                disabled={!file || isImporting}
              >
                {isImporting ? 'Importing...' : `Import ${file ? 'Patient Data' : ''}`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

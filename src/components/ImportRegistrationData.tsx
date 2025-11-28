
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { CSVImport } from './CSVImport';
import { importRegistrationData } from '@/utils/registrationDataImporter';
import { useToast } from '@/hooks/use-toast';
import { useDiagnoses } from '@/hooks/useDiagnoses';

export const ImportRegistrationData = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; errors: number } | null>(null);
  const { toast } = useToast();
  const { diagnoses } = useDiagnoses();

  const handleImport = async (csvData: any[]) => {
    setIsImporting(true);
    try {
      const result = await importRegistrationData(csvData);
      
      // Convert the result to match expected format
      setImportResults({ 
        success: result.patientsInserted, 
        errors: 0 // Since we don't track errors separately yet
      });
      
      toast({
        title: "Import Successful",
        description: `Imported ${result.patientsInserted} patients and ${result.visitsInserted} visits`,
      });
    } catch (error) {
      console.error('Import error:', error);
      setImportResults({ success: 0, errors: 1 });
      
      toast({
        title: "Import Failed",
        description: "Failed to import registration data",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Convert diagnosis objects to array of strings
  const diagnosisNames = diagnoses.map(d => d.name);

  return (
    <div className="space-y-4">
      <Button onClick={() => setIsImportDialogOpen(true)} variant="outline">
        <Upload className="h-4 w-4 mr-2" />
        Import Registration Data
      </Button>
      
      <CSVImport
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={handleImport}
        diagnoses={diagnosisNames}
      />
      
      {isImporting && (
        <div className="text-sm text-muted-foreground">
          Importing data...
        </div>
      )}
      {importResults && (
        <div className="text-sm">
          <span className="text-green-600">Success: {importResults.success}</span>
          {importResults.errors > 0 && (
            <span className="text-red-600 ml-4">Errors: {importResults.errors}</span>
          )}
        </div>
      )}
    </div>
  );
};

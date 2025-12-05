
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Download, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PatientImportData {
  diagnosis: string;
  patient: {
    name: string;
    primary_diagnosis: string;
    complications: string;
    surgery: string;
    surgeon: string;
    consultant: string;
    hopeSurgeon: string;
    hopeConsultants: string;
    admission_date: string | null;
    surgery_date: string | null;
    discharge_date: string | null;
  };
}

interface CSVImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (patients: PatientImportData[]) => void;
  diagnoses: string[];
}

export const CSVImport: React.FC<CSVImportProps> = ({
  isOpen,
  onClose,
  onImport,
  diagnoses
}) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const template = `name,diagnosis,primary_diagnosis,complications,surgery,surgeon,consultant,hope_surgeon,hope_consultants,admission_date,surgery_date,discharge_date
John Doe,Appendicitis,Acute Appendicitis,None,Laparoscopic Appendectomy,Dr. Smith,Dr. Johnson,Dr. Hope,Dr. Consultant,2024-01-15,2024-01-16,2024-01-20
Jane Smith,Cholecystitis,Acute Cholecystitis,None,Laparoscopic Cholecystectomy,Dr. Brown,Dr. Wilson,Dr. Hope2,Dr. Consultant2,2024-01-10,2024-01-11,2024-01-15`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'patient_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      setErrors(['CSV file must have at least a header and one data row']);
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const requiredFields = ['name', 'diagnosis'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));

    if (missingFields.length > 0) {
      setErrors([`Missing required fields: ${missingFields.join(', ')}`]);
      return;
    }

    const data = [];
    const newErrors = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) {
        newErrors.push(`Row ${i + 1}: Column count mismatch`);
        continue;
      }

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Validate required fields
      if (!row.name) {
        newErrors.push(`Row ${i + 1}: Name is required`);
        continue;
      }

      if (!row.diagnosis) {
        newErrors.push(`Row ${i + 1}: Diagnosis is required`);
        continue;
      }

      // Validate diagnosis exists
      if (!diagnoses.includes(row.diagnosis)) {
        newErrors.push(`Row ${i + 1}: Diagnosis "${row.diagnosis}" not found. Available: ${diagnoses.join(', ')}`);
        continue;
      }

      // Validate date formats (if provided)
      const dateFields = ['admission_date', 'surgery_date', 'discharge_date'];
      for (const field of dateFields) {
        if (row[field] && row[field] !== '') {
          const date = new Date(row[field]);
          if (isNaN(date.getTime())) {
            newErrors.push(`Row ${i + 1}: Invalid date format for ${field}. Use YYYY-MM-DD format`);
          }
        }
      }

      data.push(row);
    }

    setErrors(newErrors);
    setParsedData(data);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        parseCSV(text);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = () => {
    if (parsedData.length === 0) {
      toast({
        title: "Error",
        description: "No valid data to import",
        variant: "destructive"
      });
      return;
    }

    if (errors.length > 0) {
      toast({
        title: "Import Warning",
        description: `${errors.length} errors found. Only valid rows will be imported.`,
        variant: "destructive"
      });
    }

    const formattedData = parsedData.map(row => ({
      name: row.name,
      primary_diagnosis: row.primary_diagnosis || row.diagnosis,
      complications: row.complications || 'None',
      surgery: row.surgery || '',
      // REMOVED: labs, radiology, labs_radiology, antibiotics, other_medications
      // These are now stored in junction tables only
      surgeon: row.surgeon || '',
      consultant: row.consultant || '',
      hopeSurgeon: row.hope_surgeon || '',
      hopeConsultants: row.hope_consultants || '',
      admission_date: row.admission_date || null,
      surgery_date: row.surgery_date || null,
      discharge_date: row.discharge_date || null
    }));

    onImport(formattedData.map((patient, index) => ({
      diagnosis: parsedData[index].diagnosis,
      patient
    })));

    toast({
      title: "Success",
      description: `Imported ${formattedData.length} patients successfully`,
    });

    // Reset state
    setCsvFile(null);
    setParsedData([]);
    setErrors([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Patients from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Download Template */}
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
            <Download className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900">Download Template</h3>
              <p className="text-sm text-blue-700">
                Download a CSV template with the correct format and sample data
              </p>
            </div>
            <Button onClick={downloadTemplate} variant="outline" size="sm">
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Upload className="h-5 w-5 text-gray-600" />
              <label htmlFor="csv-file" className="font-medium">
                Upload CSV File
              </label>
            </div>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h3 className="font-medium text-red-900">Import Errors</h3>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Preview ({parsedData.length} valid rows)</h3>
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Diagnosis</th>
                      <th className="p-2 text-left">Surgery</th>
                      <th className="p-2 text-left">Admission</th>
                      <th className="p-2 text-left">Surgery Date</th>
                      <th className="p-2 text-left">Discharge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((row, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{row.name}</td>
                        <td className="p-2">{row.diagnosis}</td>
                        <td className="p-2">{row.surgery}</td>
                        <td className="p-2">{row.admission_date}</td>
                        <td className="p-2">{row.surgery_date}</td>
                        <td className="p-2">{row.discharge_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <p className="p-2 text-gray-500 text-center">... and {parsedData.length - 10} more rows</p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={parsedData.length === 0}
            >
              Import {parsedData.length} Patients
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

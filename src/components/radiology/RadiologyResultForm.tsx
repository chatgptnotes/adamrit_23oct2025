// Radiology Result Entry Form Component
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Edit,
  Trash2,
  Upload,
  FileText,
  Save,
  X,
  Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RadiologyResultFormProps {
  isOpen: boolean;
  onClose: () => void;
  patientData: {
    id: string | number;
    patientName: string;
    patientId: string;
    service: string;
  };
}

interface Template {
  id: string;
  name: string;
  content: string;
}

interface Finding {
  id: string;
  text: string;
}

export const RadiologyResultForm: React.FC<RadiologyResultFormProps> = ({
  isOpen,
  onClose,
  patientData
}) => {
  console.log('🏥 RadiologyResultForm rendered with props:', { isOpen, patientData });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [findings, setFindings] = useState<Finding[]>([
    { id: '1', text: 'FINDINGS' }
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [noOfSlices, setNoOfSlices] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [imageImpression, setImageImpression] = useState('LIVER- NORMAL IN SIZE SHAPE');
  const [advice, setAdvice] = useState('Done');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [resultText, setResultText] = useState('LIVER- NORMAL IN SIZE SHAPE AND ECHOTEXTURE.');
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);

  // Load doctors from database
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data, error } = await supabase
          .from('hope_surgeons')
          .select('id, name')
          .order('name');

        if (error) {
          console.error('Error fetching doctors:', error);
          // Set fallback doctors if database fails
          setDoctors([
            { id: 1, name: 'Dr. Smith' },
            { id: 2, name: 'Dr. Johnson' },
            { id: 3, name: 'Dr. Brown' }
          ]);
          return;
        }

        setDoctors(data || []);
      } catch (error) {
        console.error('Error in fetchDoctors:', error);
        // Set fallback doctors if database connection fails
        setDoctors([
          { id: 1, name: 'Dr. Smith' },
          { id: 2, name: 'Dr. Johnson' },
          { id: 3, name: 'Dr. Brown' }
        ]);
      }
    };

    if (isOpen) {
      fetchDoctors();
    }
  }, [isOpen]);

  // Mock templates data
  useEffect(() => {
    const mockTemplates: Template[] = [
      { id: '1', name: 'FINDINGS', content: 'LIVER- NORMAL IN SIZE SHAPE AND ECHOTEXTURE.' },
      { id: '2', name: 'ABDOMEN NORMAL', content: 'All abdominal organs appear normal in size and echogenicity.' },
      { id: '3', name: 'CHEST X-RAY', content: 'Chest X-ray shows clear lung fields with no abnormalities.' },
      { id: '4', name: 'BRAIN MRI', content: 'Brain MRI shows normal brain parenchyma with no focal lesions.' }
    ];
    setTemplates(mockTemplates);
  }, []);

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(templateSearch.toLowerCase())
  );

  const handleTemplateSelect = (template: Template) => {
    setResultText(template.content);
    setImageImpression(template.content);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files).filter(file => file.size <= 2 * 1024 * 1024); // 2MB limit
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddMore = () => {
    const newFinding: Finding = {
      id: Date.now().toString(),
      text: 'New Finding'
    };
    setFindings(prev => [...prev, newFinding]);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      console.log('Saving radiology result:', {
        patientId: patientData.patientId,
        service: patientData.service,
        noOfSlices,
        selectedDoctor,
        imageImpression,
        advice,
        resultText,
        uploadedFiles: uploadedFiles.map(f => f.name)
      });

      // Here you would save to your database
      // await supabase.from('radiology_results').insert({...})

      alert('Radiology result saved successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving result:', error);
      alert('Error saving result. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setNoOfSlices('');
    setSelectedDoctor('');
    setImageImpression('LIVER- NORMAL IN SIZE SHAPE');
    setAdvice('Done');
    setUploadedFiles([]);
    setResultText('LIVER- NORMAL IN SIZE SHAPE AND ECHOTEXTURE.');
    onClose();
  };

  console.log('🎭 Rendering Dialog with isOpen:', isOpen);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold bg-gray-100 p-3 rounded">
            {patientData.patientName} - {patientData.patientId} | {patientData.service}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Templates and Findings */}
          <div className="space-y-4">
            {/* Templates Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">Templates</span>
                  <div className="flex-1">
                    <Input
                      placeholder="Search"
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  <div className="text-xs text-gray-600 mb-2">Frequent templates:</div>
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <span className="text-sm text-blue-600">{template.name}</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Findings Section */}
            <Card>
              <CardContent className="p-4">
                {findings.map((finding) => (
                  <div key={finding.id} className="mb-2">
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      {finding.text}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Result Text Area */}
          <div className="space-y-4">
            <Textarea
              value={resultText}
              onChange={(e) => setResultText(e.target.value)}
              className="min-h-[300px] text-sm"
              placeholder="Enter radiology findings and results here..."
            />
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div>
            <Label htmlFor="slices" className="text-sm">No of Slices</Label>
            <Input
              id="slices"
              value={noOfSlices}
              onChange={(e) => setNoOfSlices(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          <div>
            <Label htmlFor="doctor" className="text-sm">Select Doctor</Label>
            <Select value={selectedDoctor || undefined} onValueChange={setSelectedDoctor}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Please Select" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id.toString()}>
                    {doctor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="impression" className="text-sm">Image Impression</Label>
            <Input
              id="impression"
              value={imageImpression}
              onChange={(e) => setImageImpression(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          <div>
            <Label htmlFor="advice" className="text-sm">Advice</Label>
            <Input
              id="advice"
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* File Upload Section */}
        <div className="mt-4">
          <Label className="text-sm">Upload file/record</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="h-8 text-sm"
              accept="image/*,.pdf,.doc,.docx"
            />
            <span className="text-xs text-gray-500">(File must be less than 2 MB)</span>
          </div>
          
          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="mt-2 space-y-1">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm">{file.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="mt-4">
          <Textarea
            placeholder="Additional comments..."
            className="h-20 text-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            onClick={handleAddMore}
            variant="outline"
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add more
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Result Publish Info */}
        <div className="mt-4 text-right">
          <span className="text-sm text-gray-600">
            Result Publish On: {new Date().toLocaleString('en-GB')}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 
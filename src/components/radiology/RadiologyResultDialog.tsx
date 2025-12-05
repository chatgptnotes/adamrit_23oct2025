import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Search, Upload, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RadiologyResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    id: string;
    patientName: string;
    patientId: string;
    service: string;
    visitId: string;
  };
}

export const RadiologyResultDialog: React.FC<RadiologyResultDialogProps> = ({
  isOpen,
  onClose,
  orderData
}) => {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    reportText: '',
    noOfSlices: '',
    selectedDoctor: '',
    imageImpression: '',
    advice: '',
    uploadedFile: null as File | null
  });
  
  const [templateSearch, setTemplateSearch] = useState('');

  // Sample frequent templates
  const frequentTemplates = [
    'Normal Study',
    'Minimal Degenerative Changes',
    'Disc Bulge L4-L5',
    'Cervical Spondylosis',
    'Lumbar Spondylosis'
  ];

  // Real doctors list
  const doctors = [
    'Please Select',
    'Dr.Murli BK',
    'Dr.Mitesh Baheti',
    'Dr.Neerja Tiwari',
    'Dr.Vilas Panchabhau',
    'Dr.Nilima Patil',
    'Dr.Naved Sheikh',
    'Dr.Sumedh Ramteke',
    'Dr.Badal Bankar',
    'Dr.Pradeep Kachhap',
    'Dr.Yasin Akbani',
    'Dr.Anil Bajaj',
    'Dr.Subhas Tiple',
    'Dr.Atul Rajkondawar',
    'Dr.Shubham Ingle',
    'Dr.Ashwin Chinchkhede',
    'Dr.Vijay Bansod',
    'Dr.Chirag Patil',
    'Dr.Vishal Nandagawli',
    'Dr.Pankaj Anantwar'
  ];

  const handleTemplateClick = (template: string) => {
    setFormData(prev => ({
      ...prev,
      reportText: prev.reportText + (prev.reportText ? '\n' : '') + template
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('File size must be less than 2MB');
        return;
      }
      setFormData(prev => ({ ...prev, uploadedFile: file }));
    }
  };

  const handleSave = async () => {
    try {
      console.log('🔄 Starting save process...');
      console.log('📊 Order data:', orderData);
      console.log('📝 Form data:', formData);
      
      // Use existing columns only - no new columns needed for now
      const updateData = {
        findings: formData.reportText || '',
        impression: formData.imageImpression || '', 
        notes: `Report: ${formData.reportText || ''}\n\nSlices: ${formData.noOfSlices || 'N/A'}\n\nDoctor: ${formData.selectedDoctor || 'Not selected'}\n\nImage Impression: ${formData.imageImpression || ''}\n\nAdvice: ${formData.advice || ''}`,
        status: 'completed',
        completed_date: new Date().toISOString()
      };

      console.log('💾 Attempting update with data:', updateData);

      // Update visit_radiology record  
      const { data, error } = await supabase
        .from('visit_radiology')
        .update(updateData)
        .eq('id', orderData.id)
        .select();

      console.log('📤 Update response:', { data, error });

      if (error) {
        console.error('❌ Database error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        toast({
          variant: "destructive",
          title: "Database Error", 
          description: error.message
        });
        return;
      }

      if (!data || data.length === 0) {
        console.error('❌ No record found with ID:', orderData.id);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Record not found for update"
        });
        return;
      }

      console.log('✅ Save successful! Updated record:', data[0]);
              console.log('✅ SUCCESS! Radiology result saved!');
        alert('Radiology result saved successfully!');
      onClose();
      
      // Trigger a refresh
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Unexpected error in handleSave:', error);
      console.error('❌ CATCH ERROR:', error.message);
      alert(`An error occurred: ${error.message}`);
    }
  };

  const handleCancel = () => {
    setFormData({
      reportText: '',
      noOfSlices: '',
      selectedDoctor: '',
      imageImpression: '',
      advice: '',
      uploadedFile: null
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {orderData.visitId} - {orderData.patientId}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {orderData.service}
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Templates */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  📋 Templates
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Frequent templates:
                  </Label>
                  {frequentTemplates.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No record found.</p>
                  ) : (
                    <div className="space-y-1">
                      {frequentTemplates
                        .filter(template => 
                          template.toLowerCase().includes(templateSearch.toLowerCase())
                        )
                        .map((template, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start h-auto p-2 text-xs hover:bg-blue-50"
                            onClick={() => handleTemplateClick(template)}
                          >
                            {template}
                          </Button>
                        ))
                      }
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Main Form */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {/* Main Report Text Area */}
              <div>
                <Textarea
                  placeholder="Enter your radiology report here..."
                  value={formData.reportText}
                  onChange={(e) => setFormData(prev => ({ ...prev, reportText: e.target.value }))}
                  className="min-h-[200px] text-sm"
                />
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* No of Slices */}
                <div>
                  <Label className="text-sm">No of Slices</Label>
                  <Input
                    type="number"
                    value={formData.noOfSlices}
                    onChange={(e) => setFormData(prev => ({ ...prev, noOfSlices: e.target.value }))}
                    className="text-sm"
                  />
                </div>

                {/* Select Doctor */}
                <div>
                  <Label className="text-sm">Select Doctor</Label>
                  <Select 
                    value={formData.selectedDoctor} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, selectedDoctor: value }))}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Please Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor, index) => (
                        <SelectItem 
                          key={index} 
                          value={doctor}
                          disabled={doctor === 'Please Select'}
                        >
                          {doctor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Image Impression */}
              <div>
                <Label className="text-sm">Image Impression</Label>
                <Textarea
                  value={formData.imageImpression}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageImpression: e.target.value }))}
                  className="min-h-[80px] text-sm"
                />
              </div>

              {/* Advice */}
              <div>
                <Label className="text-sm">Advice</Label>
                <Textarea
                  value={formData.advice}
                  onChange={(e) => setFormData(prev => ({ ...prev, advice: e.target.value }))}
                  className="min-h-[80px] text-sm"
                />
              </div>

              {/* Upload File - Temporarily disabled */}
              <div>
                <Label className="text-sm">Upload file/record</Label>
                <div className="mt-1">
                  <Input
                    type="file"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx"
                    className="text-sm"
                    disabled
                  />
                  <p className="text-xs text-orange-600 mt-1">
                    (File upload temporarily disabled - will be enabled after database update)
                  </p>
                  {formData.uploadedFile && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ {formData.uploadedFile.name} uploaded
                    </p>
                  )}
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <Textarea
                  placeholder="Additional notes or comments..."
                  className="min-h-[60px] text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Date/Time and Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(), 'dd/MM/yyyy')}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {format(new Date(), 'HH:mm:ss')}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 
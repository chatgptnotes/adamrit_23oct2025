import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, Camera, Stethoscope, X } from 'lucide-react';
import { useCreateDoctorVisit, useMarketingUsers } from '@/hooks/useMarketingData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddDoctorVisitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentMarketingUserId?: string;
}

interface ImageItem {
  file: File;
  preview: string;
}

const AddDoctorVisitDialog: React.FC<AddDoctorVisitDialogProps> = ({
  isOpen,
  onClose,
  currentMarketingUserId,
}) => {
  const { toast } = useToast();
  const { data: marketingUsers = [] } = useMarketingUsers();
  const createVisit = useCreateDoctorVisit();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    marketingUser_id: '',
    doctor_name: '',
    specialty: '',
    hospital_clinic_name: '',
    contact_number: '',
    email: '',
    visit_date: '',
    location_address: '',
    disposition: '',
    follow_up_date: '',
    comments: '',
  });

  const [images, setImages] = useState<ImageItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, { file, preview: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.doctor_name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter doctor name',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      // Upload all images
      const uploadedUrls: string[] = [];

      for (const img of images) {
        const storagePath = `marketing-visits/${Date.now()}_${img.file.name}`;
        const { error: storageError } = await (supabase as any).storage
          .from('uploads')
          .upload(storagePath, img.file);

        if (storageError) {
          toast({
            title: 'Upload Failed',
            description: storageError.message || 'Could not upload photo.',
            variant: 'destructive',
          });
          setUploading(false);
          return;
        }

        const { data: urlData } = (supabase as any).storage
          .from('uploads')
          .getPublicUrl(storagePath);

        if (urlData?.publicUrl) {
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      const visitData: any = {
        doctor_name: formData.doctor_name,
        visit_date: formData.visit_date || new Date().toISOString().split('T')[0],
        // Default values for all NOT NULL columns in DB
        area: formData.location_address || '',
        location_city: '',
        location_state: '',
        interaction_type: 'In-Person',
        sub_disposition: '',
        visit_time: '00:00',
        follow_up_notes: '',
        comments: formData.comments || '',
        specialty: formData.specialty || '',
        hospital_clinic_name: formData.hospital_clinic_name || '',
        contact_number: formData.contact_number || '',
        email: formData.email || '',
        location_address: formData.location_address || '',
        disposition: formData.disposition || '',
      };

      // Only add optional UUID/date fields if they have values
      if (formData.marketingUser_id) {
        visitData.marketingUser_id = formData.marketingUser_id;
      } else if (currentMarketingUserId) {
        visitData.marketingUser_id = currentMarketingUserId;
      }
      if (formData.follow_up_date) visitData.follow_up_date = formData.follow_up_date;

      // Try saving with image_url first, if column doesn't exist retry without
      if (uploadedUrls.length > 0) {
        visitData.image_url = JSON.stringify(uploadedUrls);
      }

      try {
        await createVisit.mutateAsync(visitData);
      } catch (firstError: any) {
        // If image_url column doesn't exist, retry without it
        if (firstError?.message?.includes('image_url') || firstError?.code === '42703') {
          delete visitData.image_url;
          await createVisit.mutateAsync(visitData);
        } else {
          throw firstError;
        }
      }
      toast({
        title: 'Success',
        description: 'Doctor visit added successfully',
      });
      handleClose();
    } catch (error: any) {
      console.error('Visit save error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to add doctor visit',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      marketingUser_id: '',
      doctor_name: '',
      specialty: '',
      hospital_clinic_name: '',
      contact_number: '',
      email: '',
      visit_date: '',
      location_address: '',
      disposition: '',
      follow_up_date: '',
      comments: '',
    });
    setImages([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Doctor Visit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3 py-4">
            {/* Row 1: Doctor Name | Specialty */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={formData.doctor_name}
                onChange={(e) => handleChange('doctor_name', e.target.value)}
                placeholder="Doctor Name *"
              />
              <Input
                value={formData.specialty}
                onChange={(e) => handleChange('specialty', e.target.value)}
                placeholder="Specialty"
              />
            </div>

            {/* Row 2: Hospital/Clinic | Contact */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={formData.hospital_clinic_name}
                onChange={(e) => handleChange('hospital_clinic_name', e.target.value)}
                placeholder="Hospital / Clinic Name"
              />
              <Input
                value={formData.contact_number}
                onChange={(e) => handleChange('contact_number', e.target.value)}
                placeholder="Contact Number"
              />
            </div>

            {/* Row 3: Email | Visit Date */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Email"
              />
              <Input
                type="date"
                value={formData.visit_date}
                onChange={(e) => handleChange('visit_date', e.target.value)}
              />
            </div>

            {/* Row 4: Outcome | Follow-up Date */}
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={formData.disposition}
                onValueChange={(value) => handleChange('disposition', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Positive">Positive</SelectItem>
                  <SelectItem value="Neutral">Neutral</SelectItem>
                  <SelectItem value="Negative">Negative</SelectItem>
                  <SelectItem value="Follow-up Required">Follow-up Required</SelectItem>
                  <SelectItem value="Not Available">Not Available</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => handleChange('follow_up_date', e.target.value)}
                placeholder="Follow-up Date"
              />
            </div>



            {/* Multi Photo Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center gap-3">
              {images.length > 0 ? (
                <div className="grid grid-cols-4 gap-2 w-full">
                  {images.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={img.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Stethoscope className="h-10 w-10 text-gray-400" />
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-purple-600 border-purple-300"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload Photo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => cameraInputRef.current?.click()}
                  className="text-blue-600 border-blue-300"
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Take Photo
                </Button>
              </div>
              {images.length > 0 && (
                <p className="text-xs text-muted-foreground">{images.length} photo(s) selected</p>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
              />
              <input
                type="file"
                ref={cameraInputRef}
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
              />
            </div>

            {/* Address */}
            <Textarea
              value={formData.location_address}
              onChange={(e) => handleChange('location_address', e.target.value)}
              placeholder="Full Address"
              rows={2}
            />

            {/* Notes */}
            <Textarea
              value={formData.comments}
              onChange={(e) => handleChange('comments', e.target.value)}
              placeholder="Notes"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploading || createVisit.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {uploading || createVisit.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDoctorVisitDialog;

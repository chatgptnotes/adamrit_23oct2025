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
import { Upload, Camera, UserRound } from 'lucide-react';
import { useCreateMarketingDoctor } from '@/hooks/useMarketingData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddMarketingDoctorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentMarketingUserId?: string;
}

const AddMarketingDoctorDialog: React.FC<AddMarketingDoctorDialogProps> = ({
  isOpen,
  onClose,
  currentMarketingUserId,
}) => {
  const { toast } = useToast();
  const createDoctor = useCreateMarketingDoctor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    doctor_name: '',
    specialty: '',
    hospital_clinic_name: '',
    city: '',
    contact_number: '',
    email: '',
    priority: 'Normal',
    visit_frequency: 30,
    location_address: '',
    notes: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
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
      let image_url: string | undefined;

      // Upload image if selected
      if (imageFile) {
        const storagePath = `marketing-doctors/${Date.now()}_${imageFile.name}`;
        const { error: storageError } = await (supabase as any).storage
          .from('uploads')
          .upload(storagePath, imageFile);

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

        image_url = urlData?.publicUrl || '';
      }

      await createDoctor.mutateAsync({
        ...formData,
        image_url,
        created_by: currentMarketingUserId || undefined,
      });

      toast({
        title: 'Success',
        description: 'Doctor added successfully',
      });
      handleClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add doctor',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      doctor_name: '',
      specialty: '',
      hospital_clinic_name: '',
      city: '',
      contact_number: '',
      email: '',
      priority: 'Normal',
      visit_frequency: 30,
      location_address: '',
      notes: '',
    });
    setImageFile(null);
    setImagePreview(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Doctor</DialogTitle>
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
                placeholder="Speciality"
              />
            </div>

            {/* Row 2: Clinic/Hospital | City */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={formData.hospital_clinic_name}
                onChange={(e) => handleChange('hospital_clinic_name', e.target.value)}
                placeholder="Clinic / Hospital Name"
              />
              <Input
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="City"
              />
            </div>

            {/* Row 3: Phone | Email */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={formData.contact_number}
                onChange={(e) => handleChange('contact_number', e.target.value)}
                placeholder="Phone Number"
              />
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Email"
              />
            </div>

            {/* Row 4: Priority | Visit Frequency */}
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={formData.priority}
                onValueChange={(value) => handleChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Normal Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal Priority</SelectItem>
                  <SelectItem value="High">High Priority</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={formData.visit_frequency}
                onChange={(e) => handleChange('visit_frequency', parseInt(e.target.value) || 0)}
                placeholder="30"
              />
            </div>

            {/* Photo Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center gap-3">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                  <UserRound className="h-12 w-12 text-gray-400" />
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
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
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

            {/* Full Address */}
            <Textarea
              value={formData.location_address}
              onChange={(e) => handleChange('location_address', e.target.value)}
              placeholder="Full Address"
              rows={2}
            />

            {/* Notes */}
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Notes"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || createDoctor.isPending}>
              {uploading || createDoctor.isPending ? 'Adding...' : 'Add Doctor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMarketingDoctorDialog;

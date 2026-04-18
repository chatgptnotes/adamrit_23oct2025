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
import { Upload, Camera, Tent, X } from 'lucide-react';
import { useCreateMarketingCamp, useMarketingUsers } from '@/hooks/useMarketingData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddMarketingCampDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentMarketingUserId?: string;
}

interface ImageItem {
  file: File;
  preview: string;
}

const AddMarketingCampDialog: React.FC<AddMarketingCampDialogProps> = ({
  isOpen,
  onClose,
  currentMarketingUserId,
}) => {
  const { toast } = useToast();
  const { data: marketingUsers = [] } = useMarketingUsers();
  const createCamp = useCreateMarketingCamp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    marketing_user_id: '',
    camp_name: '',
    camp_type: '',
    camp_date: '',
    start_time: '',
    location: '',
    expected_footfall: '',
    actual_footfall: '',
    budget: '',
    actual_cost: '',
    description: '',
    camp_notes: '',
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

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.camp_name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter title',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      // Upload all images
      const uploadedUrls: string[] = [];

      for (const img of images) {
        const storagePath = `marketing-camps/${Date.now()}_${img.file.name}`;
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

      const image_url = uploadedUrls.length > 0 ? JSON.stringify(uploadedUrls) : undefined;

      await createCamp.mutateAsync({
        marketing_user_id: formData.marketing_user_id || currentMarketingUserId || undefined,
        camp_name: formData.camp_name,
        camp_type: formData.camp_type || undefined,
        camp_date: formData.camp_date || new Date().toISOString().split('T')[0],
        start_time: formData.start_time || undefined,
        location: formData.location || '',
        expected_footfall: formData.expected_footfall ? parseInt(formData.expected_footfall) : undefined,
        actual_footfall: formData.actual_footfall ? parseInt(formData.actual_footfall) : undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        actual_cost: formData.actual_cost ? parseFloat(formData.actual_cost) : undefined,
        description: formData.description || undefined,
        camp_notes: formData.camp_notes || undefined,
        image_url,
        status: 'Scheduled',
      } as any);
      toast({
        title: 'Success',
        description: 'Camp added successfully',
      });
      handleClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add camp',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      marketing_user_id: '',
      camp_name: '',
      camp_type: '',
      camp_date: '',
      start_time: '',
      location: '',
      expected_footfall: '',
      actual_footfall: '',
      budget: '',
      actual_cost: '',
      description: '',
      camp_notes: '',
    });
    setImages([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Camp</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3 py-4">
            {/* Row 1: Title | Camp Type */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={formData.camp_name}
                onChange={(e) => handleChange('camp_name', e.target.value)}
                placeholder="Title *"
              />
              <Select
                value={formData.camp_type}
                onValueChange={(value) => handleChange('camp_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Camp Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Health Camp">Health Camp</SelectItem>
                  <SelectItem value="First Aid Camp">First Aid Camp</SelectItem>
                  <SelectItem value="Patient Education Event">Patient Education Event</SelectItem>
                  <SelectItem value="Awareness Drive">Awareness Drive</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 2: Date | Time */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                value={formData.camp_date}
                onChange={(e) => handleChange('camp_date', e.target.value)}
                placeholder="dd-mm-yyyy"
              />
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => handleChange('start_time', e.target.value)}
              />
            </div>

            {/* Row 3: Location / Venue */}
            <Input
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Location / Venue"
            />

            {/* Row 4: Expected Attendees | Actual Attendees */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                value={formData.expected_footfall}
                onChange={(e) => handleChange('expected_footfall', e.target.value)}
                placeholder="Expected Attendees"
              />
              <Input
                type="number"
                value={formData.actual_footfall}
                onChange={(e) => handleChange('actual_footfall', e.target.value)}
                placeholder="Actual Attendees"
              />
            </div>

            {/* Row 5: Budget | Actual Cost */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                value={formData.budget}
                onChange={(e) => handleChange('budget', e.target.value)}
                placeholder="Budget (₹)"
              />
              <Input
                type="number"
                value={formData.actual_cost}
                onChange={(e) => handleChange('actual_cost', e.target.value)}
                placeholder="Actual Cost (₹)"
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
                  <Tent className="h-10 w-10 text-gray-400" />
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

            {/* Description */}
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description"
              rows={2}
            />

            {/* Notes */}
            <Textarea
              value={formData.camp_notes}
              onChange={(e) => handleChange('camp_notes', e.target.value)}
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
              disabled={uploading || createCamp.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {uploading || createCamp.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMarketingCampDialog;

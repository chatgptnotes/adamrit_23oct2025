import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, UserRound, Upload, Eye, Plus, Trash2, Image } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMarketingDoctors, useUpdateMarketingDoctor, useDeleteMarketingDoctor } from '@/hooks/useMarketingData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DoctorListProps {
  onAddNew: () => void;
}

const DoctorList: React.FC<DoctorListProps> = ({ onAddNew }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: doctors = [], isLoading } = useMarketingDoctors();
  const updateDoctor = useUpdateMarketingDoctor();
  const deleteDoctor = useDeleteMarketingDoctor();

  const filteredDoctors = doctors.filter(doc =>
    doc.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.hospital_clinic_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.specialty || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.city || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUploadClick = (doctorId: string) => {
    setUploadingFor(doctorId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingFor) return;

    try {
      const storagePath = `marketing-doctors/${Date.now()}_${file.name}`;

      const { error: storageError } = await (supabase as any).storage
        .from('uploads')
        .upload(storagePath, file);

      if (storageError) {
        toast({
          title: 'Upload Failed',
          description: storageError.message || 'Could not upload file.',
          variant: 'destructive',
        });
        return;
      }

      const { data: urlData } = (supabase as any).storage
        .from('uploads')
        .getPublicUrl(storagePath);

      const publicUrl = urlData?.publicUrl || '';

      await updateDoctor.mutateAsync({
        id: uploadingFor,
        image_url: publicUrl,
      });

      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploadingFor(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await deleteDoctor.mutateAsync(id);
        toast({
          title: 'Success',
          description: 'Doctor deleted successfully',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete doctor',
          variant: 'destructive',
        });
      }
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'VIP':
        return <Badge className="bg-purple-100 text-purple-800">VIP</Badge>;
      case 'High':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Normal</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5" />
            Doctor List
          </CardTitle>
          <Button onClick={onAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Doctor
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />

        {/* Search */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by doctor name, hospital, specialty, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-12">
            <UserRound className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Doctors Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No doctors match your search criteria.' : 'No doctors added yet.'}
            </p>
            <Button onClick={onAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Doctor
            </Button>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Photo</TableHead>
                  <TableHead>Doctor Name</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Hospital/Clinic</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDoctors.map((doctor, index) => (
                  <TableRow key={doctor.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {doctor.image_url ? (
                        <img
                          src={doctor.image_url}
                          alt={doctor.doctor_name}
                          className="w-10 h-10 rounded-full object-cover cursor-pointer"
                          onClick={() => setPreviewImage(doctor.image_url!)}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <UserRound className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{doctor.doctor_name}</TableCell>
                    <TableCell>{doctor.specialty || '-'}</TableCell>
                    <TableCell>{doctor.hospital_clinic_name || '-'}</TableCell>
                    <TableCell>{doctor.city || '-'}</TableCell>
                    <TableCell>{doctor.contact_number || '-'}</TableCell>
                    <TableCell>{getPriorityBadge(doctor.priority)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {doctor.image_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewImage(doctor.image_url!)}
                            className="text-green-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUploadClick(doctor.id)}
                          disabled={uploadingFor === doctor.id}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(doctor.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredDoctors.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredDoctors.length} doctor(s)
          </div>
        )}
      </CardContent>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Doctor Photo
            </DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="flex justify-center">
              <img
                src={previewImage}
                alt="Doctor"
                className="max-h-[500px] rounded-md object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default DoctorList;

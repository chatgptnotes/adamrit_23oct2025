import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Camera,
  Upload,
  X,
  Image,
  FileText,
  Search,
  SwitchCamera,
  StopCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/activity-logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CameraUploadProps {
  isDialog?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface PatientResult {
  id: string;
  name: string;
}

interface FileUploadRecord {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category: string;
  patient_name: string | null;
  notes: string | null;
  created_at: string;
}

type UploadCategory = 'report' | 'prescription' | 'xray' | 'document' | 'photo' | 'id_proof';

const CATEGORY_OPTIONS: { value: UploadCategory; label: string }[] = [
  { value: 'report', label: 'Report' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'xray', label: 'X-Ray' },
  { value: 'document', label: 'Document' },
  { value: 'photo', label: 'Photo' },
  { value: 'id_proof', label: 'ID Proof' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

// ---------------------------------------------------------------------------
// Helper: human-readable time-ago
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Helper: format file size
// ---------------------------------------------------------------------------

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const CameraUpload: React.FC<CameraUploadProps> = ({
  isDialog = false,
  open = false,
  onOpenChange,
}) => {
  const { toast } = useToast();

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const streamRef = useRef<MediaStream | null>(null);

  // File / capture state
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Metadata form state
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<PatientResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [category, setCategory] = useState<UploadCategory>('photo');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  // Recent uploads state
  const [recentUploads, setRecentUploads] = useState<FileUploadRecord[]>([]);

  // -------------------------------------------------------------------------
  // Fetch recent uploads
  // -------------------------------------------------------------------------

  const fetchRecentUploads = useCallback(async () => {
    try {
      const raw = localStorage.getItem('hmis_user');
      const user = raw ? JSON.parse(raw) : null;
      const userId = user?.id || user?.email || null;

      let query = (supabase as any)
        .from('file_uploads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (userId) {
        query = query.eq('uploaded_by', userId);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching recent uploads:', error);
        return;
      }
      setRecentUploads((data as FileUploadRecord[]) || []);
    } catch (e) {
      console.error('Error fetching recent uploads:', e);
    }
  }, []);

  useEffect(() => {
    fetchRecentUploads();
  }, [fetchRecentUploads]);

  // -------------------------------------------------------------------------
  // Camera handling
  // -------------------------------------------------------------------------

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      toast({
        title: 'Camera Error',
        description: 'Unable to access camera. Please check permissions.',
        variant: 'destructive',
      });
    }
  }, [facingMode, toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const switchCamera = useCallback(() => {
    stopCamera();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  }, [stopCamera]);

  // Restart camera when facingMode changes while camera was active
  useEffect(() => {
    if (cameraActive) {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // Cleanup camera on unmount or dialog close
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setSelectedFile(null);
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          stopCamera();
        }
      },
      'image/jpeg',
      0.9
    );
  }, [stopCamera]);

  // -------------------------------------------------------------------------
  // File upload handling (drag & drop + click)
  // -------------------------------------------------------------------------

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: 'Please select an image (JPG, PNG, GIF, WebP) or a PDF.',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'File Too Large',
          description: 'Maximum file size is 10 MB.',
          variant: 'destructive',
        });
        return;
      }
      setCapturedBlob(null);
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    },
    [toast]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const onBrowseClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ACCEPTED_TYPES.join(',');
    input.onchange = (ev) => {
      const target = ev.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) handleFileSelect(file);
    };
    input.click();
  }, [handleFileSelect]);

  // -------------------------------------------------------------------------
  // Clear / reset state
  // -------------------------------------------------------------------------

  const clearCapture = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCapturedBlob(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setPatientSearch('');
    setPatientResults([]);
    setSelectedPatient(null);
    setCategory('photo');
    setNotes('');
  }, [previewUrl]);

  // -------------------------------------------------------------------------
  // Patient search
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (patientSearch.length < 2) {
      setPatientResults([]);
      setShowPatientDropdown(false);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('patients')
          .select('id, name')
          .ilike('name', `%${patientSearch}%`)
          .limit(10);

        if (error) {
          console.error('Patient search error:', error);
          return;
        }
        setPatientResults((data as PatientResult[]) || []);
        setShowPatientDropdown(true);
      } catch (e) {
        console.error('Patient search error:', e);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [patientSearch]);

  // -------------------------------------------------------------------------
  // Upload logic
  // -------------------------------------------------------------------------

  const handleUpload = useCallback(async () => {
    const fileToUpload = capturedBlob || selectedFile;
    if (!fileToUpload) {
      toast({
        title: 'No File',
        description: 'Please capture a photo or select a file first.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const raw = localStorage.getItem('hmis_user');
      const user = raw ? JSON.parse(raw) : null;

      // Determine file name
      const fileName = selectedFile
        ? selectedFile.name
        : `capture_${Date.now()}.jpg`;

      const storagePath = `uploads/${Date.now()}_${fileName}`;

      // Upload to Supabase Storage bucket "uploads"
      const { error: storageError } = await (supabase as any).storage
        .from('uploads')
        .upload(storagePath, fileToUpload);

      if (storageError) {
        console.error('Storage upload error:', storageError);
        toast({
          title: 'Upload Failed',
          description: storageError.message || 'Could not upload file to storage.',
          variant: 'destructive',
        });
        setUploading(false);
        return;
      }

      // Get public URL
      const { data: urlData } = (supabase as any).storage
        .from('uploads')
        .getPublicUrl(storagePath);

      const publicUrl = urlData?.publicUrl || '';

      // Save metadata to file_uploads table
      const { error: insertError } = await (supabase as any)
        .from('file_uploads')
        .insert({
          file_name: fileName,
          file_url: publicUrl,
          file_type: selectedFile?.type || 'image/jpeg',
          file_size: fileToUpload.size,
          storage_path: storagePath,
          category,
          patient_id: selectedPatient?.id || null,
          patient_name: selectedPatient?.name || null,
          notes: notes || null,
          uploaded_by: user?.id || user?.email || null,
        });

      if (insertError) {
        console.error('Metadata insert error:', insertError);
        toast({
          title: 'Upload Failed',
          description: insertError.message || 'Could not save file metadata.',
          variant: 'destructive',
        });
        setUploading(false);
        return;
      }

      // Log activity
      await logActivity('file_upload', { fileName, category });

      toast({
        title: 'Upload Successful',
        description: `${fileName} has been uploaded successfully.`,
      });

      // Reset form and refresh gallery
      clearCapture();
      fetchRecentUploads();
    } catch (e) {
      console.error('Upload error:', e);
      toast({
        title: 'Upload Failed',
        description: 'An unexpected error occurred during upload.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }, [
    capturedBlob,
    selectedFile,
    category,
    notes,
    selectedPatient,
    toast,
    clearCapture,
    fetchRecentUploads,
  ]);

  // -------------------------------------------------------------------------
  // Determine if a file/capture is ready for the metadata form
  // -------------------------------------------------------------------------

  const hasFile = !!(capturedBlob || selectedFile);

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  /** Camera section */
  const renderCamera = () => (
    <div className="space-y-3">
      {!cameraActive && !hasFile && (
        <Button
          variant="outline"
          className="w-full h-24 border-dashed border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50"
          onClick={startCamera}
        >
          <Camera className="h-8 w-8 mr-2 text-blue-500" />
          <span className="text-blue-600 font-medium">Start Camera</span>
        </Button>
      )}

      {cameraActive && (
        <div className="space-y-2">
          <div className="relative rounded-lg overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-lg"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={capturePhoto} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Camera className="h-4 w-4 mr-2" />
              Capture
            </Button>
            <Button variant="outline" onClick={switchCamera}>
              <SwitchCamera className="h-4 w-4 mr-1" />
              Switch
            </Button>
            <Button variant="outline" onClick={stopCamera}>
              <StopCircle className="h-4 w-4 mr-1" />
              Stop
            </Button>
          </div>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );

  /** File upload drop zone */
  const renderDropZone = () => {
    if (cameraActive || hasFile) return null;

    return (
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={onBrowseClick}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 font-medium">
          Drag & drop a file here, or click to browse
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Images (JPG, PNG, GIF, WebP) or PDF -- Max 10 MB
        </p>
      </div>
    );
  };

  /** Preview of captured photo or selected file */
  const renderPreview = () => {
    if (!hasFile) return null;

    const isPdf = selectedFile?.type === 'application/pdf';
    const displayName = selectedFile?.name || 'captured_photo.jpg';
    const displaySize = formatSize(
      selectedFile?.size || capturedBlob?.size || 0
    );

    return (
      <div className="space-y-3">
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          {previewUrl && !isPdf ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full max-h-64 object-contain bg-gray-50"
            />
          ) : (
            <div className="flex items-center justify-center p-8 bg-gray-50">
              <FileText className="h-16 w-16 text-blue-400" />
            </div>
          )}
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={clearCapture}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {isPdf ? (
            <FileText className="h-4 w-4 text-red-500" />
          ) : (
            <Image className="h-4 w-4 text-blue-500" />
          )}
          <span className="truncate">{displayName}</span>
          <span className="text-gray-400">({displaySize})</span>
        </div>
      </div>
    );
  };

  /** Metadata form shown after capture / file selection */
  const renderMetadataForm = () => {
    if (!hasFile) return null;

    return (
      <div className="space-y-4 pt-2">
        {/* Patient search */}
        <div className="space-y-1.5 relative">
          <Label className="text-sm font-medium">Patient Name</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search patient..."
              value={selectedPatient ? selectedPatient.name : patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                setSelectedPatient(null);
              }}
              className="pl-8"
            />
          </div>
          {showPatientDropdown && patientResults.length > 0 && !selectedPatient && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
              {patientResults.map((p) => (
                <button
                  key={p.id}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors"
                  onClick={() => {
                    setSelectedPatient(p);
                    setPatientSearch(p.name);
                    setShowPatientDropdown(false);
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category select */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as UploadCategory)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Notes</Label>
          <Input
            placeholder="Optional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Upload button */}
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Upload className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </>
          )}
        </Button>
      </div>
    );
  };

  /** Recent uploads gallery */
  const renderRecentUploads = () => {
    if (recentUploads.length === 0) return null;

    return (
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700">Recent Uploads</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {recentUploads.map((upload) => {
            const isImage = upload.file_type?.startsWith('image/');
            return (
              <div
                key={upload.id}
                className="rounded-lg border border-gray-200 overflow-hidden bg-white hover:shadow-sm transition-shadow"
              >
                {isImage && upload.file_url ? (
                  <img
                    src={upload.file_url}
                    alt={upload.file_name}
                    className="w-full h-20 object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-20 bg-gray-50">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="p-1.5">
                  <p className="text-xs truncate text-gray-700" title={upload.file_name}>
                    {upload.file_name}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {upload.category}
                    </Badge>
                    <span className="text-[10px] text-gray-400">
                      {timeAgo(upload.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Main content
  // -------------------------------------------------------------------------

  const content = (
    <div className="space-y-4">
      {renderCamera()}
      {renderDropZone()}
      {renderPreview()}
      {renderMetadataForm()}
      {renderRecentUploads()}
    </div>
  );

  // -------------------------------------------------------------------------
  // Dialog vs standalone card rendering
  // -------------------------------------------------------------------------

  if (isDialog) {
    return (
      <Dialog open={open} onOpenChange={(val) => {
        if (!val) stopCamera();
        onOpenChange?.(val);
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-600" />
              Camera Capture & Upload
            </DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Camera className="h-5 w-5 text-blue-600" />
          Camera Capture & Upload
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};

export default CameraUpload;

// ---------------------------------------------------------------------------
// QuickCaptureCard -- shows a card with camera and upload buttons
// ---------------------------------------------------------------------------

export const QuickCaptureCard: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    const fetchTodayCount = async () => {
      try {
        const raw = localStorage.getItem('hmis_user');
        const user = raw ? JSON.parse(raw) : null;
        const userId = user?.id || user?.email || null;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        let query = (supabase as any)
          .from('file_uploads')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', todayStart.toISOString());

        if (userId) {
          query = query.eq('uploaded_by', userId);
        }

        const { count, error } = await query;
        if (!error && typeof count === 'number') {
          setTodayCount(count);
        }
      } catch (e) {
        console.error('Error fetching today upload count:', e);
      }
    };

    fetchTodayCount();
  }, [dialogOpen]); // Re-fetch when dialog closes (new uploads may have been made)

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-600" />
            Quick Capture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-blue-200 hover:bg-blue-50 hover:border-blue-400"
              onClick={() => setDialogOpen(true)}
            >
              <Camera className="h-4 w-4 mr-2 text-blue-500" />
              Camera
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-blue-200 hover:bg-blue-50 hover:border-blue-400"
              onClick={() => setDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2 text-blue-500" />
              Upload
            </Button>
          </div>
          {todayCount > 0 && (
            <p className="text-xs text-gray-500 text-center">
              {todayCount} upload{todayCount !== 1 ? 's' : ''} today
            </p>
          )}
        </CardContent>
      </Card>

      <CameraUpload
        isDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
};

// ---------------------------------------------------------------------------
// FloatingCameraFAB -- fixed-position floating action button
// ---------------------------------------------------------------------------

export const FloatingCameraFAB: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    const fetchTodayCount = async () => {
      try {
        const raw = localStorage.getItem('hmis_user');
        const user = raw ? JSON.parse(raw) : null;
        const userId = user?.id || user?.email || null;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        let query = (supabase as any)
          .from('file_uploads')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', todayStart.toISOString());

        if (userId) {
          query = query.eq('uploaded_by', userId);
        }

        const { count, error } = await query;
        if (!error && typeof count === 'number') {
          setTodayCount(count);
        }
      } catch (e) {
        console.error('Error fetching today upload count:', e);
      }
    };

    fetchTodayCount();
  }, [dialogOpen]);

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        aria-label="Open camera capture"
      >
        <Camera className="h-6 w-6" />
        {todayCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {todayCount > 99 ? '99+' : todayCount}
          </span>
        )}
      </button>

      <CameraUpload
        isDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
};

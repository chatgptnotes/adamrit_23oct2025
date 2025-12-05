// PACS Image Viewer Component
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Camera, 
  Search, 
  Download, 
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Maximize,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Archive,
  Share,
  Settings,
  Monitor,
  Image,
  Film,
  Database
} from 'lucide-react';

const PacsImageViewer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudy, setSelectedStudy] = useState<string | null>(null);
  const [viewerSettings, setViewerSettings] = useState({
    zoom: 100,
    rotation: 0,
    brightness: 50,
    contrast: 50,
    windowLevel: 0,
    windowWidth: 100
  });

  const pacsStats = {
    totalStudies: 15847,
    todayStudies: 147,
    storageUsed: 24.7, // TB
    availableStorage: 75.3 // TB
  };

  const studies = [
    {
      id: 1,
      studyInstanceUID: '1.2.840.10008.5.1.4.1.1.1.001',
      accessionNumber: 'ACC2025001',
      patientName: 'Rajesh Kumar',
      patientId: 'P001',
      studyDate: '2025-06-13',
      studyTime: '08:30:00',
      modality: 'CT',
      bodyPart: 'Brain',
      studyDescription: 'CT Brain without contrast',
      seriesCount: 3,
      imageCount: 156,
      studySize: '245 MB',
      status: 'Available',
      radiologist: 'Dr. Priya Sharma',
      reportStatus: 'Pending'
    },
    {
      id: 2,
      studyInstanceUID: '1.2.840.10008.5.1.4.1.1.2.002',
      accessionNumber: 'ACC2025002',
      patientName: 'Sunita Reddy',
      patientId: 'P002',
      studyDate: '2025-06-13',
      studyTime: '09:15:00',
      modality: 'MRI',
      bodyPart: 'Brain',
      studyDescription: 'MRI Brain with contrast',
      seriesCount: 8,
      imageCount: 624,
      studySize: '1.2 GB',
      status: 'Available',
      radiologist: 'Dr. Rajesh Kumar',
      reportStatus: 'Preliminary'
    },
    {
      id: 3,
      studyInstanceUID: '1.2.840.10008.5.1.4.1.1.1.003',
      accessionNumber: 'ACC2025003',
      patientName: 'Mohammed Ali',
      patientId: 'P003',
      studyDate: '2025-06-13',
      studyTime: '10:45:00',
      modality: 'XR',
      bodyPart: 'Chest',
      studyDescription: 'Chest X-ray PA view',
      seriesCount: 1,
      imageCount: 2,
      studySize: '8.5 MB',
      status: 'Available',
      radiologist: 'Dr. Amit Patel',
      reportStatus: 'Final'
    },
    {
      id: 4,
      studyInstanceUID: '1.2.840.10008.5.1.4.1.1.3.004',
      accessionNumber: 'ACC2025004',
      patientName: 'Priya Gupta',
      patientId: 'P004',
      studyDate: '2025-06-13',
      studyTime: '11:30:00',
      modality: 'US',
      bodyPart: 'Abdomen',
      studyDescription: 'Abdominal Ultrasound',
      seriesCount: 4,
      imageCount: 45,
      studySize: '95 MB',
      status: 'Available',
      radiologist: 'Dr. Sunita Reddy',
      reportStatus: 'Final'
    },
    {
      id: 5,
      studyInstanceUID: '1.2.840.10008.5.1.4.1.1.1.005',
      accessionNumber: 'ACC2025005',
      patientName: 'Vikas Singh',
      patientId: 'P005',
      studyDate: '2025-06-12',
      studyTime: '16:20:00',
      modality: 'MG',
      bodyPart: 'Breast',
      studyDescription: 'Screening Mammography',
      seriesCount: 4,
      imageCount: 8,
      studySize: '32 MB',
      status: 'Archived',
      radiologist: 'Dr. Sunita Reddy',
      reportStatus: 'Final'
    }
  ];

  const getModalityIcon = (modality: string) => {
    switch (modality) {
      case 'CT': return '🔍';
      case 'MRI': return '🧲';
      case 'XR': return '☢️';
      case 'US': return '🔊';
      case 'MG': return '📐';
      default: return '📷';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Archived': return 'bg-blue-100 text-blue-800';
      case 'Processing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReportStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-orange-100 text-orange-800';
      case 'Preliminary': return 'bg-blue-100 text-blue-800';
      case 'Final': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredStudies = studies.filter(study =>
    study.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    study.accessionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    study.studyDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleZoomIn = () => {
    setViewerSettings(prev => ({ ...prev, zoom: Math.min(prev.zoom + 25, 400) }));
  };

  const handleZoomOut = () => {
    setViewerSettings(prev => ({ ...prev, zoom: Math.max(prev.zoom - 25, 25) }));
  };

  const handleRotate = () => {
    setViewerSettings(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }));
  };

  const handleReset = () => {
    setViewerSettings({
      zoom: 100,
      rotation: 0,
      brightness: 50,
      contrast: 50,
      windowLevel: 0,
      windowWidth: 100
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Camera className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">PACS Image Viewer</h2>
            <p className="text-sm text-muted-foreground">
              View, manipulate, and manage medical images
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Archive className="h-4 w-4 mr-2" />
            Archive Manager
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            PACS Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Studies</p>
                <p className="text-2xl font-bold text-blue-600">{pacsStats.totalStudies.toLocaleString()}</p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Studies</p>
                <p className="text-2xl font-bold text-green-600">{pacsStats.todayStudies}</p>
              </div>
              <Image className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold text-orange-600">{pacsStats.storageUsed} TB</p>
              </div>
              <Monitor className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Storage</p>
                <p className="text-2xl font-bold text-purple-600">{pacsStats.availableStorage} TB</p>
              </div>
              <Archive className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Study List */}
        <div className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search studies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Studies */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Studies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredStudies.map((study) => (
                  <div 
                    key={study.id} 
                    className={`p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
                      selectedStudy === study.studyInstanceUID ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedStudy(study.studyInstanceUID)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getModalityIcon(study.modality)}</span>
                        <div>
                          <div className="font-medium text-sm">{study.patientName}</div>
                          <div className="text-xs text-muted-foreground">{study.accessionNumber}</div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(study.status)}>
                        {study.status}
                      </Badge>
                    </div>
                    
                    <div className="text-xs space-y-1">
                      <div className="font-medium">{study.studyDescription}</div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{new Date(study.studyDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Images:</span>
                        <span>{study.imageCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span>{study.studySize}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Report:</span>
                        <Badge className={getReportStatusColor(study.reportStatus)}>
                          {study.reportStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Image Viewer */}
        <div className="lg:col-span-2 space-y-4">
          {selectedStudy ? (
            <>
              {/* Viewer Controls */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleZoomIn}>
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleZoomOut}>
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleRotate}>
                        <RotateCw className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Move className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleReset}>
                        Reset
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Main Viewer Area */}
              <Card>
                <CardContent className="pt-4">
                  <div className="bg-black rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
                    <div 
                      className="bg-gray-800 rounded text-white p-8 text-center"
                      style={{
                        transform: `scale(${viewerSettings.zoom / 100}) rotate(${viewerSettings.rotation}deg)`,
                        filter: `brightness(${viewerSettings.brightness}%) contrast(${viewerSettings.contrast}%)`
                      }}
                    >
                      <div className="text-4xl mb-4">🖼️</div>
                      <div className="text-lg font-semibold mb-2">Medical Image Viewer</div>
                      <div className="text-sm text-gray-300">
                        Study: {studies.find(s => s.studyInstanceUID === selectedStudy)?.studyDescription}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        Image 1 of {studies.find(s => s.studyInstanceUID === selectedStudy)?.imageCount}
                      </div>
                    </div>
                    
                    {/* Viewer Overlay Info */}
                    <div className="absolute top-4 left-4 text-white text-xs bg-black bg-opacity-50 p-2 rounded">
                      <div>Zoom: {viewerSettings.zoom}%</div>
                      <div>Rotation: {viewerSettings.rotation}°</div>
                    </div>

                    <div className="absolute top-4 right-4 text-white text-xs bg-black bg-opacity-50 p-2 rounded">
                      <div>Patient: {studies.find(s => s.studyInstanceUID === selectedStudy)?.patientName}</div>
                      <div>Study Date: {studies.find(s => s.studyInstanceUID === selectedStudy)?.studyDate}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Viewer Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Image Controls</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="display" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="display">Display</TabsTrigger>
                      <TabsTrigger value="window">Window/Level</TabsTrigger>
                      <TabsTrigger value="measurements">Measurements</TabsTrigger>
                    </TabsList>

                    <TabsContent value="display" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Brightness</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={viewerSettings.brightness}
                            onChange={(e) => setViewerSettings(prev => ({ ...prev, brightness: parseInt(e.target.value) }))}
                            className="w-full"
                          />
                          <div className="text-xs text-muted-foreground">{viewerSettings.brightness}%</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Contrast</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={viewerSettings.contrast}
                            onChange={(e) => setViewerSettings(prev => ({ ...prev, contrast: parseInt(e.target.value) }))}
                            className="w-full"
                          />
                          <div className="text-xs text-muted-foreground">{viewerSettings.contrast}%</div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="window" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Window Level</label>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={viewerSettings.windowLevel}
                            onChange={(e) => setViewerSettings(prev => ({ ...prev, windowLevel: parseInt(e.target.value) }))}
                            className="w-full"
                          />
                          <div className="text-xs text-muted-foreground">{viewerSettings.windowLevel}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Window Width</label>
                          <input
                            type="range"
                            min="0"
                            max="200"
                            value={viewerSettings.windowWidth}
                            onChange={(e) => setViewerSettings(prev => ({ ...prev, windowWidth: parseInt(e.target.value) }))}
                            className="w-full"
                          />
                          <div className="text-xs text-muted-foreground">{viewerSettings.windowWidth}</div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="measurements" className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="outline">📏 Length</Button>
                        <Button size="sm" variant="outline">📐 Angle</Button>
                        <Button size="sm" variant="outline">⭕ Circle</Button>
                        <Button size="sm" variant="outline">📊 Rectangle</Button>
                        <Button size="sm" variant="outline">📝 Annotation</Button>
                        <Button size="sm" variant="outline">🗑️ Clear</Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-muted-foreground mb-4">
                  <Film className="h-16 w-16 mx-auto mb-4" />
                  <div className="text-lg font-medium">No Study Selected</div>
                  <div className="text-sm">Select a study from the list to view images</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PacsImageViewer;
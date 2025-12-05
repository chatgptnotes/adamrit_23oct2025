// Modality Management Component
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Search, 
  Plus, 
  Settings,
  Activity,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Clock
} from 'lucide-react';

const ModalityManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const modalityStats = {
    totalModalities: 6,
    activeModalities: 5,
    underMaintenance: 1,
    uptime: 98.5
  };

  const modalities = [
    {
      id: 1,
      name: 'CT Scanner - SOMATOM Definition Flash',
      code: 'CT',
      location: 'Radiology Wing - Room 101',
      manufacturer: 'Siemens',
      status: 'Active',
      uptime: 99.2,
      studiesPerDay: 45,
      lastMaintenance: '2025-05-15',
      nextMaintenance: '2025-12-15',
      radiationType: 'Ionizing',
      maxPatientsPerDay: 60
    },
    {
      id: 2,
      name: 'MRI - SIGNA Pioneer 3T',
      code: 'MRI',
      location: 'Radiology Wing - Room 102',
      manufacturer: 'GE Healthcare',
      status: 'Active',
      uptime: 97.8,
      studiesPerDay: 28,
      lastMaintenance: '2025-04-20',
      nextMaintenance: '2026-01-20',
      radiationType: 'Non-ionizing',
      maxPatientsPerDay: 35
    },
    {
      id: 3,
      name: 'Digital X-Ray - DigitalDiagnost C90',
      code: 'XR',
      location: 'Radiology Wing - Room 103',
      manufacturer: 'Philips',
      status: 'Maintenance',
      uptime: 95.5,
      studiesPerDay: 0,
      lastMaintenance: '2025-06-10',
      nextMaintenance: '2025-06-13',
      radiationType: 'Ionizing',
      maxPatientsPerDay: 80
    },
    {
      id: 4,
      name: 'Ultrasound - RS85',
      code: 'US',
      location: 'Radiology Wing - Room 104',
      manufacturer: 'Samsung',
      status: 'Active',
      uptime: 99.5,
      studiesPerDay: 32,
      lastMaintenance: '2025-03-10',
      nextMaintenance: '2025-12-10',
      radiationType: 'Non-ionizing',
      maxPatientsPerDay: 50
    },
    {
      id: 5,
      name: 'Mammography - Selenia Dimensions',
      code: 'MG',
      location: 'Radiology Wing - Room 105',
      manufacturer: 'Hologic',
      status: 'Active',
      uptime: 98.9,
      studiesPerDay: 18,
      lastMaintenance: '2025-02-28',
      nextMaintenance: '2025-12-28',
      radiationType: 'Ionizing',
      maxPatientsPerDay: 25
    },
    {
      id: 6,
      name: 'Fluoroscopy - Azurion 7',
      code: 'FL',
      location: 'Radiology Wing - Room 106',
      manufacturer: 'Philips',
      status: 'Active',
      uptime: 96.8,
      studiesPerDay: 12,
      lastMaintenance: '2025-01-15',
      nextMaintenance: '2026-01-05',
      radiationType: 'Ionizing',
      maxPatientsPerDay: 20
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Maintenance':
        return <Wrench className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 98) return 'text-green-600';
    if (uptime >= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredModalities = modalities.filter(modality =>
    modality.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    modality.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    modality.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Camera className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Modality Management</h2>
            <p className="text-sm text-muted-foreground">
              Manage imaging equipment and monitor performance
            </p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Modality
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Modalities</p>
                <p className="text-2xl font-bold text-blue-600">{modalityStats.totalModalities}</p>
              </div>
              <Camera className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{modalityStats.activeModalities}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Under Maintenance</p>
                <p className="text-2xl font-bold text-orange-600">{modalityStats.underMaintenance}</p>
              </div>
              <Wrench className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Uptime</p>
                <p className="text-2xl font-bold text-purple-600">{modalityStats.uptime}%</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search modalities by name, code, or manufacturer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Modalities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredModalities.map((modality) => (
          <Card key={modality.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{modality.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{modality.manufacturer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(modality.status)}
                  <Badge className={modality.status === 'Active' ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                    {modality.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Code</div>
                  <div className="font-medium">{modality.code}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Location</div>
                  <div className="font-medium">{modality.location}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Radiation Type</div>
                  <div className="font-medium">{modality.radiationType}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Max Patients/Day</div>
                  <div className="font-medium">{modality.maxPatientsPerDay}</div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className={`text-lg font-bold ${getUptimeColor(modality.uptime)}`}>
                      {modality.uptime}%
                    </div>
                    <div className="text-xs text-muted-foreground">Uptime</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{modality.studiesPerDay}</div>
                    <div className="text-xs text-muted-foreground">Studies Today</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">
                      {Math.round((modality.studiesPerDay / modality.maxPatientsPerDay) * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Utilization</div>
                  </div>
                </div>
              </div>

              {/* Maintenance Info */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Last Maintenance
                    </div>
                    <div className="font-medium">{new Date(modality.lastMaintenance).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Next Maintenance
                    </div>
                    <div className="font-medium">{new Date(modality.nextMaintenance).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t pt-4 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Wrench className="h-4 w-4 mr-2" />
                  Maintenance
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Activity className="h-4 w-4 mr-2" />
                  Monitor
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Equipment Utilization Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Equipment Utilization Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {modalities.map((modality) => {
              const utilizationPercent = Math.round((modality.studiesPerDay / modality.maxPatientsPerDay) * 100);
              return (
                <div key={modality.id} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium">{modality.code}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        utilizationPercent >= 80 ? 'bg-red-500' :
                        utilizationPercent >= 60 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${utilizationPercent}%` }}
                    />
                  </div>
                  <div className="w-16 text-sm text-right">
                    {modality.studiesPerDay}/{modality.maxPatientsPerDay}
                  </div>
                  <div className="w-12 text-sm text-right font-medium">
                    {utilizationPercent}%
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModalityManagement;
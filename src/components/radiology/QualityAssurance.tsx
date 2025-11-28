// Quality Assurance Component for Radiology
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Search, 
  Plus, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Settings,
  TrendingUp,
  Clock,
  Camera,
  Wrench,
  FileText
} from 'lucide-react';

const QualityAssurance: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const qaStats = {
    totalChecks: 847,
    passedChecks: 798,
    failedChecks: 28,
    warningChecks: 21,
    complianceRate: 94.2
  };

  const qaChecks = [
    {
      id: 1,
      testName: 'Daily QC - CT Scanner',
      modality: 'CT',
      modalityName: 'SOMATOM Definition Flash',
      room: 'Room 101',
      testDate: '2025-06-13',
      testTime: '07:30:00',
      qaType: 'daily',
      performedBy: 'Ravi Singh',
      status: 'pass',
      testParameters: {
        'Noise Level': { measured: 3.2, reference: 3.5, tolerance: '±0.5', unit: 'HU' },
        'CT Number Water': { measured: 0.1, reference: 0.0, tolerance: '±5.0', unit: 'HU' },
        'Spatial Resolution': { measured: 0.35, reference: 0.35, tolerance: '±0.05', unit: 'mm' }
      },
      nextTestDate: '2025-06-14',
      documentation: '/qa/reports/CT_daily_20250613.pdf'
    },
    {
      id: 2,
      testName: 'Weekly QC - MRI Scanner',
      modality: 'MRI',
      modalityName: 'SIGNA Pioneer 3T',
      room: 'Room 102',
      testDate: '2025-06-12',
      testTime: '06:00:00',
      qaType: 'weekly',
      performedBy: 'Meena Joshi',
      status: 'pass',
      testParameters: {
        'SNR Measurement': { measured: 145.2, reference: 150.0, tolerance: '±10%', unit: 'ratio' },
        'Uniformity': { measured: 87.5, reference: 85.0, tolerance: '±5%', unit: '%' },
        'Geometric Accuracy': { measured: 0.8, reference: 1.0, tolerance: '±1.0', unit: 'mm' }
      },
      nextTestDate: '2025-06-19',
      documentation: '/qa/reports/MRI_weekly_20250612.pdf'
    },
    {
      id: 3,
      testName: 'Daily QC - Digital Radiography',
      modality: 'XR',
      modalityName: 'DigitalDiagnost C90',
      room: 'Room 103',
      testDate: '2025-06-13',
      testTime: '07:45:00',
      qaType: 'daily',
      performedBy: 'Kavita Rao',
      status: 'warning',
      testParameters: {
        'Detective Quantum Efficiency': { measured: 0.52, reference: 0.55, tolerance: '±0.05', unit: 'ratio' },
        'Noise Equivalent Quanta': { measured: 42.1, reference: 45.0, tolerance: '±5%', unit: 'NEQ' },
        'Modulation Transfer Function': { measured: 3.8, reference: 4.0, tolerance: '±10%', unit: 'lp/mm' }
      },
      deviationPercentage: 7.2,
      correctiveAction: 'Detector calibration recommended within 48 hours',
      nextTestDate: '2025-06-14',
      documentation: '/qa/reports/XR_daily_20250613.pdf'
    },
    {
      id: 4,
      testName: 'Monthly QC - Ultrasound',
      modality: 'US',
      modalityName: 'Samsung RS85',
      room: 'Room 104',
      testDate: '2025-06-10',
      testTime: '08:00:00',
      qaType: 'monthly',
      performedBy: 'Suresh Gupta',
      status: 'pass',
      testParameters: {
        'Axial Resolution': { measured: 0.3, reference: 0.3, tolerance: '±0.1', unit: 'mm' },
        'Lateral Resolution': { measured: 0.8, reference: 0.8, tolerance: '±0.2', unit: 'mm' },
        'Dead Zone': { measured: 2.1, reference: 2.0, tolerance: '±0.5', unit: 'mm' }
      },
      nextTestDate: '2025-07-10',
      documentation: '/qa/reports/US_monthly_20250610.pdf'
    },
    {
      id: 5,
      testName: 'Daily QC - Mammography',
      modality: 'MG',
      modalityName: 'Selenia Dimensions',
      room: 'Room 105',
      testDate: '2025-06-13',
      testTime: '07:15:00',
      qaType: 'daily',
      performedBy: 'Suresh Gupta',
      status: 'fail',
      testParameters: {
        'Phantom Image Quality': { measured: 8.2, reference: 10.0, tolerance: '±1.0', unit: 'score' },
        'Artifact Evaluation': { measured: 'Present', reference: 'None', tolerance: 'None', unit: 'visual' },
        'Image Uniformity': { measured: 78.5, reference: 85.0, tolerance: '±5%', unit: '%' }
      },
      deviationPercentage: 18.0,
      correctiveAction: 'Equipment service required immediately. Unit taken offline.',
      supervisorReview: true,
      supervisorComments: 'Significant image quality degradation. Service engineer contacted.',
      nextTestDate: '2025-06-14',
      documentation: '/qa/reports/MG_daily_20250613.pdf'
    }
  ];

  const equipmentStatus = [
    { 
      modality: 'CT', 
      room: 'Room 101', 
      status: 'operational', 
      lastQA: '2025-06-13', 
      nextQA: '2025-06-14', 
      complianceScore: 98.5,
      uptimeThisMonth: 99.2
    },
    { 
      modality: 'MRI', 
      room: 'Room 102', 
      status: 'operational', 
      lastQA: '2025-06-12', 
      nextQA: '2025-06-19', 
      complianceScore: 96.8,
      uptimeThisMonth: 97.8
    },
    { 
      modality: 'XR', 
      room: 'Room 103', 
      status: 'warning', 
      lastQA: '2025-06-13', 
      nextQA: '2025-06-14', 
      complianceScore: 92.1,
      uptimeThisMonth: 95.5
    },
    { 
      modality: 'US', 
      room: 'Room 104', 
      status: 'operational', 
      lastQA: '2025-06-10', 
      nextQA: '2025-07-10', 
      complianceScore: 99.1,
      uptimeThisMonth: 99.5
    },
    { 
      modality: 'MG', 
      room: 'Room 105', 
      status: 'out_of_service', 
      lastQA: '2025-06-13', 
      nextQA: 'Pending', 
      complianceScore: 85.2,
      uptimeThisMonth: 89.1
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800';
      case 'fail': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4" />;
      case 'fail': return <XCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getEquipmentStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'out_of_service': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredChecks = qaChecks.filter(check =>
    check.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    check.modality.toLowerCase().includes(searchTerm.toLowerCase()) ||
    check.modalityName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Quality Assurance</h2>
            <p className="text-sm text-muted-foreground">
              Monitor and manage equipment quality control
            </p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Schedule QA Test
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total QA Checks</p>
                <p className="text-2xl font-bold text-blue-600">{qaStats.totalChecks}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Passed</p>
                <p className="text-2xl font-bold text-green-600">{qaStats.passedChecks}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{qaStats.failedChecks}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{qaStats.warningChecks}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance Rate</p>
                <p className="text-2xl font-bold text-purple-600">{qaStats.complianceRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Equipment Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {equipmentStatus.map((equipment, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium">{equipment.modality}</div>
                  <Badge className={getEquipmentStatusColor(equipment.status)}>
                    {equipment.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room:</span>
                    <span>{equipment.room}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last QA:</span>
                    <span>{new Date(equipment.lastQA).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next QA:</span>
                    <span>{equipment.nextQA === 'Pending' ? equipment.nextQA : new Date(equipment.nextQA).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Compliance:</span>
                    <span className={getComplianceColor(equipment.complianceScore)}>
                      {equipment.complianceScore}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uptime:</span>
                    <span className={getComplianceColor(equipment.uptimeThisMonth)}>
                      {equipment.uptimeThisMonth}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search QA checks by test name, modality, or equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* QA Check Results */}
      <Card>
        <CardHeader>
          <CardTitle>Recent QA Check Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredChecks.map((check) => (
              <div key={check.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium text-lg">{check.testName}</div>
                      <div className="text-sm text-muted-foreground">
                        {check.modalityName} • {check.room}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${check.qaType === 'daily' ? 'bg-blue-100 text-blue-800' : 
                                     check.qaType === 'weekly' ? 'bg-purple-100 text-purple-800' : 
                                     'bg-gray-100 text-gray-800'}`}>
                      {check.qaType.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(check.status)}>
                      {getStatusIcon(check.status)}
                      <span className="ml-1">{check.status.toUpperCase()}</span>
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <div className="text-muted-foreground">Test Date</div>
                    <div className="font-medium">{new Date(check.testDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Performed By</div>
                    <div className="font-medium">{check.performedBy}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Next Test</div>
                    <div className="font-medium">{check.nextTestDate === 'Pending' ? check.nextTestDate : new Date(check.nextTestDate).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Test Parameters */}
                <div className="border-t pt-4 mb-4">
                  <div className="text-sm font-medium mb-2">Test Parameters</div>
                  <div className="space-y-2">
                    {Object.entries(check.testParameters).map(([param, values]) => (
                      <div key={param} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <div className="font-medium">{param}</div>
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-muted-foreground">Measured: </span>
                            <span className="font-medium">{values.measured} {values.unit}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Reference: </span>
                            <span>{values.reference} {values.unit}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tolerance: </span>
                            <span>{values.tolerance}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Corrective Actions for warnings/failures */}
                {(check.status === 'warning' || check.status === 'fail') && (
                  <div className="border-t pt-4 mb-4">
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <div className="flex items-center gap-2 text-red-800 mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        <div className="font-medium">Action Required</div>
                        {check.deviationPercentage && (
                          <Badge variant="destructive">
                            {check.deviationPercentage}% deviation
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-red-700">{check.correctiveAction}</div>
                      {check.supervisorReview && (
                        <div className="mt-2 text-sm">
                          <div className="font-medium text-red-800">Supervisor Review:</div>
                          <div className="text-red-700">{check.supervisorComments}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t pt-4 flex gap-2">
                  <Button size="sm" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    View Report
                  </Button>
                  <Button size="sm" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Next
                  </Button>
                  {check.status === 'fail' && (
                    <Button size="sm" variant="outline">
                      <Wrench className="h-4 w-4 mr-2" />
                      Request Service
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Parameters
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QualityAssurance;
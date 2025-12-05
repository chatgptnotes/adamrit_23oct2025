// Quality Control Component
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Search, 
  Plus, 
  AlertTriangle,
  Settings,
  TrendingUp,
  XCircle,
  Clock
} from 'lucide-react';

const QualityControl: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const qcStats = {
    passed: 28,
    failed: 2,
    pending: 5,
    successRate: 93.3
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Quality Control</h2>
            <p className="text-sm text-muted-foreground">
              Monitor and manage laboratory quality control processes
            </p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Run QC
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">QC Passed</p>
                <p className="text-2xl font-bold text-green-600">{qcStats.passed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">QC Failed</p>
                <p className="text-2xl font-bold text-red-600">{qcStats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{qcStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-blue-600">{qcStats.successRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
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
              placeholder="Search QC runs by analyzer, test, or lot number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* QC Results */}
      <Card>
        <CardHeader>
          <CardTitle>Recent QC Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { analyzer: 'Sysmex XN-1000', test: 'CBC', level: 'Normal', result: 'PASSED', time: '08:30 AM' },
              { analyzer: 'Roche Cobas 8000', test: 'Chemistry Panel', level: 'High', result: 'PASSED', time: '08:45 AM' },
              { analyzer: 'Abbott Architect', test: 'Immunology', level: 'Low', result: 'FAILED', time: '09:15 AM' },
              { analyzer: 'Roche Cobas e801', test: 'Hormones', level: 'Normal', result: 'PASSED', time: '09:30 AM' },
              { analyzer: 'BioMerieux Vitek', test: 'Microbiology', level: 'High', result: 'PENDING', time: '10:00 AM' }
            ].map((qc, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{qc.analyzer}</div>
                  <div className="text-sm text-muted-foreground">{qc.test} • {qc.level} Level</div>
                  <div className="text-xs text-muted-foreground">Today {qc.time}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={
                    qc.result === 'PASSED' ? "bg-green-100 text-green-800" :
                    qc.result === 'FAILED' ? "bg-red-100 text-red-800" :
                    "bg-orange-100 text-orange-800"
                  }>
                    {qc.result}
                  </Badge>
                  <Button size="sm" variant="outline">View</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Equipment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Equipment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Sysmex XN-1000', status: 'Active', lastQC: 'Today 08:30', nextQC: 'Tomorrow 08:00' },
              { name: 'Roche Cobas 8000', status: 'Active', lastQC: 'Today 08:45', nextQC: 'Tomorrow 08:00' },
              { name: 'Abbott Architect', status: 'Maintenance', lastQC: 'Yesterday 16:00', nextQC: 'Pending' }
            ].map((equipment, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="font-medium">{equipment.name}</div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Status:</span>
                    <Badge className={equipment.status === 'Active' ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                      {equipment.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Last QC:</span>
                    <span className="text-muted-foreground">{equipment.lastQC}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Next QC:</span>
                    <span className="text-muted-foreground">{equipment.nextQC}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QualityControl;
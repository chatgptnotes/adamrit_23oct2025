// Result Entry Component
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TestTube, Search, Plus, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const ResultEntry: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const resultStats = {
    pending: 24,
    completed: 67,
    verified: 45,
    critical: 3
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TestTube className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Result Entry & Validation</h2>
            <p className="text-sm text-muted-foreground">
              Enter, review, and validate laboratory test results
            </p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Enter Results
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Results</p>
                <p className="text-2xl font-bold text-orange-600">{resultStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-blue-600">{resultStats.completed}</p>
              </div>
              <TestTube className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-green-600">{resultStats.verified}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Values</p>
                <p className="text-2xl font-bold text-red-600">{resultStats.critical}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
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
              placeholder="Search by order number, patient name, or test..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Worklist */}
      <Card>
        <CardHeader>
          <CardTitle>Results Worklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Complete Blood Count</div>
                  <div className="text-sm text-muted-foreground">Order: LAB2025{String(i).padStart(3, '0')} • Patient: John Doe</div>
                  <div className="text-xs text-muted-foreground">Sample: S2025{String(i).padStart(3, '0')} • Analyzer: Sysmex XN-1000</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={i <= 2 ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                    {i <= 2 ? "Ready for Entry" : "Pending"}
                  </Badge>
                  <Button size="sm" variant="outline" disabled={i > 2}>
                    {i <= 2 ? "Enter Results" : "Waiting"}
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

export default ResultEntry;
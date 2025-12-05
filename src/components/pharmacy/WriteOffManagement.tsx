// Write-off Management Component
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Archive, Plus } from 'lucide-react';

const WriteOffManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Archive className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Write-off Management</h2>
            <p className="text-sm text-muted-foreground">
              Manage expired, damaged, or unsellable stock write-offs
            </p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Write-off
        </Button>
      </div>

      {/* Placeholder Content */}
      <Card>
        <CardHeader>
          <CardTitle>Write-off Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Write-off Management Module</h3>
            <p className="text-muted-foreground mb-4">
              This module will allow you to:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Write off expired medicines</li>
              <li>• Handle damaged or contaminated stock</li>
              <li>• Process unsellable inventory</li>
              <li>• Generate write-off reports</li>
              <li>• Track write-off history and approvals</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WriteOffManagement; 
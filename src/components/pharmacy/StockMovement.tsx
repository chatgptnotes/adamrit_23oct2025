// Stock Movement Component
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Plus } from 'lucide-react';

const StockMovement: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Stock Movement</h2>
            <p className="text-sm text-muted-foreground">
              Track all inward and outward stock movements
            </p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Movement
        </Button>
      </div>

      {/* Placeholder Content */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Movement Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Stock Movement Module</h3>
            <p className="text-muted-foreground mb-4">
              This module will allow you to:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Track all inward stock movements (purchases, returns)</li>
              <li>• Monitor outward movements (sales, transfers, write-offs)</li>
              <li>• View detailed movement history</li>
              <li>• Generate movement reports</li>
              <li>• Maintain audit trail for compliance</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockMovement; 
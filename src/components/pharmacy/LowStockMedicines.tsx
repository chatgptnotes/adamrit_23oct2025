// Low Stock Medicines Component - Shows medicines with < 20 tablets in stock
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Search,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MedicineMaster } from '@/types/medicine';
import { useAuth } from '@/contexts/AuthContext';

const LOW_STOCK_THRESHOLD = 20;

const LowStockMedicines: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [medicines, setMedicines] = useState<MedicineMaster[]>([]);
  const [batchStockMap, setBatchStockMap] = useState<Record<string, { totalStock: number; piecesPerPack: number }>>({});
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { toast } = useToast();
  const { hospitalConfig } = useAuth();

  const fetchMedicines = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('medicine_master')
      .select(`
        *,
        manufacturer:manufacturer_companies(id, name),
        supplier:suppliers(id, supplier_name)
      `)
      .eq('is_deleted', false)
      .eq('hospital_name', hospitalConfig.fullName)
      .order('medicine_name');

    if (error) {
      console.error('Error fetching medicines:', error);
      toast({
        title: "Error",
        description: "Failed to fetch medicines",
        variant: "destructive"
      });
      setMedicines([]);
    } else {
      setMedicines(data || []);

      // Fetch batch inventory stock for all medicines
      const { data: batchData, error: batchError } = await supabase
        .from('medicine_batch_inventory')
        .select('medicine_id, current_stock, pieces_per_pack')
        .eq('is_active', true)
        .gt('current_stock', 0);

      if (!batchError && batchData) {
        const stockMap: Record<string, { totalStock: number; piecesPerPack: number }> = {};
        batchData.forEach((batch) => {
          if (batch.medicine_id) {
            if (!stockMap[batch.medicine_id]) {
              stockMap[batch.medicine_id] = {
                totalStock: 0,
                piecesPerPack: batch.pieces_per_pack || 1
              };
            }
            stockMap[batch.medicine_id].totalStock += (batch.current_stock || 0);
            if (batch.pieces_per_pack && batch.pieces_per_pack > 0) {
              stockMap[batch.medicine_id].piecesPerPack = batch.pieces_per_pack;
            }
          }
        });
        setBatchStockMap(stockMap);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // Filter to only low stock medicines (< 20 tablets), then apply search
  const lowStockMedicines = medicines.filter(medicine => {
    const stockInfo = batchStockMap[medicine.id] || { totalStock: 0, piecesPerPack: 1 };
    const effectivePiecesPerPack = medicine.tablets_pieces || stockInfo.piecesPerPack || 1;
    const tablets = stockInfo.totalStock * effectivePiecesPerPack;
    return tablets < LOW_STOCK_THRESHOLD;
  });

  const filteredMedicines = lowStockMedicines.filter(medicine => {
    const searchLower = searchTerm.toLowerCase();
    return medicine.medicine_name?.toLowerCase().includes(searchLower) ||
           medicine.generic_name?.toLowerCase().includes(searchLower);
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMedicines = filteredMedicines.slice(startIndex, endIndex);

  // Count out-of-stock vs low stock
  const outOfStockCount = lowStockMedicines.filter(m => {
    const stockInfo = batchStockMap[m.id] || { totalStock: 0, piecesPerPack: 1 };
    return stockInfo.totalStock === 0;
  }).length;
  const lowStockCount = lowStockMedicines.length - outOfStockCount;

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-orange-500" />
          <div>
            <h2 className="text-2xl font-bold">Low Stock Medicines</h2>
            <p className="text-sm text-muted-foreground">
              Medicines with fewer than {LOW_STOCK_THRESHOLD} tablets in stock
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="destructive" className="text-sm px-3 py-1">
            Out of Stock: {outOfStockCount}
          </Badge>
          <Badge className="text-sm px-3 py-1 bg-orange-500 hover:bg-orange-600">
            Low Stock: {lowStockCount}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Low/Out of Stock</p>
                <p className="text-2xl font-bold text-orange-600">{lowStockMedicines.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock (1-19)</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
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
              placeholder="Search low stock medicines by name or generic name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Medicines Table */}
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Medicines ({filteredMedicines.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine Name</TableHead>
                  <TableHead>Generic Name</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Stock (Tablets)</TableHead>
                  <TableHead>Stock (Strips)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading medicines...
                    </TableCell>
                  </TableRow>
                ) : paginatedMedicines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {searchTerm
                            ? 'No low stock medicines found matching your search.'
                            : 'No medicines are currently low on stock.'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedMedicines.map((medicine) => {
                    const stockInfo = batchStockMap[medicine.id] || { totalStock: 0, piecesPerPack: 1 };
                    const stockStrips = stockInfo.totalStock;
                    const effectivePiecesPerPack = medicine.tablets_pieces || stockInfo.piecesPerPack || 1;
                    const stockTablets = stockStrips * effectivePiecesPerPack;
                    const isOutOfStock = stockTablets === 0;

                    return (
                      <TableRow key={medicine.id}>
                        <TableCell className="font-medium">{medicine.medicine_name}</TableCell>
                        <TableCell>{medicine.generic_name || 'N/A'}</TableCell>
                        <TableCell>{medicine.manufacturer?.name || 'N/A'}</TableCell>
                        <TableCell>{medicine.supplier?.supplier_name || 'N/A'}</TableCell>
                        <TableCell>{medicine.type || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={isOutOfStock ? "destructive" : "outline"}
                            className={!isOutOfStock ? "border-orange-500 text-orange-600 bg-orange-50" : ""}>
                            {stockTablets}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isOutOfStock ? "destructive" : "outline"}
                            className={!isOutOfStock ? "border-orange-500 text-orange-600 bg-orange-50" : ""}>
                            {stockStrips}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {filteredMedicines.length > 0 && (
            <div className="flex items-center justify-between px-2 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredMedicines.length)} of {filteredMedicines.length} medicines
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    const showPage =
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1);

                    if (!showPage) {
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2">...</span>;
                      }
                      return null;
                    }

                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="min-w-[40px]"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LowStockMedicines;

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import AddShiftingDialog from '@/components/shifting/AddShiftingDialog';

const ITEMS_PER_PAGE = 10;

const Shifting = () => {
  const { hospitalConfig } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: shiftings = [], isLoading } = useQuery({
    queryKey: ['ward-shiftings', hospitalConfig?.name],
    queryFn: async () => {
      let query = supabase
        .from('ward_shiftings')
        .select('*')
        .order('shifting_date', { ascending: false });

      if (hospitalConfig?.name) {
        query = query.eq('hospital_name', hospitalConfig.name);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const totalPages = Math.max(1, Math.ceil(shiftings.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = shiftings.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['ward-shiftings'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shifting</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Shifting
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : shiftings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No shifting records found.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Sr.No</TableHead>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>From Ward</TableHead>
                    <TableHead>To Ward</TableHead>
                    <TableHead>Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((record: any, index: number) => (
                    <TableRow key={record.id}>
                      <TableCell>{startIndex + index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {record.patient_name}
                      </TableCell>
                      <TableCell>
                        {record.shifting_date
                          ? new Date(record.shifting_date).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell>{record.from_ward || '-'}</TableCell>
                      <TableCell>{record.shifting_ward}</TableCell>
                      <TableCell>{record.remark || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-
                    {Math.min(startIndex + ITEMS_PER_PAGE, shiftings.length)} of{' '}
                    {shiftings.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AddShiftingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        hospitalName={hospitalConfig?.name}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default Shifting;

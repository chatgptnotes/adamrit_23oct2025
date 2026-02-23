import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Eye, Trash2, Calendar, Clock, FileText, DollarSign, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const OldBills = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deletingBillId, setDeletingBillId] = useState<string | null>(null);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);

  // Fetch all bills for this visit (or all bills if no visitId)
  const { data: bills, isLoading, refetch } = useQuery({
    queryKey: ['old-bills', visitId],
    queryFn: async () => {
      if (!visitId) {
        // If no visitId, fetch all bills
        const { data: allBills, error: billsError } = await supabase
          .from('bills')
          .select(`
            *,
            patients (
              id,
              name,
              patients_id,
              age,
              sex,
              patient_name,
              mrn,
              date_of_admission,
              date_of_discharge,
              diagnosis_and_surgery_performed
            )
          `)
          .order('created_at', { ascending: false });

        if (billsError) {
          console.error('Error fetching all bills:', billsError);
          throw billsError;
        }

        return allBills || [];
      }

      // First get the visit to find the patient_id
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('patient_id')
        .eq('visit_id', visitId)
        .single();

      if (visitError) {
        console.error('Error fetching visit:', visitError);
        throw visitError;
      }

      if (!visitData?.patient_id) {
        return [];
      }

      // Then get only properly saved bills for this patient
      // Only show bills that have been explicitly saved (have line items and sections)
      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          bill_sections(*),
          bill_line_items(*)
        `)
        .eq('patient_id', visitData.patient_id)
        .not('total_amount', 'is', null)  // Must have a total amount
        .gt('total_amount', 0)            // Total amount must be greater than 0
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bills:', error);
        throw error;
      }

      // Additional filtering to ensure only properly saved bills are shown
      const validBills = (data || []).filter(bill => {
        // Must have line items (indicating it was properly saved)
        const hasLineItems = bill.bill_line_items && bill.bill_line_items.length > 0;

        // Must have a valid total amount
        const hasValidTotal = bill.total_amount && bill.total_amount > 0;

        // Must have a proper bill number
        const hasValidBillNo = bill.bill_no && bill.bill_no.trim() !== '';

        console.log(`Bill ${bill.id} validation:`, {
          hasLineItems,
          hasValidTotal,
          hasValidBillNo,
          lineItemsCount: bill.bill_line_items?.length || 0,
          totalAmount: bill.total_amount
        });

        return hasLineItems && hasValidTotal && hasValidBillNo;
      });

      console.log(`Filtered ${validBills.length} valid bills out of ${data?.length || 0} total bills`);
      return validBills;
    },
    enabled: !!visitId
  });

  // Fetch visit details for context
  const { data: visitDetails } = useQuery({
    queryKey: ['visit-details', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          patients(name, patients_id)
        `)
        .eq('visit_id', visitId)
        .single();

      if (error) {
        console.error('Error fetching visit details:', error);
        return null;
      }

      return data;
    },
    enabled: !!visitId
  });

  const handleViewBill = (billId: string) => {
    // Navigate to view bill page (we'll implement this)
    navigate(`/view-bill/${billId}`);
  };

  const handleSelectBill = (billId: string, checked: boolean) => {
    if (checked) {
      setSelectedBills(prev => [...prev, billId]);
    } else {
      setSelectedBills(prev => prev.filter(id => id !== billId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && bills) {
      setSelectedBills(bills.map(bill => bill.id));
    } else {
      setSelectedBills([]);
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedBills.length === 0) {
      toast({
        title: "No Bills Selected",
        description: "Please select at least one bill to delete.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedBills.length} bill(s)? This action cannot be undone.`)) {
      return;
    }

    setIsDeletingMultiple(true);
    
    try {
      for (const billId of selectedBills) {
        // Delete bill line items first
        await supabase
          .from('bill_line_items')
          .delete()
          .eq('bill_id', billId);

        // Delete bill sections
        await supabase
          .from('bill_sections')
          .delete()
          .eq('bill_id', billId);

        // Delete the main bill
        await supabase
          .from('bills')
          .delete()
          .eq('id', billId);
      }

      toast({
        title: "Bills Deleted",
        description: `Successfully deleted ${selectedBills.length} bill(s).`,
      });

      setSelectedBills([]);
      refetch();
    } catch (error) {
      console.error('Error deleting bills:', error);
      toast({
        title: "Error",
        description: "Failed to delete some bills. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingMultiple(false);
    }
  };

  const handleDeleteBill = async (billId: string) => {
    if (!confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
      return;
    }

    setDeletingBillId(billId);
    
    try {
      // Delete bill line items first
      await supabase
        .from('bill_line_items')
        .delete()
        .eq('bill_id', billId);

      // Delete bill sections
      await supabase
        .from('bill_sections')
        .delete()
        .eq('bill_id', billId);

      // Delete the main bill
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', billId);

      if (error) throw error;

      toast({
        title: "Bill Deleted",
        description: "The bill has been successfully deleted.",
      });

      refetch();
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast({
        title: "Error",
        description: "Failed to delete the bill. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingBillId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading bills...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            {visitId ? (
              <Button
                variant="outline"
                onClick={() => navigate(`/final-bill/${visitId}`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Current Bill
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {visitId ? 'Previous Bills' : 'All Bills'}
              </h1>
              {visitDetails && (
                <p className="text-gray-600 mt-1">
                  Patient: <span className="font-semibold">{visitDetails.patients?.name}</span>
                  {visitDetails.patients?.patients_id && (
                    <span className="ml-2 text-sm">({visitDetails.patients.patients_id})</span>
                  )}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  💾 Showing only saved bills
                </Badge>
                <span className="text-xs text-gray-500">
                  Bills appear here only after clicking 'Save Bill' button
                </span>
              </div>
            </div>
            {selectedBills.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleDeleteMultiple}
                disabled={isDeletingMultiple}
                className="flex items-center gap-2"
              >
                <Trash className="h-4 w-4" />
                {isDeletingMultiple ? 'Deleting...' : `Delete Selected (${selectedBills.length})`}
              </Button>
            )}
          </div>
        </div>

        {/* Bills List */}
        {!bills || bills.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Bills Found</h3>
              <p className="text-gray-600 mb-2">No bills have been saved for this patient yet.</p>
              <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg inline-block">
                💡 <strong>How to save a bill:</strong><br />
                1. Go to Final Bill page<br />
                2. Add items and fill details<br />
                3. Click the <strong>'💾 Save Bill'</strong> button<br />
                4. Saved bills will appear here
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Select All Checkbox */}
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
              <Checkbox
                checked={bills.length > 0 && selectedBills.length === bills.length}
                onCheckedChange={handleSelectAll}
                id="select-all"
              />
              <label htmlFor="select-all" className="text-sm font-medium text-gray-700 cursor-pointer">
                Select All ({selectedBills.length} of {bills.length} selected)
              </label>
            </div>
            
            {bills.map((bill) => (
              <Card key={bill.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedBills.includes(bill.id)}
                        onCheckedChange={(checked) => handleSelectBill(bill.id, checked as boolean)}
                        id={`bill-${bill.id}`}
                      />
                      <CardTitle className="text-lg">
                        Bill #{bill.bill_number || bill.id.slice(0, 8)}
                      </CardTitle>
                      <Badge variant="secondary">
                        {formatCurrency(bill.total_amount || 0)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewBill(bill.id)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBill(bill.id)}
                        disabled={deletingBillId === bill.id}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingBillId === bill.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600">Date</p>
                        <p className="font-medium">
                          {format(new Date(bill.created_at), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600">Time</p>
                        <p className="font-medium">
                          {format(new Date(bill.created_at), 'HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600">Total Amount</p>
                        <p className="font-medium">
                          {formatCurrency(bill.total_amount || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600">Claim ID</p>
                        <p className="font-medium">
                          {bill.claim_id || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {bill.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Notes:</span> {bill.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OldBills;

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  User, 
  Stethoscope, 
  DollarSign,
  Activity,
  Clock,
  Building2
} from "lucide-react";

interface VisitData {
  visitId: string;
  patientId: string;
  patientName: string;
  admissionDate: string;
  dischargeDate?: string;
  visitType: string;
  doctor: string;
  diagnosis: string;
}

const AdvancedStatementReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const visitData = location.state as VisitData;
  
  const [isLoading, setIsLoading] = useState(false);

  // Fetch detailed financial data
  const { data: financialData, isLoading: financialLoading } = useQuery({
    queryKey: ['financial-data', visitData?.visitId],
    queryFn: async () => {
      if (!visitData?.visitId) return null;
      
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          patients!inner(
            id,
            name,
            age,
            gender,
            patients_id,
            phone,
            address,
            insurance_person_no
          ),
          visit_bills(
            id,
            bill_number,
            total_amount,
            paid_amount,
            balance_amount,
            bill_date,
            due_date,
            status
          ),
          visit_medicines(
            id,
            medicine_name,
            quantity,
            unit_price,
            total_price
          ),
          visit_lab_tests(
            id,
            test_name,
            test_cost
          ),
          visit_radiology_tests(
            id,
            test_name,
            test_cost
          )
        `)
        .eq('visit_id', visitData.visitId)
        .single();

      if (error) {
        console.error('Error fetching financial data:', error);
        return null;
      }

      return data;
    },
    enabled: !!visitData?.visitId
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate PDF or download functionality
    console.log('📥 Downloading Advanced Statement Report...');
    toast({
      title: "Download Started",
      description: "Advanced Statement Report is being prepared for download...",
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  if (!visitData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">No Visit Data Found</h1>
          <p className="text-gray-600 mt-2">Please go back and select a patient visit.</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Advanced Statement Report</h1>
            <p className="text-gray-600">Comprehensive financial and medical summary</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Patient Information Card */}
      <Card>
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <span>Patient Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Patient Name</label>
              <p className="text-lg font-semibold">{visitData.patientName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Visit ID</label>
              <p className="text-lg font-semibold text-blue-600">{visitData.visitId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Visit Type</label>
              <Badge variant="outline" className="text-lg">
                {visitData.visitType}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Admission Date</label>
              <p className="text-lg">{formatDate(visitData.admissionDate)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Discharge Date</label>
              <p className="text-lg">{visitData.dischargeDate ? formatDate(visitData.dischargeDate) : 'Not Discharged'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Attending Doctor</label>
              <p className="text-lg">{visitData.doctor || 'Not Assigned'}</p>
            </div>
          </div>
          
          <div className="mt-6">
            <label className="text-sm font-medium text-gray-500">Diagnosis</label>
            <p className="text-lg">{visitData.diagnosis || 'No diagnosis recorded'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary Card */}
      <Card>
        <CardHeader className="bg-green-50">
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span>Financial Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {financialLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading financial data...</p>
            </div>
          ) : financialData ? (
            <div className="space-y-6">
              {/* Bills Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Bills Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {financialData.visit_bills?.map((bill: any) => (
                    <div key={bill.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Bill #{bill.bill_number}</span>
                        <Badge variant={bill.status === 'paid' ? 'default' : 'secondary'}>
                          {bill.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Total Amount:</span>
                          <span className="font-medium">{formatCurrency(bill.total_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Paid Amount:</span>
                          <span className="font-medium text-green-600">{formatCurrency(bill.paid_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Balance:</span>
                          <span className="font-medium text-red-600">{formatCurrency(bill.balance_amount)}</span>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="col-span-3 text-center py-4 text-gray-500">
                      No bills found for this visit
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Services Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Services Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Lab Tests */}
                  <div>
                    <h4 className="font-medium text-blue-600 mb-2">Lab Tests</h4>
                    <div className="space-y-2">
                      {financialData.visit_lab_tests?.map((test: any) => (
                        <div key={test.id} className="flex justify-between text-sm">
                          <span>{test.test_name}</span>
                          <span className="font-medium">{formatCurrency(test.test_cost)}</span>
                        </div>
                      )) || (
                        <p className="text-gray-500 text-sm">No lab tests</p>
                      )}
                    </div>
                  </div>

                  {/* Radiology Tests */}
                  <div>
                    <h4 className="font-medium text-purple-600 mb-2">Radiology Tests</h4>
                    <div className="space-y-2">
                      {financialData.visit_radiology_tests?.map((test: any) => (
                        <div key={test.id} className="flex justify-between text-sm">
                          <span>{test.test_name}</span>
                          <span className="font-medium">{formatCurrency(test.test_cost)}</span>
                        </div>
                      )) || (
                        <p className="text-gray-500 text-sm">No radiology tests</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Medicines */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Medicines</h3>
                <div className="space-y-2">
                  {financialData.visit_medicines?.map((medicine: any) => (
                    <div key={medicine.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <span className="font-medium">{medicine.medicine_name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          Qty: {medicine.quantity}
                        </span>
                      </div>
                      <span className="font-medium">{formatCurrency(medicine.total_price)}</span>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-sm">No medicines prescribed</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No financial data available for this visit</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card>
        <CardHeader className="bg-purple-50">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-purple-600" />
            <span>Summary Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {financialData?.visit_bills?.length || 0}
              </div>
              <div className="text-sm text-gray-500">Total Bills</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  financialData?.visit_bills?.reduce((sum: number, bill: any) => 
                    sum + (bill.total_amount || 0), 0
                  ) || 0
                )}
              </div>
              <div className="text-sm text-gray-500">Total Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(
                  financialData?.visit_bills?.reduce((sum: number, bill: any) => 
                    sum + (bill.paid_amount || 0), 0
                  ) || 0
                )}
              </div>
              <div className="text-sm text-gray-500">Total Paid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(
                  financialData?.visit_bills?.reduce((sum: number, bill: any) => 
                    sum + (bill.balance_amount || 0), 0
                  ) || 0
                )}
              </div>
              <div className="text-sm text-gray-500">Total Balance</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedStatementReport;

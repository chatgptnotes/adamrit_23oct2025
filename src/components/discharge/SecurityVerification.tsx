import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Shield, CheckCircle, XCircle, Scan, User, Clock } from 'lucide-react';

interface SecurityVerificationProps {
  onVerificationComplete?: (gatePassNumber: string) => void;
}

interface GatePassData {
  id: string;
  gate_pass_number: string;
  patient_name: string;
  discharge_date: string;
  discharge_mode: string;
  bill_paid: boolean;
  security_verified: boolean;
  verified_at?: string;
  verified_by?: string;
  is_active: boolean;
  created_at: string;
  visit: {
    visit_id: string;
    patients: {
      patients_id: string;
    };
  };
}

export const SecurityVerification: React.FC<SecurityVerificationProps> = ({ 
  onVerificationComplete 
}) => {
  const [gatePassNumber, setGatePassNumber] = useState('');
  const [verifierName, setVerifierName] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);
  const queryClient = useQueryClient();

  // Search for gate pass
  const { data: gatePass, isLoading, error } = useQuery({
    queryKey: ['gate-pass-verification', gatePassNumber],
    queryFn: async () => {
      if (!gatePassNumber.trim()) return null;
      
      const { data, error } = await supabase
        .from('gate_passes')
        .select(`
          *,
          visit:visits!inner(
            visit_id,
            patients!inner(
              patients_id
            )
          )
        `)
        .eq('gate_pass_number', gatePassNumber.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;
      return data as GatePassData | null;
    },
    enabled: searchTriggered && !!gatePassNumber.trim(),
  });

  // Verify gate pass
  const verifyGatePassMutation = useMutation({
    mutationFn: async () => {
      if (!gatePass?.id || !verifierName.trim()) {
        throw new Error('Gate pass ID and verifier name are required');
      }

      const { error } = await supabase
        .from('gate_passes')
        .update({
          security_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: verifierName.trim(),
        })
        .eq('id', gatePass.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gate-pass-verification', gatePassNumber] });
      toast({
        title: "Gate Pass Verified",
        description: "Patient is authorized to exit the hospital.",
      });
      onVerificationComplete?.(gatePassNumber);
    },
    onError: () => {
      toast({
        title: "Verification Failed",
        description: "Failed to verify gate pass. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!gatePassNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a gate pass number.",
        variant: "destructive",
      });
      return;
    }
    setSearchTriggered(true);
  };

  const handleVerify = () => {
    if (!verifierName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name as the verifying officer.",
        variant: "destructive",
      });
      return;
    }
    verifyGatePassMutation.mutate();
  };

  const handleReset = () => {
    setGatePassNumber('');
    setVerifierName('');
    setSearchTriggered(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGatePassStatus = () => {
    if (!gatePass) return null;

    if (gatePass.security_verified) return 'verified';
    
    const dischargeDate = new Date(gatePass.discharge_date);
    const now = new Date();
    const daysDiff = Math.ceil((now.getTime() - dischargeDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 1) return 'expired';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Gate Pass Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Section */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="gate-pass-number">Gate Pass Number</Label>
                <Input
                  id="gate-pass-number"
                  value={gatePassNumber}
                  onChange={(e) => setGatePassNumber(e.target.value.toUpperCase())}
                  placeholder="Enter gate pass number (e.g., GP250801001)"
                  className="font-mono"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Scan className="h-4 w-4" />
                  {isLoading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
          </div>

          {/* Search Results */}
          {searchTriggered && (
            <div className="space-y-4">
              {isLoading && (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Searching for gate pass...</span>
                </div>
              )}

              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-red-800">
                      <XCircle className="h-5 w-5" />
                      <span>Error searching for gate pass. Please try again.</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!isLoading && !error && !gatePass && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <XCircle className="h-5 w-5" />
                      <span>Gate pass not found. Please verify the number and try again.</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {gatePass && (
                <Card className="border-2">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Status Badge */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Gate Pass Details</h3>
                        <Badge 
                          className={getStatusColor(getGatePassStatus() || '')}
                          variant="outline"
                        >
                          {getGatePassStatus()?.toUpperCase()}
                        </Badge>
                      </div>

                      {/* Patient Information */}
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Patient Name:</span>
                            <span>{gatePass.patient_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Patient ID:</span>
                            <span>{gatePass.visit.patients.patients_id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Visit ID:</span>
                            <span>{gatePass.visit.visit_id}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Discharge Date:</span>
                            <span>{format(new Date(gatePass.discharge_date), 'dd/MM/yyyy HH:mm')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Discharge Mode:</span>
                            <span className="capitalize">{gatePass.discharge_mode.replace('_', ' ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Bill Status:</span>
                            <Badge variant={gatePass.bill_paid ? "default" : "destructive"}>
                              {gatePass.bill_paid ? 'PAID' : 'UNPAID'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Verification Status */}
                      {gatePass.security_verified ? (
                        <Card className="border-green-200 bg-green-50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-green-800">
                              <CheckCircle className="h-5 w-5" />
                              <div>
                                <p className="font-medium">Already Verified</p>
                                <p className="text-sm">
                                  Verified by: {gatePass.verified_by} on{' '}
                                  {gatePass.verified_at && format(new Date(gatePass.verified_at), 'dd/MM/yyyy HH:mm')}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          {getGatePassStatus() === 'expired' ? (
                            <Card className="border-red-200 bg-red-50">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-red-800">
                                  <XCircle className="h-5 w-5" />
                                  <span>This gate pass has expired. Please contact administration.</span>
                                </div>
                              </CardContent>
                            </Card>
                          ) : (
                            <>
                              <div>
                                <Label htmlFor="verifier-name">Security Officer Name</Label>
                                <Input
                                  id="verifier-name"
                                  value={verifierName}
                                  onChange={(e) => setVerifierName(e.target.value)}
                                  placeholder="Enter your name"
                                />
                              </div>
                              <Button
                                onClick={handleVerify}
                                disabled={verifyGatePassMutation.isPending || !verifierName.trim()}
                                className="w-full"
                                size="lg"
                              >
                                <CheckCircle className="mr-2 h-5 w-5" />
                                {verifyGatePassMutation.isPending ? 'Verifying...' : 'Verify Exit'}
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reset Button */}
              <div className="flex justify-center">
                <Button variant="outline" onClick={handleReset}>
                  Search Another Gate Pass
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
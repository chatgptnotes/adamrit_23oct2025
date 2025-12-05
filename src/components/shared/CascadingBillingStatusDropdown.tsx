import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Visit {
  id: string;
  visit_id?: string;
  billing_status?: string | null;
  billing_sub_status?: string | null;
}

interface CascadingBillingStatusDropdownProps {
  visit: Visit;
  queryKey?: string[];
  onUpdate?: () => void;
}

export const CascadingBillingStatusDropdown: React.FC<CascadingBillingStatusDropdownProps> = ({
  visit,
  queryKey = ['visits'],
  onUpdate
}) => {
  const [primaryStatus, setPrimaryStatus] = useState(visit.billing_status || '');
  const [subStatus, setSubStatus] = useState(visit.billing_sub_status || '');
  const [debouncedPrimary] = useDebounce(primaryStatus, 2000);
  const [debouncedSub] = useDebounce(subStatus, 2000);
  const [isUpdating, setIsUpdating] = useState(false);
  const lastSubmittedPrimary = useRef<string | null>(null);
  const lastSubmittedSub = useRef<string | null>(null);


  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Updated billing status options with new mother fields
  const billingStatusOptions = {
    'Approval Pending': [
      'Awaiting management review',
      'Documents under verification',
      'Initial form not signed',
      'Approval email not received',
      'Policy mismatch under review'
    ],
    'ID Pending': [
      'Patient ID not generated',
      'Insurance ID missing',
      'KYC documents not uploaded',
      'ID verification in progress',
      'Duplicate ID conflict'
    ],
    'Doctor Planning Done': [
      'Treatment plan approved',
      'Doctor\'s consent received',
      'Procedure schedule finalized',
      'Specialist opinion documented',
      'Investigation reports uploaded'
    ],
    'Bill Completed': [
      'Final charges entered',
      'Discharge summary attached',
      'Doctor fees confirmed',
      'Pharmacy & lab charges verified',
      'Billing audit completed'
    ],
    'Bill Submitted': [
      'Sent to insurance for claim',
      'Submitted to finance department',
      'Patient copy handed over',
      'Online claim portal updated',
      'E-mail with bill confirmation sent'
    ],
    'Bill uploaded, not couriered': [],
    'Bill uploaded, couriered': [],
    'Payment received': []
  };

  const updateMutation = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: string }) => {
      const updateField = field === 'primary' ? 'billing_status' : 'billing_sub_status';
      const idField = visit.visit_id ? 'visit_id' : 'id';
      const idValue = visit.visit_id || visit.id;

      const { error } = await supabase
        .from('visits')
        .update({ [updateField]: value })
        .eq(idField, idValue);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      if (onUpdate) onUpdate();
    },
    onError: (error) => {
      console.error('Error updating billing status:', error);
      toast({
        title: "Error",
        description: "Failed to update billing status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  // Keep local state in sync with visit prop updates
  useEffect(() => {
    setPrimaryStatus(visit.billing_status || '');
  }, [visit.billing_status]);

  useEffect(() => {
    setSubStatus(visit.billing_sub_status || '');
  }, [visit.billing_sub_status]);

  // Submit primary only when it's a real change and not already submitted
  useEffect(() => {
    const currentProp = visit.billing_status || '';
    if (
      debouncedPrimary !== undefined &&
      debouncedPrimary !== currentProp &&
      debouncedPrimary !== lastSubmittedPrimary.current
    ) {
      setIsUpdating(true);
      lastSubmittedPrimary.current = debouncedPrimary;
      updateMutation.mutate({ field: 'primary', value: debouncedPrimary });
    }
  }, [debouncedPrimary, visit.billing_status]);

  // Submit sub only when it's a real change and not already submitted
  useEffect(() => {
    const currentProp = visit.billing_sub_status || '';
    if (
      debouncedSub !== undefined &&
      debouncedSub !== currentProp &&
      debouncedSub !== lastSubmittedSub.current
    ) {
      setIsUpdating(true);
      lastSubmittedSub.current = debouncedSub;
      updateMutation.mutate({ field: 'sub', value: debouncedSub });
    }
  }, [debouncedSub, visit.billing_sub_status]);

  const handlePrimaryChange = (value: string) => {
    setPrimaryStatus(value);
    setSubStatus(''); // Reset sub status when primary changes
    // Changing primary means any pending sub submission should be ignored
    lastSubmittedSub.current = null;
  };

  return (
    <div className="relative">
      <div className="flex flex-col gap-1">
        <select
          value={primaryStatus}
          onChange={(e) => handlePrimaryChange(e.target.value)}
          className="w-44 h-8 text-xs border border-gray-300 rounded-md px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isUpdating}
        >
          <option value="">Select Status</option>
          {Object.keys(billingStatusOptions).map((option) => (
            <option key={option} value={option}>
              {option === 'Bill Completed' ? 'Bill PDF Completed' : (option === 'Bill Submitted' ? 'Bill submitted - DSC done' : option)}
            </option>
          ))}
        </select>

        {primaryStatus && billingStatusOptions[primaryStatus as keyof typeof billingStatusOptions] && (
          <select
            value={subStatus}
            onChange={(e) => setSubStatus(e.target.value)}
            className="w-44 h-8 text-xs border border-gray-300 rounded-md px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 z-10"
            disabled={isUpdating}
          >
            <option value="">Select Detail</option>
            {billingStatusOptions[primaryStatus as keyof typeof billingStatusOptions].map((subOption) => (
              <option key={subOption} value={subOption}>
                {subOption}
              </option>
            ))}
          </select>
        )}
      </div>
      {isUpdating && (
        <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
      )}
    </div>
  );
};

export default CascadingBillingStatusDropdown;
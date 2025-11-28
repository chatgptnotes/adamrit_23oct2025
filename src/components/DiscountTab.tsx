import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DiscountTabProps {
  visitId?: string;
  onDiscountUpdate?: (discountAmount: number) => void;
}

interface DiscountData {
  id?: string;
  discount_amount: number;
  discount_reason: string;
}

export const DiscountTab: React.FC<DiscountTabProps> = ({
  visitId,
  onDiscountUpdate
}) => {
  const [discountData, setDiscountData] = useState<DiscountData>({
    discount_amount: 0,
    discount_reason: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);


  // Load existing discount data
  useEffect(() => {
    const loadDiscountData = async () => {
      if (!visitId) {
        console.log('⚠️ [DISCOUNT LOAD] No visitId provided');
        return;
      }

      setIsLoading(true);
      try {
        console.log('🔍 [DISCOUNT LOAD] Loading discount data for visitId:', visitId);

        // Convert visitId (string) to visit UUID
        const { data: visitData, error: visitError } = await supabase
          .from('visits')
          .select('id')
          .eq('visit_id', visitId)
          .single();

        if (visitError) {
          console.error('❌ [DISCOUNT LOAD] Error finding visit UUID:', visitError);
          toast.error('Error finding visit record for discount loading');
          return;
        }

        if (!visitData) {
          console.log('⚠️ [DISCOUNT LOAD] No visit found for visitId:', visitId);
          return;
        }

        console.log('✅ [DISCOUNT LOAD] Found visit UUID:', visitData.id);

        // Load discount data using visit UUID
        const { data: discountData, error: discountError } = await supabase
          .from('visit_discounts')
          .select('*')
          .eq('visit_id', visitData.id)
          .single();

        if (discountError && discountError.code !== 'PGRST116') {
          console.error('❌ [DISCOUNT LOAD] Error loading discount data:', discountError);
          toast.error('Error loading discount data');
          return;
        }

        if (discountData) {
          console.log('✅ [DISCOUNT LOAD] Found existing discount:', discountData);
          setDiscountData({
            id: discountData.id,
            discount_amount: discountData.discount_amount || 0,
            discount_reason: discountData.discount_reason || ''
          });

          // Notify parent component about loaded discount
          if (onDiscountUpdate) {
            onDiscountUpdate(discountData.discount_amount || 0);
          }
        } else {
          console.log('📝 [DISCOUNT LOAD] No existing discount found');
        }
      } catch (error) {
        console.error('❌ [DISCOUNT LOAD] Exception:', error);
        toast.error('Failed to load discount data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDiscountData();
  }, [visitId]);

  // Save discount data
  const handleSaveDiscount = async () => {
    if (!visitId) {
      toast.error('Visit ID is required to save discount');
      return;
    }

    if (discountData.discount_amount < 0) {
      toast.error('Discount amount cannot be negative');
      return;
    }

    setIsSaving(true);
    try {
      // Convert visitId (string) to visit UUID
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData) {
        toast.error('Error finding visit record');
        return;
      }

      // Prepare data for upsert
      const upsertData = {
        visit_id: visitData.id,
        discount_amount: discountData.discount_amount,
        discount_reason: discountData.discount_reason,
        applied_by: 'Current User', // TODO: Get from auth context
        updated_at: new Date().toISOString()
      };

      // Upsert discount data
      const { data: savedData, error: saveError } = await supabase
        .from('visit_discounts')
        .upsert(upsertData, { onConflict: 'visit_id' })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving discount:', saveError);
        toast.error('Failed to save discount');
        return;
      }

      // Update local state with saved data
      setDiscountData(prev => ({
        ...prev,
        id: savedData.id
      }));

      // Notify parent component about discount update
      console.log('🔥 [DISCOUNT SAVE] About to call onDiscountUpdate with amount:', discountData.discount_amount);
      if (onDiscountUpdate) {
        console.log('🔥 [DISCOUNT SAVE] Calling onDiscountUpdate callback...');
        onDiscountUpdate(discountData.discount_amount);
        console.log('🔥 [DISCOUNT SAVE] onDiscountUpdate callback completed');
      } else {
        console.error('❌ [DISCOUNT SAVE] onDiscountUpdate callback not available!');
      }

      toast.success('Discount saved successfully!');
    } catch (error) {
      console.error('Exception saving discount:', error);
      toast.error('Failed to save discount');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle discount amount change
  const handleDiscountAmountChange = (value: string) => {
    const numericValue = parseFloat(value) || 0;
    setDiscountData(prev => ({
      ...prev,
      discount_amount: numericValue
    }));
  };

  // Handle discount reason change
  const handleDiscountReasonChange = (value: string) => {
    setDiscountData(prev => ({
      ...prev,
      discount_reason: value
    }));
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading discount information...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill Discount</h3>
          <p className="text-sm text-gray-600">
            Enter discount amount to apply to this bill. The discount will appear in the financial summary table.
          </p>
        </div>

        {/* Discount Form */}
        <div className="space-y-4">
          {/* Discount Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Amount (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={discountData.discount_amount || ''}
              onChange={(e) => handleDiscountAmountChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter discount amount"
            />
          </div>

          {/* Discount Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Reason (Optional)
            </label>
            <textarea
              value={discountData.discount_reason}
              onChange={(e) => handleDiscountReasonChange(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter reason for discount (e.g., Senior citizen discount, Insurance coverage, etc.)"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveDiscount}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </span>
              ) : (
                'Save Discount'
              )}
            </button>
          </div>
        </div>

        {/* Discount Status */}
        {discountData.id && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Discount of ₹{discountData.discount_amount.toLocaleString()} has been applied to this bill.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
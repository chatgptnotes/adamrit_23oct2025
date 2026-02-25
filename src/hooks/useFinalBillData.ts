
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BillSection {
  id: string;
  section_title: string;
  date_from: string | null;
  date_to: string | null;
  section_order: number;
  conservative_additional_start?: string | null;
  conservative_additional_end?: string | null;
  additionalDateRanges?: any[];
}

export interface BillLineItem {
  id: string;
  bill_section_id: string | null;
  sr_no: string;
  item_description: string;
  cghs_nabh_code: string | null;
  cghs_nabh_rate: number | null;
  qty: number;
  amount: number;
  item_type: 'standard' | 'surgical';
  base_amount: number | null;
  primary_adjustment: string | null;
  secondary_adjustment: string | null;
  dates_info: string | null;
  item_order: number;
}

export interface BillData {
  id: string;
  bill_no: string;
  claim_id: string;
  date: string;
  category: string;
  total_amount: number;
  status: string;
  visit_id?: string;
  admission_date?: string;
  discharge_date?: string;
  visit_date?: string;
  visit_created_at?: string;
  sections: BillSection[];
  line_items: BillLineItem[];
}

export const useFinalBillData = (visitId: string) => {
  const queryClient = useQueryClient();

  const { data: billData, isLoading, error } = useQuery({
    queryKey: ['final-bill', visitId],
    queryFn: async () => {
      try {
        console.log('🔍 Fetching bill data for visit ID:', visitId);

        // First try to find bill by visit_id directly
        const { data: billByVisit } = await supabase
          .from('bills')
          .select('*')
          .eq('visit_id', visitId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle() as { data: any };

        // Get visit dates
        const { data: visitData, error: visitError } = await supabase
          .from('visits')
          .select('patient_id, admission_date, discharge_date, created_at, visit_date')
          .eq('visit_id', visitId)
          .single() as { data: any; error: any };

        if (visitError) {
          console.error('❌ Error fetching visit:', visitError);
          if (visitError.code === 'PGRST116') {
            console.warn(`⚠️ No visit found with visit_id: ${visitId}`);
            return null;
          }
          return null;
        }

        if (!visitData?.patient_id) {
          console.warn('⚠️ Visit found but patient_id is missing:', visitData);
          return null;
        }

        console.log('✅ Visit data found:', {
          patient_id: visitData.patient_id,
          admission_date: visitData.admission_date,
          visit_date: visitData.visit_date
        });

        // Use bill found by visit_id, or fallback to patient_id lookup
        let billsData = billByVisit;
        if (!billsData) {
          const { data: billByPatient, error: billsError } = await supabase
            .from('bills')
            .select('*')
            .eq('patient_id', visitData.patient_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle() as { data: any; error: any };

          if (billsError) {
            console.error('❌ Error fetching bill:', billsError);
            return null;
          }
          billsData = billByPatient;
        }

        if (!billsData) {
          console.log('ℹ️ No bill found for patient, returning null');
          return null;
        }

        console.log('✅ Bill found:', billsData.bill_no);

        // Get sections
        const { data: sectionsData, error: sectionsError } = await supabase
          .from('bill_sections')
          .select('*')
          .eq('bill_id', billsData.id)
          .order('section_order') as { data: any; error: any };

        if (sectionsError) {
          console.error('❌ Error fetching sections:', sectionsError);
        }

        // Get line items
        const { data: lineItemsData, error: lineItemsError } = await supabase
          .from('bill_line_items')
          .select('*')
          .eq('bill_id', billsData.id)
          .order('item_order') as { data: any; error: any };

        if (lineItemsError) {
          console.error('❌ Error fetching line items:', lineItemsError);
        }

        const result = {
          ...billsData,
          admission_date: visitData.admission_date,
          discharge_date: visitData.discharge_date,
          visit_date: visitData.visit_date,
          visit_created_at: visitData.created_at,
          sections: sectionsData || [],
          line_items: lineItemsData || []
        } as BillData;

        console.log('✅ Successfully loaded bill data with', result.line_items.length, 'line items');
        return result;
      } catch (err) {
        console.error('❌ Unexpected error in useFinalBillData:', err);
        return null;
      }
    },
    enabled: !!visitId,
    retry: false,
  });

  const saveBillMutation = useMutation({
    mutationFn: async (billData: {
      id?: string;
      visit_id?: string;
      patient_id: string;
      bill_no: string;
      claim_id: string;
      date: string;
      category: string;
      total_amount: number;
      sections: any[];
      line_items: any[];
      bill_patient_data?: any;
    }) => {
      console.log('💾 Starting bill save with total_amount:', billData.total_amount);

      // Find existing bill: first by id, then by visit_id, then by patient_id
      let existingBillId = billData.id;

      if (!existingBillId && billData.visit_id) {
        const { data: existingBill } = await supabase
          .from('bills')
          .select('id')
          .eq('visit_id', billData.visit_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle() as { data: any };

        if (existingBill) {
          existingBillId = existingBill.id;
          console.log('📌 Found existing bill by visit_id:', existingBillId);
        }
      }

      if (!existingBillId) {
        const { data: existingBill } = await supabase
          .from('bills')
          .select('id')
          .eq('patient_id', billData.patient_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle() as { data: any };

        if (existingBill) {
          existingBillId = existingBill.id;
          console.log('📌 Found existing bill by patient_id:', existingBillId);
        }
      }

      let bill: any = null;
      let billError: any = null;

      if (existingBillId) {
        // UPDATE existing bill - only edit, no new row
        console.log('📝 Updating existing bill:', existingBillId);
        const result = await supabase
          .from('bills')
          .update({
            bill_no: billData.bill_no,
            claim_id: billData.claim_id,
            date: billData.date,
            category: billData.category,
            total_amount: billData.total_amount,
            visit_id: billData.visit_id || visitId,
            bill_patient_data: billData.bill_patient_data || {},
            status: 'DRAFT'
          } as any)
          .eq('id', existingBillId)
          .select()
          .single();
        bill = result.data;
        billError = result.error;
      } else {
        // INSERT new bill only if no existing bill found
        console.log('🆕 Creating new bill (first time for this visit)');
        const result = await supabase
          .from('bills')
          .insert({
            patient_id: billData.patient_id,
            bill_no: billData.bill_no,
            claim_id: billData.claim_id,
            date: billData.date,
            category: billData.category,
            total_amount: billData.total_amount,
            visit_id: billData.visit_id || visitId,
            bill_patient_data: billData.bill_patient_data || {},
            status: 'DRAFT'
          } as any)
          .select()
          .single();
        bill = result.data;
        billError = result.error;
      }

      if (billError) {
        console.error('Error saving bill:', billError);
        throw billError;
      }

      // Delete existing sections and line items (then re-insert fresh)
      await supabase.from('bill_sections').delete().eq('bill_id', bill.id);
      await supabase.from('bill_line_items').delete().eq('bill_id', bill.id);

      // Save sections
      if (billData.sections.length > 0) {
        const sectionsToInsert = billData.sections.map((section: any, index: number) => ({
          bill_id: bill.id,
          section_title: section.title,
          date_from: section.dates?.from ? new Date(section.dates.from).toISOString().split('T')[0] : null,
          date_to: section.dates?.to ? new Date(section.dates.to).toISOString().split('T')[0] : null,
          section_order: index,
          conservative_additional_start: section.conservative_additional_start ?
            new Date(section.conservative_additional_start).toISOString().split('T')[0] : null,
          conservative_additional_end: section.conservative_additional_end ?
            new Date(section.conservative_additional_end).toISOString().split('T')[0] : null
        }));

        const { error: sectionsError } = await supabase
          .from('bill_sections')
          .insert(sectionsToInsert as any);

        if (sectionsError) {
          console.error('Error saving sections:', sectionsError);
          throw sectionsError;
        }
      }

      // Save line items
      if (billData.line_items.length > 0) {
        const lineItemsToInsert = billData.line_items.map((item: any, index: number) => ({
          bill_id: bill.id,
          bill_section_id: null,
          sr_no: item.srNo || `${index + 1}`,
          item_description: item.description || '',
          cghs_nabh_code: item.code || null,
          cghs_nabh_rate: item.rate ? parseFloat(item.rate.toString()) : null,
          qty: item.qty || 1,
          amount: item.amount ? parseFloat(item.amount.toString()) : 0,
          item_type: item.type || 'standard',
          base_amount: item.type === 'surgical' && item.baseAmount ? parseFloat(item.baseAmount.toString()) : null,
          primary_adjustment: item.type === 'surgical' ? item.primaryAdjustment : null,
          secondary_adjustment: item.type === 'surgical' ? item.secondaryAdjustment : null,
          dates_info: item.dates ? JSON.stringify(item.dates) : null,
          item_order: index
        }));

        const { error: lineItemsError } = await supabase
          .from('bill_line_items')
          .insert(lineItemsToInsert as any);

        if (lineItemsError) {
          console.error('Error saving line items:', lineItemsError);
          throw lineItemsError;
        }
      }

      console.log('✅ Bill saved successfully with ID:', bill.id);
      console.log('✅ Saved total_amount:', bill.total_amount);

      return bill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['final-bill', visitId] });
    },
  });

  return {
    billData,
    isLoading,
    error,
    saveBill: saveBillMutation.mutate,
    isSaving: saveBillMutation.isPending
  };
};

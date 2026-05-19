import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Pharmacy tables are not in the generated types — untyped client.
const db = supabase as any;

export interface MedicineResult {
  id: string; // medicine_master.id
  name: string;
  generic: string;
  type: string;
  totalStock: number;
}

/**
 * Searches the pharmacy catalogue (`medicine_master`) and sums live stock from
 * `medicine_batch_inventory` (active, non-expired batches). Read-only — never
 * writes the pharmacy. Stock is summed across all batches, matching the desktop
 * `StockMedicinePicker` (the `hospital_name` column on the batch table holds
 * inconsistent values, so it is not used as a filter).
 */
export function useMedicineSearch() {
  const [searchTerm, setSearchTerm] = useState("");

  const query = useQuery({
    queryKey: ["tablet-medicine-search", searchTerm],
    queryFn: async (): Promise<MedicineResult[]> => {
      let q = db
        .from("medicine_master")
        .select("id, medicine_name, generic_name, type")
        .eq("is_deleted", false)
        .order("medicine_name")
        .limit(30);
      const t = searchTerm.trim();
      if (t) q = q.or(`medicine_name.ilike.%${t}%,generic_name.ilike.%${t}%`);

      const { data: meds, error } = await q;
      if (error) throw error;
      const rows = meds || [];
      const ids = rows.map((m: any) => m.id);

      const stock: Record<string, number> = {};
      if (ids.length) {
        const { data: batches } = await db
          .from("medicine_batch_inventory")
          .select("medicine_id, current_stock")
          .in("medicine_id", ids)
          .eq("is_active", true)
          .eq("is_expired", false)
          .gt("current_stock", 0);
        for (const b of batches || []) {
          stock[b.medicine_id] =
            (stock[b.medicine_id] || 0) + (Number(b.current_stock) || 0);
        }
      }

      return rows.map((m: any) => ({
        id: m.id,
        name: m.medicine_name || m.generic_name || "Medicine",
        generic: m.generic_name || "",
        type: m.type || "",
        totalStock: stock[m.id] || 0,
      }));
    },
  });

  return {
    medicines: query.data || [],
    isLoading: query.isLoading,
    searchTerm,
    setSearchTerm,
  };
}

/** Sum of in-stock batch quantities for a set of medicine ids. */
export async function fetchMedicineStock(
  medicineIds: string[],
): Promise<Record<string, number>> {
  const stock: Record<string, number> = {};
  if (!medicineIds.length) return stock;
  const { data: batches } = await db
    .from("medicine_batch_inventory")
    .select("medicine_id, current_stock")
    .in("medicine_id", medicineIds)
    .eq("is_active", true)
    .eq("is_expired", false)
    .gt("current_stock", 0);
  for (const b of batches || []) {
    stock[b.medicine_id] =
      (stock[b.medicine_id] || 0) + (Number(b.current_stock) || 0);
  }
  return stock;
}

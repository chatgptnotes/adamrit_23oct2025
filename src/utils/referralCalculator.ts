/**
 * Referral Policy Calculator
 *
 * Private Patients:
 * - Deductions: Consultation (100%), Lab (75%), Radiology (75%), Outsource (100%), Implants (100%), Medicine (100%)
 * - Referral: 20% of net amount
 * - Bills < 1,25,000: 20% (no cap)
 * - Bills >= 1,25,000: Max 25,000
 * - Total Payment Cap: 2,00,000
 *
 * Yojna (Scheme) Patients:
 * - Rate: 10%
 * - Minimum: 2,000
 * - Maximum: 5,000
 */

export interface BillCategory {
  category: string;
  amount: number;
}

export interface ReferralBreakdown {
  grossAmount: number;
  deductions: Record<string, number>;
  totalDeductions: number;
  netAmount: number;
  referralPercentage: number;
  calculatedAmount: number;
  finalAmount: number;
  capApplied: string;
}

// Deduction rates for Private patients
const PRIVATE_DEDUCTION_RATES: Record<string, number> = {
  'Consultation': 1.00,      // 100%
  'Laboratory': 0.75,        // 75%
  'Radiology': 0.75,         // 75%
  'Outsource': 1.00,         // 100%
  'Implants': 1.00,          // 100%
  'Medicine': 1.00,          // 100%
};

// Map bill descriptions to categories
const CATEGORY_MAPPING: Record<string, string> = {
  'consultation': 'Consultation',
  'doctor': 'Consultation',
  'pathology': 'Laboratory',
  'laboratory': 'Laboratory',
  'lab': 'Laboratory',
  'radiology': 'Radiology',
  'x-ray': 'Radiology',
  'ct scan': 'Radiology',
  'mri': 'Radiology',
  'usg': 'Radiology',
  'ultrasound': 'Radiology',
  'surgeon': 'Outsource',
  'anesthetist': 'Outsource',
  'surgery': 'Outsource',
  'implant': 'Implants',
  'medicine': 'Medicine',
  'pharmacy': 'Medicine',
  'drug': 'Medicine',
};

/**
 * Map a bill item description to a referral category
 */
export function mapDescriptionToCategory(description: string): string | null {
  const lowerDesc = description.toLowerCase();

  for (const [keyword, category] of Object.entries(CATEGORY_MAPPING)) {
    if (lowerDesc.includes(keyword)) {
      return category;
    }
  }

  return null; // No deduction category (Room, Other, etc.)
}

/**
 * Calculate referral amount based on bill categories and patient type
 * @param billItems - Array of bill line items with description/category and amount
 * @param patientType - 'Private' or 'Yojna'
 * @param fallbackGrossAmount - Fallback gross amount when bill_line_items is empty (from bills.total_amount)
 */
export function calculateReferralAmount(
  billItems: Array<{ description?: string; category?: string; amount: number }>,
  patientType: 'Private' | 'Yojna',
  fallbackGrossAmount: number = 0
): ReferralBreakdown {

  // Group amounts by category
  const categoryAmounts: Record<string, number> = {};
  let grossAmount = 0;

  billItems.forEach(item => {
    const amount = Number(item.amount) || 0;
    grossAmount += amount;

    // Determine category from item.category or item.description
    let category = item.category || mapDescriptionToCategory(item.description || '');

    if (category) {
      categoryAmounts[category] = (categoryAmounts[category] || 0) + amount;
    }
  });

  // FALLBACK: If no bill items, use fallbackGrossAmount (from bills.total_amount)
  if (grossAmount === 0 && fallbackGrossAmount > 0) {
    grossAmount = fallbackGrossAmount;
  }

  if (patientType === 'Private') {
    return calculatePrivateReferral(categoryAmounts, grossAmount);
  } else {
    return calculateYojnaReferral(grossAmount);
  }
}

/**
 * Calculate referral for Private patients with deductions
 */
function calculatePrivateReferral(
  categoryAmounts: Record<string, number>,
  grossAmount: number
): ReferralBreakdown {

  // Calculate deductions
  const deductions: Record<string, number> = {};
  let totalDeductions = 0;

  Object.entries(categoryAmounts).forEach(([category, amount]) => {
    const rate = PRIVATE_DEDUCTION_RATES[category] || 0;
    const deduction = amount * rate;
    if (deduction > 0) {
      deductions[category] = deduction;
      totalDeductions += deduction;
    }
  });

  const netAmount = grossAmount - totalDeductions;
  const referralPercentage = 20;
  const calculatedAmount = netAmount * 0.20;

  // Apply caps
  let finalAmount = calculatedAmount;
  let capApplied = 'none';

  // Bills >= 1,25,000: Max 25,000
  if (grossAmount >= 125000 && calculatedAmount > 25000) {
    finalAmount = 25000;
    capApplied = 'max_25000';
  }

  // Total payment cap: 2,00,000
  if (finalAmount > 200000) {
    finalAmount = 200000;
    capApplied = 'total_cap_200000';
  }

  return {
    grossAmount,
    deductions,
    totalDeductions,
    netAmount,
    referralPercentage,
    calculatedAmount,
    finalAmount: Math.round(finalAmount * 100) / 100,
    capApplied
  };
}

/**
 * Calculate referral for Yojna (Scheme) patients
 */
function calculateYojnaReferral(grossAmount: number): ReferralBreakdown {
  const referralPercentage = 10;
  let calculatedAmount = grossAmount * 0.10;
  let finalAmount = calculatedAmount;
  let capApplied = 'none';

  // Apply min/max
  if (calculatedAmount < 2000) {
    finalAmount = 2000;
    capApplied = 'min_2000';
  } else if (calculatedAmount > 5000) {
    finalAmount = 5000;
    capApplied = 'max_5000';
  }

  return {
    grossAmount,
    deductions: {},
    totalDeductions: 0,
    netAmount: grossAmount,
    referralPercentage,
    calculatedAmount,
    finalAmount: Math.round(finalAmount * 100) / 100,
    capApplied
  };
}

/**
 * Format amount in Indian currency format
 */
export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

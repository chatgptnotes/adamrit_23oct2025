// Revenue-share calculation for the Hope Hospital <-> NephroPlus dialysis
// partnership (Supplemental Agreement, Annexure III). Pure functions only — no
// I/O — so the split math is easy to reason about and verify.
//
// Model assumption: NephroPlus collects the Charged Price; Hope Hospital receives
// its entitlement percentage. `basis = 'margin'` rows split the entered margin
// (Pharmacy, Bloodline/Dialyzer, Procedures) rather than the gross charged price.

export type EncounterType = 'OP' | 'IP';
export type PayerType = 'private_credit' | 'govt' | 'cash';
export type RateBasis = 'charged' | 'margin';
export type AppliesTo = 'OP' | 'IP' | 'BOTH';

export interface DialysisRateRow {
  id: string;
  service_category: string;
  label: string;
  applies_to: AppliesTo;
  band_min: number | null;
  band_max: number | null;
  basis: RateBasis;
  private_pct: number | null;
  govt_pct: number | null;
  cash_pct: number | null;
  sort_order: number;
  active: boolean;
}

export interface SplitInput {
  chargedPrice: number;
  marginAmount: number | null;
  rateRow: DialysisRateRow;
  payerType: PayerType;
}

export interface SplitResult {
  base: number;            // amount the percentage is applied to
  basis: RateBasis;
  pct: number | null;      // null => NA / not shareable
  shareable: boolean;
  hopeShare: number;
  nephroplusShare: number;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Hope's % for a payer column on a rate row. NULL means NA (not shareable). */
export function pctForPayer(rateRow: DialysisRateRow, payerType: PayerType): number | null {
  switch (payerType) {
    case 'private_credit':
      return rateRow.private_pct;
    case 'govt':
      return rateRow.govt_pct;
    case 'cash':
      return rateRow.cash_pct;
    default:
      return null;
  }
}

/**
 * Find the active rate row for a service category that applies to the encounter
 * type (BOTH always matches). Returns undefined when nothing matches.
 */
export function resolveRate(
  rateConfig: readonly DialysisRateRow[],
  serviceCategory: string,
  encounterType: EncounterType
): DialysisRateRow | undefined {
  return rateConfig.find(
    (row) =>
      row.active &&
      row.service_category === serviceCategory &&
      (row.applies_to === 'BOTH' || row.applies_to === encounterType)
  );
}

/** Compute the Hope vs NephroPlus split for a single session. */
export function computeSplit({ chargedPrice, marginAmount, rateRow, payerType }: SplitInput): SplitResult {
  const base = rateRow.basis === 'margin' ? marginAmount ?? 0 : chargedPrice;
  const pct = pctForPayer(rateRow, payerType);

  if (pct === null) {
    // NA for this payer column — nothing is shared with Hope on this line.
    return { base, basis: rateRow.basis, pct: null, shareable: false, hopeShare: 0, nephroplusShare: round2(base) };
  }

  const hopeShare = round2((base * pct) / 100);
  return {
    base,
    basis: rateRow.basis,
    pct,
    shareable: true,
    hopeShare,
    nephroplusShare: round2(base - hopeShare),
  };
}

/**
 * Best-effort suggestion of the dialysis service category from a charged price,
 * using the band_min/band_max guidance on the rate rows. Only considers rows with
 * a band defined (the core dialysis-session rows); explicit categories such as
 * pharmacy/lab/procedures are picked manually by the user.
 */
export function suggestCategoryFromPrice(
  rateConfig: readonly DialysisRateRow[],
  chargedPrice: number,
  encounterType: EncounterType
): string | undefined {
  const banded = rateConfig
    .filter(
      (row) =>
        row.active &&
        (row.applies_to === 'BOTH' || row.applies_to === encounterType) &&
        (row.band_min !== null || row.band_max !== null)
    )
    .sort((a, b) => a.sort_order - b.sort_order);

  const match = banded.find((row) => {
    const aboveMin = row.band_min === null || chargedPrice >= row.band_min;
    const belowMax = row.band_max === null || chargedPrice < row.band_max;
    return aboveMin && belowMax;
  });

  return match?.service_category;
}

export const PAYER_LABELS: Record<PayerType, string> = {
  private_credit: 'Private Credit (TPA/Corporate)',
  govt: 'Govt Scheme (MJPJAY/PMJAY)',
  cash: 'Cash',
};

/** Map a visit's patient_type (OPD/IPD/Emergency) to the agreement's OP/IP axis. */
export function encounterFromPatientType(patientType: string | null | undefined): EncounterType {
  const normalized = (patientType ?? '').trim().toUpperCase();
  return normalized === 'OPD' ? 'OP' : 'IP';
}

/**
 * Best-effort guess of payer column from a visit/patient `corporate` value.
 * Government schemes are intentionally NOT produced here — the NephroPlus payable
 * view tracks only Cash vs Private credit. An empty/"private"/"cash"/"general"
 * value -> 'cash'; anything else (a corporate/TPA/scheme name) -> 'private_credit'.
 * The user can always override in the form.
 */
export function payerFromCorporate(corporate: string | null | undefined): PayerType {
  const value = (corporate ?? '').trim().toLowerCase();
  if (!value || value === 'private' || value === 'cash' || value === 'general') return 'cash';
  return 'private_credit';
}

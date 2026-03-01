// Tally Auto-Push Service
// Fire-and-forget push of bills/payments/pharmacy sales to Tally
// Skips silently if Tally is not configured

import { supabase } from "@/integrations/supabase/client";

// Check if Tally integration is configured and active
async function isTallyActive(): Promise<{ active: boolean; serverUrl: string; companyName: string }> {
  try {
    const { data } = await supabase
      .from("tally_config")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .single();
    if (!data) return { active: false, serverUrl: "", companyName: "" };
    return { active: true, serverUrl: data.server_url, companyName: data.company_name };
  } catch {
    return { active: false, serverUrl: "", companyName: "" };
  }
}

// Get ledger mapping from tally_ledger_mapping table or fall back to defaults
async function getLedgerMapping() {
  try {
    const { data: mappings } = await supabase
      .from("tally_ledger_mapping")
      .select("*")
      .eq("is_active", true);

    if (mappings && mappings.length > 0) {
      const paymentModes: Record<string, string> = {};
      let defaultIncomeLedger = "Hospital Income";
      let pharmacySalesLedger = "Pharmacy Sales";

      for (const m of mappings) {
        if (m.adamrit_entity_type === "payment_mode") {
          paymentModes[m.adamrit_entity_name] = m.tally_ledger_name;
        } else if (m.adamrit_entity_type === "service_category" && m.adamrit_entity_name === "Hospital Income") {
          defaultIncomeLedger = m.tally_ledger_name;
        } else if (m.adamrit_entity_type === "pharmacy" && m.adamrit_entity_name === "Pharmacy Sales") {
          pharmacySalesLedger = m.tally_ledger_name;
        }
      }

      return { defaultIncomeLedger, pharmacySalesLedger, paymentModes };
    }
  } catch {
    // Table may not exist yet, fall through to defaults
  }

  // Fallback: check tally_config metadata
  try {
    const { data } = await supabase
      .from("tally_config")
      .select("metadata")
      .eq("is_active", true)
      .limit(1)
      .single();
    if (data?.metadata?.ledgerMapping) return data.metadata.ledgerMapping;
  } catch {
    // ignore
  }

  return {
    defaultIncomeLedger: "Hospital Income",
    pharmacySalesLedger: "Pharmacy Sales",
    paymentModes: {
      Cash: "Cash",
      CASH: "Cash",
      Card: "HDFC Bank",
      CARD: "HDFC Bank",
      UPI: "HDFC Bank",
      "Bank Transfer": "HDFC Bank",
      NEFT: "HDFC Bank",
      RTGS: "HDFC Bank",
      ONLINE: "HDFC Bank",
      DD: "HDFC Bank",
      CHEQUE: "HDFC Bank",
      Insurance: "Insurance Receivables",
      CREDIT: "Credit",
      ESIC: "ESIC Receivables",
      CGHS: "CGHS Receivables",
    },
  };
}

async function logPush(syncType: string, success: boolean, errors?: any, ref?: string) {
  try {
    await supabase.from("tally_sync_log").insert({
      sync_type: syncType,
      direction: "outward",
      status: success ? "completed" : "failed",
      records_synced: success ? 1 : 0,
      records_failed: success ? 0 : 1,
      error_details: errors ? { errors, ref } : null,
      completed_at: new Date().toISOString(),
    });
  } catch {
    // Logging failure should not propagate
  }
}

// Push a bill to Tally as Sales Voucher
export async function pushBillToTally(bill: {
  billNumber: string;
  patientName: string;
  date: string;
  totalAmount: number;
  items: { description: string; amount: number; ledgerName?: string }[];
}) {
  const config = await isTallyActive();
  if (!config.active) return;

  const mapping = await getLedgerMapping();
  const tallyItems = bill.items.map((item) => ({
    ledgerName: item.ledgerName || mapping.defaultIncomeLedger || "Hospital Income",
    amount: item.amount,
  }));

  try {
    const response = await fetch("/api/tally-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: "push",
        action: "create-sales-voucher",
        serverUrl: config.serverUrl,
        companyName: config.companyName,
        data: {
          billNumber: bill.billNumber,
          patientName: bill.patientName,
          date: bill.date,
          totalAmount: bill.totalAmount,
          items: tallyItems,
        },
      }),
    });
    const result = await response.json();
    await logPush("auto_push_bill", !!result.success, result.errors, bill.billNumber);
    return result;
  } catch (err) {
    console.error("Tally auto-push bill failed:", err);
    await logPush("auto_push_bill", false, String(err), bill.billNumber);
  }
}

// Push a payment/advance receipt to Tally
export async function pushPaymentToTally(payment: {
  receiptNumber: string;
  patientName: string;
  date: string;
  amount: number;
  paymentMode: string;
}) {
  const config = await isTallyActive();
  if (!config.active) return;

  const mapping = await getLedgerMapping();
  const bankLedger =
    mapping.paymentModes?.[payment.paymentMode] ||
    (payment.paymentMode === "Cash" || payment.paymentMode === "CASH" ? "Cash" : "Bank Account");

  try {
    const response = await fetch("/api/tally-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: "push",
        action: "create-receipt-voucher",
        serverUrl: config.serverUrl,
        companyName: config.companyName,
        data: {
          receiptNumber: payment.receiptNumber,
          patientName: payment.patientName,
          date: payment.date,
          amount: payment.amount,
          paymentMode: payment.paymentMode,
          bankLedger,
        },
      }),
    });
    const result = await response.json();
    await logPush("auto_push_payment", !!result.success, result.errors, payment.receiptNumber);
    return result;
  } catch (err) {
    console.error("Tally payment push failed:", err);
    await logPush("auto_push_payment", false, String(err), payment.receiptNumber);
  }
}

// Push ESIC bill to Tally — uses ESIC-specific ledger mapping
export async function pushESICBillToTally(bill: {
  billNumber: string;
  patientName: string;
  date: string;
  totalAmount: number;
  esicNumber?: string;
  serviceType?: string; // Consultation, IPD, OPD, Surgery, Lab, Pharmacy
  items: { description: string; amount: number }[];
}) {
  const config = await isTallyActive();
  if (!config.active) return;

  // Get ESIC-specific ledger mapping
  let esicReceivablesLedger = "ESIC Receivables";
  let esicIncomeLedger = "ESIC Income - IPD";

  try {
    const { data: mappings } = await supabase
      .from("tally_ledger_mapping")
      .select("*")
      .eq("is_active", true)
      .in("adamrit_entity_type", ["insurance", "esic_income"]);

    if (mappings) {
      const esicMapping = mappings.find(
        (m) => m.adamrit_entity_type === "insurance" && m.adamrit_entity_name === "ESIC"
      );
      if (esicMapping) esicReceivablesLedger = esicMapping.tally_ledger_name;

      const serviceKey = `ESIC ${bill.serviceType || "IPD"}`;
      const incomeMapping = mappings.find(
        (m) => m.adamrit_entity_type === "esic_income" && m.adamrit_entity_name === serviceKey
      );
      if (incomeMapping) esicIncomeLedger = incomeMapping.tally_ledger_name;
    }
  } catch {
    // Use defaults
  }

  const narration = `ESIC Bill #${bill.billNumber}${bill.esicNumber ? ` | ESIC# ${bill.esicNumber}` : ""} - ${bill.patientName}`;

  try {
    const response = await fetch("/api/tally-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: "push",
        action: "create-voucher",
        serverUrl: config.serverUrl,
        companyName: config.companyName,
        data: {
          voucherType: "Sales",
          date: bill.date,
          narration,
          partyLedger: esicReceivablesLedger,
          ledgerEntries: [
            { ledgerName: esicReceivablesLedger, amount: bill.totalAmount, isDeemedPositive: true },
            ...bill.items.map((item) => ({
              ledgerName: esicIncomeLedger,
              amount: item.amount,
              isDeemedPositive: false,
            })),
          ],
        },
      }),
    });
    const result = await response.json();
    await logPush("auto_push_esic_bill", !!result.success, result.errors, bill.billNumber);
    return result;
  } catch (err) {
    console.error("Tally ESIC push failed:", err);
    await logPush("auto_push_esic_bill", false, String(err), bill.billNumber);
  }
}

// Push Insurance/TPA claim bill to Tally
export async function pushInsuranceBillToTally(bill: {
  billNumber: string;
  patientName: string;
  date: string;
  totalAmount: number;
  claimAmount: number;
  patientShare: number;
  insuranceCompany: string; // e.g. "Star Health", "ICICI Lombard"
  tpaName?: string;
  policyNumber?: string;
  items: { description: string; amount: number }[];
}) {
  const config = await isTallyActive();
  if (!config.active) return;

  // Resolve insurance receivables ledger
  let insuranceLedger = `${bill.insuranceCompany} Insurance Receivables`;
  const incomeLedger = "Hospital Income";

  try {
    const { data: mappings } = await supabase
      .from("tally_ledger_mapping")
      .select("*")
      .eq("adamrit_entity_type", "insurance")
      .eq("adamrit_entity_name", bill.insuranceCompany)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (mappings) insuranceLedger = mappings.tally_ledger_name;
  } catch {
    // Use default
  }

  const mapping = await getLedgerMapping();
  const narration = `Insurance Bill #${bill.billNumber} | ${bill.insuranceCompany}${bill.policyNumber ? ` | Policy# ${bill.policyNumber}` : ""} - ${bill.patientName}`;

  // Double-entry: Insurance company owes claimAmount, patient owes patientShare
  const ledgerEntries: { ledgerName: string; amount: number; isDeemedPositive: boolean }[] = [];

  // Debit: Insurance receivables for claim amount
  if (bill.claimAmount > 0) {
    ledgerEntries.push({ ledgerName: insuranceLedger, amount: bill.claimAmount, isDeemedPositive: true });
  }
  // Debit: Patient for their share (if any)
  if (bill.patientShare > 0) {
    ledgerEntries.push({ ledgerName: bill.patientName, amount: bill.patientShare, isDeemedPositive: true });
  }
  // Credit: Income ledgers
  for (const item of bill.items) {
    ledgerEntries.push({
      ledgerName: item.description || mapping.defaultIncomeLedger || incomeLedger,
      amount: item.amount,
      isDeemedPositive: false,
    });
  }

  try {
    const response = await fetch("/api/tally-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: "push",
        action: "create-voucher",
        serverUrl: config.serverUrl,
        companyName: config.companyName,
        data: {
          voucherType: "Sales",
          date: bill.date,
          narration,
          partyLedger: insuranceLedger,
          ledgerEntries,
        },
      }),
    });
    const result = await response.json();
    await logPush("auto_push_insurance_bill", !!result.success, result.errors, bill.billNumber);
    return result;
  } catch (err) {
    console.error("Tally insurance push failed:", err);
    await logPush("auto_push_insurance_bill", false, String(err), bill.billNumber);
  }
}

// Push insurance payment received (settlement from TPA/insurance company)
export async function pushInsurancePaymentToTally(payment: {
  receiptNumber: string;
  insuranceCompany: string;
  date: string;
  amount: number;
  tdsAmount?: number;
  disallowanceAmount?: number;
  bankAccount?: string;
  utrNumber?: string;
}) {
  const config = await isTallyActive();
  if (!config.active) return;

  let insuranceLedger = `${payment.insuranceCompany} Insurance Receivables`;

  try {
    const { data: mappings } = await supabase
      .from("tally_ledger_mapping")
      .select("*")
      .eq("adamrit_entity_type", "insurance")
      .eq("adamrit_entity_name", payment.insuranceCompany)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (mappings) insuranceLedger = mappings.tally_ledger_name;
  } catch {
    // Use default
  }

  const bankLedger = payment.bankAccount || "HDFC Bank";
  const narration = `Insurance Settlement #${payment.receiptNumber} from ${payment.insuranceCompany}${payment.utrNumber ? ` | UTR: ${payment.utrNumber}` : ""}`;

  const ledgerEntries: { ledgerName: string; amount: number; isDeemedPositive: boolean }[] = [
    // Debit: Bank (money received)
    { ledgerName: bankLedger, amount: payment.amount, isDeemedPositive: true },
    // Credit: Insurance receivables (debt reduced)
    { ledgerName: insuranceLedger, amount: payment.amount, isDeemedPositive: false },
  ];

  // If there's a TDS deduction
  if (payment.tdsAmount && payment.tdsAmount > 0) {
    ledgerEntries.push({ ledgerName: "TDS Receivable", amount: payment.tdsAmount, isDeemedPositive: true });
    // Increase credit to insurance receivables for the TDS portion
    ledgerEntries[1].amount += payment.tdsAmount;
  }

  // If there's a disallowance
  if (payment.disallowanceAmount && payment.disallowanceAmount > 0) {
    ledgerEntries.push({ ledgerName: "Insurance Disallowance", amount: payment.disallowanceAmount, isDeemedPositive: true });
    ledgerEntries[1].amount += payment.disallowanceAmount;
  }

  try {
    const response = await fetch("/api/tally-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: "push",
        action: "create-voucher",
        serverUrl: config.serverUrl,
        companyName: config.companyName,
        data: {
          voucherType: "Receipt",
          date: payment.date,
          narration,
          partyLedger: insuranceLedger,
          ledgerEntries,
        },
      }),
    });
    const result = await response.json();
    await logPush("auto_push_insurance_payment", !!result.success, result.errors, payment.receiptNumber);
    return result;
  } catch (err) {
    console.error("Tally insurance payment push failed:", err);
    await logPush("auto_push_insurance_payment", false, String(err), payment.receiptNumber);
  }
}

// Push pharmacy sale (direct sale or prescription sale) to Tally as Sales Voucher
export async function pushPharmacySaleToTally(sale: {
  invoiceNumber: string;
  patientName: string;
  date: string;
  totalAmount: number;
  items: { medicineName: string; quantity: number; amount: number }[];
}) {
  const config = await isTallyActive();
  if (!config.active) return;

  const mapping = await getLedgerMapping();

  try {
    const response = await fetch("/api/tally-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: "push",
        action: "create-sales-voucher",
        serverUrl: config.serverUrl,
        companyName: config.companyName,
        data: {
          billNumber: sale.invoiceNumber,
          patientName: sale.patientName,
          date: sale.date,
          totalAmount: sale.totalAmount,
          items: sale.items.map((item) => ({
            ledgerName: mapping.pharmacySalesLedger || "Pharmacy Sales",
            amount: item.amount,
          })),
        },
      }),
    });
    const result = await response.json();
    await logPush("auto_push_pharmacy", !!result.success, result.errors, sale.invoiceNumber);
    return result;
  } catch (err) {
    console.error("Tally pharmacy push failed:", err);
    await logPush("auto_push_pharmacy", false, String(err), sale.invoiceNumber);
  }
}

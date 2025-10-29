import React, { useState, useMemo } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { useCashBookEntries, useCashBookUsers, useCashBookVoucherTypes, useAllDailyTransactions, DailyTransaction } from '@/hooks/useCashBookQueries';
import PatientTransactionModal from '@/components/PatientTransactionModal';

const CashBook: React.FC = () => {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [searchNarration, setSearchNarration] = useState('');
  const [searchAmount, setSearchAmount] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('');
  const [hideNarration, setHideNarration] = useState(false);

  // Modal state for patient transaction details
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{
    patientId?: string;
    visitId?: string;
    patientName?: string;
  } | null>(null);

  // Fetch ALL daily transactions from all billing tables
  const { data: dailyTransactions, isLoading, error } = useAllDailyTransactions({
    from_date: fromDate,
    to_date: toDate,
    voucher_type: selectedType || undefined,
    search_narration: searchNarration || undefined,
    payment_mode: selectedPaymentMode || undefined
  });

  // Fetch old voucher data for Opening Balance only
  const { data: cashBookData } = useCashBookEntries({
    from_date: fromDate,
    to_date: toDate
  });

  // Fetch users and voucher types for dropdowns
  const { data: users = [] } = useCashBookUsers();
  const { data: voucherTypes = [] } = useCashBookVoucherTypes();

  // Handler to open patient transaction modal
  const handlePatientClick = (patientId?: string, visitId?: string, patientName?: string) => {
    setSelectedPatient({ patientId, visitId, patientName });
    setIsModalOpen(true);
  };

  // Prepare entries with opening balance and grouped by patient
  const displayEntries = useMemo(() => {
    const entries = [];

    // Add opening balance row
    if (cashBookData?.openingBalance) {
      entries.push({
        type: 'opening-balance' as const,
        date: fromDate,
        particulars: 'Opening Balance',
        debit: cashBookData.openingBalance.opening_balance_type === 'DR'
          ? cashBookData.openingBalance.opening_balance
          : 0,
        credit: cashBookData.openingBalance.opening_balance_type === 'CR'
          ? cashBookData.openingBalance.opening_balance
          : 0,
        patientId: undefined,
        visitId: undefined,
        patientName: undefined,
      });
    }

    // Group transactions by patient
    if (dailyTransactions && dailyTransactions.length > 0) {
      const patientGroups = new Map<string, {
        patientId: string | null;
        patientName: string;
        visitId: string | null;
        transactions: DailyTransaction[];
        paymentModes: Map<string, number>;
        totalAmount: number;
        firstDate: string;
      }>();

      // Group transactions by patient
      dailyTransactions.forEach((txn: DailyTransaction) => {
        const patientKey = txn.patient_id || txn.patient_name || 'Unknown';

        if (!patientGroups.has(patientKey)) {
          patientGroups.set(patientKey, {
            patientId: txn.patient_id,
            patientName: txn.patient_name || 'Unknown Patient',
            visitId: txn.visit_id,
            transactions: [],
            paymentModes: new Map(),
            totalAmount: 0,
            firstDate: txn.transaction_date
          });
        }

        const group = patientGroups.get(patientKey)!;
        group.transactions.push(txn);

        // Aggregate by payment mode
        const currentModeAmount = group.paymentModes.get(txn.payment_mode) || 0;
        group.paymentModes.set(txn.payment_mode, currentModeAmount + txn.amount);

        group.totalAmount += txn.amount;
      });

      // Create patient summary entries
      patientGroups.forEach((group) => {
        // Format first transaction date
        const date = new Date(group.firstDate);
        const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

        // Build payment mode breakdown string
        const paymentBreakdown = Array.from(group.paymentModes.entries())
          .map(([mode, amount]) => `${mode}: Rs ${amount.toLocaleString('en-IN')}`)
          .join(', ');

        // Build summary line
        const summary = `${group.transactions.length} transaction${group.transactions.length > 1 ? 's' : ''} | ${paymentBreakdown}`;

        entries.push({
          type: 'patient-summary' as const,
          date: formattedDate,
          particulars: group.patientName,
          summary: summary,
          debit: group.totalAmount,
          credit: 0,
          patientId: group.patientId,
          visitId: group.visitId,
          patientName: group.patientName,
          transactionCount: group.transactions.length,
        });
      });
    }

    return entries;
  }, [dailyTransactions, cashBookData, fromDate]);

  // Calculate totals for footer
  const totals = useMemo(() => {
    const totalDebit = displayEntries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
    const totalCredit = displayEntries.reduce((sum, entry) => sum + (entry.credit || 0), 0);
    const closingBalance = totalDebit - totalCredit;

    return {
      totalDebit,
      totalCredit,
      closingBalance
    };
  }, [displayEntries]);

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '';
    return `Rs ${amount.toLocaleString('en-IN')}`;
  };

  const formatCurrencyTotal = (amount: number) => {
    return `Rs ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDateForInput = (dateStr: string) => {
    // Convert YYYY-MM-DD to DD/MM/YYYY for display
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Control Bar */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 flex justify-between items-center">
        <h1 className="text-white text-xl font-bold">Cash Book</h1>
        <div className="flex space-x-2">
          <button className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-1.5 rounded text-sm font-medium">
            Export To Excel
          </button>
          <button className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-1.5 rounded text-sm font-medium">
            Print
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-gray-200 px-4 py-3 border-b border-gray-300">
        <div className="flex items-center space-x-2">
          {/* Date Picker - From */}
          <div className="flex items-center bg-white border border-gray-300 rounded px-2 py-1">
            <Calendar className="h-4 w-4 text-gray-500 mr-1" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-32 outline-none text-sm"
            />
          </div>

          {/* Date Picker - To */}
          <div className="flex items-center bg-white border border-gray-300 rounded px-2 py-1">
            <Calendar className="h-4 w-4 text-gray-500 mr-1" />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-32 outline-none text-sm"
            />
          </div>

          {/* Search by Narration */}
          <input
            type="text"
            value={searchNarration}
            onChange={(e) => setSearchNarration(e.target.value)}
            placeholder="Search by Narration"
            className="px-3 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-blue-500 w-48"
          />

          {/* Search by Amount */}
          <input
            type="text"
            value={searchAmount}
            onChange={(e) => setSearchAmount(e.target.value)}
            placeholder="Search by Amount"
            className="px-3 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-blue-500 w-40"
          />

          {/* Select Type */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-blue-500 bg-white"
          >
            <option value="">All Types</option>
            {voucherTypes.map((type: any) => (
              <option key={type.id} value={type.voucher_category}>
                {type.voucher_type_name}
              </option>
            ))}
          </select>

          {/* Select User */}
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-blue-500 bg-white"
          >
            <option value="">All Users</option>
            {users.map((user: any) => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.email}
              </option>
            ))}
          </select>

          {/* Select Payment Mode */}
          <select
            value={selectedPaymentMode}
            onChange={(e) => setSelectedPaymentMode(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-blue-500 bg-white"
          >
            <option value="">All Payment Modes</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
            <option value="CREDIT">Credit Card</option>
            <option value="DEBIT">Debit Card</option>
            <option value="CHEQUE">Cheque</option>
            <option value="ONLINE">Online Transfer</option>
            <option value="NEFT">NEFT</option>
            <option value="RTGS">RTGS</option>
            <option value="DD">Demand Draft</option>
          </select>

          {/* Hide Narration */}
          <button
            onClick={() => setHideNarration(!hideNarration)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-1.5 rounded text-sm font-medium"
          >
            {hideNarration ? 'Show' : 'Hide'} Narration
          </button>
        </div>
      </div>

      {/* Date Range Display */}
      <div className="text-right px-4 py-2 text-sm font-medium text-gray-700 bg-white">
        {formatDateForInput(fromDate)} To {formatDateForInput(toDate)}
      </div>

      {/* Cash Book Table */}
      <div className="flex-1 overflow-auto px-4 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading cash book entries...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center max-w-md">
              <p className="text-red-600 font-medium text-lg mb-2">Error loading cash book</p>
              <p className="text-gray-600 text-sm mb-4">{error.message}</p>
              <div className="bg-blue-50 border border-blue-200 rounded p-4 text-left">
                <p className="text-sm font-medium text-blue-900 mb-2">Troubleshooting:</p>
                <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                  <li>Ensure 'Cash in Hand' account exists in chart_of_accounts table</li>
                  <li>Check if accounting migrations have been run</li>
                  <li>Verify database connection is working</li>
                </ul>
              </div>
            </div>
          </div>
        ) : displayEntries.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600">No transactions found for the selected date range</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-blue-100 z-10">
              <tr>
                <th className="text-left py-2 px-3 font-semibold text-blue-700 border-b-2 border-gray-300 text-sm w-32">
                  Date
                </th>
                <th className="text-left py-2 px-3 font-semibold text-blue-700 border-b-2 border-gray-300 text-sm">
                  Particulars
                </th>
                <th className="text-right py-2 px-3 font-semibold text-blue-700 border-b-2 border-gray-300 text-sm w-40">
                  Debit
                </th>
                <th className="text-right py-2 px-3 font-semibold text-blue-700 border-b-2 border-gray-300 text-sm w-40">
                  Credit
                </th>
              </tr>
            </thead>
            <tbody>
              {displayEntries.map((entry, index) => {
                if (entry.type === 'opening-balance') {
                  return (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 px-3 align-top text-sm">{entry.date}</td>
                      <td className="py-2 px-3 align-top text-sm">
                        <div className="font-medium">{entry.particulars}</div>
                      </td>
                      <td className="py-2 px-3 text-right align-top text-sm font-medium">
                        {formatCurrency(entry.debit)}
                      </td>
                      <td className="py-2 px-3 text-right align-top text-sm font-medium">
                        {formatCurrency(entry.credit)}
                      </td>
                    </tr>
                  );
                }

                if (entry.type === 'patient-summary') {
                  return (
                    <React.Fragment key={index}>
                      <tr className="border-b border-gray-200 hover:bg-blue-50">
                        <td className="py-2 px-3 align-top text-sm">{entry.date}</td>
                        <td className="py-2 px-3 align-top text-sm" colSpan={3}>
                          <div
                            className="font-bold text-blue-600 hover:text-blue-800 cursor-pointer hover:underline text-base"
                            onClick={() => {
                              handlePatientClick(entry.patientId, entry.visitId, entry.patientName);
                            }}
                          >
                            Patient: {entry.particulars}
                          </div>
                          <div className="text-xs text-gray-600 mt-1 ml-4">
                            └─ {entry.summary} | Total: {formatCurrency(entry.debit)}
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                }

                return null;
              })}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-400">
              <tr>
                <td className="py-3 px-3 text-sm font-bold" colSpan={2}>
                  Total:
                </td>
                <td className="py-3 px-3 text-right text-sm font-bold text-blue-900">
                  {formatCurrencyTotal(totals.totalDebit)}
                </td>
                <td className="py-3 px-3 text-right text-sm font-bold text-blue-900">
                  {formatCurrencyTotal(totals.totalCredit)}
                </td>
              </tr>
              <tr className="bg-red-50">
                <td className="py-3 px-3 text-sm font-bold text-red-700" colSpan={2}>
                  Closing Balance:
                </td>
                <td className="py-3 px-3 text-right text-sm font-bold text-red-700" colSpan={2}>
                  {formatCurrencyTotal(Math.abs(totals.closingBalance))}
                  <span className="ml-2 text-xs">
                    {totals.closingBalance >= 0 ? '(DR)' : '(CR)'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Patient Transaction Details Modal */}
      <PatientTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patientId={selectedPatient?.patientId}
        visitId={selectedPatient?.visitId}
        patientName={selectedPatient?.patientName}
        filterDate={today}
      />
    </div>
  );
};

export default CashBook;

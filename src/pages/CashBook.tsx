import React, { useState, useMemo } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { useCashBookEntries, useCashBookUsers, useCashBookVoucherTypes } from '@/hooks/useCashBookQueries';

const CashBook: React.FC = () => {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [searchNarration, setSearchNarration] = useState('');
  const [searchAmount, setSearchAmount] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [hideNarration, setHideNarration] = useState(false);

  // Fetch cash book data from database
  const { data: cashBookData, isLoading, error } = useCashBookEntries({
    from_date: fromDate,
    to_date: toDate,
    voucher_type: selectedType || undefined,
    created_by: selectedUser || undefined,
    search_narration: searchNarration || undefined
  });

  // Fetch users and voucher types for dropdowns
  const { data: users = [] } = useCashBookUsers();
  const { data: voucherTypes = [] } = useCashBookVoucherTypes();

  // Prepare entries with opening balance
  const displayEntries = useMemo(() => {
    if (!cashBookData) return [];

    const entries = [];

    // Add opening balance row
    if (cashBookData.openingBalance) {
      entries.push({
        date: fromDate,
        time: undefined,
        particulars: 'Opening Balance',
        enteredBy: undefined,
        narration: undefined,
        voucherType: '',
        voucherNo: '',
        debit: cashBookData.openingBalance.opening_balance_type === 'DR'
          ? cashBookData.openingBalance.opening_balance
          : 0,
        credit: cashBookData.openingBalance.opening_balance_type === 'CR'
          ? cashBookData.openingBalance.opening_balance
          : 0,
      });
    }

    // Add transaction entries
    cashBookData.entries.forEach(entry => {
      // Format date to DD/MM/YYYY
      const date = new Date(entry.voucher_date);
      const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

      entries.push({
        date: formattedDate,
        time: entry.time_only,
        particulars: entry.particulars,
        enteredBy: entry.entered_by,
        narration: entry.entry_narration || entry.voucher_narration,
        voucherType: entry.voucher_type,
        voucherNo: entry.voucher_number,
        debit: entry.debit_amount,
        credit: entry.credit_amount,
      });
    });

    return entries;
  }, [cashBookData, fromDate]);

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '';
    return `Rs ${amount.toLocaleString('en-IN')}`;
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
                <th className="text-left py-2 px-3 font-semibold text-blue-700 border-b-2 border-gray-300 text-sm">
                  Date
                </th>
                <th className="text-left py-2 px-3 font-semibold text-blue-700 border-b-2 border-gray-300 text-sm">
                  Particulars
                </th>
                <th className="text-center py-2 px-3 font-semibold text-blue-700 border-b-2 border-gray-300 text-sm">
                  Voucher Type
                </th>
                <th className="text-center py-2 px-3 font-semibold text-blue-700 border-b-2 border-gray-300 text-sm">
                  Voucher No.
                </th>
                <th className="text-right py-2 px-3 font-semibold text-blue-700 border-b-2 border-gray-300 text-sm">
                  Debit
                </th>
                <th className="text-right py-2 px-3 font-semibold text-blue-700 border-b-2 border-gray-300 text-sm">
                  Credit
                </th>
              </tr>
            </thead>
            <tbody>
              {displayEntries.map((entry, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-2 px-3 align-top text-sm">
                    <div>{entry.date}</div>
                    {entry.time && (
                      <div className="text-xs text-gray-600">{entry.time}</div>
                    )}
                  </td>
                  <td className="py-2 px-3 align-top text-sm">
                    <div className="font-medium">{entry.particulars}</div>
                    {entry.enteredBy && (
                      <div className="text-xs italic text-gray-600 mt-1">
                        Entered By : {entry.enteredBy}
                      </div>
                    )}
                    {entry.narration && !hideNarration && (
                      <div className="text-xs italic text-gray-600 mt-1">
                        Narration : {entry.narration}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center align-top text-sm">
                    {entry.voucherType}
                  </td>
                  <td className="py-2 px-3 text-center align-top text-sm">
                    {entry.voucherNo}
                  </td>
                  <td className="py-2 px-3 text-right align-top text-sm font-medium">
                    {formatCurrency(entry.debit)}
                  </td>
                  <td className="py-2 px-3 text-right align-top text-sm font-medium">
                    {formatCurrency(entry.credit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CashBook;

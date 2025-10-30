import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Printer, Edit2, Trash2 } from 'lucide-react';

const LedgerStatement: React.FC = () => {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  const navigate = useNavigate();

  const [mrnNo, setMrnNo] = useState('');
  const [accountName, setAccountName] = useState('');
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [searchNarration, setSearchNarration] = useState('');
  const [searchAmount, setSearchAmount] = useState('');
  const [hideNarration, setHideNarration] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState('Ledger Statement');

  // Menu items for the left sidebar
  const sidebarMenuItems = [
    { label: 'Ledger Statement', bgColor: 'bg-gray-400' },
    { label: 'Cash Book', bgColor: 'bg-gray-300' },
    { label: 'Day Book', bgColor: 'bg-gray-300' },
  ];

  const handleMenuClick = (menuLabel: string) => {
    setActiveMenuItem(menuLabel);

    // Navigate based on menu item
    switch (menuLabel) {
      case 'Cash Book':
        navigate('/cash-book');
        break;
      case 'Ledger Statement':
        // Already on this page
        break;
      case 'Day Book':
        console.log('Day Book - To be implemented');
        break;
      default:
        break;
    }
  };

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log('Search clicked');
  };

  // Sample ledger data (replace with API data later)
  const sampleLedgerData = [
    {
      date: '30/10/2025',
      patientName: 'KP Kori',
      narration: 'Being online received towards from pt. KP Kori against R. No.:',
      voucherType: 'Receipt',
      voucherNo: '20223',
      debit: 9000,
      credit: 0
    },
    {
      date: '30/10/2025',
      patientName: 'Shama Kori',
      narration: 'Being online received towards investigation from pt. Shama Kori against R. No.:',
      voucherType: 'Receipt',
      voucherNo: '20227',
      debit: 8000,
      credit: 0
    },
    {
      date: '30/10/2025',
      patientName: 'SAROJ PATEL',
      narration: 'Being online received towards ipd advance from pt. SAROJ PATEL against R. No.:',
      voucherType: 'Receipt',
      voucherNo: '20237',
      debit: 10000,
      credit: 0
    },
    {
      date: '30/10/2025',
      patientName: 'GANESH SALAME',
      narration: 'Being online received towards ipd advance from pt. GANESH SALAME against R. No.:',
      voucherType: 'Receipt',
      voucherNo: '20239',
      debit: 20000,
      credit: 0
    }
  ];

  // Calculate totals for balance summary
  const totalDebit = sampleLedgerData.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = sampleLedgerData.reduce((sum, entry) => sum + entry.credit, 0);
  const openingBalance = 30716435.98; // Sample opening balance (replace with actual data)
  const closingBalance = openingBalance + totalDebit - totalCredit;

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '';
    return `Rs ${amount.toLocaleString('en-IN')}`;
  };

  const formatDateForDisplay = (dateStr: string) => {
    return dateStr;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top Control Bar */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 flex justify-between items-center">
        <h1 className="text-white text-xl font-bold">Ledger Vouchers</h1>
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
      <div className="bg-gray-500 px-4 py-3 border-b border-gray-400">
        <div className="flex items-center space-x-3">
          {/* MRN# Input */}
          <div className="flex items-center">
            <label className="text-white font-semibold text-sm mr-2">MRN#</label>
            <input
              type="text"
              value={mrnNo}
              onChange={(e) => setMrnNo(e.target.value)}
              placeholder="Enter Patient MRN No."
              className="px-3 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-blue-500 w-48"
            />
          </div>

          {/* Account Dropdown */}
          <div className="flex items-center">
            <label className="text-white font-semibold text-sm mr-2">Account</label>
            <select
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-blue-500 w-48 bg-white"
            >
              <option value="">All Accounts</option>
              <option value="SARASWAT_BANK">SARASWAT BANK</option>
              <option value="STATE_BANK_DRM">STATE BANK OF INDIA ( DRM )</option>
            </select>
          </div>

          {/* From Date Picker */}
          <div className="flex items-center bg-white border border-gray-300 rounded px-2 py-1">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-32 outline-none text-sm"
            />
            <Calendar className="h-4 w-4 text-gray-500 ml-1" />
          </div>

          {/* To Date Picker */}
          <div className="flex items-center bg-white border border-gray-300 rounded px-2 py-1">
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-32 outline-none text-sm"
            />
            <Calendar className="h-4 w-4 text-gray-500 ml-1" />
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

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-1.5 rounded text-sm font-medium"
          >
            Search
          </button>

          {/* Hide Narration Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hideNarration"
              checked={hideNarration}
              onChange={(e) => setHideNarration(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="hideNarration" className="text-white text-sm font-medium">
              Hide Narration
            </label>
          </div>
        </div>
      </div>

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Menu */}
        <div className="w-60 bg-gray-200 border-r border-gray-300 overflow-y-auto">
          <div className="py-2">
            {sidebarMenuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleMenuClick(item.label)}
                className={`w-full text-left px-4 py-2 text-sm font-medium border-b border-gray-400 hover:bg-gray-400 transition-colors ${
                  item.label === activeMenuItem ? item.bgColor : 'bg-gray-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6 bg-white">
          {accountName ? (
            <div>
              {/* Ledger Header */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-yellow-400">
                <h2 className="text-xl font-bold">
                  Ledger : {accountName === 'SARASWAT_BANK' ? 'SARASWAT BANK' : accountName === 'STATE_BANK_DRM' ? 'STATE BANK OF INDIA ( DRM )' : accountName}
                </h2>
                <p className="text-sm font-medium text-gray-700">
                  {formatDateForDisplay(fromDate)} To {formatDateForDisplay(toDate)}
                </p>
              </div>

              {/* Ledger Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="text-left py-2 px-3 font-semibold text-blue-700 border border-gray-300 text-sm">
                        Date
                      </th>
                      <th className="text-left py-2 px-3 font-semibold text-blue-700 border border-gray-300 text-sm">
                        Particulars
                      </th>
                      <th className="text-left py-2 px-3 font-semibold text-blue-700 border border-gray-300 text-sm">
                        Voucher Type
                      </th>
                      <th className="text-left py-2 px-3 font-semibold text-blue-700 border border-gray-300 text-sm">
                        Voucher No.
                      </th>
                      <th className="text-right py-2 px-3 font-semibold text-blue-700 border border-gray-300 text-sm">
                        Debit
                      </th>
                      <th className="text-right py-2 px-3 font-semibold text-blue-700 border border-gray-300 text-sm">
                        Credit
                      </th>
                      <th className="text-center py-2 px-3 font-semibold text-blue-700 border border-gray-300 text-sm">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleLedgerData.map((entry, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-2 px-3 border border-gray-300 text-sm align-top">
                          {entry.date}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 text-sm align-top">
                          <div className="font-medium">{entry.patientName}</div>
                          <div className="text-xs text-gray-600 italic mt-1">
                            Narration : {entry.narration}
                          </div>
                        </td>
                        <td className="py-2 px-3 border border-gray-300 text-sm align-top">
                          {entry.voucherType}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 text-sm align-top">
                          {entry.voucherNo}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 text-sm text-right align-top font-medium">
                          {formatCurrency(entry.debit)}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 text-sm text-right align-top font-medium">
                          {formatCurrency(entry.credit)}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 text-sm text-center align-top">
                          <div className="flex justify-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-800">
                              <Printer className="h-4 w-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-800">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-800">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Balance Summary */}
              <div className="mt-6 border-t-2 border-gray-300 pt-4">
                <div className="flex justify-end">
                  <div className="text-right space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold mr-8">Opening Balance :</span>
                      <span>Rs {openingBalance.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Dr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold mr-8">Current Balance :</span>
                      <div>
                        <span>Rs {totalDebit.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Dr</span>
                        <span className="ml-4">Rs {totalCredit.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Cr</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold mr-8">Closing Balance :</span>
                      <span>Rs {closingBalance.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Dr</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-lg">
                Select an account or enter search criteria to view ledger statement
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LedgerStatement;

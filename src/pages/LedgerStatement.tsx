import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Printer, Edit2, Trash2, Eye } from 'lucide-react';
import { usePaymentByVoucherNo } from '@/hooks/useCashBookQueries';
import { useLedgerStatementData, useLedgerBalances } from '@/hooks/useLedgerStatement';
import { printReceipt } from '@/utils/receiptPrinter';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import PaymentDetailsModal from '@/components/PaymentDetailsModal';

const LedgerStatement: React.FC = () => {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  const navigate = useNavigate();

  const [mrnNo, setMrnNo] = useState('');
  const [accountName, setAccountName] = useState('STATE BANK OF INDIA (DRM)');
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [searchNarration, setSearchNarration] = useState('');
  const [searchAmount, setSearchAmount] = useState('');
  const [hideNarration, setHideNarration] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState('Ledger Statement');
  const [printingVoucherNo, setPrintingVoucherNo] = useState<string | undefined>(undefined);

  // Fetch ledger data from database
  const { data: ledgerData, isLoading: isLoadingLedger, error: ledgerError } = useLedgerStatementData({
    accountName,
    fromDate,
    toDate,
    mrnFilter: mrnNo || undefined,
  });

  // Calculate balances
  const balances = useLedgerBalances(ledgerData);

  // State for Payment Details Modal
  const [selectedVoucherNo, setSelectedVoucherNo] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch payment data when printing is triggered
  const { data: paymentData, isLoading: isLoadingPayment, error: paymentError } = usePaymentByVoucherNo(printingVoucherNo);

  // Effect to handle printing once data is loaded
  React.useEffect(() => {
    if (printingVoucherNo && paymentData) {
      try {
        printReceipt(paymentData);
        toast.success('Receipt opened for printing');
      } catch (error) {
        console.error('Error printing receipt:', error);
        toast.error('Failed to print receipt');
      } finally {
        // Reset the printing state
        setPrintingVoucherNo(undefined);
      }
    }

    if (printingVoucherNo && paymentError) {
      console.error('Error fetching payment data:', paymentError);
      toast.error('Failed to fetch payment details. Please try again.');
      setPrintingVoucherNo(undefined);
    }
  }, [paymentData, paymentError, printingVoucherNo]);

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

  const handlePrintReceipt = (voucherNo: string) => {
    if (isLoadingPayment) {
      toast.info('Please wait, loading payment data...');
      return;
    }
    setPrintingVoucherNo(voucherNo);
  };

  const handlePatientClick = (patientId: string, visitId: string) => {
    if (patientId && visitId) {
      navigate(`/patient-profile?patient=${patientId}&visit=${visitId}`);
    }
  };

  const getPaymentTypeBadge = (paymentType: string) => {
    switch (paymentType) {
      case 'ADVANCE_PAYMENT':
        return <Badge className="bg-green-500 hover:bg-green-600">Advance</Badge>;
      case 'ADVANCE_REFUND':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Refund</Badge>;
      case 'FINAL_PAYMENT':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Final</Badge>;
      default:
        return <Badge variant="secondary">Other</Badge>;
    }
  };

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
              className="px-3 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-blue-500 w-64 bg-white"
            >
              <option value="STATE BANK OF INDIA (DRM)">STATE BANK OF INDIA ( DRM )</option>
              <option value="SARASWAT BANK">SARASWAT BANK</option>
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
                  Ledger : {accountName}
                </h2>
                <p className="text-sm font-medium text-gray-700">
                  {formatDateForDisplay(fromDate)} To {formatDateForDisplay(toDate)}
                </p>
              </div>

              {/* Loading and Error States */}
              {isLoadingLedger && (
                <div className="text-center py-8 text-gray-500">
                  Loading ledger data...
                </div>
              )}
              {ledgerError && (
                <div className="text-center py-8 text-red-500">
                  Error loading ledger data: {ledgerError.message}
                </div>
              )}
              {!isLoadingLedger && ledgerData && ledgerData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No transactions found for the selected criteria
                </div>
              )}

              {/* Ledger Table */}
              {!isLoadingLedger && ledgerData && ledgerData.length > 0 && (
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
                        MRN #
                      </th>
                      <th className="text-left py-2 px-3 font-semibold text-blue-700 border border-gray-300 text-sm">
                        Visit ID
                      </th>
                      <th className="text-left py-2 px-3 font-semibold text-blue-700 border border-gray-300 text-sm">
                        Payment Type
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
                    {ledgerData?.map((entry, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-2 px-3 border border-gray-300 text-sm align-top">
                          {new Date(entry.voucher_date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 text-sm align-top">
                          <div
                            className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                            onClick={() => handlePatientClick(entry.patient_id, entry.visit_id)}
                            title="Click to view patient profile"
                          >
                            {entry.patient_name}
                          </div>
                          {!hideNarration && (
                            <div className="text-xs text-gray-600 italic mt-1">
                              Narration : {entry.narration}
                            </div>
                          )}
                          {entry.payment_mode && (
                            <div className="text-xs text-gray-500 mt-1">
                              Mode: {entry.payment_mode}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 text-sm align-top">
                          <span className="font-mono text-blue-700">
                            {entry.mrn_number || '-'}
                          </span>
                        </td>
                        <td className="py-2 px-3 border border-gray-300 text-sm align-top">
                          <span className="font-mono text-gray-700">
                            {entry.visit_id || '-'}
                          </span>
                        </td>
                        <td className="py-2 px-3 border border-gray-300 text-sm align-top">
                          {getPaymentTypeBadge(entry.payment_type)}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 text-sm align-top">
                          {entry.voucher_type}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 text-sm align-top">
                          {entry.voucher_number}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 text-sm text-right align-top font-medium">
                          {formatCurrency(entry.debit_amount || 0)}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 text-sm text-right align-top font-medium">
                          {formatCurrency(entry.credit_amount || 0)}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 text-sm text-center align-top">
                          <div className="flex justify-center space-x-2">
                            <button
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              onClick={() => handlePrintReceipt(entry.voucher_number)}
                              title="Print Receipt"
                              disabled={isLoadingPayment}
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                            <button
                              className="text-purple-600 hover:text-purple-800"
                              onClick={() => handlePatientClick(entry.patient_id, entry.visit_id)}
                              title="View Patient"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}

              {/* Balance Summary */}
              {!isLoadingLedger && ledgerData && ledgerData.length > 0 && (
              <div className="mt-6 border-t-2 border-gray-300 pt-4">
                <div className="flex justify-end">
                  <div className="text-right space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold mr-8">Opening Balance :</span>
                      <span>Rs {balances.openingBalance.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Dr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold mr-8">Current Balance :</span>
                      <div>
                        <span>Rs {balances.currentDebit.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Dr</span>
                        <span className="ml-4">Rs {balances.currentCredit.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Cr</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold mr-8">Closing Balance :</span>
                      <span>Rs {balances.closingBalance.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Dr</span>
                    </div>
                  </div>
                </div>
              </div>
              )}
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

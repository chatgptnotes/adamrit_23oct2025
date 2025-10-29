import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { usePatientTransactionDetails, usePatientTransactionSummary } from '@/hooks/usePatientTransactions';

interface PatientTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  visitId?: string;
  patientName?: string;
  filterDate?: string;
}

const PatientTransactionModal: React.FC<PatientTransactionModalProps> = ({
  isOpen,
  onClose,
  patientId,
  visitId,
  patientName,
  filterDate
}) => {
  const { data: transactions, isLoading } = usePatientTransactionDetails(patientId, visitId, filterDate);
  const summary = usePatientTransactionSummary(patientId, visitId, filterDate);

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const getTypeBadgeClass = (type: string) => {
    const classes: Record<string, string> = {
      'OPD_SERVICE': 'bg-green-100 text-green-700',
      'LAB_TEST': 'bg-blue-100 text-blue-700',
      'RADIOLOGY': 'bg-purple-100 text-purple-700',
      'PHARMACY': 'bg-cyan-100 text-cyan-700',
      'MANDATORY_SERVICE': 'bg-orange-100 text-orange-700',
      'PHYSIOTHERAPY': 'bg-pink-100 text-pink-700',
      'DIRECT_SALE': 'bg-yellow-100 text-yellow-700'
    };
    return classes[type] || 'bg-gray-100 text-gray-700';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'OPD_SERVICE': 'OPD',
      'LAB_TEST': 'Lab',
      'RADIOLOGY': 'Radiology',
      'PHARMACY': 'Pharmacy',
      'MANDATORY_SERVICE': 'Mandatory',
      'PHYSIOTHERAPY': 'Physio',
      'DIRECT_SALE': 'Direct Sale'
    };
    return labels[type] || type;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Patient Transaction Details</h2>
            {patientName && (
              <p className="text-sm text-gray-600 mt-1">
                Patient: <span className="font-medium">{patientName}</span>
                {filterDate && <span className="text-xs text-blue-600 ml-2">(Today's transactions only)</span>}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading transactions...</span>
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm border-b">Date</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm border-b">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm border-b">Description</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm border-b">Qty</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm border-b">Rate</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm border-b">Amount</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm border-b">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn, index) => (
                    <tr key={txn.transaction_id || index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {formatDate(txn.transaction_date)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeClass(txn.transaction_type)}`}>
                          {getTypeLabel(txn.transaction_type)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {txn.description}
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-gray-900">
                        {txn.quantity}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-900">
                        {formatCurrency(txn.unit_rate)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(txn.amount)}
                      </td>
                      <td className="py-3 px-4 text-center text-sm">
                        <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium">
                          {txn.payment_mode}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-600">No transactions found for this patient</p>
            </div>
          )}
        </div>

        {/* Footer - Summary */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Total Transactions</p>
              <p className="text-lg font-bold text-gray-900">{summary.transactionCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Total Charges</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(summary.totalCharges)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Advance Paid</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(summary.totalAdvance)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Balance</p>
              <p className={`text-lg font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(summary.balance))} {summary.balance >= 0 ? '(Credit)' : '(Due)'}
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientTransactionModal;

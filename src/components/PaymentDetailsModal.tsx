import React from 'react';
import { X, Loader2, Receipt, CreditCard } from 'lucide-react';
import { usePaymentDetailsByVoucher } from '@/hooks/usePaymentDetails';

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucherNumber: string | null;
}

const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  isOpen,
  onClose,
  voucherNumber
}) => {
  const { data: paymentDetails, isLoading, error } = usePaymentDetailsByVoucher(voucherNumber);

  if (!isOpen) return null;

  // Utility functions
  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'AUTHORISED': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'DRAFT': 'bg-gray-100 text-gray-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentModeColor = (mode: string) => {
    const colors: Record<string, string> = {
      'CASH': 'bg-green-100 text-green-800',
      'UPI': 'bg-purple-100 text-purple-800',
      'CARD': 'bg-blue-100 text-blue-800',
      'NEFT': 'bg-cyan-100 text-cyan-800',
      'RTGS': 'bg-indigo-100 text-indigo-800',
      'CHEQUE': 'bg-orange-100 text-orange-800',
      'DD': 'bg-pink-100 text-pink-800',
      'ONLINE': 'bg-teal-100 text-teal-800'
    };
    return colors[mode] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Payment Transaction Details</h2>
            {voucherNumber && (
              <p className="text-sm text-gray-600 mt-1">
                Voucher: <span className="font-medium text-blue-600">{voucherNumber}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading payment details...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="text-red-500 text-lg font-semibold mb-2">Error Loading Payment Details</div>
              <p className="text-gray-600 text-sm">{error.message}</p>
            </div>
          ) : !paymentDetails ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="text-gray-500 text-lg font-semibold mb-2">No Payment Details Found</div>
              <p className="text-gray-600 text-sm">Unable to find payment details for voucher {voucherNumber}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Voucher Information Section */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-center mb-4">
                  <Receipt className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Voucher Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Voucher Number</label>
                    <p className="text-base font-semibold text-gray-900">{paymentDetails.voucher_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Voucher Date</label>
                    <p className="text-base font-semibold text-gray-900">{formatDate(paymentDetails.voucher_date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <p className="text-base">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(paymentDetails.voucher_status)}`}>
                        {paymentDetails.voucher_status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Amount</label>
                    <p className="text-base font-bold text-green-700">{formatCurrency(paymentDetails.voucher_amount)}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Narration</label>
                    <p className="text-base text-gray-900">{paymentDetails.voucher_narration || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Payment Information Section */}
              <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
                <div className="flex items-center mb-4">
                  <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Patient Name</label>
                    <p className="text-base font-semibold text-gray-900">{paymentDetails.patient_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Registration No.</label>
                    <p className="text-base font-semibold text-gray-900">{paymentDetails.registration_no || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Mode</label>
                    <p className="text-base">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentModeColor(paymentDetails.payment_mode)}`}>
                        {paymentDetails.payment_mode}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Date</label>
                    <p className="text-base font-semibold text-gray-900">{formatDate(paymentDetails.payment_date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Visit ID</label>
                    <p className="text-base text-gray-900">{paymentDetails.visit_id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Reference Number</label>
                    <p className="text-base text-gray-900">{paymentDetails.reference_number || 'N/A'}</p>
                  </div>
                  {paymentDetails.billing_executive && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Billing Executive</label>
                      <p className="text-base text-gray-900">{paymentDetails.billing_executive}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Amount Paid</label>
                    <p className="text-base font-bold text-green-700">{formatCurrency(paymentDetails.advance_amount)}</p>
                  </div>
                  {paymentDetails.remarks && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-600">Remarks</label>
                      <p className="text-base text-gray-900 bg-white p-3 rounded border border-gray-200">{paymentDetails.remarks}</p>
                    </div>
                  )}
                  {paymentDetails.is_refund && (
                    <div className="col-span-2">
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <label className="text-sm font-semibold text-red-700">Refund Transaction</label>
                        {paymentDetails.refund_reason && (
                          <p className="text-sm text-red-600 mt-1">Reason: {paymentDetails.refund_reason}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;

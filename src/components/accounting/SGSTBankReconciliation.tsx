import React from 'react';
import { X } from 'lucide-react';
import TallyHeader from './TallyHeader';
import TallyFooter from './TallyFooter';

interface SGSTBankReconciliationProps {
  onClose: () => void;
}

const SGSTBankReconciliation: React.FC<SGSTBankReconciliationProps> = ({ onClose }) => {
  // SGST Bank Reconciliation - Exact UI match with reconciliation table and balance summary
  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      <TallyHeader />
      
      <div className="flex flex-1" style={{ height: "calc(100vh - 120px)" }}>
        <div className="flex-1 bg-white flex flex-col">
          {/* Header */}
          <div className="bg-blue-100 px-4 py-2 border-b">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-blue-700">Bank Reconciliation</div>
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-gray-700">AARTI PVT LMT</div>
                <div className="text-sm font-medium text-gray-700">1-Apr-24 to 31-Mar-25</div>
              </div>
            </div>
          </div>

          {/* Ledger Info */}
          <div className="bg-gray-50 px-4 py-1 border-b">
            <div className="text-sm font-medium text-gray-700">Ledger: SGST</div>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Table Header */}
          <div className="bg-gray-100 border-b">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="border-r border-gray-300 px-2 py-2 text-left w-20">Date</th>
                  <th className="border-r border-gray-300 px-2 py-2 text-left w-32">Particulars</th>
                  <th className="border-r border-gray-300 px-2 py-2 text-center w-20">Vch Type</th>
                  <th className="border-r border-gray-300 px-2 py-2 text-center w-24">(Reconciliation) Transaction Type</th>
                  <th className="border-r border-gray-300 px-2 py-2 text-center w-24">Instrument No</th>
                  <th className="border-r border-gray-300 px-2 py-2 text-center w-24">Instrument Date</th>
                  <th className="border-r border-gray-300 px-2 py-2 text-center w-20">Bank Date</th>
                  <th className="border-r border-gray-300 px-2 py-2 text-right w-20">Debit</th>
                  <th className="px-2 py-2 text-right w-20">Credit</th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Table Body - Scrollable area */}
          <div className="bg-white flex-1 overflow-y-auto">
            <table className="w-full text-xs">
              <tbody>
                {/* Empty rows to fill space */}
                {Array.from({ length: 25 }, (_, index) => (
                  <tr key={`empty-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border-r border-gray-300 px-2 py-2 w-20">&nbsp;</td>
                    <td className="border-r border-gray-300 px-2 py-2 w-32">&nbsp;</td>
                    <td className="border-r border-gray-300 px-2 py-2 text-center w-20">&nbsp;</td>
                    <td className="border-r border-gray-300 px-2 py-2 text-center w-24">&nbsp;</td>
                    <td className="border-r border-gray-300 px-2 py-2 text-center w-24">&nbsp;</td>
                    <td className="border-r border-gray-300 px-2 py-2 text-center w-24">&nbsp;</td>
                    <td className="border-r border-gray-300 px-2 py-2 text-center w-20">&nbsp;</td>
                    <td className="border-r border-gray-300 px-2 py-2 text-right w-20">&nbsp;</td>
                    <td className="px-2 py-2 text-right w-20">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Balance Summary */}
          <div className="bg-white border-t border-gray-300 px-4 py-3 flex-shrink-0">
            <div className="text-right text-sm space-y-1">
              <div className="font-medium">Balance as per Company Books:</div>
              <div>Amounts not reflected in Bank</div>
              <div className="font-medium">Balance as per Bank:</div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-48 bg-blue-50 border-l border-gray-300 h-full overflow-y-auto">
          {/* F2: Period */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F2: Period</span>
            </div>
          </div>

          {/* F3: Company */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F3: Company</span>
            </div>
          </div>

          {/* F4: Bank */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F4: Bank</span>
            </div>
          </div>

          {/* F5-F7 - Empty */}
          {[5, 6, 7].map(num => (
            <div key={num} className="border-b border-gray-300 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">F{num}</span>
              </div>
            </div>
          ))}

          {/* F8-F10 - Empty */}
          {[8, 9, 10].map(num => (
            <div key={num} className="border-b border-gray-300 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">F{num}</span>
              </div>
            </div>
          ))}

          {/* Empty space */}
          <div className="border-b border-gray-300 p-4"></div>

          {/* Additional Options */}
          {[
            'B: Basis of Values',
            'H: Change View', 
            'J: Exception Reports'
          ].map(option => (
            <div key={option} className="border-b border-gray-300 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800">{option}</span>
              </div>
            </div>
          ))}

          {/* Empty space */}
          <div className="p-2"></div>

          {/* More Options */}
          {[
            'U: Opening BRS',
            'J: Create Voucher',
            'Q: Reconcile Unlimited',
            'R: Reconcile All Unlimited',
            'S: Set Bank Date',
            'V: Delete Unlimited',
            'W: Delete All Unlimited'
          ].map(option => (
            <div key={option} className="border-b border-gray-300 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800">{option}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto">
        <TallyFooter onQuit={onClose} />
      </div>
    </div>
  );
};

export default SGSTBankReconciliation;

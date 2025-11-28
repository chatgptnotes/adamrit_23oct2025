import React from 'react';
import { X } from 'lucide-react';
import TallyHeader from './TallyHeader';

interface PurchaseAcLedgerProps {
  onClose: () => void;
}

const PurchaseAcLedger: React.FC<PurchaseAcLedgerProps> = ({ onClose }) => {
  // Purchase A/c Ledger - Exact UI match with input boxes for Selected Total and Grand Total
  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      <TallyHeader />
      
      <div className="flex flex-1" style={{ height: "calc(100vh - 120px)" }}>
        <div className="flex-1 bg-white flex flex-col">
          {/* Header */}
          <div className="bg-blue-100 px-4 py-2 border-b">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-blue-700">Ledger: Purchase A/c</div>
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-gray-700">AARTI PVT LMT</div>
                <div className="text-sm font-medium text-gray-700">1-Apr-24 to 31-Mar-25</div>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Table Header */}
          <div className="bg-gray-100 border-b">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border-r border-gray-300 px-3 py-2 text-left w-24">Date</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-left w-64">Particulars</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-center w-24">Vch Type</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-center w-20">Vch No</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-center w-24">Reconciled</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-center w-32">Printed / Emailed ?</th>
                  <th className="px-3 py-2 text-right w-32">Amount</th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Table Body - Scrollable area */}
          <div className="bg-white flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <tbody>
                {/* Empty rows to fill space */}
                {Array.from({ length: 25 }, (_, index) => (
                  <tr key={`empty-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border-r border-gray-300 px-3 py-2 w-24">&nbsp;</td>
                    <td className="border-r border-gray-300 px-3 py-2 w-64">&nbsp;</td>
                    <td className="border-r border-gray-300 px-3 py-2 text-center w-24">&nbsp;</td>
                    <td className="border-r border-gray-300 px-3 py-2 text-center w-20">&nbsp;</td>
                    <td className="border-r border-gray-300 px-3 py-2 text-center w-24">&nbsp;</td>
                    <td className="border-r border-gray-300 px-3 py-2 text-center w-32">&nbsp;</td>
                    <td className="px-3 py-2 text-right w-32">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Summary */}
          <div className="bg-white border-t border-gray-300 px-4 py-2 flex-shrink-0">
            <div className="flex items-center text-sm space-x-8">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Selected Total</span>
                <input
                  type="text"
                  className="w-32 px-2 py-1 border border-gray-300 text-right text-sm"
                  placeholder="0.00"
                  readOnly
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Grand Total</span>
                <input
                  type="text"
                  className="w-32 px-2 py-1 border border-gray-300 text-right text-sm"
                  placeholder="0.00"
                  readOnly
                />
              </div>
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

          {/* F4: Ledger */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F4: Ledger</span>
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

          {/* F8: Reconciled Only */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F8: Reconciled Only</span>
            </div>
          </div>

          {/* F9-F10 - Empty */}
          {[9, 10].map(num => (
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
            'J: Exception Reports',
            'L: Save View'
          ].map(option => (
            <div key={option} className="border-b border-gray-300 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800">{option}</span>
              </div>
            </div>
          ))}

          {/* Empty space */}
          <div className="p-2"></div>

          {/* Bottom Options */}
          {[
            'B: Mark as Printed',
            'W: Update E-mail ID'
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
      <div className="bg-blue-100 border-t border-gray-300 px-4 py-2">
        <div className="flex items-center text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs">Q:</span>
              <span className="text-gray-700">Quit</span>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs">Enter:</span>
              <span className="text-gray-700">Alter</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs">A:</span>
              <span className="text-gray-700">Space:</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs">Space:</span>
              <span className="text-gray-700">Select</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs">A:</span>
              <span className="text-gray-700">Remove Line</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs">U:</span>
              <span className="text-gray-700">Restore Line</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs">F12:</span>
              <span className="text-gray-700">Configure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseAcLedger;

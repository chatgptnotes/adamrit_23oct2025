import React from 'react';
import { X } from 'lucide-react';
import TallyHeader from './TallyHeader';

interface SGSTTransactionsSummaryProps {
  onClose: () => void;
}

const SGSTTransactionsSummary: React.FC<SGSTTransactionsSummaryProps> = ({ onClose }) => {
  // SGST Transactions Monthly Summary - Exact UI match
  const months = [
    'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December', 'January', 'February', 'March'
  ];

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      <TallyHeader />
      
      <div className="flex flex-1" style={{ height: "calc(100vh - 120px)" }}>
        <div className="flex-1 bg-white flex flex-col">
          {/* Header */}
          <div className="bg-blue-100 px-4 py-2 border-b">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-blue-700">PostDated Transactions Monthly Summary</div>
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-gray-700">AARTI PVT LMT</div>
                <div className="text-sm font-medium text-gray-700">SGST</div>
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-1">1-Apr-24 to 31-Mar-25</div>
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
                  <th className="border-r border-gray-300 px-4 py-2 text-left w-32">Particulars</th>
                  <th className="border-r border-gray-300 px-4 py-2 text-center" colSpan={2}>Received</th>
                  <th className="px-4 py-2 text-center" colSpan={2}>Issued</th>
                </tr>
                <tr>
                  <th className="border-r border-gray-300 px-4 py-1 text-left w-32"></th>
                  <th className="border-r border-gray-300 px-4 py-1 text-center w-24">Amount</th>
                  <th className="border-r border-gray-300 px-4 py-1 text-center w-20">Count</th>
                  <th className="border-r border-gray-300 px-4 py-1 text-center w-24">Amount</th>
                  <th className="px-4 py-1 text-center w-20">Count</th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Table Body - Scrollable area */}
          <div className="bg-white flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <tbody>
                {months.map((month, index) => (
                  <tr key={month} className={month === 'March' ? 'bg-yellow-200' : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
                    <td className="border-r border-gray-300 px-4 py-2 w-32">{month}</td>
                    <td className="border-r border-gray-300 px-4 py-2 text-center w-24"></td>
                    <td className="border-r border-gray-300 px-4 py-2 text-center w-20"></td>
                    <td className="border-r border-gray-300 px-4 py-2 text-center w-24"></td>
                    <td className="px-4 py-2 text-center w-20"></td>
                  </tr>
                ))}
                
                {/* Empty rows to fill space */}
                {Array.from({ length: 10 }, (_, index) => (
                  <tr key={`empty-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border-r border-gray-300 px-4 py-2 w-32">&nbsp;</td>
                    <td className="border-r border-gray-300 px-4 py-2 text-center w-24">&nbsp;</td>
                    <td className="border-r border-gray-300 px-4 py-2 text-center w-20">&nbsp;</td>
                    <td className="border-r border-gray-300 px-4 py-2 text-center w-24">&nbsp;</td>
                    <td className="px-4 py-2 text-center w-20">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grand Total */}
          <div className="bg-white border-t border-gray-300 px-4 py-2 flex-shrink-0">
            <div className="flex items-center text-sm">
              <span className="font-medium">Grand Total</span>
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

          {/* F5-F10 - Empty */}
          {[5, 6, 7, 8, 9, 10].map(num => (
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

export default SGSTTransactionsSummary;

import React from 'react';
import { X } from 'lucide-react';
import TallyHeader from './TallyHeader';

interface BankwiseRegisterProps {
  onClose: () => void;
}

const BankwiseRegister: React.FC<BankwiseRegisterProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      <TallyHeader />
      
      <div className="flex flex-1" style={{ height: "calc(100vh - 120px)" }}>
        <div className="flex-1 bg-white flex flex-col">
          {/* Header */}
          <div className="bg-blue-100 px-4 py-2 border-b flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="text-lg font-bold text-blue-700">Cheque Register</div>
              <div className="text-sm text-gray-600">1 Apr 24 to 31 Mar 25</div>
            </div>
            <div className="text-sm font-medium text-gray-700">AARTI PVT LMT</div>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Bank wise Register Title */}
          <div className="px-4 py-2 bg-gray-50 border-b">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-bold">Bank wise Register</span>
            </div>
          </div>

          {/* Table Header */}
          <div className="bg-gray-100 border-b">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border-r border-gray-300 px-3 py-2 text-left w-48">Particulars</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-center w-24">Available Cheques</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-center w-24">Unreconciled</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-center w-24">Reconciled</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-center w-24">Blank</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-center w-24">Cancelled</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-center w-24">Out of Period</th>
                  <th className="px-3 py-2 text-center w-24">Total Cheques</th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Table Body - Scrollable area */}
          <div className="bg-white flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <tbody>
                {/* Empty rows to fill the space */}
                {Array.from({ length: 20 }, (_, index) => (
                  <tr key={`empty-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border-r border-gray-300 px-3 py-2 w-48">&nbsp;</td>
                    <td className="border-r border-gray-300 px-3 py-2 text-center w-24">&nbsp;</td>
                    <td className="border-r border-gray-300 px-3 py-2 text-center w-24">&nbsp;</td>
                    <td className="border-r border-gray-300 px-3 py-2 text-center w-24">&nbsp;</td>
                    <td className="border-r border-gray-300 px-3 py-2 text-center w-24">&nbsp;</td>
                    <td className="border-r border-gray-300 px-3 py-2 text-center w-24">&nbsp;</td>
                    <td className="border-r border-gray-300 px-3 py-2 text-center w-24">&nbsp;</td>
                    <td className="px-3 py-2 text-center w-24">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Summary */}
          <div className="bg-white border-t border-gray-300 px-4 py-2 flex-shrink-0">
            <div className="flex items-center text-sm space-x-8">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Grand Total</span>
                <input
                  type="text"
                  value="0"
                  readOnly
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm bg-gray-50"
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
              <span className="text-xs text-gray-500">⌃</span>
            </div>
          </div>

          {/* F3: Company */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F3: Company</span>
              <span className="text-xs text-gray-500">⌃</span>
            </div>
          </div>

          {/* F4 - Empty */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F4</span>
            </div>
          </div>

          {/* F5 - Empty */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F5</span>
            </div>
          </div>

          {/* F6 - Empty */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F6</span>
            </div>
          </div>

          {/* F7 - Empty */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F7</span>
            </div>
          </div>

          {/* F8: Cheque Status */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F8: Cheque Status</span>
            </div>
          </div>

          {/* F9 - Empty */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F9</span>
            </div>
          </div>

          {/* F10 - Empty */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F10</span>
            </div>
          </div>

          {/* Empty space */}
          <div className="border-b border-gray-300 p-4"></div>

          {/* Additional Options */}
          {[
            'B: Basis of Values',
            'L: Change View', 
            'J: Exception Reports',
            'S: Save View'
          ].map(option => (
            <div key={option} className="border-b border-gray-300 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800">{option}</span>
              </div>
            </div>
          ))}

          {/* Empty space */}
          <div className="p-4"></div>

          {/* Bottom Options */}
          {[
            'B: Alter Chq Book',
            'Q: Quick Search',
            'R: Reconcile'
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
          <div className="flex-1"></div>
          <div className="flex-1"></div>
          <div className="flex-1"></div>
          <div className="flex-1"></div>
          <div className="flex-1"></div>
          <div className="flex-1"></div>
          <div className="flex-1"></div>
          <div className="flex-1"></div>
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

export default BankwiseRegister;

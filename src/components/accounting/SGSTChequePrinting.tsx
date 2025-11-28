import React from 'react';
import { X } from 'lucide-react';
import TallyHeader from './TallyHeader';

interface SGSTChequePrintingProps {
  onClose: () => void;
}

const SGSTChequePrinting: React.FC<SGSTChequePrintingProps> = ({ onClose }) => {
  // SGST Cheque Printing Component - Fixed and Working
  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      <TallyHeader />

      <div className="flex flex-1" style={{ height: "calc(100vh - 120px)" }}>
        <div className="flex-1 bg-white flex flex-col">
          <div className="bg-blue-100 px-4 py-2 border-b flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="text-lg font-bold text-blue-700">Cheque Printing</div>
              <div className="text-sm text-gray-600">1-Mar-25 to 31-Mar-25</div>
            </div>
            <div className="text-sm font-medium text-gray-700">AARTI PVT LMT</div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="px-4 py-2 bg-gray-50 border-b">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">Ledger:</span>
              <span className="text-sm font-bold">SGST</span>
            </div>
          </div>

          <div className="px-4 py-2 bg-yellow-50 border-b text-center">
            <span className="text-sm text-gray-700 italic">(Bank not configured for Cheque Printing)</span>
          </div>

          <div className="bg-gray-100 border-b">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border-r border-gray-300 px-3 py-2 text-left w-20">Date</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-left w-64">Particulars</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-left w-32">Instrument No.</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-left w-32">Instrument Date</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-center w-24">Printed ?</th>
                  <th className="px-3 py-2 text-right w-32">Amount</th>
                </tr>
              </thead>
            </table>
          </div>

          <div className="bg-white flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <tbody>
                {Array.from({ length: 20 }, (_, index) => (
                  <tr key={`empty-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border-r border-gray-300 px-3 py-2 w-20">&nbsp;</td>
                    <td className="border-r border-gray-300 px-3 py-2 w-64">&nbsp;</td>
                    <td className="border-r border-gray-300 px-3 py-2 w-32">&nbsp;</td>
                    <td className="border-r border-gray-300 px-3 py-2 w-32">&nbsp;</td>
                    <td className="border-r border-gray-300 px-3 py-2 text-center w-24">&nbsp;</td>
                    <td className="px-3 py-2 text-right w-32">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white border-t border-gray-300 px-4 py-2 flex-shrink-0">
            <div className="flex items-center text-sm space-x-8">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Selected Total</span>
                <input
                  type="text"
                  value="0.00"
                  readOnly
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm bg-gray-50"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Grand Total</span>
                <input
                  type="text"
                  value="0.00"
                  readOnly
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-48 bg-blue-50 border-l border-gray-300 h-full overflow-y-auto">
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F2: Period</span>
              <span className="text-xs text-gray-500">⌃</span>
            </div>
          </div>
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F3: Company</span>
              <span className="text-xs text-gray-500">⌃</span>
            </div>
          </div>
          <div className="border-b border-gray-300 p-2 bg-yellow-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F4: Bank</span>
            </div>
          </div>
          {[5, 6, 7].map(num => (
            <div key={num} className="border-b border-gray-300 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">F{num}</span>
              </div>
            </div>
          ))}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F8: Incl Printed</span>
            </div>
          </div>
          {[9, 10].map(num => (
            <div key={num} className="border-b border-gray-300 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">F{num}</span>
              </div>
            </div>
          ))}
          <div className="border-b border-gray-300 p-4"></div>
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
          <div className="p-4"></div>
          {[
            'B: Alter Ledger',
            'L: Alter Chq Details'
          ].map(option => (
            <div key={option} className="border-b border-gray-300 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800">{option}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-100 border-t border-gray-300 px-4 py-2">
        <div className="flex items-center text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs">Q:</span>
              <span className="text-gray-700">Quit</span>
            </div>
          </div>
          <div className="flex-1"></div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs">Enter:</span>
              <span className="text-gray-700">Alter</span>
            </div>
          </div>
          <div className="flex-1"></div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs">Space:</span>
              <span className="text-gray-700">Select</span>
            </div>
          </div>
          <div className="flex-1"></div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs">A:</span>
              <span className="text-gray-700">Accept</span>
            </div>
          </div>
          <div className="flex-1"></div>
          <div className="flex-1"></div>
          <div className="flex-1"></div>
          <div className="flex-1"></div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs">R:</span>
              <span className="text-gray-700">Remove Line</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs">U:</span>
              <span className="text-gray-700">Restore Line</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SGSTChequePrinting;
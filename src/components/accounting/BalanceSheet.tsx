import React from 'react';
import { X } from 'lucide-react';
import TallyHeader from './TallyHeader';
import TallyFooter from './TallyFooter';

interface BalanceSheetProps {
  onClose: () => void;
}

const BalanceSheet: React.FC<BalanceSheetProps> = ({ onClose }) => {
  // Balance Sheet component - Exact UI match with liabilities and assets layout
  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      <TallyHeader />
      
      <div className="flex flex-1" style={{ height: "calc(100vh - 120px)" }}>
        <div className="flex-1 bg-white flex flex-col">
          {/* Header */}
          <div className="bg-blue-100 px-4 py-2 border-b">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-blue-700">Balance Sheet</div>
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-gray-700">AARTI PVT LMT</div>
                <div className="text-sm font-medium text-gray-700">as at 31-Mar-25</div>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Main Content - Two Column Layout */}
          <div className="flex-1 flex">
            {/* Left Column - Liabilities */}
            <div className="flex-1 border-r border-gray-300">
              {/* Liabilities Header */}
              <div className="bg-blue-100 px-4 py-2 border-b border-gray-300">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-gray-700">Liabilities</div>
                  <div className="text-sm font-bold text-gray-700">AARTI PVT LMT</div>
                </div>
                <div className="text-xs text-gray-600 text-right">as at 31-Mar-25</div>
              </div>

              {/* Liabilities Content */}
              <div className="p-4 space-y-2">
                {/* Capital Account - Highlighted */}
                <div className="bg-yellow-200 px-3 py-1 flex items-center justify-between">
                  <span className="text-sm font-medium">Capital Account</span>
                  <span className="text-sm font-medium"></span>
                </div>

                {/* Loans (Liability) */}
                <div className="px-3 py-1 flex items-center justify-between">
                  <span className="text-sm">Loans (Liability)</span>
                  <span className="text-sm"></span>
                </div>

                {/* Current Liabilities */}
                <div className="px-3 py-1 flex items-center justify-between">
                  <span className="text-sm">Current Liabilities</span>
                  <span className="text-sm"></span>
                </div>

                {/* Current Assets */}
                <div className="px-3 py-1 flex items-center justify-between">
                  <span className="text-sm">Current Assets</span>
                  <span className="text-sm font-medium">20,000.00</span>
                </div>

                {/* Empty space for more items */}
                <div className="h-64"></div>
              </div>

              {/* Total - Liabilities */}
              <div className="bg-gray-100 border-t border-gray-300 px-4 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Total</span>
                  <span className="text-sm font-bold">20,000.00</span>
                </div>
              </div>
            </div>

            {/* Right Column - Assets */}
            <div className="flex-1">
              {/* Assets Header */}
              <div className="bg-blue-100 px-4 py-2 border-b border-gray-300">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-gray-700">Assets</div>
                  <div className="text-sm font-bold text-gray-700">AARTI PVT LMT</div>
                </div>
                <div className="text-xs text-gray-600 text-right">as at 31-Mar-25</div>
              </div>

              {/* Assets Content */}
              <div className="p-4 space-y-2">
                {/* Profit & Loss A/c */}
                <div className="px-3 py-1 flex items-center justify-between">
                  <span className="text-sm">Profit & Loss A/c</span>
                  <span className="text-sm font-medium">20,000.00</span>
                </div>

                {/* Opening Balance */}
                <div className="px-6 py-1 flex items-center justify-between text-xs italic">
                  <span>Opening Balance</span>
                  <span></span>
                </div>

                {/* Current Period */}
                <div className="px-6 py-1 flex items-center justify-between text-xs italic">
                  <span>Current Period</span>
                  <span>20,000.00</span>
                </div>

                {/* Empty space for more items */}
                <div className="h-64"></div>
              </div>

              {/* Total - Assets */}
              <div className="bg-gray-100 border-t border-gray-300 px-4 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Total</span>
                  <span className="text-sm font-bold">20,000.00</span>
                </div>
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

          {/* F4 */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F4</span>
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

          {/* F8: Valuation */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F8: Valuation</span>
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

          {/* More Options */}
          {[
            'E: Apply Filter',
            'F: Filter Details'
          ].map(option => (
            <div key={option} className="border-b border-gray-300 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800">{option}</span>
              </div>
            </div>
          ))}

          {/* Empty space */}
          <div className="p-2"></div>

          {/* Column Options */}
          {[
            'C: New Column',
            'A: Alter Column',
            'D: Delete Column',
            'N: Auto Column'
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

export default BalanceSheet;

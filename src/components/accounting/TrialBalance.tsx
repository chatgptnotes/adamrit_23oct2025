import React from 'react';
import { X } from 'lucide-react';
import TallyHeader from './TallyHeader';
import TallyFooter from './TallyFooter';

interface TrialBalanceProps {
  onClose: () => void;
}

const TrialBalance: React.FC<TrialBalanceProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      <TallyHeader />
      
      <div className="flex flex-1" style={{ height: "calc(100vh - 180px)" }}>
        <div className="flex-1 bg-white flex flex-col">
          {/* Header */}
          <div className="bg-blue-100 px-4 py-2 border-b">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-blue-700">Trial Balance</div>
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-gray-700">AARTI PVT LMT</div>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Trial Balance Content */}
          <div className="flex-1 flex flex-col p-4" style={{ height: "calc(100vh - 240px)" }}>
            
            {/* Company Info Header */}
            <div className="text-right mb-4">
              <div className="text-sm font-bold">AARTI PVT LMT</div>
              <div className="text-xs">1-Apr-24 to 31-Mar-25</div>
              <div className="text-xs">Closing Balance</div>
              <div className="flex justify-end space-x-8 text-xs font-medium">
                <span>Debit</span>
                <span>Credit</span>
              </div>
            </div>

            {/* Trial Balance Table */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-1">
                {/* Header Row */}
                <div className="flex bg-gray-100 py-2 px-4 font-medium text-sm border-b">
                  <div className="flex-1">Particulars</div>
                  <div className="w-24 text-right">Debit</div>
                  <div className="w-24 text-right">Credit</div>
                </div>

                {/* Current Assets */}
                <div className="py-1 px-4 text-sm font-medium text-gray-700">
                  Current Assets
                </div>

                {/* Purchase Accounts - Highlighted */}
                <div className="flex bg-yellow-300 py-2 px-4 text-sm font-medium">
                  <div className="flex-1">Purchase Accounts</div>
                  <div className="w-24 text-right">20,000.00</div>
                  <div className="w-24 text-right">20,000.00</div>
                </div>

                {/* Empty rows for spacing */}
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>

                {/* Grand Total */}
                <div className="flex bg-gray-100 py-2 px-4 text-sm font-bold border-t border-gray-300">
                  <div className="flex-1">Grand Total</div>
                  <div className="w-24 text-right">20,000.00</div>
                  <div className="w-24 text-right">20,000.00</div>
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

          {/* F4: Group */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F4: Group</span>
            </div>
          </div>

          {/* F5: Ledger-wise */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F5: Ledger-wise</span>
            </div>
          </div>

          {/* F6: Monthly */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F6: Monthly</span>
            </div>
          </div>

          {/* F7 - F10 (Disabled) */}
          {[7, 8, 9, 10].map(num => (
            <div key={num} className="border-b border-gray-300 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">F{num}</span>
              </div>
            </div>
          ))}

          {/* Empty space */}
          <div className="border-b border-gray-300 p-4"></div>

          {/* Trial Balance Options */}
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

          {/* Filter Options */}
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

      {/* Footer - Always Visible and Complete */}
      <div className="flex-shrink-0 h-16">
        <TallyFooter onQuit={onClose} />
      </div>
    </div>
  );
};

export default TrialBalance;

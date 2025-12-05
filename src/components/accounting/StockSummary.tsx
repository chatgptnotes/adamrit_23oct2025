import React from 'react';
import { X } from 'lucide-react';
import TallyHeader from './TallyHeader';
import TallyFooter from './TallyFooter';

interface StockSummaryProps {
  onClose: () => void;
}

const StockSummary: React.FC<StockSummaryProps> = ({ onClose }) => {
  // Stock Summary component - Exact UI match with particulars and closing balance as per image
  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      <TallyHeader />
      
      <div className="flex flex-1" style={{ height: "calc(100vh - 180px)" }}>
        <div className="flex-1 bg-white flex flex-col">
          {/* Header */}
          <div className="bg-blue-100 px-4 py-2 border-b">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-blue-700">Stock Summary</div>
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

          {/* Main Content Layout */}
          <div className="flex-1 flex flex-col" style={{ height: "calc(100vh - 240px)" }}>
            {/* Content Area */}
            <div className="flex-1 flex" style={{ height: "calc(100% - 80px)" }}>
              {/* Left Column - Particulars */}
              <div className="flex-1 border-r border-gray-300 flex flex-col">
                {/* Particulars Header */}
                <div className="bg-blue-100 px-4 py-2 border-b border-gray-300">
                  <div className="text-sm font-bold text-gray-700">Particulars</div>
                </div>

                {/* Particulars Content - Empty for stock items */}
                <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                  {/* Empty space for stock items */}
                  <div className="h-32"></div>
                </div>
              </div>

              {/* Right Column - Closing Balance */}
              <div className="w-80 flex flex-col">
                {/* Closing Balance Header */}
                <div className="bg-blue-100 px-4 py-2 border-b border-gray-300">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-gray-700">AARTI PVT LMT</div>
                  </div>
                  <div className="text-xs text-gray-600">1-Apr-24 to 31-Mar-25</div>
                  <div className="text-sm font-bold text-gray-700 mt-1">Closing Balance</div>
                </div>

                {/* Column Headers */}
                <div className="bg-gray-50 border-b border-gray-300 px-4 py-2">
                  <div className="flex justify-between text-xs font-medium text-gray-700">
                    <span className="w-20">Quantity</span>
                    <span className="w-16 text-center">Rate</span>
                    <span className="w-20 text-right">Value</span>
                  </div>
                </div>

                {/* Closing Balance Content - Empty for stock values */}
                <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                  {/* Empty space for stock values */}
                  <div className="h-32"></div>
                </div>

                {/* Total for Closing Balance */}
                <div className="bg-gray-100 border-t border-gray-300 px-4 py-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="w-20"></span>
                    <span className="w-16 text-center"></span>
                    <span className="w-20 text-right"></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grand Total - Full Width Box with Input - FULLY VISIBLE NOW */}
            <div className="bg-yellow-100 border-t-2 border-gray-600 px-4 py-4 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-black">Grand Total</span>
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    className="w-32 px-3 py-2 border-2 border-gray-400 rounded bg-white text-right font-bold"
                    placeholder="0.00"
                    readOnly
                  />
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

          {/* F4: Stock Group */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F4: Stock Group</span>
            </div>
          </div>

          {/* F5: Stock Item-wise */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F5: Stock Item-wise</span>
            </div>
          </div>

          {/* F6: Monthly */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F6: Monthly</span>
            </div>
          </div>

          {/* F7: Show Profit */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F7: Show Profit</span>
            </div>
          </div>

          {/* F8: Valuation */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F8: Valuation</span>
            </div>
          </div>

          {/* F9: Orders */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F9: Orders</span>
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

      {/* Footer - Always Visible and Complete */}
      <div className="flex-shrink-0 h-16">
        <TallyFooter onQuit={onClose} />
      </div>
    </div>
  );
};

export default StockSummary;

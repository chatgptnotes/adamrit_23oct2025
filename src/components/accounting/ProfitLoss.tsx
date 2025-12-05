import React from 'react';
import { X } from 'lucide-react';
import TallyHeader from './TallyHeader';
import TallyFooter from './TallyFooter';

interface ProfitLossProps {
  onClose: () => void;
}

const ProfitLoss: React.FC<ProfitLossProps> = ({ onClose }) => {
  // Profit & Loss component - Exact UI match with particulars layout as per image
  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      <TallyHeader />
      
      <div className="flex flex-1" style={{ height: "calc(100vh - 120px)" }}>
        <div className="flex-1 bg-white flex flex-col">
          {/* Header */}
          <div className="bg-blue-100 px-4 py-2 border-b">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-blue-700">Profit & Loss A/c</div>
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

          {/* Main Content - Two Column Layout */}
          <div className="flex-1 flex">
            {/* Left Column - Particulars */}
            <div className="flex-1 border-r border-gray-300">
              {/* Particulars Header */}
              <div className="bg-blue-100 px-4 py-2 border-b border-gray-300">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-gray-700">Particulars</div>
                  <div className="text-sm font-bold text-gray-700">1-Apr-24 to 31-Mar-25</div>
                </div>
              </div>

              {/* Particulars Content */}
              <div className="p-4 space-y-2">
                {/* Opening Stock - Highlighted */}
                <div className="bg-yellow-200 px-3 py-1 flex items-center justify-between">
                  <span className="text-sm font-medium">Opening Stock</span>
                  <span className="text-sm font-medium"></span>
                </div>

                {/* Purchase Accounts */}
                <div className="px-3 py-1 flex items-center justify-between">
                  <span className="text-sm">Purchase Accounts</span>
                  <span className="text-sm font-medium">20,000.00</span>
                </div>

                {/* Second line for Purchase Accounts */}
                <div className="px-3 py-1 flex items-center justify-between">
                  <span className="text-sm"></span>
                  <span className="text-sm font-medium">20,000.00</span>
                </div>

                {/* Gross Loss b/f */}
                <div className="px-3 py-1 flex items-center justify-between">
                  <span className="text-sm">Gross Loss b/f</span>
                  <span className="text-sm font-medium">20,000.00</span>
                </div>

                {/* Empty space for more items */}
                <div className="h-64"></div>
              </div>

              {/* Total - Left */}
              <div className="bg-gray-100 border-t border-gray-300 px-4 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Total</span>
                  <span className="text-sm font-bold">20,000.00</span>
                </div>
              </div>
            </div>

            {/* Right Column - Particulars */}
            <div className="flex-1">
              {/* Particulars Header */}
              <div className="bg-blue-100 px-4 py-2 border-b border-gray-300">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-gray-700">Particulars</div>
                  <div className="text-sm font-bold text-gray-700">1-Apr-24 to 31-Mar-25</div>
                </div>
              </div>

              {/* Particulars Content */}
              <div className="p-4 space-y-2">
                {/* Closing Stock */}
                <div className="px-3 py-1 flex items-center justify-between">
                  <span className="text-sm">Closing Stock</span>
                  <span className="text-sm"></span>
                </div>

                {/* Gross Loss c/o */}
                <div className="px-3 py-1 flex items-center justify-between">
                  <span className="text-sm">Gross Loss c/o</span>
                  <span className="text-sm font-medium">20,000.00</span>
                </div>

                {/* Second line for Gross Loss c/o */}
                <div className="px-3 py-1 flex items-center justify-between">
                  <span className="text-sm"></span>
                  <span className="text-sm font-medium">20,000.00</span>
                </div>

                {/* Net Loss */}
                <div className="px-3 py-1 flex items-center justify-between">
                  <span className="text-sm">Net Loss</span>
                  <span className="text-sm font-medium">20,000.00</span>
                </div>

                {/* Empty space for more items */}
                <div className="h-64"></div>
              </div>

              {/* Total - Right */}
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

export default ProfitLoss;

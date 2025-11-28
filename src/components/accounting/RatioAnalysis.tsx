import React from 'react';
import { X } from 'lucide-react';
import TallyHeader from './TallyHeader';
import TallyFooter from './TallyFooter';

interface RatioAnalysisProps {
  onClose: () => void;
}

const RatioAnalysis: React.FC<RatioAnalysisProps> = ({ onClose }) => {
  // Ratio Analysis component - Exact UI match with principal groups and ratios
  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      <TallyHeader />
      
      <div className="flex flex-1" style={{ height: "calc(100vh - 180px)" }}>
        <div className="flex-1 bg-white flex flex-col">
          {/* Header */}
          <div className="bg-blue-100 px-4 py-2 border-b">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-blue-700">Ratio Analysis</div>
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
              {/* Left Column - Principal Groups */}
              <div className="flex-1 border-r border-gray-300 flex flex-col">
                {/* Principal Groups Header */}
                <div className="bg-blue-100 px-4 py-2 border-b border-gray-300">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-gray-700">Principal Groups</div>
                    <div className="text-sm font-bold text-gray-700">1-Apr-24 to 31-Mar-25</div>
                  </div>
                </div>

                {/* Principal Groups Content */}
                <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                  {/* Working Capital - Highlighted */}
                  <div className="bg-yellow-200 px-3 py-1 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Working Capital</div>
                      <div className="text-xs text-gray-600">(Current Assets-Current Liabilities)</div>
                    </div>
                    <span className="text-sm font-medium">20,000.00</span>
                  </div>

                  {/* Cash in Hand */}
                  <div className="px-3 py-1 flex items-center justify-between">
                    <span className="text-sm">Cash in Hand</span>
                    <span className="text-sm font-medium">20,000.00</span>
                  </div>

                  {/* Bank Accounts */}
                  <div className="px-3 py-1 flex items-center justify-between">
                    <span className="text-sm">Bank Accounts</span>
                    <span className="text-sm font-medium"></span>
                  </div>

                  {/* Bank OD A/c */}
                  <div className="px-3 py-1 flex items-center justify-between">
                    <span className="text-sm">Bank OD A/c</span>
                    <span className="text-sm font-medium"></span>
                  </div>

                  {/* Sundry Debtors */}
                  <div className="px-3 py-1 flex items-center justify-between">
                    <div>
                      <div className="text-sm">Sundry Debtors</div>
                      <div className="text-xs text-gray-600">(due till today)</div>
                    </div>
                    <span className="text-sm font-medium"></span>
                  </div>

                  {/* Sundry Creditors */}
                  <div className="px-3 py-1 flex items-center justify-between">
                    <div>
                      <div className="text-sm">Sundry Creditors</div>
                      <div className="text-xs text-gray-600">(due till today)</div>
                    </div>
                    <span className="text-sm font-medium"></span>
                  </div>

                  {/* Sales Accounts */}
                  <div className="px-3 py-1 flex items-center justify-between">
                    <span className="text-sm">Sales Accounts</span>
                    <span className="text-sm font-medium"></span>
                  </div>

                  {/* Purchase Accounts */}
                  <div className="px-3 py-1 flex items-center justify-between">
                    <span className="text-sm">Purchase Accounts</span>
                    <span className="text-sm font-medium">20,000.00</span>
                  </div>

                  {/* Stock-in-Hand */}
                  <div className="px-3 py-1 flex items-center justify-between">
                    <span className="text-sm">Stock-in-Hand</span>
                    <span className="text-sm font-medium"></span>
                  </div>

                  {/* Net Loss */}
                  <div className="px-3 py-1 flex items-center justify-between">
                    <span className="text-sm">Net Loss</span>
                    <span className="text-sm font-medium">20,000.00</span>
                  </div>

                  {/* Wkg. Capital Turnover */}
                  <div className="px-3 py-1 flex items-center justify-between">
                    <div>
                      <div className="text-sm">Wkg. Capital Turnover</div>
                      <div className="text-xs text-gray-600">(Sales Accounts / Working Capital)</div>
                    </div>
                    <span className="text-sm font-medium"></span>
                  </div>

                  {/* Inventory Turnover */}
                  <div className="px-3 py-1 flex items-center justify-between">
                    <div>
                      <div className="text-sm">Inventory Turnover</div>
                      <div className="text-xs text-gray-600">(Sales Accounts / Closing Stock)</div>
                    </div>
                    <span className="text-sm font-medium"></span>
                  </div>
                </div>
              </div>

              {/* Right Column - Principal Ratios */}
              <div className="w-80 flex flex-col">
                {/* Principal Ratios Header */}
                <div className="bg-blue-100 px-4 py-2 border-b border-gray-300">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-gray-700">Principal Ratios</div>
                    <div className="text-sm font-bold text-gray-700">1-Apr-24 to 31-Mar-25</div>
                  </div>
                </div>

                {/* Principal Ratios Content */}
                <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                  {/* Current Ratio */}
                  <div className="px-3 py-1 flex items-center justify-between">
                    <div>
                      <div className="text-sm">Current Ratio</div>
                      <div className="text-xs text-gray-600">(Current Assets : Current Liabilities)</div>
                    </div>
                    <span className="text-sm font-medium">0.00 : 1</span>
                  </div>

                  {/* Quick Ratio */}
                  <div className="px-3 py-1 flex items-center justify-between">
                    <div>
                      <div className="text-sm">Quick Ratio</div>
                      <div className="text-xs text-gray-600">(Current Assets-Stock-in-Hand : Current Liabilities)</div>
                    </div>
                    <span className="text-sm font-medium">0.00 : 1</span>
                  </div>

                  {/* Debt/Equity Ratio */}
                  <div className="px-3 py-1 flex items-center justify-between">
                    <div>
                      <div className="text-sm">Debt/Equity Ratio</div>
                      <div className="text-xs text-gray-600">(Loans (Liability) : Capital Account + Net Profit)</div>
                    </div>
                    <span className="text-sm font-medium">0.00 : 1</span>
                  </div>

                  {/* Gross Profit % */}
                  <div className="px-3 py-1 flex items-center justify-between">
                    <span className="text-sm">Gross Profit %</span>
                    <span className="text-sm font-medium">0.00 %</span>
                  </div>

                  {/* Net Profit % */}
                  <div className="px-3 py-1 flex items-center justify-between">
                    <span className="text-sm">Net Profit %</span>
                    <span className="text-sm font-medium">0.00 %</span>
                  </div>

                  {/* Operating Cost % */}
                  <div className="px-3 py-1 flex items-center justify-between">
                    <div>
                      <div className="text-sm">Operating Cost %</div>
                      <div className="text-xs text-gray-600">(as percentage of Sales Accounts)</div>
                    </div>
                    <span className="text-sm font-medium">0.00 %</span>
                  </div>

                  {/* Recv. Turnover in days */}
                  <div className="px-3 py-1 flex items-center justify-between">
                    <div>
                      <div className="text-sm">Recv. Turnover in days</div>
                      <div className="text-xs text-gray-600">(payment performance of Debtors)</div>
                    </div>
                    <span className="text-sm font-medium">days</span>
                  </div>

                  {/* Return on Investment % */}
                  <div className="px-3 py-1 flex items-center justify-between">
                    <div>
                      <div className="text-sm">Return on Investment %</div>
                      <div className="text-xs text-gray-600">(Net Profit / Capital Account + Net Profit )</div>
                    </div>
                    <span className="text-sm font-medium">100.00 %</span>
                  </div>

                  {/* Return on Wkg. Capital % */}
                  <div className="px-3 py-1 flex items-center justify-between">
                    <div>
                      <div className="text-sm">Return on Wkg. Capital %</div>
                      <div className="text-xs text-gray-600">(Net Profit / Working Capital) %</div>
                    </div>
                    <span className="text-sm font-medium">( )100.00 %</span>
                  </div>
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

          {/* F5 */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F5</span>
            </div>
          </div>

          {/* F6 */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F6</span>
            </div>
          </div>

          {/* F7 */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F7</span>
            </div>
          </div>

          {/* F8 */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F8</span>
            </div>
          </div>

          {/* F9 */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F9</span>
            </div>
          </div>

          {/* F10 */}
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

export default RatioAnalysis;

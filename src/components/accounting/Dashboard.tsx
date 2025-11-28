import React from 'react';
import { X } from 'lucide-react';
import TallyHeader from './TallyHeader';
import TallyFooter from './TallyFooter';

interface DashboardProps {
  onClose: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onClose }) => {
  // Dashboard component - Exact UI match with all charts and sections
  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      <TallyHeader />
      
      <div className="flex flex-1" style={{ height: "calc(100vh - 180px)" }}>
        <div className="flex-1 bg-white flex flex-col">
          {/* Header */}
          <div className="bg-blue-100 px-4 py-2 border-b">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-blue-700">Dashboard</div>
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

          {/* Main Dashboard Content */}
          <div className="flex-1 flex flex-col p-4 space-y-4" style={{ height: "calc(100vh - 240px)" }}>
            
            {/* Top Row - Charts */}
            <div className="flex space-x-4 h-48">
              {/* Sales Trend Chart */}
              <div className="flex-1 border border-gray-300 bg-white">
                <div className="bg-blue-100 px-3 py-1 border-b">
                  <div className="text-sm font-bold">Sales Trend</div>
                  <div className="text-xs text-gray-600">1-Apr-24 to 31-Mar-25</div>
                </div>
                <div className="p-3 h-40 relative">
                  {/* Simple chart representation */}
                  <div className="w-full h-full bg-gray-50 border flex items-end justify-center space-x-1 px-2">
                    {/* Chart bars */}
                    {[20, 40, 30, 60, 45, 70, 55, 80, 65, 90, 75, 85].map((height, index) => (
                      <div key={index} className="flex-1 bg-blue-400 opacity-70" style={{ height: `${height}%` }}></div>
                    ))}
                  </div>
                  <div className="absolute bottom-1 left-3 right-3 flex justify-between text-xs text-gray-500">
                    <span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span>
                    <span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span>
                  </div>
                  <div className="absolute bottom-0 left-3 text-xs text-blue-600">Net Transactions</div>
                </div>
              </div>

              {/* Purchase Trend Chart */}
              <div className="flex-1 border border-gray-300 bg-white">
                <div className="bg-blue-100 px-3 py-1 border-b">
                  <div className="text-sm font-bold">Purchase Trend</div>
                  <div className="text-xs text-gray-600">1-Apr-24 to 31-Mar-25</div>
                </div>
                <div className="p-3 h-40 relative">
                  {/* Simple chart representation */}
                  <div className="w-full h-full bg-gray-50 border flex items-end justify-center space-x-1 px-2">
                    {/* Chart line */}
                    <div className="w-full h-full relative">
                      <svg className="w-full h-full">
                        <polyline
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="2"
                          points="10,120 30,100 50,80 70,60 90,70 110,50 130,40 150,30 170,35 190,20 210,25 230,15"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-1 left-3 right-3 flex justify-between text-xs text-gray-500">
                    <span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span>
                    <span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span>
                  </div>
                  <div className="absolute bottom-0 left-3 text-xs text-blue-600">Net Transactions</div>
                </div>
              </div>

              {/* Cash In/Out Flow */}
              <div className="w-80 border border-gray-300 bg-white">
                <div className="bg-blue-100 px-3 py-1 border-b">
                  <div className="text-sm font-bold">Cash In/Out Flow</div>
                  <div className="text-xs text-gray-600">1-Apr-24 to 31-Mar-25</div>
                </div>
                <div className="p-3">
                  <div className="text-xs text-right mb-2">for ● Primary</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Particulars</span>
                      <span className="font-medium">Amount</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Net Flow</span>
                      <span>20,000.00 Cr</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Inflow</span>
                      <span></span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Outflow</span>
                      <span>20,000.00 Cr</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Row */}
            <div className="flex space-x-4 h-32">
              {/* Trading Details */}
              <div className="flex-1 border border-gray-300 bg-white">
                <div className="bg-blue-100 px-3 py-1 border-b">
                  <div className="text-sm font-bold">Trading Details</div>
                  <div className="text-xs text-gray-600">1-Apr-24 to 31-Mar-25</div>
                </div>
                <div className="p-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Particulars</span>
                      <span className="font-medium">Amount</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Gross Loss</span>
                      <span>20,000.00 Dr</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Net Loss</span>
                      <span>20,000.00 Dr</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Sales Accounts</span>
                      <span></span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Purchase Accounts</span>
                      <span>20,000.00 Dr</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assets/Liabilities */}
              <div className="flex-1 border border-gray-300 bg-white">
                <div className="bg-blue-100 px-3 py-1 border-b">
                  <div className="text-sm font-bold">Assets/Liabilities</div>
                  <div className="text-xs text-gray-600">1-Apr-24 to 31-Mar-25</div>
                </div>
                <div className="p-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Particulars</span>
                      <span className="font-medium">Closing Balance</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Current Assets</span>
                      <span>20,000.00 Cr</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Current Liabilities</span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Receivables/Payables */}
              <div className="w-80 border border-gray-300 bg-white">
                <div className="bg-blue-100 px-3 py-1 border-b">
                  <div className="text-sm font-bold">Receivables/Payables</div>
                  <div className="text-xs text-gray-600">1-Apr-24 to 31-Mar-25</div>
                </div>
                <div className="p-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Particulars</span>
                      <span className="font-medium">Pending Amount</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Receivables</span>
                      <span></span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Overdue Receivables</span>
                      <span></span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Payables</span>
                      <span></span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Overdue Payables</span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="flex space-x-4 flex-1">
              {/* Cash/Bank Accounts */}
              <div className="flex-1 border border-gray-300 bg-white">
                <div className="bg-blue-100 px-3 py-1 border-b">
                  <div className="text-sm font-bold">Cash/Bank Accounts</div>
                  <div className="text-xs text-gray-600">1-Apr-24 to 31-Mar-25</div>
                </div>
                <div className="p-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Particulars</span>
                      <span className="font-medium">Closing Balance</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cash-in-Hand</span>
                      <span>20,000.00 Cr</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Bank Accounts</span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Groups/Ledgers */}
              <div className="flex-1 border border-gray-300 bg-white">
                <div className="bg-blue-100 px-3 py-1 border-b">
                  <div className="text-sm font-bold">Top Groups/Ledgers</div>
                  <div className="text-xs text-gray-600">1-Apr-24 to 31-Mar-25</div>
                </div>
                <div className="p-3">
                  <div className="text-xs text-center mb-2">for Bank Accounts (Ledger-wise)</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Particulars</span>
                      <span className="font-medium">Closing Balance</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accounting Ratios */}
              <div className="w-80 border border-gray-300 bg-white">
                <div className="bg-blue-100 px-3 py-1 border-b">
                  <div className="text-sm font-bold">Accounting Ratios</div>
                  <div className="text-xs text-gray-600">1-Apr-24 to 31-Mar-25</div>
                </div>
                <div className="p-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Particulars</span>
                      <span className="font-medium"></span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Inventory Turnover</span>
                      <span>0.00 : 1</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Debt/Equity Ratio</span>
                      <span>days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Receivable Turnover in Days</span>
                      <span></span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Return on Investment %</span>
                      <span>100.00 %</span>
                    </div>
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

          {/* Dashboard Options */}
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

          {/* Tile Options */}
          {[
            'V: Expand Tile',
            'A: Add Tile',
            'C: Configure Tile',
            'D: Remove Tile'
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

export default Dashboard;

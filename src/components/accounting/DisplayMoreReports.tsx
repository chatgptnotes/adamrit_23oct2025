import React from 'react';
import { X } from 'lucide-react';
import TallyHeader from './TallyHeader';

interface DisplayMoreReportsProps {
  onClose: () => void;
  onTrialBalanceClick?: () => void;
  onDayBookClick?: () => void;
  onCashFlowClick?: () => void;
  onFundsFlowClick?: () => void;
  onAccountBooksClick?: () => void;
}

const DisplayMoreReports: React.FC<DisplayMoreReportsProps> = ({ onClose, onTrialBalanceClick, onDayBookClick, onCashFlowClick, onFundsFlowClick, onAccountBooksClick }) => {
  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      <TallyHeader />
      
      <div className="flex flex-1" style={{ height: "calc(100vh - 60px)" }}>
        <div className="flex-1 bg-white flex">
          {/* Left Panel - Company Info */}
          <div className="w-2/5 p-6 border-r">
            <div className="mb-6">
              <div className="text-sm text-gray-600 mb-2">CURRENT PERIOD</div>
              <div className="font-medium">1-Apr-24 to 31-Mar-25</div>
            </div>

            <div className="mb-6">
              <div className="text-sm text-gray-600 mb-2">CURRENT DATE</div>
              <div className="font-medium">Monday, 31-Mar-2025</div>
            </div>

            <div className="mb-6">
              <div className="text-sm text-gray-600 mb-2">NAME OF COMPANY</div>
              <div className="font-medium text-blue-600">AARTI PVT LMT</div>
            </div>

            <div className="mb-6">
              <div className="text-sm text-gray-600 mb-2">DATE OF LAST ENTRY</div>
              <div className="font-medium">31-Mar-25</div>
            </div>
          </div>

          {/* Center Panel - Display More Reports */}
          <div className="w-2/5 p-6">
            <div className="bg-blue-600 text-white text-center py-3 rounded-t">
              <h2 className="font-bold">Gateway of Tally</h2>
              <div className="text-sm">Display More Reports</div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-b">
              {/* ACCOUNTING Section */}
              <div className="p-4">
                <div className="text-sm text-gray-600 mb-2">ACCOUNTING</div>
                <div className="bg-yellow-400 text-center py-2 mb-2 rounded">
                  <div
                    className="font-medium cursor-pointer hover:text-gray-700"
                    onClick={onTrialBalanceClick}
                  >
                    Trial Balance
                  </div>
                </div>
                <div className="space-y-1">
                  <div
                    className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                    onClick={onDayBookClick}
                  >
                    Day Book
                  </div>
                  <div
                    className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                    onClick={onCashFlowClick}
                  >
                    Cash Flow
                  </div>
                  <div
                    className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                    onClick={onFundsFlowClick}
                  >
                    Funds Flow
                  </div>
                </div>
              </div>

              {/* Account Books Section */}
              <div className="px-4 pb-4">
                <div className="space-y-1">
                  <div
                    className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                    onClick={onAccountBooksClick}
                  >
                    Account Books
                  </div>
                  <div className="text-blue-600 underline cursor-pointer hover:text-blue-800">
                    Statements of Accounts
                  </div>
                </div>
              </div>

              {/* INVENTORY Section */}
              <div className="px-4 pb-4">
                <div className="text-sm text-gray-600 mb-2">INVENTORY</div>
                <div className="space-y-1">
                  <div className="text-blue-600 underline cursor-pointer hover:text-blue-800">
                    Inventory Books
                  </div>
                  <div className="text-blue-600 underline cursor-pointer hover:text-blue-800">
                    Statements of Inventory
                  </div>
                </div>
              </div>

              {/* STATUTORY Section */}
              <div className="px-4 pb-4">
                <div className="text-sm text-gray-600 mb-2">STATUTORY</div>
                <div className="space-y-1">
                  <div className="text-blue-600 underline cursor-pointer hover:text-blue-800">
                    Statutory Reports
                  </div>
                </div>
              </div>

              {/* EXCEPTION Section */}
              <div className="px-4 pb-4">
                <div className="text-sm text-gray-600 mb-2">EXCEPTION</div>
                <div className="space-y-1">
                  <div className="text-blue-600 underline cursor-pointer hover:text-blue-800">
                    Exception Reports
                  </div>
                  <div className="text-blue-600 underline cursor-pointer hover:text-blue-800">
                    Analysis & Verification
                  </div>
                </div>
              </div>

              {/* Quit */}
              <div className="px-4 pb-4">
                <div 
                  className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                  onClick={onClose}
                >
                  Quit
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Function Keys Sidebar */}
          <div className="w-1/5 bg-blue-50 border-l border-gray-300">
            {/* F2: Date */}
            <div className="border-b border-gray-300 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">F2: Date</span>
              </div>
            </div>

            {/* F3: Company */}
            <div className="border-b border-gray-300 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">F3: Company</span>
              </div>
            </div>

            {/* F4 - F10 (Disabled) */}
            {[4, 5, 6, 7, 8, 9, 10].map(num => (
              <div key={num} className="border-b border-gray-300 p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">F{num}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default DisplayMoreReports;

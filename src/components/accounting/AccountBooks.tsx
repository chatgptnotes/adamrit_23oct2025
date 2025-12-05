import React from 'react';
import { X } from 'lucide-react';
import TallyHeader from './TallyHeader';
import TallyFooter from './TallyFooter';

interface AccountBooksProps {
  onClose: () => void;
}

const AccountBooks: React.FC<AccountBooksProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      <TallyHeader />
      
      <div className="flex flex-1" style={{ height: "calc(100vh - 180px)" }}>
        <div className="flex-1 bg-white flex flex-col">
          {/* Header */}
          <div className="bg-blue-100 px-4 py-2 border-b">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-blue-700">Gateway of Tally</div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Gateway Content */}
          <div className="flex flex-1 p-4" style={{ height: "calc(100vh - 240px)" }}>

            {/* Left Panel - Company Info */}
            <div className="w-1/2 pr-4">
              <div className="bg-gray-50 p-4 h-full">
                {/* Current Period */}
                <div className="mb-6">
                  <div className="text-xs font-medium text-gray-600 mb-1">CURRENT PERIOD</div>
                  <div className="text-sm font-medium">1-Apr-24 to 31-Mar-25</div>
                </div>

                {/* Current Date */}
                <div className="mb-6">
                  <div className="text-xs font-medium text-gray-600 mb-1">CURRENT DATE</div>
                  <div className="text-sm font-medium">Monday, 31-Mar-2025</div>
                </div>

                {/* Company Info */}
                <div className="border-t border-gray-300 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs font-medium text-gray-600">NAME OF COMPANY</div>
                    <div className="text-xs font-medium text-gray-600">DATE OF LAST ENTRY</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-bold">AARTI PVT LMT</div>
                    <div className="text-sm font-medium">31-Mar-25</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Account Books Menu */}
            <div className="w-1/2 pl-4">
              <div className="bg-blue-50 h-full">
                {/* Gateway Header */}
                <div className="bg-blue-200 px-4 py-2 text-center">
                  <div className="text-sm font-medium text-blue-800">Gateway of Tally</div>
                  <div className="text-xs text-blue-700">Display More Reports</div>
                </div>

                {/* Account Books Section */}
                <div className="bg-blue-600 px-4 py-2 text-center">
                  <div className="text-sm font-bold text-white">Account Books</div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  {/* Summary Section */}
                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-600 mb-2 px-2">SUMMARY</div>
                    <div className="bg-yellow-400 px-3 py-2 text-sm font-medium text-black cursor-pointer hover:bg-yellow-500">
                      Cash/Bank Book(s)
                    </div>
                    <div className="px-3 py-1 text-sm text-blue-600 underline cursor-pointer hover:text-blue-800">
                      Ledger
                    </div>
                    <div className="px-3 py-1 text-sm text-blue-600 underline cursor-pointer hover:text-blue-800">
                      Group Summary
                    </div>
                    <div className="px-3 py-1 text-sm text-blue-600 underline cursor-pointer hover:text-blue-800">
                      Group Vouchers
                    </div>
                  </div>

                  {/* Registers Section */}
                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-600 mb-2 px-2">REGISTERS</div>
                    <div className="px-3 py-1 text-sm text-blue-600 underline cursor-pointer hover:text-blue-800">
                      Contra Register
                    </div>
                    <div className="px-3 py-1 text-sm text-blue-600 underline cursor-pointer hover:text-blue-800">
                      Payment Register
                    </div>
                    <div className="px-3 py-1 text-sm text-blue-600 underline cursor-pointer hover:text-blue-800">
                      Receipt Register
                    </div>
                    <div className="px-3 py-1 text-sm text-blue-600 underline cursor-pointer hover:text-blue-800">
                      Sales Register
                    </div>
                    <div className="px-3 py-1 text-sm text-blue-600 underline cursor-pointer hover:text-blue-800">
                      Purchase Register
                    </div>
                    <div className="px-3 py-1 text-sm text-blue-600 underline cursor-pointer hover:text-blue-800">
                      Journal Register
                    </div>
                    <div className="px-3 py-1 text-sm text-blue-600 underline cursor-pointer hover:text-blue-800">
                      Debit Note Register
                    </div>
                    <div className="px-3 py-1 text-sm text-blue-600 underline cursor-pointer hover:text-blue-800">
                      Credit Note Register
                    </div>
                  </div>

                  {/* Other Options */}
                  <div className="mb-4">
                    <div className="px-3 py-1 text-sm text-blue-600 underline cursor-pointer hover:text-blue-800">
                      Voucher Clarification
                    </div>
                  </div>

                  {/* Quit Option */}
                  <div className="px-3 py-1 text-sm text-blue-600 underline cursor-pointer hover:text-blue-800" onClick={onClose}>
                    Quit
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-48 bg-blue-50 border-l border-gray-300 h-full overflow-y-auto">
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

          {/* Empty space */}
          <div className="border-b border-gray-300 p-4"></div>

          {/* Account Books Options */}
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

export default AccountBooks;

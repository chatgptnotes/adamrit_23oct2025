import React from 'react';
import { X } from 'lucide-react';
import TallyFooter from './TallyFooter';

interface ChartOfAccountsProps {
  onClose: () => void;
}

const ChartOfAccounts: React.FC<ChartOfAccountsProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-100 px-4 py-2 border-b flex items-center justify-between">
        <div className="text-center flex-1">
          <div className="text-sm font-medium text-gray-700">AARTI PVT LMT</div>
          <div className="text-lg font-bold text-blue-700">Chart of Accounts</div>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1" style={{ height: "calc(100vh - 120px)" }}>
        {/* Left Panel - Company Info */}
        <div className="w-1/3 bg-gray-100 p-4 border-r overflow-y-auto">
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-1">CURRENT PERIOD</div>
            <div className="text-sm">1-Apr-24 to 31-Mar-25</div>
          </div>

          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-1">CURRENT DATE</div>
            <div className="text-sm">Monday, 31-Mar-2025</div>
          </div>

          <div className="mb-6">
            <div className="text-sm font-medium text-blue-700 mb-2">AARTI PVT LMT</div>
          </div>
        </div>

        {/* Center Panel - Chart of Accounts */}
        <div className="w-1/3 bg-white flex flex-col">
          {/* Top Section - Ledgers */}
          <div className="bg-yellow-400 text-center py-2 font-medium border-b">
            Ledgers
          </div>
          
          {/* List of Masters Header */}
          <div className="bg-blue-600 text-white text-center py-2 font-medium">
            List of Masters
          </div>
          
          <div className="p-2 flex-1 overflow-y-auto">
            {/* Top buttons */}
            <div className="flex justify-between mb-2">
              <button className="text-xs text-blue-600 underline">Change Company</button>
              <button className="text-xs text-blue-600 underline">Show Inactive</button>
            </div>

            {/* Accounting Masters Section */}
            <div className="mb-4">
              <div className="bg-gray-200 px-2 py-1 text-sm font-medium border">
                Accounting Masters
              </div>
              
              <div className="bg-blue-50 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-blue-100">
                Groups
              </div>
              
              {/* Ledgers - highlighted */}
              <div className="bg-yellow-300 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-yellow-400">
                Ledgers
              </div>
              
              <div className="bg-blue-50 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-blue-100">
                Voucher Types
              </div>
              <div className="bg-blue-50 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-blue-100">
                Currencies
              </div>
              <div className="bg-blue-50 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-blue-100">
                Budgets
              </div>
              <div className="bg-blue-50 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-blue-100">
                Scenarios
              </div>
            </div>

            {/* Inventory Masters Section */}
            <div className="mb-4">
              <div className="bg-gray-200 px-2 py-1 text-sm font-medium border">
                Inventory Masters
              </div>
              <div className="bg-blue-50 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-blue-100">
                Stock Groups
              </div>
              <div className="bg-blue-50 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-blue-100">
                Stock Items
              </div>
              <div className="bg-blue-50 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-blue-100">
                Stock Categories
              </div>
              <div className="bg-blue-50 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-blue-100">
                Units
              </div>
              <div className="bg-blue-50 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-blue-100">
                Godowns
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Content Area */}
        <div className="w-1/3 bg-gray-50 p-4 overflow-y-auto">
          <div className="text-center text-gray-500 mt-20">
            <div className="text-lg mb-2">Chart of Accounts</div>
            <div className="text-sm">View and manage your account structure</div>
          </div>
          
          {/* Add more content to demonstrate scrolling */}
          <div className="mt-10 space-y-4">
            <div className="bg-white p-4 rounded border">
              <h3 className="font-medium mb-2">Account Hierarchy</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div className="pl-0">📁 Assets</div>
                <div className="pl-4">📁 Current Assets</div>
                <div className="pl-8">💰 Cash</div>
                <div className="pl-8">🏦 Bank Accounts</div>
                <div className="pl-4">📁 Fixed Assets</div>
                <div className="pl-8">🏢 Buildings</div>
                <div className="pl-8">💻 Equipment</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded border">
              <h3 className="font-medium mb-2">Liabilities</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div className="pl-0">📁 Liabilities</div>
                <div className="pl-4">📁 Current Liabilities</div>
                <div className="pl-8">💳 Accounts Payable</div>
                <div className="pl-8">📄 Short-term Loans</div>
                <div className="pl-4">📁 Long-term Liabilities</div>
                <div className="pl-8">🏦 Long-term Loans</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded border">
              <h3 className="font-medium mb-2">Income</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div className="pl-0">📁 Income</div>
                <div className="pl-4">💰 Sales Revenue</div>
                <div className="pl-4">💸 Service Income</div>
                <div className="pl-4">📈 Other Income</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded border">
              <h3 className="font-medium mb-2">Expenses</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div className="pl-0">📁 Expenses</div>
                <div className="pl-4">🛒 Cost of Goods Sold</div>
                <div className="pl-4">🏢 Operating Expenses</div>
                <div className="pl-4">💼 Administrative Expenses</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded border">
              <h3 className="font-medium mb-2">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left text-blue-600 hover:bg-blue-50 p-2 rounded">
                  Create New Account
                </button>
                <button className="w-full text-left text-blue-600 hover:bg-blue-50 p-2 rounded">
                  Import Chart of Accounts
                </button>
                <button className="w-full text-left text-blue-600 hover:bg-blue-50 p-2 rounded">
                  Export Account List
                </button>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded border">
              <h3 className="font-medium mb-2">Account Summary</h3>
              <div className="text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Total Accounts:</span>
                  <span className="font-medium">156</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Accounts:</span>
                  <span className="font-medium">142</span>
                </div>
                <div className="flex justify-between">
                  <span>Inactive Accounts:</span>
                  <span className="font-medium">14</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TallyPrime Footer */}
      <TallyFooter onQuit={onClose} />
    </div>
  );
};

export default ChartOfAccounts;

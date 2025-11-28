import React from 'react';
import { X } from 'lucide-react';
import TallyFooter from './TallyFooter';

interface MasterAlterationProps {
  onClose: () => void;
}

const MasterAlteration: React.FC<MasterAlterationProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-100 px-4 py-2 border-b flex items-center justify-between">
        <div className="text-center flex-1">
          <div className="text-sm font-medium text-gray-700">AARTI PVT LMT</div>
          <div className="text-lg font-bold text-blue-700">Master Alteration</div>
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

        {/* Center Panel - List of Masters */}
        <div className="w-1/3 bg-white flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white text-center py-2 font-medium">
            List of Masters
          </div>
          
          <div className="p-2 flex-1 overflow-y-auto">
            {/* Top buttons */}
            <div className="flex justify-between mb-2">
              <button className="text-xs text-blue-600 underline">Change Company</button>
              <div className="flex space-x-2">
                <button className="text-xs text-blue-600 underline">Expand All</button>
                <button className="text-xs text-blue-600 underline">Show More</button>
              </div>
            </div>

            {/* Accounting Masters Section */}
            <div className="mb-4">
              <div className="bg-gray-200 px-2 py-1 text-sm font-medium border">
                Accounting Masters
              </div>
              
              {/* Group - highlighted */}
              <div className="bg-yellow-300 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-yellow-400">
                Group
              </div>
              
              {/* Other items */}
              <div className="bg-blue-50 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-blue-100">
                Ledger
              </div>
              <div className="bg-blue-50 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-blue-100">
                Currency
              </div>
              <div className="bg-blue-50 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-blue-100">
                Voucher Type
              </div>
            </div>

            {/* Inventory Masters Section */}
            <div className="mb-4">
              <div className="bg-gray-200 px-2 py-1 text-sm font-medium border">
                Inventory Masters
              </div>
              <div className="bg-blue-50 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-blue-100">
                Stock Group
              </div>
              <div className="bg-blue-50 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-blue-100">
                Stock Category
              </div>
              <div className="bg-blue-50 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-blue-100">
                Stock Item
              </div>
              <div className="bg-blue-50 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-blue-100">
                Unit
              </div>
              <div className="bg-blue-50 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-blue-100">
                Godown
              </div>
            </div>

            {/* Statutory Masters Section */}
            <div className="mb-4">
              <div className="bg-gray-200 px-2 py-1 text-sm font-medium border">
                Statutory Masters
              </div>
              <div className="bg-blue-50 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-blue-100">
                GST Registration
              </div>
              <div className="bg-blue-50 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-blue-100">
                GST Classification
              </div>
            </div>

            {/* Statutory Details Section */}
            <div className="mb-4">
              <div className="bg-gray-200 px-2 py-1 text-sm font-medium border">
                Statutory Details
              </div>
              <div className="bg-blue-50 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-blue-100">
                Company GST Details
              </div>
              <div className="bg-blue-50 px-2 py-1 text-sm border-l border-r border-b cursor-pointer hover:bg-blue-100">
                PAN/CIN Details
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Content Area */}
        <div className="w-1/3 bg-gray-50 p-4 overflow-y-auto">
          <div className="text-center text-gray-500 mt-20">
            <div className="text-lg mb-2">Select a master to alter</div>
            <div className="text-sm">Choose from the list to modify existing masters</div>
          </div>
          
          {/* Add more content to demonstrate scrolling */}
          <div className="mt-10 space-y-4">
            <div className="bg-white p-4 rounded border">
              <h3 className="font-medium mb-2">Master Alteration Guidelines</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Select the master type you want to modify</li>
                <li>• Choose the specific master from the list</li>
                <li>• Make necessary changes carefully</li>
                <li>• Save changes after verification</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded border">
              <h3 className="font-medium mb-2">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left text-blue-600 hover:bg-blue-50 p-2 rounded">
                  Alter Group
                </button>
                <button className="w-full text-left text-blue-600 hover:bg-blue-50 p-2 rounded">
                  Alter Ledger
                </button>
                <button className="w-full text-left text-blue-600 hover:bg-blue-50 p-2 rounded">
                  Alter Stock Item
                </button>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded border">
              <h3 className="font-medium mb-2">Recently Modified</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Cash Account - Modified today</div>
                <div>Bank Account - Modified yesterday</div>
                <div>Sales Account - Modified 2 days ago</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded border">
              <h3 className="font-medium mb-2">Backup & Restore</h3>
              <div className="text-sm text-gray-600">
                <p>Always backup your data before making major alterations.</p>
                <button className="text-blue-600 hover:underline mt-2">Create Backup</button>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded border">
              <h3 className="font-medium mb-2">Audit Trail</h3>
              <div className="text-sm text-gray-600">
                <p>All alterations are logged for audit purposes.</p>
                <button className="text-blue-600 hover:underline mt-2">View Audit Log</button>
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

export default MasterAlteration;

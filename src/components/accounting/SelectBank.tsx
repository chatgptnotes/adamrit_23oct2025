import React, { useState } from 'react';
import { X } from 'lucide-react';
import TallyHeader from './TallyHeader';
import LedgerCreation from './LedgerCreation';
import ChequeDepositSlip from './ChequeDepositSlip';

interface SelectBankProps {
  onClose: () => void;
}

const SelectBank: React.FC<SelectBankProps> = ({ onClose }) => {
  // Select Bank component - Deposit Slip page with bank selection
  const [showLedgerCreation, setShowLedgerCreation] = useState(false);
  const [showChequeDepositSlip, setShowChequeDepositSlip] = useState(false);

  if (showLedgerCreation) {
    return <LedgerCreation onClose={() => setShowLedgerCreation(false)} />;
  }

  if (showChequeDepositSlip) {
    return <ChequeDepositSlip onClose={() => setShowChequeDepositSlip(false)} />;
  }

  return (
    <div className="fixed inset-0 bg-gray-200 z-50 flex flex-col">
      <TallyHeader />
      
      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        {/* Central Dialog Box */}
        <div className="bg-gray-300 border-2 border-gray-400 rounded-lg shadow-lg" style={{ width: '400px', height: '500px' }}>
          
          {/* Header */}
          <div className="bg-blue-100 border-b border-gray-400 p-3 flex items-center justify-between">
            <div className="text-sm font-bold text-gray-700">Select Bank</div>
            <div className="text-sm font-medium text-gray-700">AARTI PVT LMT</div>
          </div>

          {/* Date Range */}
          <div className="bg-gray-200 border-b border-gray-400 p-2 text-center">
            <div className="text-xs text-gray-600">1-Apr-24 to 31-Mar-25</div>
          </div>

          {/* Name of Bank Section */}
          <div className="bg-blue-100 border-b border-gray-400 p-3 text-center">
            <div className="text-sm font-medium text-gray-700 mb-2">Name of Bank</div>
            <input
              type="text"
              value="SGST"
              className="w-full px-3 py-1 border border-gray-400 bg-white text-center text-sm"
              readOnly
            />
          </div>

          {/* List of Banks Section */}
          <div className="bg-blue-600 text-white border-b border-gray-400 p-2 flex items-center justify-between">
            <span className="text-sm font-medium">List of Banks</span>
            <button
              onClick={() => setShowLedgerCreation(true)}
              className="bg-gray-200 text-gray-700 border border-gray-400 px-3 py-1 text-xs hover:bg-gray-300"
            >
              Create
            </button>
          </div>

          {/* List Items */}
          <div className="bg-white flex-1 overflow-y-auto">
            {/* SGST - Highlighted */}
            <div
              className="px-3 py-1 text-sm bg-orange-300 text-black border-b border-gray-200 cursor-pointer hover:bg-orange-400"
              onClick={() => setShowChequeDepositSlip(true)}
            >
              SGST
            </div>

            {/* Empty space for more items */}
            <div className="h-80"></div>
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Footer */}
      <div className="bg-blue-100 border-t border-gray-300 px-4 py-2">
        <div className="flex items-center text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs">Q:</span>
              <span className="text-gray-700">Quit</span>
            </div>
          </div>
          <div className="flex-1"></div>
          <div className="flex-1"></div>
          <div className="flex-1"></div>
          <div className="flex-1"></div>
          <div className="flex-1"></div>
          <div className="flex-1"></div>
          <div className="flex-1"></div>
          <div className="flex-1"></div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs">A:</span>
              <span className="text-gray-700">Accept</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectBank;

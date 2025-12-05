import React, { useState } from 'react';
import { X } from 'lucide-react';
import TallyHeader from './TallyHeader';
import TallyFooter from './TallyFooter';
import LedgerCreation from './LedgerCreation';
import SGSTBankReconciliation from './SGSTBankReconciliation';

interface SelectBankReconciliationProps {
  onClose: () => void;
}

const SelectBankReconciliation: React.FC<SelectBankReconciliationProps> = ({ onClose }) => {
  // Select Bank component - Bank Reconciliation page with bank ledger selection UI and TallyFooter
  const [showLedgerCreation, setShowLedgerCreation] = useState(false);
  const [showSGSTBankReconciliation, setShowSGSTBankReconciliation] = useState(false);

  if (showLedgerCreation) {
    return <LedgerCreation onClose={() => setShowLedgerCreation(false)} />;
  }

  if (showSGSTBankReconciliation) {
    return <SGSTBankReconciliation onClose={() => setShowSGSTBankReconciliation(false)} />;
  }

  return (
    <div className="fixed inset-0 bg-gray-200 z-50 flex flex-col">
      <TallyHeader />

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        {/* Central Dialog Box */}
        <div className="bg-gray-300 border-2 border-gray-400 rounded-lg shadow-lg flex flex-col" style={{ width: '500px', height: 'auto', maxHeight: 'calc(100vh - 150px)' }}>

          {/* Header */}
          <div className="bg-blue-100 border-b border-gray-400 p-3 flex items-center justify-between">
            <div className="text-sm font-bold text-gray-700">Select Bank</div>
            <div className="text-sm font-medium text-gray-700">AARTI PVT LMT</div>
          </div>

          {/* Date Range */}
          <div className="bg-gray-200 border-b border-gray-400 p-2 text-center">
            <div className="text-xs text-gray-600">1-Apr-24 to 31-Mar-25</div>
          </div>

          {/* Name of Bank Ledger Section */}
          <div className="bg-blue-100 border-b border-gray-400 p-3 text-center">
            <div className="text-sm font-medium text-gray-700 mb-2">Name of Bank Ledger</div>
            <input
              type="text"
              className="w-full px-3 py-1 border border-gray-400 bg-white text-center text-sm"
              placeholder=""
            />
          </div>

          {/* List of Bank Ledgers Section */}
          <div className="bg-blue-600 text-white border-b border-gray-400 p-2 flex items-center justify-between">
            <span className="text-sm font-medium">List of Bank Ledgers</span>
            <button
              onClick={() => setShowLedgerCreation(true)}
              className="bg-gray-200 text-gray-700 border border-gray-400 px-3 py-1 text-xs hover:bg-gray-300"
            >
              Create
            </button>
          </div>

          {/* Table Header */}
          <div className="bg-gray-100 border-b border-gray-400">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border-r border-gray-400 px-3 py-2 text-left">Ledger Name</th>
                  <th className="px-3 py-2 text-center">Account No.</th>
                </tr>
              </thead>
            </table>
          </div>

          {/* List Items */}
          <div className="bg-white overflow-y-auto" style={{ height: '200px' }}>
            <table className="w-full text-sm">
              <tbody>
                {/* SGST - Highlighted and Clickable */}
                <tr
                  className="bg-orange-300 cursor-pointer hover:bg-orange-400"
                  onClick={() => setShowSGSTBankReconciliation(true)}
                >
                  <td className="border-r border-gray-400 px-3 py-1 text-left">SGST</td>
                  <td className="px-3 py-1 text-center"></td>
                </tr>

                {/* Empty rows for more items */}
                {Array.from({ length: 10 }, (_, index) => (
                  <tr key={`empty-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border-r border-gray-400 px-3 py-1">&nbsp;</td>
                    <td className="px-3 py-1">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* Footer - Now properly visible at the bottom of the screen */}
      <div className="mt-auto">
        <TallyFooter onQuit={onClose} />
      </div>
    </div>
  );
};

export default SelectBankReconciliation;

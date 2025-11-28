import React, { useState } from 'react';
import { X } from 'lucide-react';
import ChequePrinting from './ChequePrinting';
import BankwiseRegister from './BankwiseRegister';
import PostDatedSummary from './PostDatedSummary';
import SelectBank from './SelectBank';
import SelectItem from './SelectItem';
import SelectBankReconciliation from './SelectBankReconciliation';

interface BankingProps {
  onClose: () => void;
}

const Banking: React.FC<BankingProps> = ({ onClose }) => {
  const [showChequePrinting, setShowChequePrinting] = useState(false);
  const [showBankwiseRegister, setShowBankwiseRegister] = useState(false);
  const [showPostDatedSummary, setShowPostDatedSummary] = useState(false);
  const [showSelectBank, setShowSelectBank] = useState(false);
  const [showSelectItem, setShowSelectItem] = useState(false);
  const [showSelectBankReconciliation, setShowSelectBankReconciliation] = useState(false);

  if (showChequePrinting) {
    return <ChequePrinting onClose={() => setShowChequePrinting(false)} />;
  }

  if (showBankwiseRegister) {
    return <BankwiseRegister onClose={() => setShowBankwiseRegister(false)} />;
  }

  if (showPostDatedSummary) {
    return <PostDatedSummary onClose={() => setShowPostDatedSummary(false)} />;
  }

  if (showSelectBank) {
    return <SelectBank onClose={() => setShowSelectBank(false)} />;
  }

  if (showSelectItem) {
    return <SelectItem onClose={() => setShowSelectItem(false)} />;
  }

  if (showSelectBankReconciliation) {
    return <SelectBankReconciliation onClose={() => setShowSelectBankReconciliation(false)} />;
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-100 px-4 py-2 border-b flex items-center justify-between">
        <div className="text-center flex-1">
          <div className="text-lg font-bold text-blue-700">Gateway of Tally</div>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1" style={{ height: "calc(100vh - 120px)" }}>
        {/* Left Panel - Company Info */}
        <div className="w-1/2 p-6 border-r">
          {/* Current Period */}
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-2">CURRENT PERIOD</div>
            <div className="font-medium">1 Apr 24 to 31 Mar 25</div>
          </div>

          {/* Current Date */}
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-2">CURRENT DATE</div>
            <div className="font-medium">Monday, 31 Mar 2025</div>
          </div>

          {/* Company Info */}
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-2">NAME OF COMPANY</div>
            <div className="font-medium">AARTI PVT LMT</div>
          </div>

          {/* Date of Last Entry */}
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-2">DATE OF LAST ENTRY</div>
            <div className="font-medium">31-Mar-25</div>
          </div>
        </div>

        {/* Center Panel - Banking Menu */}
        <div className="w-1/3 flex items-center justify-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 w-64">
            {/* Banking Header */}
            <div className="bg-blue-600 text-white text-center py-2 mb-4 rounded">
              <div className="font-medium">Gateway of Tally</div>
              <div className="text-lg font-bold">Banking</div>
            </div>

            {/* Banking Menu Options */}
            <div className="space-y-1">
              {/* CHEQUE Section */}
              <div className="mb-3">
                <div className="text-xs text-gray-600 mb-1">CHEQUE</div>
                <div className="bg-yellow-400 text-center py-2 rounded">
                  <div
                    className="text-sm font-medium cursor-pointer hover:text-gray-700"
                    onClick={() => setShowChequePrinting(true)}
                  >
                    Cheque Printing
                  </div>
                  <div
                    className="text-sm cursor-pointer hover:text-gray-700"
                    onClick={() => setShowBankwiseRegister(true)}
                  >
                    Cheque Register
                  </div>
                  <div
                    className="text-sm cursor-pointer hover:text-gray-700"
                    onClick={() => setShowPostDatedSummary(true)}
                  >
                    Post dated Summary
                  </div>
                </div>
              </div>

              {/* STATEMENTS Section */}
              <div className="mb-3">
                <div className="text-xs text-gray-600 mb-1">STATEMENTS</div>
                <div className="space-y-1">
                  <div
                    className="text-blue-600 underline cursor-pointer hover:text-blue-800 text-sm"
                    onClick={() => setShowSelectBank(true)}
                  >
                    Deposit Slip
                  </div>
                  <div
                    className="text-blue-600 underline cursor-pointer hover:text-blue-800 text-sm"
                    onClick={() => setShowSelectItem(true)}
                  >
                    Payment Advice
                  </div>
                </div>
              </div>

              {/* Bank Reconciliation */}
              <div className="mb-3">
                <div
                  className="text-blue-600 underline cursor-pointer hover:text-blue-800 text-sm"
                  onClick={() => setShowSelectBankReconciliation(true)}
                >
                  Bank Reconciliation
                </div>
              </div>

              {/* Quit Option */}
              <div className="mt-4">
                <div 
                  className="text-blue-600 underline cursor-pointer hover:text-blue-800 text-sm"
                  onClick={onClose}
                >
                  Quit
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Function Keys Sidebar */}
        <div className="w-48 bg-blue-50 border-l border-gray-300 h-full overflow-y-auto">
          {/* F2: Date */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F2: Date</span>
              <span className="text-xs text-gray-500">Γîâ</span>
            </div>
          </div>

          {/* F3: Company */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F3: Company</span>
              <span className="text-xs text-gray-500">Γîâ</span>
            </div>
          </div>

          {/* Empty space for other function keys */}
          <div className="p-4">
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banking;

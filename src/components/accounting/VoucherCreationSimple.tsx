import React, { useState } from 'react';
import { X } from 'lucide-react';
import TallyFooter from './TallyFooter';
import LedgerAccountsSidebar from './LedgerAccountsSidebar';
import BillwiseDetails from './BillwiseDetails';

interface VoucherEntry {
  account: string;
  amount: string;
  method: string;
}

interface VoucherCreationProps {
  onClose: () => void;
}

const VoucherCreation: React.FC<VoucherCreationProps> = ({ onClose }) => {
  const [account, setAccount] = useState('');
  const [narration, setNarration] = useState('');
  const [amount, setAmount] = useState('');
  const [currentParticular, setCurrentParticular] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [showLedgerSidebar, setShowLedgerSidebar] = useState(false);
  const [showBillwiseDetails, setShowBillwiseDetails] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [voucherEntries, setVoucherEntries] = useState<VoucherEntry[]>([]);
  const [isParticularInput, setIsParticularInput] = useState(false);
  const [showParticularsSection, setShowParticularsSection] = useState(false);

  const handleAccountChange = (value: string) => {
    setAccount(value);
    setShowLedgerSidebar(value.length > 0);
    setIsParticularInput(false); // This is for Account input (upper box)
  };

  const handleParticularChange = (value: string) => {
    setCurrentParticular(value);
    setShowLedgerSidebar(value.length > 0);
    setIsParticularInput(true); // This is for Particulars input (lower box)
  };

  const handleSelectAccount = (selectedAccount: string) => {
    setShowLedgerSidebar(false); // Hide sidebar first

    if (isParticularInput) {
      // For Particulars input (lower box)
      setCurrentParticular(selectedAccount);
      setSelectedAccount(selectedAccount);
      // Show amount input after selecting account
      setTimeout(() => {
        const amountInput = document.getElementById('amount-input');
        if (amountInput) amountInput.focus();
      }, 100);
    } else {
      // For Account input (upper box)
      setAccount(selectedAccount);

      // Show Particulars section only when Cash or SGST is selected
      if (selectedAccount === 'Cash' || selectedAccount === 'SGST') {
        setShowParticularsSection(true);
        // Auto-focus on Particulars input after selecting Account
        setTimeout(() => {
          const particularInput = document.getElementById('particular-input');
          if (particularInput) {
            particularInput.focus();
            particularInput.click(); // Trigger click to ensure focus
          }
        }, 200);
      }
    }
  };

  const handleAmountSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentAmount && currentParticular) {
      setShowBillwiseDetails(true);
    }
  };

  const handleBillwiseSave = (method: string, amount: string) => {
    const newEntry: VoucherEntry = {
      account: currentParticular,
      amount: amount,
      method: method
    };

    setVoucherEntries([...voucherEntries, newEntry]);
    setCurrentParticular('');
    setCurrentAmount('');
    setSelectedAccount('');
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="bg-blue-100 px-4 py-2 border-b flex items-center justify-between">
        <div className="text-center flex-1">
          <div className="text-sm font-medium text-gray-700">AARTI PVT LMT</div>
          <div className="text-lg font-bold text-blue-700">Accounting Voucher Creation</div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1" style={{ height: "calc(100vh - 120px)" }}>
        <div className="flex-1 overflow-y-auto">
          <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="bg-blue-800 px-3 py-1 rounded text-sm font-medium">Payment</span>
              <span className="text-sm">No.</span>
              <span className="bg-white text-blue-600 px-2 py-1 rounded text-sm font-medium">1</span>
            </div>
            <div className="text-right">
              <div className="text-sm">31-Mar-25</div>
              <div className="text-xs">Monday</div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 min-h-full">
            {/* Account Section */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <label className="text-sm font-medium text-gray-700 w-20">Account</label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={account}
                    onChange={(e) => handleAccountChange(e.target.value)}
                    onFocus={() => {
                      setIsParticularInput(false);
                      if (account.length > 0) {
                        setShowLedgerSidebar(true);
                      }
                    }}
                    className="w-full border-2 border-yellow-400 bg-yellow-100 px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"
                    placeholder="Enter account name"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-600 ml-20">Current balance</div>
            </div>

            {/* Particulars Section - Only show when Cash or SGST is selected */}
            {showParticularsSection && (
              <div className="mb-6">
                <div className="bg-white border border-gray-300 rounded">
                  <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 flex">
                    <div className="flex-1 text-sm font-medium text-gray-700">Particulars</div>
                    <div className="w-32 text-sm font-medium text-gray-700 text-right">Amount</div>
                  </div>

                  {/* Voucher Entries */}
                  <div className="min-h-32">
                    {voucherEntries.map((entry, index) => (
                      <div key={index} className="flex border-b border-gray-200 bg-gray-50">
                        <div className="flex-1 p-2 text-sm">{entry.account}</div>
                        <div className="w-32 p-2 text-sm text-right">{entry.amount} Dr</div>
                      </div>
                    ))}

                    {/* Current Input Row */}
                    <div className="flex border-b border-gray-200">
                      <div className="flex-1 p-2">
                        <input
                          id="particular-input"
                          type="text"
                          value={currentParticular}
                          onChange={(e) => handleParticularChange(e.target.value)}
                          onFocus={() => {
                            setIsParticularInput(true);
                            // Always show sidebar when focusing on particulars input
                            setShowLedgerSidebar(true);
                          }}
                          className="w-full border-2 border-yellow-400 bg-yellow-100 px-2 py-1 text-sm focus:outline-none focus:border-yellow-500"
                          placeholder="Enter account name"
                        />
                      </div>
                      <div className="w-32 p-2">
                        <input
                          id="amount-input"
                          type="number"
                          value={currentAmount}
                          onChange={(e) => setCurrentAmount(e.target.value)}
                          onKeyPress={handleAmountSubmit}
                          className="w-full border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:border-blue-500"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Empty rows for spacing */}
                    {voucherEntries.length === 0 && (
                      <div className="p-4" style={{ minHeight: '100px' }}>
                        <div className="text-center text-gray-500 mt-8">
                          <div className="text-sm">Enter voucher details</div>
                          <div className="text-xs mt-1">Press Tab to move between fields</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Narration Section */}
            <div className="mb-6">
              <div className="flex items-start">
                <label className="text-sm font-medium text-gray-700 w-20 mt-2">Narration:</label>
                <div className="flex-1">
                  <textarea
                    value={narration}
                    onChange={(e) => setNarration(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder="Enter narration details"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {showLedgerSidebar && (
          <LedgerAccountsSidebar
            searchTerm={isParticularInput ? currentParticular : account}
            onSelectAccount={handleSelectAccount}
            isParticularInput={isParticularInput}
          />
        )}
      </div>

      {/* Billwise Details Modal */}
      {showBillwiseDetails && (
        <BillwiseDetails
          accountName={selectedAccount}
          amount={currentAmount}
          onClose={() => setShowBillwiseDetails(false)}
          onSave={handleBillwiseSave}
        />
      )}

      <TallyFooter onQuit={onClose} />
    </div>
  );
};

export default VoucherCreation;

import React, { useState } from 'react';
import { X } from 'lucide-react';
import TallyHeader from './TallyHeader';
import LedgerCreation from './LedgerCreation';
import SGSTChequePrinting from './SGSTChequePrinting';

interface ChequePrintingProps {
  onClose: () => void;
}

const ChequePrinting: React.FC<ChequePrintingProps> = ({ onClose }) => {
  const [selectedBank, setSelectedBank] = useState('');
  const [bankName, setBankName] = useState('');
  const [showLedgerCreation, setShowLedgerCreation] = useState(false);
  const [showSGSTChequePrinting, setShowSGSTChequePrinting] = useState(false);

  // Sample bank list
  const banks = [
    'All Items',
    'SGST'
  ];

  if (showLedgerCreation) {
    return <LedgerCreation onClose={() => setShowLedgerCreation(false)} />;
  }

  if (showSGSTChequePrinting) {
    return <SGSTChequePrinting onClose={() => setShowSGSTChequePrinting(false)} />;
  }

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      {/* TallyPrime Header */}
      <TallyHeader />

      {/* Main Content */}
      <div className="flex-1 relative" style={{ height: "calc(100vh - 60px)" }}>
        {/* Background Info */}
        <div className="absolute top-4 left-4 text-sm text-gray-600">
          <div>1 Apr 24 to 31 Mar 25</div>
        </div>

        <div className="absolute top-16 left-4 text-sm text-gray-600">
          <div>AARTI PVT LMT</div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Select Bank Title */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <div className="text-lg font-bold text-blue-700">Select Bank</div>
        </div>

        {/* Company Name Header */}
        <div className="absolute top-12 right-4">
          <div className="text-sm font-medium text-gray-700">AARTI PVT LMT</div>
        </div>

        {/* Central Bank Selection Dialog */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-white border border-gray-300 rounded shadow-lg" style={{ width: '400px' }}>
            {/* Dialog Header */}
            <div className="bg-blue-100 px-4 py-2 border-b text-center">
              <div className="font-medium text-gray-700">Name of Bank</div>
            </div>

            {/* Bank Name Input */}
            <div className="p-4">
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="Enter bank name..."
              />
            </div>

            {/* List of Banks Header */}
            <div className="bg-blue-600 text-white text-center py-2 font-medium">
              List of Banks
            </div>

            {/* Create Button */}
            <div className="bg-yellow-400 text-center py-2 border-b border-gray-300">
              <button
                className="text-sm font-medium hover:text-gray-700"
                onClick={() => setShowLedgerCreation(true)}
              >
                Create
              </button>
            </div>

            {/* Banks List */}
            <div className="bg-blue-50 max-h-64 overflow-y-auto">
              {banks.map((bank, index) => (
                <div
                  key={index}
                  className={`px-4 py-2 cursor-pointer hover:bg-blue-100 border-b border-gray-200 ${
                    index === 0 ? 'bg-white' : index === 1 ? 'bg-yellow-200' : ''
                  }`}
                  onClick={() => {
                    setSelectedBank(bank);
                    if (bank === 'SGST') {
                      setShowSGSTChequePrinting(true);
                    }
                  }}
                >
                  <div className="flex items-center">
                    <span className="text-sm">{bank}</span>
                  </div>
                </div>
              ))}
              
              {/* Empty space for more banks */}
              <div className="h-32"></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-gray-200 border-t border-gray-300 px-4 py-3">
          <div className="flex items-center justify-between text-xs">
            {/* Left Section */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-1">
                <span className="bg-blue-500 text-white px-2 py-1 rounded">Q:</span>
                <span className="text-gray-700">Quit</span>
              </div>
            </div>

            {/* Center Section */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-1">
                <span className="bg-blue-500 text-white px-2 py-1 rounded">A:</span>
                <span className="text-gray-700">Accept</span>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-6">
              {/* Empty for now */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChequePrinting;

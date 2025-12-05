import React from 'react';

interface LedgerAccountsSidebarProps {
  searchTerm: string;
  onSelectAccount: (account: string) => void;
  isParticularInput?: boolean;
}

const LedgerAccountsSidebar: React.FC<LedgerAccountsSidebarProps> = ({ searchTerm, onSelectAccount, isParticularInput = false }) => {
  // Different account lists for different input boxes
  const accountAccounts = ['Cash', 'SGST']; // For upper Account input box
  const particularAccounts = ['Ashok', 'Purchase A/C']; // For lower Particulars input box

  // Choose accounts based on which input box is being used
  const allAccounts = isParticularInput ? particularAccounts : accountAccounts;

  // Filter accounts based on search term
  const filteredAccounts = allAccounts.filter(account =>
    account.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Debug log
  console.log('Sidebar Debug:', {
    searchTerm,
    isParticularInput,
    allAccounts,
    filteredAccounts
  });

  return (
    <div className="w-64 bg-blue-50 border-l border-gray-300 h-full overflow-y-auto">
      {/* Header */}
      <div className="bg-blue-600 text-white text-center py-2 font-medium text-sm">
        List of Ledger Accounts
      </div>
      
      {/* Create Button */}
      <div className="bg-yellow-400 text-center py-2 border-b border-gray-300">
        <button className="text-sm font-medium hover:text-gray-700">
          Create
        </button>
      </div>

      {/* Accounts List */}
      <div className="p-2">
        {filteredAccounts.length > 0 ? (
          <div className="space-y-1">
            {filteredAccounts.map((account, index) => (
              <div
                key={index}
                className={`px-2 py-1 text-sm cursor-pointer hover:bg-blue-100 rounded ${
                  account === 'Ashok' ? 'bg-yellow-300 font-medium' : ''
                }`}
                onClick={() => onSelectAccount(account)}
              >
                {account}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 text-sm mt-4">
            No accounts found
          </div>
        )}
      </div>


    </div>
  );
};

export default LedgerAccountsSidebar;

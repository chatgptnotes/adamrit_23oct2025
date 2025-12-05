import React from 'react';
import { X } from 'lucide-react';
import TallyFooter from './TallyFooter';

interface DayBookProps {
  onClose: () => void;
}

const DayBook: React.FC<DayBookProps> = ({ onClose }) => {
  // Sample data matching the TallyPrime interface
  const dayBookEntries = [
    {
      date: '31-Mar-25',
      particulars: 'Cash',
      vchType: 'Purchase',
      vchNo: '',
      debitAmount: '20,000.00',
      creditAmount: '',
      inwardsQty: '',
      outwardsQty: ''
    }
  ];

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-100 px-4 py-2 border-b flex items-center justify-between">
        <div className="text-center flex-1">
          <div className="text-sm font-medium text-gray-700">AARTI PVT LMT</div>
          <div className="text-lg font-bold text-blue-700">Day Book</div>
          <div className="text-sm text-gray-600">For 31-Mar-25</div>
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
        {/* Left Panel - Day Book Table */}
        <div className="flex-1 overflow-y-auto">
          <div className="bg-white">
            {/* Table Header */}
            <div className="bg-gray-100 border-b">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="border-r border-gray-300 px-3 py-2 text-left w-20">Date</th>
                    <th className="border-r border-gray-300 px-3 py-2 text-left w-64">Particulars</th>
                    <th className="border-r border-gray-300 px-3 py-2 text-left w-24">Vch Type</th>
                    <th className="border-r border-gray-300 px-3 py-2 text-left w-20">Vch No</th>
                    <th className="border-r border-gray-300 px-3 py-2 text-center w-32">
                      <div>Debit Amount</div>
                      <div className="text-xs">Inwards Qty</div>
                    </th>
                    <th className="px-3 py-2 text-center w-32">
                      <div>Credit Amount</div>
                      <div className="text-xs">Outwards Qty</div>
                    </th>
                  </tr>
                </thead>
              </table>
            </div>

            {/* Table Body */}
            <div className="bg-white">
              <table className="w-full text-sm">
                <tbody>
                  {dayBookEntries.map((entry, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-yellow-100' : 'bg-white'}>
                      <td className="border-r border-gray-300 px-3 py-2 w-20">{entry.date}</td>
                      <td className="border-r border-gray-300 px-3 py-2 w-64">{entry.particulars}</td>
                      <td className="border-r border-gray-300 px-3 py-2 w-24">{entry.vchType}</td>
                      <td className="border-r border-gray-300 px-3 py-2 w-20">{entry.vchNo}</td>
                      <td className="border-r border-gray-300 px-3 py-2 text-right w-32">{entry.debitAmount}</td>
                      <td className="border-r border-gray-300 px-3 py-2 text-right w-32">{entry.creditAmount}</td>
                      <td className="border-r border-gray-300 px-3 py-2 text-right w-24">{entry.inwardsQty}</td>
                      <td className="px-3 py-2 text-right w-24">{entry.outwardsQty}</td>
                    </tr>
                  ))}
                  
                  {/* Empty rows to fill the space */}
                  {Array.from({ length: 20 }, (_, index) => (
                    <tr key={`empty-${index}`} className={index % 2 === 1 ? 'bg-yellow-50' : 'bg-white'}>
                      <td className="border-r border-gray-300 px-3 py-2 w-20">&nbsp;</td>
                      <td className="border-r border-gray-300 px-3 py-2 w-64">&nbsp;</td>
                      <td className="border-r border-gray-300 px-3 py-2 w-24">&nbsp;</td>
                      <td className="border-r border-gray-300 px-3 py-2 w-20">&nbsp;</td>
                      <td className="border-r border-gray-300 px-3 py-2 text-right w-32">&nbsp;</td>
                      <td className="border-r border-gray-300 px-3 py-2 text-right w-32">&nbsp;</td>
                      <td className="border-r border-gray-300 px-3 py-2 text-right w-24">&nbsp;</td>
                      <td className="px-3 py-2 text-right w-24">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-48 bg-blue-50 border-l border-gray-300 h-full overflow-y-auto">
          {/* F2: Date */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F2: Date</span>
              <span className="text-xs text-gray-500">⌃</span>
            </div>
          </div>

          {/* F3: Company */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F3: Company</span>
              <span className="text-xs text-gray-500">⌃</span>
            </div>
          </div>

          {/* F4: Voucher Type */}
          <div className="border-b border-gray-300 p-2 bg-yellow-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F4: Voucher Type</span>
            </div>
          </div>

          {/* F5 - Empty */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F5</span>
              <span className="text-xs text-gray-500">⌃</span>
            </div>
          </div>

          {/* F6 - Empty */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F6</span>
              <span className="text-xs text-gray-500">⌃</span>
            </div>
          </div>

          {/* F7: Show Profit */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F7: Show Profit</span>
              <span className="text-xs text-gray-500">⌃</span>
            </div>
          </div>

          {/* F8: Columnar */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F8: Columnar</span>
              <span className="text-xs text-gray-500">⌃</span>
            </div>
          </div>

          {/* F9 - Empty */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F9</span>
              <span className="text-xs text-gray-500">⌃</span>
            </div>
          </div>

          {/* F10 - Empty */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F10</span>
              <span className="text-xs text-gray-500">⌃</span>
            </div>
          </div>

          {/* Empty space */}
          <div className="border-b border-gray-300 p-4">
          </div>

          {/* B: Basis of Values */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800">B: Basis of Values</span>
              <span className="text-xs text-gray-500">⌃</span>
            </div>
          </div>

          {/* L: Change View */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800">L: Change View</span>
              <span className="text-xs text-gray-500">⌃</span>
            </div>
          </div>

          {/* J: Exception Reports */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800">J: Exception Reports</span>
              <span className="text-xs text-gray-500">⌃</span>
            </div>
          </div>

          {/* S: Save View */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800">S: Save View</span>
              <span className="text-xs text-gray-500">⌃</span>
            </div>
          </div>

          {/* E: Apply Filter */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800">E: Apply Filter</span>
              <span className="text-xs text-gray-500">⌃</span>
            </div>
          </div>

          {/* F: Filter Details */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800">F: Filter Details</span>
              <span className="text-xs text-gray-500">⌃</span>
            </div>
          </div>

          {/* Empty space */}
          <div className="p-8">
          </div>

          {/* F12: Configure */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F12: Configure</span>
              <span className="text-xs text-gray-500">⌃</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <TallyFooter onQuit={onClose} />
    </div>
  );
};

export default DayBook;

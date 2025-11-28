import React from 'react';
import { X } from 'lucide-react';
import TallyHeader from './TallyHeader';
import TallyFooter from './TallyFooter';

interface DayBookReportProps {
  onClose: () => void;
}

const DayBookReport: React.FC<DayBookReportProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      <TallyHeader />
      
      <div className="flex flex-1" style={{ height: "calc(100vh - 180px)" }}>
        <div className="flex-1 bg-white flex flex-col">
          {/* Header */}
          <div className="bg-blue-100 px-4 py-2 border-b">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-blue-700">Day Book</div>
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-gray-700">AARTI PVT LMT</div>
                <div className="text-sm text-gray-600">For 31-Mar-25</div>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Day Book Content */}
          <div className="flex-1 flex flex-col p-4" style={{ height: "calc(100vh - 240px)" }}>
            
            {/* Day Book Table */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-1">
                {/* Header Row */}
                <div className="flex bg-gray-100 py-2 px-4 font-medium text-sm border-b">
                  <div className="w-20">Date</div>
                  <div className="flex-1 ml-4">Particulars</div>
                  <div className="w-24 text-center">Vch Type</div>
                  <div className="w-20 text-center">Vch No.</div>
                  <div className="w-32 text-right">Debit Amount</div>
                  <div className="w-32 text-right">Credit Amount</div>
                </div>

                {/* Subheader Row */}
                <div className="flex bg-gray-50 py-1 px-4 text-xs text-gray-600 border-b">
                  <div className="w-20"></div>
                  <div className="flex-1 ml-4"></div>
                  <div className="w-24 text-center"></div>
                  <div className="w-20 text-center"></div>
                  <div className="w-32 text-right">Inwards Qty</div>
                  <div className="w-32 text-right">Outwards Qty</div>
                </div>

                {/* Data Row - 31-Mar-25 Cash Purchase */}
                <div className="flex bg-yellow-300 py-2 px-4 text-sm font-medium">
                  <div className="w-20">31-Mar-25</div>
                  <div className="flex-1 ml-4">Cash</div>
                  <div className="w-24 text-center">Purchase</div>
                  <div className="w-20 text-center">1</div>
                  <div className="w-32 text-right">20,000.00</div>
                  <div className="w-32 text-right"></div>
                </div>

                {/* Empty rows for spacing */}
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
                <div className="py-8"></div>
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

          {/* F4: Voucher Type */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F4: Voucher Type</span>
            </div>
          </div>

          {/* F5 - F10 (Disabled) */}
          {[5, 6, 7, 8, 9, 10].map(num => (
            <div key={num} className="border-b border-gray-300 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">F{num}</span>
              </div>
            </div>
          ))}

          {/* F7: Show Profit */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800">F7: Show Profit</span>
            </div>
          </div>

          {/* F8: Columnar */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800">F8: Columnar</span>
            </div>
          </div>

          {/* Empty space */}
          <div className="border-b border-gray-300 p-4"></div>

          {/* Day Book Options */}
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
        </div>
      </div>

      {/* Footer - Always Visible and Complete */}
      <div className="flex-shrink-0 h-16">
        <TallyFooter onQuit={onClose} />
      </div>
    </div>
  );
};

export default DayBookReport;

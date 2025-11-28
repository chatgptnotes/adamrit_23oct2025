import React from 'react';
import { X } from 'lucide-react';
import TallyHeader from './TallyHeader';
import TallyFooter from './TallyFooter';

interface CashFlowProps {
  onClose: () => void;
}

const CashFlow: React.FC<CashFlowProps> = ({ onClose }) => {
  const months = [
    'April', 'May', 'June', 'July', 'August', 'September', 
    'October', 'November', 'December', 'January', 'February', 'March'
  ];

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      <TallyHeader />
      
      <div className="flex flex-1" style={{ height: "calc(100vh - 180px)" }}>
        <div className="flex-1 bg-white flex flex-col">
          {/* Header */}
          <div className="bg-blue-100 px-4 py-2 border-b">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-blue-700">Cash Flow</div>
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-gray-700">AARTI PVT LMT</div>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Cash Flow Content */}
          <div className="flex-1 flex flex-col p-4" style={{ height: "calc(100vh - 240px)" }}>
            
            {/* Company Info Header */}
            <div className="text-right mb-4">
              <div className="text-sm font-bold">AARTI PVT LMT</div>
              <div className="text-xs">1-Apr-24 to 31-Mar-25</div>
              <div className="flex justify-end space-x-8 text-xs font-medium mt-2">
                <div className="text-center">
                  <div>Cash Movement</div>
                  <div className="flex space-x-4 mt-1">
                    <span>Inflow</span>
                    <span>Outflow</span>
                  </div>
                </div>
                <div className="text-center">
                  <div>Nett</div>
                  <div>Flow</div>
                </div>
              </div>
            </div>

            {/* Cash Flow Table */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-1">
                {/* Header Row */}
                <div className="flex bg-gray-100 py-2 px-4 font-medium text-sm border-b">
                  <div className="flex-1">Particulars</div>
                  <div className="w-32 text-right">Inflow</div>
                  <div className="w-32 text-right">Outflow</div>
                  <div className="w-32 text-right">Nett Flow</div>
                </div>

                {/* Monthly Data */}
                {months.map((month, index) => (
                  <div 
                    key={month} 
                    className={`flex py-1 px-4 text-sm ${
                      month === 'October' ? 'bg-blue-500 text-white font-medium' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1">{month}</div>
                    <div className="w-32 text-right">
                      {month === 'March' ? '20,000.00' : ''}
                    </div>
                    <div className="w-32 text-right">
                      {month === 'March' ? '(20,000.00)' : ''}
                    </div>
                    <div className="w-32 text-right">
                      {month === 'March' ? '' : ''}
                    </div>
                  </div>
                ))}

                {/* Grand Total */}
                <div className="flex bg-gray-100 py-2 px-4 text-sm font-bold border-t border-gray-300 mt-4">
                  <div className="flex-1">Grand Total</div>
                  <div className="w-32 text-right">20,000.00</div>
                  <div className="w-32 text-right">(20,000.00)</div>
                  <div className="w-32 text-right"></div>
                </div>

                {/* Chart Section */}
                <div className="mt-8 bg-gray-50 p-4 border rounded">
                  <div className="text-center text-sm font-medium mb-4">Cash Flow Chart</div>
                  
                  {/* Y-axis labels */}
                  <div className="flex items-end justify-center space-x-2 h-32">
                    <div className="text-xs text-gray-600 mr-2 flex flex-col justify-between h-full">
                      <span>20000</span>
                      <span>10000</span>
                      <span>0</span>
                    </div>
                    
                    {/* Chart bars */}
                    <div className="flex items-end space-x-1 h-full">
                      {['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map((month, index) => (
                        <div key={month} className="flex flex-col items-center">
                          <div className="w-6 bg-gray-300 mb-1" style={{ 
                            height: month === 'Mar' ? '80px' : '2px' 
                          }}>
                            {month === 'Mar' && (
                              <div className="w-full h-full bg-blue-600"></div>
                            )}
                          </div>
                          <span className="text-xs text-gray-600 transform -rotate-45 origin-center mt-2">
                            {month}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-48 bg-blue-50 border-l border-gray-300 h-full overflow-y-auto">
          {/* F2: Period */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F2: Period</span>
            </div>
          </div>

          {/* F3: Company */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">F3: Company</span>
            </div>
          </div>

          {/* F4 - F10 (Disabled) */}
          {[4, 5, 6, 7, 8, 9, 10].map(num => (
            <div key={num} className="border-b border-gray-300 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">F{num}</span>
              </div>
            </div>
          ))}

          {/* F6: Monthly */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800">F6: Monthly</span>
            </div>
          </div>

          {/* Empty space */}
          <div className="border-b border-gray-300 p-4"></div>

          {/* Cash Flow Options */}
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

          {/* Empty space */}
          <div className="p-2"></div>

          {/* Column Options */}
          {[
            'C: New Column',
            'A: Alter Column',
            'D: Delete Column',
            'N: Auto Column'
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

export default CashFlow;

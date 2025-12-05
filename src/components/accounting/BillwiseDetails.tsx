import React, { useState } from 'react';

interface BillwiseDetailsProps {
  accountName: string;
  amount: string;
  onClose: () => void;
  onSave: (method: string, amount: string) => void;
}

const BillwiseDetails: React.FC<BillwiseDetailsProps> = ({ accountName, amount, onClose, onSave }) => {
  const [selectedMethod, setSelectedMethod] = useState('On Account');
  const [enteredAmount, setEnteredAmount] = useState(amount);
  const [showVoucherLines, setShowVoucherLines] = useState(false);
  const [voucherLines, setVoucherLines] = useState([
    { id: 1, typeOfRef: '', name: '', dueDate: '', amount: '', drCr: 'Dr' },
    { id: 2, typeOfRef: '', name: '', dueDate: '', amount: '', drCr: 'Dr' },
    { id: 3, typeOfRef: '', name: '', dueDate: '', amount: '', drCr: 'Dr' }
  ]);
  const [totalDr, setTotalDr] = useState(0);
  const [totalCr, setTotalCr] = useState(0);
  const [difference, setDifference] = useState(0);
  const [enteredDate, setEnteredDate] = useState('31-Mar-25');

  const methods = [
    'Advance',
    'Agst Ref',
    'New Ref',
    'On Account'
  ];

  const handleMethodChange = (method: string) => {
    setSelectedMethod(method);
    setShowVoucherLines(true); // Show detailed UI after method selection
  };

  const handleVoucherLineChange = (id: number, field: string, value: string) => {
    const updatedLines = voucherLines.map(line =>
      line.id === id ? { ...line, [field]: value } : line
    );
    setVoucherLines(updatedLines);

    // Calculate totals like TallyPrime
    calculateTotals(updatedLines);
  };

  const calculateTotals = (lines: any[]) => {
    let drTotal = 0;
    let crTotal = 0;

    lines.forEach(line => {
      const amount = parseFloat(line.amount) || 0;
      if (line.drCr === 'Dr') {
        drTotal += amount;
      } else {
        crTotal += amount;
      }
    });

    setTotalDr(drTotal);
    setTotalCr(crTotal);
    setDifference(drTotal - crTotal);
  };

  const toggleDrCr = (id: number) => {
    const updatedLines = voucherLines.map(line =>
      line.id === id ? { ...line, drCr: line.drCr === 'Dr' ? 'Cr' : 'Dr' } : line
    );
    setVoucherLines(updatedLines);
    calculateTotals(updatedLines);
  };

  const handleSave = () => {
    onSave(selectedMethod, enteredAmount);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-2 border-gray-400 w-96 max-h-96 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-400">
          <div className="text-sm font-medium text-center">
            Bill-wise Details for : <span className="font-bold">{accountName}</span>
          </div>
          <div className="text-xs text-center">
            Up to : ₹ {amount} Dr
          </div>
        </div>

        {/* Table Header */}
        <div className="bg-gray-50 border-b border-gray-400">
          <div className="flex text-xs font-medium">
            <div className="w-20 p-2 border-r border-gray-400 text-center">Type of Ref</div>
            <div className="w-24 p-2 border-r border-gray-400 text-center">Name</div>
            <div className="w-24 p-2 border-r border-gray-400 text-center">Due Date, or Credit Days</div>
            <div className="w-20 p-2 text-center">Amount Dr/ Cr</div>
          </div>
        </div>

        {/* Content */}
        <div className="h-80 overflow-y-auto">
          {!showVoucherLines ? (
            /* First UI - Method Selection with dropdown */
            <>
              {/* Header Row */}
              <div className="flex text-xs font-medium bg-gray-100 border-b border-gray-400">
                <div className="w-20 p-2 border-r border-gray-400 text-center">Type of Ref</div>
                <div className="w-32 p-2 border-r border-gray-400 text-center">Name</div>
                <div className="w-32 p-2 border-r border-gray-400 text-center">Due Date, or Credit Days</div>
                <div className="w-24 p-2 text-center">Amount Dr/ Cr</div>
              </div>

              {/* Second Header Row */}
              <div className="flex text-xs font-medium bg-gray-50 border-b border-gray-400">
                <div className="w-20 p-2 border-r border-gray-400 text-center">Type of Ref</div>
                <div className="w-32 p-2 border-r border-gray-400 text-center">Name</div>
                <div className="w-32 p-2 border-r border-gray-400 text-center">Due Date, or Credit Days</div>
                <div className="w-24 p-2 text-center">Amount Dr/ Cr</div>
              </div>

              {/* Method Selection Row */}
              <div className="flex text-xs border-b border-gray-400">
                <div className="w-20 p-2 border-r border-gray-400">
                  <div className="bg-blue-600 text-white text-center py-1 text-xs">
                    Method of Adj
                  </div>
                </div>
                <div className="w-32 p-2 border-r border-gray-400">
                  <select
                    value={selectedMethod}
                    onChange={(e) => handleMethodChange(e.target.value)}
                    className="w-full text-xs border-none outline-none bg-transparent"
                  >
                    {methods.map((method) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
                <div className="w-32 p-2 border-r border-gray-400 text-center text-xs">
                  <input
                    type="text"
                    value={enteredDate}
                    onChange={(e) => setEnteredDate(e.target.value)}
                    className="w-full text-xs text-center border border-gray-400 outline-none bg-white px-1"
                    placeholder="31-Mar-25"
                  />
                </div>
                <div className="w-24 p-2"></div>
              </div>

              {/* Advance Row - Shows selected method */}
              <div className="flex text-xs bg-yellow-200 border-b border-gray-400">
                <div className="w-20 p-2 border-r border-gray-400">
                  <div className="bg-yellow-400 text-center py-1 text-xs font-medium">
                    {selectedMethod}
                  </div>
                </div>
                <div className="w-32 p-2 border-r border-gray-400">
                  <input
                    type="text"
                    className="w-full text-xs border border-gray-400 outline-none bg-blue-100 px-1"
                    placeholder="Enter details"
                  />
                </div>
                <div className="w-32 p-2 border-r border-gray-400 text-center text-xs">
                  <input
                    type="text"
                    value={enteredDate}
                    onChange={(e) => setEnteredDate(e.target.value)}
                    className="w-full text-xs text-center border border-gray-400 outline-none bg-white px-1"
                    placeholder="31-Mar-25"
                  />
                </div>
                <div className="w-24 p-2 text-right">
                  <input
                    type="number"
                    value={enteredAmount}
                    onChange={(e) => setEnteredAmount(e.target.value)}
                    className="w-full text-xs text-right border border-gray-400 outline-none bg-white px-1"
                    placeholder="0.00"
                    step="0.01"
                  />
                  <span className="text-xs ml-1">Dr</span>
                </div>
              </div>

              {/* Empty space */}
              <div style={{ height: '200px' }} className="bg-white">
                {/* Empty content area */}
              </div>
            </>
          ) : (
            /* Second UI - Simpler view after selecting Advance */
            <>
              {/* Header Row */}
              <div className="flex text-xs font-medium bg-gray-100 border-b border-gray-400">
                <div className="w-20 p-2 border-r border-gray-400 text-center">Type of Ref</div>
                <div className="w-32 p-2 border-r border-gray-400 text-center">Name</div>
                <div className="w-32 p-2 border-r border-gray-400 text-center">Due Date, or Credit Days</div>
                <div className="w-24 p-2 text-center">Amount Dr/ Cr</div>
              </div>

              {/* Advance Row - Simple version as in second image */}
              <div className="flex text-xs bg-yellow-200 border-b border-gray-400">
                <div className="w-20 p-2 border-r border-gray-400">
                  <div className="bg-yellow-400 text-center py-1 text-xs font-medium">
                    {selectedMethod}
                  </div>
                </div>
                <div className="w-32 p-2 border-r border-gray-400">
                  <input
                    type="text"
                    value="1"
                    className="w-full text-xs border border-gray-400 outline-none bg-yellow-100 px-1 text-center"
                    readOnly
                  />
                </div>
                <div className="w-32 p-2 border-r border-gray-400 text-center text-xs">
                  <input
                    type="text"
                    value={enteredDate}
                    onChange={(e) => setEnteredDate(e.target.value)}
                    className="w-full text-xs text-center border border-gray-400 outline-none bg-white px-1"
                    placeholder="31-Mar-25"
                  />
                </div>
                <div className="w-24 p-2 text-right">
                  <input
                    type="number"
                    value={enteredAmount}
                    onChange={(e) => setEnteredAmount(e.target.value)}
                    className="w-full text-xs text-right border border-gray-400 outline-none bg-white px-1"
                    placeholder="0.00"
                    step="0.01"
                  />
                  <span className="text-xs ml-1">Dr</span>
                </div>
              </div>

              {/* Empty space */}
              <div style={{ height: '300px' }} className="bg-white">
                {/* Empty content area */}
              </div>

              {/* Bottom total line */}
              <div className="border-t border-gray-400 bg-white">
                <div className="flex justify-end p-2">
                  <span className="text-xs font-medium">90.00 Dr</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-400 bg-gray-50 p-2">
          <div className="flex justify-between items-center">
            <div className="text-xs">
              <button 
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 px-3 py-1 text-xs rounded"
              >
                Cancel
              </button>
            </div>
            <div className="text-xs font-medium">
              ₹ {enteredAmount} Dr
            </div>
            <div className="text-xs">
              <button 
                onClick={handleSave}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs rounded"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillwiseDetails;

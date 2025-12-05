import React, { useState } from 'react';
import { format } from 'date-fns';

// Define proper types for financial data
type FinancialRow = {
  advancePayment: string;
  clinicalServices: string;
  laboratoryServices: string;
  radiology: string;
  pharmacy: string;
  implant: string;
  blood: string;
  surgery: string;
  mandatoryServices: string;
  physiotherapy: string;
  consultation: string;
  surgeryInternalReport: string;
  implantCost: string;
};

type FinancialData = {
  totalAmount: FinancialRow;
  discount: FinancialRow;
  amountPaid: FinancialRow;
  refundedAmount: FinancialRow;
  balance: FinancialRow;
};

const FinancialSummary = () => {
  // State for all input values
  const [financialData, setFinancialData] = useState<FinancialData>({
    // Row 1: Total Amount
    totalAmount: {
      advancePayment: '',
      clinicalServices: '11276',
      laboratoryServices: '6565',
      radiology: '28000',
      pharmacy: '',
      implant: '',
      blood: '',
      surgery: '',
      mandatoryServices: '6100',
      physiotherapy: '',
      consultation: '10000',
      surgeryInternalReport: '',
      implantCost: ''
    },
    // Row 2: Discount
    discount: {
      advancePayment: '',
      clinicalServices: '2256',
      laboratoryServices: '1315',
      radiology: '200',
      pharmacy: '',
      implant: '',
      blood: '',
      surgery: '',
      mandatoryServices: '',
      physiotherapy: '',
      consultation: '',
      surgeryInternalReport: '',
      implantCost: ''
    },
    // Row 3: Amount Paid
    amountPaid: {
      advancePayment: '29000',
      clinicalServices: '',
      laboratoryServices: '',
      radiology: '',
      pharmacy: '',
      implant: '',
      blood: '',
      surgery: '',
      mandatoryServices: '',
      physiotherapy: '',
      consultation: '',
      surgeryInternalReport: '',
      implantCost: ''
    },
    // Row 4: Refunded Amount
    refundedAmount: {
      advancePayment: '',
      clinicalServices: '',
      laboratoryServices: '',
      radiology: '',
      pharmacy: '',
      implant: '',
      blood: '',
      surgery: '',
      mandatoryServices: '',
      physiotherapy: '',
      consultation: '',
      surgeryInternalReport: '',
      implantCost: ''
    },
    // Row 5: Balance
    balance: {
      advancePayment: '',
      clinicalServices: '9020',
      laboratoryServices: '5250',
      radiology: '27800',
      pharmacy: '',
      implant: '',
      blood: '',
      surgery: '',
      mandatoryServices: '6100',
      physiotherapy: '',
      consultation: '10000',
      surgeryInternalReport: '',
      implantCost: ''
    }
  });

  // Handle input change
  const handleInputChange = (row: keyof FinancialData, column: keyof FinancialRow, value: string) => {
    setFinancialData(prev => ({
      ...prev,
      [row]: {
        ...prev[row],
        [column]: value
      }
    }));
  };

  // Handle submit for individual cell
  const handleSubmit = (row: keyof FinancialData, column: keyof FinancialRow) => {
    console.log(`Submitted ${row} - ${column}:`, financialData[row][column]);
    // Here you can add API call to save the data
    alert(`✅ ${row} - ${column} updated successfully!`);
  };
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Financial Summary</h1>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Date:</label>
              <input
                type="date"
                className="border border-gray-300 rounded px-3 py-1 text-sm"
                defaultValue={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm">
              Start Package
            </button>
          </div>
        </div>

        {/* Financial Summary Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Financial Summary Table</h2>
          
          <div className="flex">
            {/* Vertical Row Labels Sidebar */}
            <div className="flex flex-col mr-2">
              <div className="h-12 bg-gray-100 border border-gray-300 p-2 text-sm font-medium flex items-center justify-center mb-1">
                Total Amount
              </div>
              <div className="h-12 bg-gray-100 border border-gray-300 p-2 text-sm font-medium flex items-center justify-center mb-1">
                Discount
              </div>
              <div className="h-12 bg-gray-100 border border-gray-300 p-2 text-sm font-medium flex items-center justify-center mb-1">
                Amount Paid
              </div>
              <div className="h-12 bg-gray-100 border border-gray-300 p-2 text-sm font-medium flex items-center justify-center mb-1">
                Refunded Amount
              </div>
              <div className="h-12 bg-gray-100 border border-gray-300 p-2 text-sm font-medium flex items-center justify-center">
                Balance
              </div>
            </div>

            {/* Main Table */}
            <div className="flex-1 overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="border border-gray-300 p-2 text-center font-bold">Advance Payment</th>
                    <th className="border border-gray-300 p-2 text-center font-bold">Clinical Services</th>
                    <th className="border border-gray-300 p-2 text-center font-bold">Laboratory Services</th>
                    <th className="border border-gray-300 p-2 text-center font-bold">Radiology</th>
                    <th className="border border-gray-300 p-2 text-center font-bold">Pharmacy</th>
                    <th className="border border-gray-300 p-2 text-center font-bold">Implant</th>
                    <th className="border border-gray-300 p-2 text-center font-bold">Blood</th>
                    <th className="border border-gray-300 p-2 text-center font-bold">Surgery</th>
                    <th className="border border-gray-300 p-2 text-center font-bold">Mandatory services</th>
                    <th className="border border-gray-300 p-2 text-center font-bold">Physiotherapy</th>
                    <th className="border border-gray-300 p-2 text-center font-bold">Consultation</th>
                    <th className="border border-gray-300 p-2 text-center font-bold">Surgery for Internal Report and Yojnas</th>
                    <th className="border border-gray-300 p-2 text-center font-bold">Implant Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: Total Amount */}
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.totalAmount.advancePayment}
                          onChange={(e) => handleInputChange('totalAmount', 'advancePayment', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('totalAmount', 'advancePayment')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.totalAmount.clinicalServices}
                          onChange={(e) => handleInputChange('totalAmount', 'clinicalServices', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('totalAmount', 'clinicalServices')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.totalAmount.laboratoryServices}
                          onChange={(e) => handleInputChange('totalAmount', 'laboratoryServices', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('totalAmount', 'laboratoryServices')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.totalAmount.radiology}
                          onChange={(e) => handleInputChange('totalAmount', 'radiology', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('totalAmount', 'radiology')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.totalAmount.pharmacy}
                          onChange={(e) => handleInputChange('totalAmount', 'pharmacy', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('totalAmount', 'pharmacy')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.totalAmount.implant}
                          onChange={(e) => handleInputChange('totalAmount', 'implant', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('totalAmount', 'implant')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.totalAmount.blood}
                          onChange={(e) => handleInputChange('totalAmount', 'blood', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('totalAmount', 'blood')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.totalAmount.surgery}
                          onChange={(e) => handleInputChange('totalAmount', 'surgery', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('totalAmount', 'surgery')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.totalAmount.mandatoryServices}
                          onChange={(e) => handleInputChange('totalAmount', 'mandatoryServices', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('totalAmount', 'mandatoryServices')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.totalAmount.physiotherapy}
                          onChange={(e) => handleInputChange('totalAmount', 'physiotherapy', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('totalAmount', 'physiotherapy')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.totalAmount.consultation}
                          onChange={(e) => handleInputChange('totalAmount', 'consultation', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('totalAmount', 'consultation')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.totalAmount.surgeryInternalReport}
                          onChange={(e) => handleInputChange('totalAmount', 'surgeryInternalReport', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('totalAmount', 'surgeryInternalReport')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.totalAmount.implantCost}
                          onChange={(e) => handleInputChange('totalAmount', 'implantCost', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('totalAmount', 'implantCost')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Row 2: Discount */}
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.discount.advancePayment}
                          onChange={(e) => handleInputChange('discount', 'advancePayment', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('discount', 'advancePayment')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.discount.clinicalServices}
                          onChange={(e) => handleInputChange('discount', 'clinicalServices', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('discount', 'clinicalServices')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.discount.laboratoryServices}
                          onChange={(e) => handleInputChange('discount', 'laboratoryServices', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('discount', 'laboratoryServices')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.discount.radiology}
                          onChange={(e) => handleInputChange('discount', 'radiology', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('discount', 'radiology')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.discount.pharmacy}
                          onChange={(e) => handleInputChange('discount', 'pharmacy', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('discount', 'pharmacy')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.discount.implant}
                          onChange={(e) => handleInputChange('discount', 'implant', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('discount', 'implant')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.discount.blood}
                          onChange={(e) => handleInputChange('discount', 'blood', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('discount', 'blood')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.discount.surgery}
                          onChange={(e) => handleInputChange('discount', 'surgery', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('discount', 'surgery')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.discount.mandatoryServices}
                          onChange={(e) => handleInputChange('discount', 'mandatoryServices', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('discount', 'mandatoryServices')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.discount.physiotherapy}
                          onChange={(e) => handleInputChange('discount', 'physiotherapy', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('discount', 'physiotherapy')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.discount.consultation}
                          onChange={(e) => handleInputChange('discount', 'consultation', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('discount', 'consultation')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.discount.surgeryInternalReport}
                          onChange={(e) => handleInputChange('discount', 'surgeryInternalReport', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('discount', 'surgeryInternalReport')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.discount.implantCost}
                          onChange={(e) => handleInputChange('discount', 'implantCost', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('discount', 'implantCost')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Row 3: Amount Paid */}
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.amountPaid.advancePayment}
                          onChange={(e) => handleInputChange('amountPaid', 'advancePayment', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('amountPaid', 'advancePayment')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.amountPaid.clinicalServices}
                          onChange={(e) => handleInputChange('amountPaid', 'clinicalServices', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('amountPaid', 'clinicalServices')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.amountPaid.laboratoryServices}
                          onChange={(e) => handleInputChange('amountPaid', 'laboratoryServices', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('amountPaid', 'laboratoryServices')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.amountPaid.radiology}
                          onChange={(e) => handleInputChange('amountPaid', 'radiology', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('amountPaid', 'radiology')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.amountPaid.pharmacy}
                          onChange={(e) => handleInputChange('amountPaid', 'pharmacy', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('amountPaid', 'pharmacy')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.amountPaid.implant}
                          onChange={(e) => handleInputChange('amountPaid', 'implant', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('amountPaid', 'implant')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.amountPaid.blood}
                          onChange={(e) => handleInputChange('amountPaid', 'blood', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('amountPaid', 'blood')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.amountPaid.surgery}
                          onChange={(e) => handleInputChange('amountPaid', 'surgery', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('amountPaid', 'surgery')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.amountPaid.mandatoryServices}
                          onChange={(e) => handleInputChange('amountPaid', 'mandatoryServices', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('amountPaid', 'mandatoryServices')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.amountPaid.physiotherapy}
                          onChange={(e) => handleInputChange('amountPaid', 'physiotherapy', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('amountPaid', 'physiotherapy')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.amountPaid.consultation}
                          onChange={(e) => handleInputChange('amountPaid', 'consultation', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('amountPaid', 'consultation')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.amountPaid.surgeryInternalReport}
                          onChange={(e) => handleInputChange('amountPaid', 'surgeryInternalReport', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('amountPaid', 'surgeryInternalReport')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.amountPaid.implantCost}
                          onChange={(e) => handleInputChange('amountPaid', 'implantCost', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('amountPaid', 'implantCost')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Row 4: Refunded Amount */}
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.refundedAmount.advancePayment}
                          onChange={(e) => handleInputChange('refundedAmount', 'advancePayment', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('refundedAmount', 'advancePayment')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.refundedAmount.clinicalServices}
                          onChange={(e) => handleInputChange('refundedAmount', 'clinicalServices', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('refundedAmount', 'clinicalServices')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.refundedAmount.laboratoryServices}
                          onChange={(e) => handleInputChange('refundedAmount', 'laboratoryServices', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('refundedAmount', 'laboratoryServices')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.refundedAmount.radiology}
                          onChange={(e) => handleInputChange('refundedAmount', 'radiology', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('refundedAmount', 'radiology')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.refundedAmount.pharmacy}
                          onChange={(e) => handleInputChange('refundedAmount', 'pharmacy', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('refundedAmount', 'pharmacy')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.refundedAmount.implant}
                          onChange={(e) => handleInputChange('refundedAmount', 'implant', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('refundedAmount', 'implant')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.refundedAmount.blood}
                          onChange={(e) => handleInputChange('refundedAmount', 'blood', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('refundedAmount', 'blood')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.refundedAmount.surgery}
                          onChange={(e) => handleInputChange('refundedAmount', 'surgery', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('refundedAmount', 'surgery')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.refundedAmount.mandatoryServices}
                          onChange={(e) => handleInputChange('refundedAmount', 'mandatoryServices', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('refundedAmount', 'mandatoryServices')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.refundedAmount.physiotherapy}
                          onChange={(e) => handleInputChange('refundedAmount', 'physiotherapy', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('refundedAmount', 'physiotherapy')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.refundedAmount.consultation}
                          onChange={(e) => handleInputChange('refundedAmount', 'consultation', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('refundedAmount', 'consultation')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.refundedAmount.surgeryInternalReport}
                          onChange={(e) => handleInputChange('refundedAmount', 'surgeryInternalReport', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('refundedAmount', 'surgeryInternalReport')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.refundedAmount.implantCost}
                          onChange={(e) => handleInputChange('refundedAmount', 'implantCost', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('refundedAmount', 'implantCost')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Row 5: Balance */}
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.balance.advancePayment}
                          onChange={(e) => handleInputChange('balance', 'advancePayment', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('balance', 'advancePayment')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.balance.clinicalServices}
                          onChange={(e) => handleInputChange('balance', 'clinicalServices', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('balance', 'clinicalServices')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.balance.laboratoryServices}
                          onChange={(e) => handleInputChange('balance', 'laboratoryServices', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('balance', 'laboratoryServices')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.balance.radiology}
                          onChange={(e) => handleInputChange('balance', 'radiology', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('balance', 'radiology')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.balance.pharmacy}
                          onChange={(e) => handleInputChange('balance', 'pharmacy', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('balance', 'pharmacy')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.balance.implant}
                          onChange={(e) => handleInputChange('balance', 'implant', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('balance', 'implant')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.balance.blood}
                          onChange={(e) => handleInputChange('balance', 'blood', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('balance', 'blood')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.balance.surgery}
                          onChange={(e) => handleInputChange('balance', 'surgery', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('balance', 'surgery')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.balance.mandatoryServices}
                          onChange={(e) => handleInputChange('balance', 'mandatoryServices', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('balance', 'mandatoryServices')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.balance.physiotherapy}
                          onChange={(e) => handleInputChange('balance', 'physiotherapy', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('balance', 'physiotherapy')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.balance.consultation}
                          onChange={(e) => handleInputChange('balance', 'consultation', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('balance', 'consultation')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.balance.surgeryInternalReport}
                          onChange={(e) => handleInputChange('balance', 'surgeryInternalReport', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('balance', 'surgeryInternalReport')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={financialData.balance.implantCost}
                          onChange={(e) => handleInputChange('balance', 'implantCost', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleSubmit('balance', 'implantCost')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-6 justify-center">
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              Advance Payment
            </button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              Invoice
            </button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              Corporate Bill
            </button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              Final Payment
            </button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              P2 Form
            </button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              Detailed Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;

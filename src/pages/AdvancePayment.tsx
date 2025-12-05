import React, { useState } from 'react';
import { format } from 'date-fns';

const AdvancePayment = () => {
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle advance payment submission
    console.log('Advance Payment:', {
      amount: advanceAmount,
      method: paymentMethod,
      patientName,
      patientId,
      date: format(new Date(), 'yyyy-MM-dd')
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Advance Payment</h1>
          <p className="text-gray-600">Record advance payments for patients</p>
        </div>

        {/* Advance Payment Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Details</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Name
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter patient name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient ID
                </label>
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter patient ID"
                  required
                />
              </div>
            </div>

            {/* Payment Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Advance Amount (₹)
              </label>
              <input
                type="number"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter amount"
                required
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date
              </label>
              <input
                type="date"
                defaultValue={format(new Date(), 'yyyy-MM-dd')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Record Advance Payment
              </button>
            </div>
          </form>
        </div>

        {/* Recent Advance Payments */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Advance Payments</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-blue-100">
                  <th className="border border-gray-300 p-2 text-center font-bold">Date</th>
                  <th className="border border-gray-300 p-2 text-center font-bold">Patient Name</th>
                  <th className="border border-gray-300 p-2 text-center font-bold">Patient ID</th>
                  <th className="border border-gray-300 p-2 text-center font-bold">Amount</th>
                  <th className="border border-gray-300 p-2 text-center font-bold">Method</th>
                  <th className="border border-gray-300 p-2 text-center font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 p-2 text-center">2024-01-15</td>
                  <td className="border border-gray-300 p-2 text-center">John Doe</td>
                  <td className="border border-gray-300 p-2 text-center">P001</td>
                  <td className="border border-gray-300 p-2 text-center">₹29,000</td>
                  <td className="border border-gray-300 p-2 text-center">Cash</td>
                  <td className="border border-gray-300 p-2 text-center">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Completed</span>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 p-2 text-center">2024-01-14</td>
                  <td className="border border-gray-300 p-2 text-center">Jane Smith</td>
                  <td className="border border-gray-300 p-2 text-center">P002</td>
                  <td className="border border-gray-300 p-2 text-center">₹15,000</td>
                  <td className="border border-gray-300 p-2 text-center">Card</td>
                  <td className="border border-gray-300 p-2 text-center">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Completed</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancePayment;

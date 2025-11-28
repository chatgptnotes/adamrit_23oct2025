import React, { useState } from 'react';
import { format } from 'date-fns';

const CorporateBill = () => {
  const [selectedCorporate, setSelectedCorporate] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [billType, setBillType] = useState('comprehensive');

  const corporateData = [
    { id: 'C001', name: 'ABC Corporation', contact: 'Mr. John Smith', phone: '+91-9876543210' },
    { id: 'C002', name: 'XYZ Industries', contact: 'Ms. Sarah Johnson', phone: '+91-9876543211' },
    { id: 'C003', name: 'DEF Enterprises', contact: 'Mr. Mike Wilson', phone: '+91-9876543212' }
  ];

  const sampleCorporateBill = {
    corporateName: 'ABC Corporation',
    corporateId: 'C001',
    contactPerson: 'Mr. John Smith',
    patientName: 'John Doe',
    patientId: 'P001',
    admissionDate: '2024-01-10',
    dischargeDate: '2024-01-15',
    totalAmount: 78141,
    corporateDiscount: 15,
    discountAmount: 11721,
    finalAmount: 66420,
    services: [
      { name: 'Clinical Services', amount: 11276, discount: 1691 },
      { name: 'Laboratory Services', amount: 6565, discount: 985 },
      { name: 'Radiology', amount: 28000, discount: 4200 },
      { name: 'Mandatory Services', amount: 6100, discount: 915 },
      { name: 'Consultation', amount: 10000, discount: 1500 },
      { name: 'Accommodation Charges', amount: 16200, discount: 2430 }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Corporate Bill Management</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Corporate:</label>
              <select
                value={selectedCorporate}
                onChange={(e) => setSelectedCorporate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="">Select Corporate</option>
                {corporateData.map(corp => (
                  <option key={corp.id} value={corp.id}>{corp.id} - {corp.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Patient:</label>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="">Select Patient</option>
                <option value="P001">P001 - John Doe</option>
                <option value="P002">P002 - Jane Smith</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Bill Type:</label>
              <select
                value={billType}
                onChange={(e) => setBillType(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="comprehensive">Comprehensive</option>
                <option value="summary">Summary</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm">
              Generate Corporate Bill
            </button>
          </div>
        </div>

        {/* Corporate Bill Preview */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Corporate Bill Preview</h2>
          
          {/* Bill Header */}
          <div className="border-b border-gray-300 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">CORPORATE BILL</h3>
                <p className="text-gray-600">Bill #: CB-2024-001</p>
                <p className="text-gray-600">Date: {format(new Date(), 'dd/MM/yyyy')}</p>
              </div>
              <div className="text-right">
                <h4 className="font-bold text-gray-900">Corporate Details</h4>
                <p className="text-gray-600">Name: {sampleCorporateBill.corporateName}</p>
                <p className="text-gray-600">ID: {sampleCorporateBill.corporateId}</p>
                <p className="text-gray-600">Contact: {sampleCorporateBill.contactPerson}</p>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-gray-900">Patient Details</h4>
              <p className="text-gray-600">Name: {sampleCorporateBill.patientName}</p>
              <p className="text-gray-600">ID: {sampleCorporateBill.patientId}</p>
              <p className="text-gray-600">Admission: {format(new Date(sampleCorporateBill.admissionDate), 'dd/MM/yyyy')}</p>
              <p className="text-gray-600">Discharge: {format(new Date(sampleCorporateBill.dischargeDate), 'dd/MM/yyyy')}</p>
            </div>
          </div>

          {/* Services Table */}
          <div className="mb-6">
            <h4 className="font-bold text-gray-900 mb-3">Services with Corporate Discount</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="border border-gray-300 p-2 text-left font-bold">Service Description</th>
                    <th className="border border-gray-300 p-2 text-center font-bold">Original Amount (₹)</th>
                    <th className="border border-gray-300 p-2 text-center font-bold">Discount ({sampleCorporateBill.corporateDiscount}%)</th>
                    <th className="border border-gray-300 p-2 text-center font-bold">Final Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleCorporateBill.services.map((service, index) => (
                    <tr key={index} className="bg-gray-50">
                      <td className="border border-gray-300 p-2">{service.name}</td>
                      <td className="border border-gray-300 p-2 text-center">{service.amount.toLocaleString()}</td>
                      <td className="border border-gray-300 p-2 text-center">{service.discount.toLocaleString()}</td>
                      <td className="border border-gray-300 p-2 text-center">{(service.amount - service.discount).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="border-t border-gray-300 pt-4">
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Total Amount:</span>
                  <span>₹{sampleCorporateBill.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Corporate Discount:</span>
                  <span>₹{sampleCorporateBill.discountAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-gray-300 pt-2">
                  <span className="font-bold">Final Amount:</span>
                  <span className="font-bold">₹{sampleCorporateBill.finalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Corporate Terms */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-bold text-gray-900 mb-2">Corporate Terms & Conditions</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Payment due within 30 days of bill generation</li>
              <li>• Corporate discount of {sampleCorporateBill.corporateDiscount}% applied</li>
              <li>• All disputes subject to local jurisdiction</li>
              <li>• Late payment may incur additional charges</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            <button className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              Print Corporate Bill
            </button>
            <button className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
              Download PDF
            </button>
            <button className="px-6 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors">
              Email to Corporate
            </button>
            <button className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors">
              Send for Approval
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporateBill;

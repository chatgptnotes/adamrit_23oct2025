import React, { useState } from 'react';
import { X } from 'lucide-react';
import TallyHeader from './TallyHeader';

interface LedgerCreationProps {
  onClose: () => void;
}

const LedgerCreation: React.FC<LedgerCreationProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    alias: '',
    under: '',
    capitalAccount: '',
    mailingName: '',
    mailingAddress: '',
    state: 'Maharashtra',
    country: 'India',
    pincode: '',
    provideBankDetails: 'No',
    panitNo: '',
    registrationType: 'Regular',
    gstin: '',
    setAlterGstDetails: 'No'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      {/* TallyPrime Header */}
      <TallyHeader />

      {/* Main Content */}
      <div className="flex flex-1" style={{ height: "calc(100vh - 60px)" }}>
        {/* Left Panel - Form */}
        <div className="flex-1 bg-white p-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-lg font-bold text-blue-700">Ledger Creation (Secondary)</div>
            <div className="text-sm font-medium text-gray-700">AARTI PVT LMT</div>
          </div>

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Name and Alias */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  placeholder="(alias)"
                />
              </div>
              <div></div>
            </div>

            {/* Under and Capital Account */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Under</label>
                <input
                  type="text"
                  value={formData.under}
                  onChange={(e) => handleInputChange('under', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capital Account</label>
                <input
                  type="text"
                  value={formData.capitalAccount}
                  onChange={(e) => handleInputChange('capitalAccount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Mailing Details Section */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Mailing Details</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.mailingName}
                    onChange={(e) => handleInputChange('mailingName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div></div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={formData.mailingAddress}
                    onChange={(e) => handleInputChange('mailingAddress', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    rows={3}
                  />
                </div>
                <div></div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div></div>
              </div>
            </div>

            {/* Banking Details Section */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Banking Details</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provide bank details</label>
                  <select
                    value={formData.provideBankDetails}
                    onChange={(e) => handleInputChange('provideBankDetails', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div></div>
              </div>
            </div>

            {/* Tax Registration Details Section */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Tax Registration Details</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN/IT No.</label>
                  <input
                    type="text"
                    value={formData.panitNo}
                    onChange={(e) => handleInputChange('panitNo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div></div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration type</label>
                  <select
                    value={formData.registrationType}
                    onChange={(e) => handleInputChange('registrationType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Composition">Composition</option>
                  </select>
                </div>
                <div></div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN/UIN</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => handleInputChange('gstin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div></div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Set/Alter additional GST details</label>
                  <select
                    value={formData.setAlterGstDetails}
                    onChange={(e) => handleInputChange('setAlterGstDetails', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div></div>
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

          {/* F4 - Empty */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F4</span>
            </div>
          </div>

          {/* F5 - Empty */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F5</span>
            </div>
          </div>

          {/* F6 - Empty */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F6</span>
            </div>
          </div>

          {/* F7 - Empty */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F7</span>
            </div>
          </div>

          {/* F8 - Empty */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F8</span>
            </div>
          </div>

          {/* F9 - Empty */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">F9</span>
            </div>
          </div>

          {/* F10: Other Masters */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800">F10: Other Masters</span>
            </div>
          </div>

          {/* More Details */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800">I: More Details</span>
            </div>
          </div>

          {/* Empty space */}
          <div className="p-4"></div>

          {/* B: Get HSN/SAC Info */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800">B: Get HSN/SAC Info</span>
            </div>
          </div>

          {/* Fetch Details Using GSTIN/UIN */}
          <div className="border-b border-gray-300 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800">Fetch Details Using GSTIN/UIN</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-200 border-t border-gray-300 px-4 py-3">
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
            <div className="flex items-center space-x-1">
              <span className="bg-blue-500 text-white px-2 py-1 rounded">D:</span>
              <span className="text-gray-700">Delete</span>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1">
              <span className="bg-blue-500 text-white px-2 py-1 rounded">F12:</span>
              <span className="text-gray-700">Configure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LedgerCreation;

import React from 'react';

interface TallyFooterProps {
  onQuit?: () => void; // Function to handle quit action
}

const TallyFooter: React.FC<TallyFooterProps> = ({ onQuit }) => {
  return (
    <div className="bg-gray-200 border-t border-gray-300 px-4 py-3 mt-auto">
      <div className="flex items-center justify-between text-xs">
        {/* Left Section */}
        <div className="flex items-center space-x-6">
          <div
            className="flex items-center space-x-1 cursor-pointer hover:bg-gray-300 px-2 py-1 rounded"
            onClick={onQuit}
          >
            <span className="bg-blue-500 text-white px-2 py-1 rounded">Q:</span>
            <span className="text-gray-700">Quit</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="bg-blue-500 text-white px-2 py-1 rounded">Enter:</span>
            <span className="text-gray-700">Alter</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="bg-blue-500 text-white px-2 py-1 rounded">Space:</span>
            <span className="text-gray-700">Select</span>
          </div>
        </div>

        {/* Center Section */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-1">
            <span className="bg-blue-500 text-white px-2 py-1 rounded">A:</span>
            <span className="text-gray-700">Add Vch</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="bg-blue-500 text-white px-2 py-1 rounded">Z:</span>
            <span className="text-gray-700">Duplicate Vch</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="bg-blue-500 text-white px-2 py-1 rounded">I:</span>
            <span className="text-gray-700">Insert Vch</span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-1">
            <span className="bg-blue-500 text-white px-2 py-1 rounded">D:</span>
            <span className="text-gray-700">Delete</span>
          </div>

          <div className="flex items-center space-x-1">
            <span className="bg-blue-500 text-white px-2 py-1 rounded">X:</span>
            <span className="text-gray-700">Cancel Vch</span>
          </div>

          <div className="flex items-center space-x-1">
            <span className="bg-blue-500 text-white px-2 py-1 rounded">U:</span>
            <span className="text-gray-700">Restore Line</span>
          </div>

          <div className="flex items-center space-x-1">
            <span className="bg-blue-500 text-white px-2 py-1 rounded">F12:</span>
            <span className="text-gray-700">Configure</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TallyFooter;

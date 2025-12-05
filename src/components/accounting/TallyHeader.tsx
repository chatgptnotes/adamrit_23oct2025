import React from 'react';
import { Minimize2, Square, X, Bell, User, Settings } from 'lucide-react';

const TallyHeader: React.FC = () => {
  return (
    <div className="bg-blue-600 text-white">
      {/* Top Menu Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-blue-500">
        {/* Left Section */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="bg-orange-500 text-white px-2 py-1 rounded text-sm font-bold">
              EDU
            </div>
            <span className="font-bold text-lg">TallyPrime</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium cursor-pointer hover:text-blue-200 border-b-2 border-blue-400 pb-1">
              MANAGE
            </span>
          </div>
        </div>

        {/* Right Section - Window Controls */}
        <div className="flex items-center space-x-2">
          <Bell className="h-4 w-4 cursor-pointer hover:text-blue-200" />
          <Minimize2 className="h-4 w-4 cursor-pointer hover:text-blue-200" />
          <Square className="h-4 w-4 cursor-pointer hover:text-blue-200" />
          <X className="h-4 w-4 cursor-pointer hover:text-blue-200" />
        </div>
      </div>

      {/* Second Row - Shortcuts */}
      <div className="flex items-center justify-between px-4 py-2 bg-blue-700">
        {/* Left Section - Empty for alignment */}
        <div></div>

        {/* Center/Right Section - Keyboard Shortcuts */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1">
            <span className="bg-blue-800 px-2 py-1 rounded border border-blue-600">K:</span>
            <span className="text-blue-200">Company</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <span className="bg-blue-800 px-2 py-1 rounded border border-blue-600">Y:</span>
            <span className="text-blue-200">Data</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <span className="bg-blue-800 px-2 py-1 rounded border border-blue-600">Z:</span>
            <span className="text-blue-200">Exchange</span>
          </div>
          
          <button className="bg-white text-blue-700 px-3 py-1 rounded text-xs font-medium hover:bg-blue-50">
            Go To
          </button>
          
          <div className="flex items-center space-x-1">
            <span className="bg-blue-800 px-2 py-1 rounded border border-blue-600">Q:</span>
            <span className="text-blue-200">Import</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <span className="bg-blue-800 px-2 py-1 rounded border border-blue-600">E:</span>
            <span className="text-blue-200">Export</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <span className="bg-blue-800 px-2 py-1 rounded border border-blue-600">M:</span>
            <span className="text-blue-200">Share</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <span className="bg-blue-800 px-2 py-1 rounded border border-blue-600">P:</span>
            <span className="text-blue-200">Print</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <span className="bg-blue-800 px-2 py-1 rounded border border-blue-600">F1:</span>
            <span className="text-blue-200">Help</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TallyHeader;

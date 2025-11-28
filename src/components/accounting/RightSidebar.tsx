import React from 'react';

const RightSidebar: React.FC = () => {
  return (
    <div className="w-40 bg-blue-50 border-l border-gray-300 h-full overflow-y-auto">
      {/* F2: Date */}
      <div className="border-b border-gray-300 p-2">
        <div className="flex items-center space-x-1">
          <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">F2:</span>
          <span className="text-xs font-medium text-gray-700">Date</span>
        </div>
      </div>

      {/* F3: Company */}
      <div className="border-b border-gray-300 p-2">
        <div className="flex items-center space-x-1">
          <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">F3:</span>
          <span className="text-xs font-medium text-gray-700">Company</span>
        </div>
      </div>

      {/* Empty space to fill the sidebar */}
      <div className="flex-1 bg-blue-50"></div>
    </div>
  );
};

export default RightSidebar;

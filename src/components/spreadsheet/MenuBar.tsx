import React from 'react';

const menuItems = [
  'File',
  'Edit', 
  'View',
  'Insert',
  'Format',
  'Data',
  'Tools',
  'Extensions',
  'Help'
];

export const MenuBar: React.FC = () => {
  return (
    <nav className="flex items-start gap-4 relative max-md:gap-3 max-sm:gap-2 px-5 pb-3">
      {menuItems.map((item) => (
        <button
          key={item}
          className="text-black text-base font-normal relative max-md:text-sm max-sm:text-sm hover:bg-gray-100 px-2 py-1 rounded transition-colors"
        >
          {item}
        </button>
      ))}
    </nav>
  );
};

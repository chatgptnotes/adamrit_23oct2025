
import React, { useState } from 'react';

interface ExcelMenuBarProps {
  onMenuAction?: (action: string, data?: any) => void;
}

export const ExcelMenuBar: React.FC<ExcelMenuBarProps> = ({ onMenuAction }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleMenuClick = (action: string, data?: any) => {
    console.log('Menu action:', action, data);
    onMenuAction?.(action, data);
    setActiveMenu(null);
  };

  const menuItems = [
    { 
      name: 'File', 
      items: [
        { label: 'New', action: 'new', shortcut: 'Ctrl+N' },
        { label: 'Open', action: 'open', shortcut: 'Ctrl+O' },
        { label: 'Save', action: 'save', shortcut: 'Ctrl+S' },
        { label: 'Save As', action: 'save-as', shortcut: 'Ctrl+Shift+S' },
        { label: 'Print', action: 'print', shortcut: 'Ctrl+P' },
        { label: 'Export', action: 'export' },
        { label: 'Exit', action: 'exit' }
      ]
    },
    { 
      name: 'Edit', 
      items: [
        { label: 'Undo', action: 'undo', shortcut: 'Ctrl+Z' },
        { label: 'Redo', action: 'redo', shortcut: 'Ctrl+Y' },
        { label: 'Cut', action: 'cut', shortcut: 'Ctrl+X' },
        { label: 'Copy', action: 'copy', shortcut: 'Ctrl+C' },
        { label: 'Paste', action: 'paste', shortcut: 'Ctrl+V' },
        { label: 'Find', action: 'find', shortcut: 'Ctrl+F' },
        { label: 'Replace', action: 'replace', shortcut: 'Ctrl+H' }
      ]
    },
    { 
      name: 'View', 
      items: [
        { label: 'Normal', action: 'view-normal' },
        { label: 'Page Layout', action: 'view-page-layout' },
        { label: 'Page Break Preview', action: 'view-page-break' },
        { label: 'Zoom In', action: 'zoom-in', shortcut: 'Ctrl++' },
        { label: 'Zoom Out', action: 'zoom-out', shortcut: 'Ctrl+-' },
        { label: 'Fit to Window', action: 'zoom-fit' }
      ]
    },
    { 
      name: 'Insert', 
      items: [
        { label: 'Insert Rows', action: 'insert-rows' },
        { label: 'Insert Columns', action: 'insert-columns' },
        { label: 'Insert Cells', action: 'insert-cells' },
        { label: 'Insert Chart', action: 'insert-chart' },
        { label: 'Insert Picture', action: 'insert-picture' },
        { label: 'Insert Function', action: 'insert-function' }
      ]
    },
    { 
      name: 'Format', 
      items: [
        { label: 'Format Cells', action: 'format-cells', shortcut: 'Ctrl+1' },
        { label: 'Row Height', action: 'format-row-height' },
        { label: 'Column Width', action: 'format-column-width' },
        { label: 'AutoFit Row Height', action: 'autofit-row-height' },
        { label: 'AutoFit Column Width', action: 'autofit-column-width' },
        { label: 'Sheet', action: 'format-sheet' }
      ]
    },
    { 
      name: 'Data', 
      items: [
        { label: 'Sort Ascending', action: 'sort-asc' },
        { label: 'Sort Descending', action: 'sort-desc' },
        { label: 'Filter', action: 'filter', shortcut: 'Ctrl+Shift+L' },
        { label: 'Remove Filter', action: 'remove-filter' },
        { label: 'Import Data', action: 'import-data' },
        { label: 'Refresh', action: 'refresh', shortcut: 'F5' }
      ]
    },
    { 
      name: 'Tools', 
      items: [
        { label: 'Spelling Check', action: 'spell-check', shortcut: 'F7' },
        { label: 'Options', action: 'options' },
        { label: 'Macros', action: 'macros' },
        { label: 'Data Validation', action: 'data-validation' }
      ]
    },
    { 
      name: 'Help', 
      items: [
        { label: 'Help Topics', action: 'help-topics', shortcut: 'F1' },
        { label: 'Keyboard Shortcuts', action: 'keyboard-shortcuts' },
        { label: 'About', action: 'about' }
      ]
    }
  ];

  return (
    <div className="relative bg-white border-b border-gray-200">
      <div className="flex items-center px-4 py-1">
        {menuItems.map((menu) => (
          <div key={menu.name} className="relative">
            <button
              className={`
                px-3 py-1 text-sm hover:bg-gray-100 rounded transition-colors
                ${activeMenu === menu.name ? 'bg-gray-100' : ''}
              `}
              onMouseEnter={() => setActiveMenu(menu.name)}
              onMouseLeave={() => setActiveMenu(null)}
              onClick={() => setActiveMenu(activeMenu === menu.name ? null : menu.name)}
            >
              {menu.name}
            </button>
            
            {activeMenu === menu.name && (
              <div 
                className="absolute top-full left-0 z-50 bg-white border border-gray-300 shadow-lg min-w-48 py-1"
                onMouseEnter={() => setActiveMenu(menu.name)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                {menu.items.map((item) => (
                  <button
                    key={item.action}
                    className="flex justify-between items-center w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                    onClick={() => handleMenuClick(item.action, item)}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="text-xs text-gray-500 ml-4">{item.shortcut}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

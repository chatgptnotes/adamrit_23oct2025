
import React, { useState } from 'react';

interface EditableDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  className?: string;
  placeholder?: string;
}

export const EditableDropdown: React.FC<EditableDropdownProps> = ({
  value,
  onChange,
  options = [],
  className = "",
  placeholder = "Enter value"
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleOptionSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center border border-gray-300 rounded bg-white">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          className="flex-1 px-2 py-1 text-xs text-center bg-transparent outline-none focus:ring-1 focus:ring-blue-500 min-w-[60px]"
          placeholder={placeholder}
        />
        {options.length > 0 && (
          <button
            type="button"
            onClick={toggleDropdown}
            className="px-1 py-1 text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0 border-l border-gray-300"
          >
            <span className="text-xs">▼</span>
          </button>
        )}
      </div>
      
      {isOpen && options.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-32 overflow-y-auto">
          {options.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleOptionSelect(option)}
              className="w-full px-2 py-1 text-left text-xs hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

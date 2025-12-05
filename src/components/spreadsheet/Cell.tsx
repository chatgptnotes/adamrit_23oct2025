import React, { useState } from 'react';

export interface SpreadsheetCell {
  value: string;
  color?: 'green' | 'red' | 'yellow';
  bold?: boolean;
  background?: string;
  // You can add more formatting options as needed
}

interface CellProps {
  value?: string;
  isHeader?: boolean;
  isRowHeader?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  hasImage?: boolean;
  imageUrl?: string;
  linkUrl?: string;
  color?: string;
  bold?: boolean;
  rowHeight?: number;
  background?: string;
}

export const Cell: React.FC<CellProps> = ({
  value = '',
  isHeader = false,
  isRowHeader = false,
  isSelected = false,
  onClick,
  className = '',
  hasImage = false,
  imageUrl,
  linkUrl,
  color,
  bold,
  rowHeight = 48,
  background
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [cellValue, setCellValue] = useState(value);

  const handleDoubleClick = () => {
    if (!isHeader && !isRowHeader) {
      setIsEditing(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
    }
  };

  // Define background colors for Yes/No values
  let bgColor = background;
  let textColor = 'black';

  if (value === 'Yes') {
    bgColor = '#dcfce7'; // Light green
    textColor = '#166534'; // Dark green
  } else if (value === 'No') {
    bgColor = '#fee2e2'; // Light red
    textColor = '#991b1b'; // Dark red
  } else if (isHeader) {
    bgColor = '#f3f4f6'; // Light gray
    textColor = '#111827'; // Dark gray
  }

  const cellStyle = {
    height: rowHeight,
    minWidth: 140,
    maxWidth: 260,
    display: 'flex',
    alignItems: 'center',
    justifyContent: isHeader ? 'center' : 'flex-start',
    backgroundColor: bgColor,
    color: textColor,
    fontWeight: bold || isHeader ? 'bold' : 'normal',
    padding: '8px 16px',
    fontSize: '14px',
    transition: 'all 150ms ease',
    whiteSpace: 'pre-line' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  };

  return (
    <div
      className={`border border-gray-300 ${isSelected ? 'ring-2 ring-blue-500' : ''} ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${className}`}
      style={cellStyle}
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
    >
      {hasImage && imageUrl ? (
        <div className="flex items-center p-1">
          <img
            src={imageUrl}
            alt=""
            className="w-[22px] h-[22px] shrink-0"
          />
          {linkUrl && (
            <a
              href={linkUrl}
              className="text-[#0957D0] text-sm font-normal underline decoration-solid decoration-auto underline-offset-auto ml-1 max-sm:text-xs"
              target="_blank"
              rel="noopener noreferrer"
            >
              {linkUrl}
            </a>
          )}
        </div>
      ) : isEditing ? (
        <input
          type="text"
          value={cellValue}
          onChange={(e) => setCellValue(e.target.value)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={handleKeyDown}
          className="w-full h-full px-1 text-sm border-none outline-none bg-transparent max-sm:text-xs"
          autoFocus
        />
      ) : (
        <div className="w-full h-full flex items-center">
          {cellValue}
        </div>
      )}
    </div>
  );
};


import React, { useState } from 'react';
import { IconButton } from './IconButton';

interface ExcelToolbarProps {
  onFormatChange?: (format: any) => void;
  selectedCells?: any[];
}

export const ExcelToolbar: React.FC<ExcelToolbarProps> = ({ 
  onFormatChange,
  selectedCells = []
}) => {
  const [fontSize, setFontSize] = useState('11');
  const [fontFamily, setFontFamily] = useState('Calibri');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState('left');
  const [fillColor, setFillColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#000000');

  const handleSave = () => {
    console.log('Save action triggered');
    if (window.confirm('Save current spreadsheet?')) {
      console.log('Spreadsheet saved');
    }
  };

  const handlePrint = () => {
    console.log('Print action triggered');
    window.print();
  };

  const handleUndo = () => {
    console.log('Undo action triggered');
  };

  const handleRedo = () => {
    console.log('Redo action triggered');
  };

  const handleBold = () => {
    const newBold = !isBold;
    setIsBold(newBold);
    console.log('Bold toggle:', newBold);
    onFormatChange?.({ bold: newBold });
  };

  const handleItalic = () => {
    const newItalic = !isItalic;
    setIsItalic(newItalic);
    console.log('Italic toggle:', newItalic);
    onFormatChange?.({ italic: newItalic });
  };

  const handleUnderline = () => {
    const newUnderline = !isUnderline;
    setIsUnderline(newUnderline);
    console.log('Underline toggle:', newUnderline);
    onFormatChange?.({ underline: newUnderline });
  };

  const handleFontSizeChange = (newSize: string) => {
    setFontSize(newSize);
    console.log('Font size changed to:', newSize);
    onFormatChange?.({ fontSize: newSize });
  };

  const handleFontFamilyChange = (newFamily: string) => {
    setFontFamily(newFamily);
    console.log('Font family changed to:', newFamily);
    onFormatChange?.({ fontFamily: newFamily });
  };

  const handleTextAlign = (alignment: string) => {
    setTextAlign(alignment);
    console.log('Text alignment changed to:', alignment);
    onFormatChange?.({ textAlign: alignment });
  };

  const handleFillColor = () => {
    const input = document.createElement('input');
    input.type = 'color';
    input.value = fillColor;
    input.onchange = (e) => {
      const newColor = (e.target as HTMLInputElement).value;
      setFillColor(newColor);
      console.log('Fill color changed to:', newColor);
      onFormatChange?.({ backgroundColor: newColor });
    };
    input.click();
  };

  const handleTextColor = () => {
    const input = document.createElement('input');
    input.type = 'color';
    input.value = textColor;
    input.onchange = (e) => {
      const newColor = (e.target as HTMLInputElement).value;
      setTextColor(newColor);
      console.log('Text color changed to:', newColor);
      onFormatChange?.({ textColor: newColor });
    };
    input.click();
  };

  const handleBorders = () => {
    console.log('Borders action triggered');
    onFormatChange?.({ borders: true });
  };

  const handleMergeCells = () => {
    console.log('Merge cells action triggered');
    if (selectedCells.length > 1) {
      onFormatChange?.({ merge: true });
    } else {
      alert('Please select multiple cells to merge');
    }
  };

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 bg-white">
      {/* File Operations */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
        <IconButton title="Save (Ctrl+S)" onClick={handleSave}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 2H3C2.45 2 2 2.45 2 3V13C2 13.55 2.45 14 3 14H13C13.55 14 14 13.55 14 13V3C14 2.45 13.55 2 13 2ZM12 12H4V4H12V12ZM6 4H10V6H6V4Z" fill="currentColor"/>
          </svg>
        </IconButton>
        <IconButton title="Print (Ctrl+P)" onClick={handlePrint}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 6V2H4V6H2C0.9 6 0 6.9 0 8V12H4V14H12V12H16V8C16 6.9 15.1 6 14 6H12ZM6 4H10V6H6V4ZM10 12H6V10H10V12ZM14 10C13.45 10 13 9.55 13 9S13.45 8 14 8S15 8.45 15 9S14.55 10 14 10Z" fill="currentColor"/>
          </svg>
        </IconButton>
      </div>

      {/* Undo/Redo */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
        <IconButton title="Undo (Ctrl+Z)" onClick={handleUndo}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6.5 1L1.5 6L6.5 11V8C10.09 8 13 10.91 13 14.5C13 15.18 12.89 15.84 12.69 16.46C11.95 14.46 10.17 13 8 13H6.5V10L1.5 6L6.5 1Z" fill="currentColor"/>
          </svg>
        </IconButton>
        <IconButton title="Redo (Ctrl+Y)" onClick={handleRedo}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M9.5 1L14.5 6L9.5 11V8C5.91 8 3 10.91 3 14.5C3 15.18 3.11 15.84 3.31 16.46C4.05 14.46 5.83 13 8 13H9.5V10L14.5 6L9.5 1Z" fill="currentColor"/>
          </svg>
        </IconButton>
      </div>

      {/* Font Controls */}
      <div className="flex items-center gap-2 pr-2 border-r border-gray-300">
        <select 
          value={fontFamily}
          onChange={(e) => handleFontFamilyChange(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm bg-white w-24"
        >
          <option value="Calibri">Calibri</option>
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times</option>
          <option value="Verdana">Verdana</option>
        </select>
        
        <input
          type="number"
          value={fontSize}
          onChange={(e) => handleFontSizeChange(e.target.value)}
          className="w-12 px-1 py-1 text-sm text-center border border-gray-300 rounded"
          min="8"
          max="72"
        />
      </div>

      {/* Text Formatting */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
        <IconButton 
          title="Bold (Ctrl+B)" 
          onClick={handleBold}
          className={isBold ? 'bg-blue-100 border-blue-300' : ''}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 2V14H8.5C10.43 14 12 12.43 12 10.5C12 9.16 11.23 8.01 10.12 7.48C10.65 6.93 11 6.21 11 5.5C11 3.57 9.43 2 7.5 2H4ZM6 4H7.5C8.33 4 9 4.67 9 5.5S8.33 7 7.5 7H6V4ZM6 9H8.5C9.33 9 10 9.67 10 10.5S9.33 12 8.5 12H6V9Z" fill="currentColor"/>
          </svg>
        </IconButton>
        
        <IconButton 
          title="Italic (Ctrl+I)" 
          onClick={handleItalic}
          className={isItalic ? 'bg-blue-100 border-blue-300' : ''}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 2V4H7.21L5.79 12H4V14H8V12H6.79L8.21 4H10V2H6Z" fill="currentColor"/>
          </svg>
        </IconButton>
        
        <IconButton 
          title="Underline (Ctrl+U)" 
          onClick={handleUnderline}
          className={isUnderline ? 'bg-blue-100 border-blue-300' : ''}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 2V8C4 10.21 5.79 12 8 12S12 10.21 12 8V2H10V8C10 9.1 9.1 10 8 10S6 9.1 6 8V2H4ZM2 14H14V16H2V14Z" fill="currentColor"/>
          </svg>
        </IconButton>
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
        <IconButton 
          title="Align Left" 
          onClick={() => handleTextAlign('left')}
          className={textAlign === 'left' ? 'bg-blue-100 border-blue-300' : ''}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 3H14V5H2V3ZM2 7H12V9H2V7ZM2 11H14V13H2V11Z" fill="currentColor"/>
          </svg>
        </IconButton>
        
        <IconButton 
          title="Center" 
          onClick={() => handleTextAlign('center')}
          className={textAlign === 'center' ? 'bg-blue-100 border-blue-300' : ''}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 3H14V5H2V3ZM4 7H12V9H4V7ZM2 11H14V13H2V11Z" fill="currentColor"/>
          </svg>
        </IconButton>
        
        <IconButton 
          title="Align Right" 
          onClick={() => handleTextAlign('right')}
          className={textAlign === 'right' ? 'bg-blue-100 border-blue-300' : ''}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 3H14V5H2V3ZM6 7H14V9H6V7ZM2 11H14V13H2V11Z" fill="currentColor"/>
          </svg>
        </IconButton>
      </div>

      {/* Colors and Borders */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
        <IconButton title="Text Color" onClick={handleTextColor}>
          <div className="flex flex-col items-center">
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <text x="8" y="8" textAnchor="middle" fontSize="10" fill="currentColor">A</text>
            </svg>
            <div className="w-full h-1 mt-1" style={{ backgroundColor: textColor }}></div>
          </div>
        </IconButton>
        
        <IconButton title="Fill Color" onClick={handleFillColor}>
          <div className="flex flex-col items-center">
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <rect x="2" y="2" width="12" height="8" fill="none" stroke="currentColor"/>
            </svg>
            <div className="w-full h-1 mt-1" style={{ backgroundColor: fillColor }}></div>
          </div>
        </IconButton>
        
        <IconButton title="Borders" onClick={handleBorders}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3H13V13H3V3ZM2 2V14H14V2H2Z" fill="none" stroke="currentColor"/>
            <path d="M5 5H11V11H5V5Z" fill="none" stroke="currentColor"/>
          </svg>
        </IconButton>
        
        <IconButton title="Merge Cells" onClick={handleMergeCells}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 2H6V4H4V6H2V2ZM8 2H12V6H10V4H8V2ZM2 8H4V10H6V12H2V8ZM10 10H8V12H12V8H10V10Z" fill="currentColor"/>
          </svg>
        </IconButton>
      </div>

      {/* Number Format */}
      <div className="flex items-center gap-1">
        <select className="px-2 py-1 border border-gray-300 rounded text-sm bg-white w-24">
          <option>General</option>
          <option>Number</option>
          <option>Currency</option>
          <option>Date</option>
          <option>Time</option>
          <option>Percentage</option>
        </select>
      </div>

      {/* Print Button - Right Side */}
      <div className="flex items-center ml-auto">
        <IconButton title="Print Spreadsheet" onClick={handlePrint}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 8H5C3.34 8 2 9.34 2 11V17H6V21H18V17H22V11C22 9.34 20.66 8 19 8ZM16 19H8V14H16V19ZM19 12C18.45 12 18 11.55 18 11S18.45 10 19 10S20 10.45 20 11S19.55 12 19 12ZM18 3H6V7H18V3Z" fill="currentColor"/>
          </svg>
        </IconButton>
      </div>
    </div>
  );
};

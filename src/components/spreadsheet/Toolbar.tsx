
import React, { useState } from 'react';
import { IconButton } from './IconButton';

export const Toolbar: React.FC = () => {
  const [fontSize, setFontSize] = useState('10');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');

  const handleUndo = () => {
    console.log('Undo action');
    // Add undo functionality here
  };

  const handleRedo = () => {
    console.log('Redo action');
    // Add redo functionality here
  };

  const handlePrint = () => {
    console.log('Print action');
    window.print();
  };

  const handleSpellCheck = () => {
    console.log('Spell check action');
    // Add spell check functionality here
  };

  const handlePaintFormat = () => {
    console.log('Paint format action');
    // Add paint format functionality here
  };

  const handleZoomIn = () => {
    console.log('Zoom in action');
    // Add zoom in functionality here
  };

  const handleSelectAll = () => {
    console.log('Select all action');
    // Add select all functionality here
  };

  const handleBold = () => {
    setIsBold(!isBold);
    console.log('Bold toggle:', !isBold);
  };

  const handleItalic = () => {
    setIsItalic(!isItalic);
    console.log('Italic toggle:', !isItalic);
  };

  const handleStrikethrough = () => {
    console.log('Strikethrough action');
    // Add strikethrough functionality here
  };

  const handleTextColor = (color: string) => {
    setSelectedColor(color);
    console.log('Text color changed to:', color);
  };

  const handleFillColor = () => {
    console.log('Fill color action');
    // Add fill color functionality here
  };

  const handleBorders = () => {
    console.log('Borders action');
    // Add borders functionality here
  };

  const handleMerge = () => {
    console.log('Merge cells action');
    // Add merge cells functionality here
  };

  const handleHorizontalAlign = (alignment: string) => {
    console.log('Horizontal alignment:', alignment);
    // Add horizontal alignment functionality here
  };

  const handleVerticalAlign = () => {
    console.log('Vertical alignment action');
    // Add vertical alignment functionality here
  };

  const handleWrapText = () => {
    console.log('Wrap text action');
    // Add wrap text functionality here
  };

  const handleTextRotation = () => {
    console.log('Text rotation action');
    // Add text rotation functionality here
  };

  const handleNumberFormat = () => {
    console.log('Number format action');
    // Add number format functionality here
  };

  const handleMoreFormats = () => {
    console.log('More formats action');
    // Add more formats functionality here
  };

  const handleDecreaseFontSize = () => {
    const currentSize = parseInt(fontSize);
    if (currentSize > 8) {
      const newSize = (currentSize - 1).toString();
      setFontSize(newSize);
      console.log('Font size decreased to:', newSize);
    }
  };

  const handleIncreaseFontSize = () => {
    const currentSize = parseInt(fontSize);
    if (currentSize < 400) {
      const newSize = (currentSize + 1).toString();
      setFontSize(newSize);
      console.log('Font size increased to:', newSize);
    }
  };

  return (
    <section className="flex items-center gap-1 self-stretch relative px-5 py-2 border-b border-gray-200 max-sm:px-2 max-sm:gap-0.5">
      {/* Undo/Redo */}
      <IconButton onClick={handleUndo} title="Undo (Ctrl+Z)">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M6.38 8.69L14 1.06C14.39 0.67 14.39 0.04 14 -0.35C13.61 -0.74 12.98 -0.74 12.59 -0.35L4.59 7.65C4.2 8.04 4.2 8.67 4.59 9.06L12.59 17.06C12.98 17.45 13.61 17.45 14 17.06C14.39 16.67 14.39 16.04 14 15.65L6.38 8.02C6.01 7.65 6.01 7.06 6.38 8.69Z" fill="black"/>
        </svg>
      </IconButton>

      <IconButton onClick={handleRedo} title="Redo (Ctrl+Y)">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11.62 8.69L4 1.06C3.61 0.67 3.61 0.04 4 -0.35C4.39 -0.74 5.02 -0.74 5.41 -0.35L13.41 7.65C13.8 8.04 13.8 8.67 13.41 9.06L5.41 17.06C5.02 17.45 4.39 17.45 4 17.06C3.61 16.67 3.61 16.04 4 15.65L11.62 8.02C11.99 7.65 11.99 7.06 11.62 8.69Z" fill="black"/>
        </svg>
      </IconButton>

      <IconButton onClick={handlePrint} title="Print (Ctrl+P)">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M14 6V2H4V6H2C0.9 6 0 6.9 0 8V13H4V16H14V13H18V8C18 6.9 17.1 6 16 6H14ZM6 4H12V6H6V4ZM12 14H6V10H12V14ZM16 11C15.45 11 15 10.55 15 10S15.45 9 16 9S17 9.45 17 10S16.55 11 16 11Z" fill="black"/>
        </svg>
      </IconButton>

      <IconButton onClick={handleSpellCheck} title="Spell check">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M16.5 11.5L15.09 10.09L10 15.17L4.91 10.09L3.5 11.5L10 18L16.5 11.5ZM16.5 6.5L15.09 5.09L10 10.17L4.91 5.09L3.5 6.5L10 13L16.5 6.5Z" fill="black"/>
        </svg>
      </IconButton>

      <IconButton onClick={handlePaintFormat} title="Paint format">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M16 2H12C11.45 2 11 2.45 11 3V11C11 11.55 11.45 12 12 12H16C16.55 12 17 11.55 17 11V3C17 2.45 16.55 2 16 2ZM15 10H13V4H15V10ZM9 2H2C1.45 2 1 2.45 1 3S1.45 4 2 4H9C9.55 4 10 3.55 10 3S9.55 2 9 2ZM9 6H2C1.45 6 1 6.45 1 7S1.45 8 2 8H9C9.55 8 10 7.55 10 7S9.55 6 9 6ZM9 10H2C1.45 10 1 10.45 1 11S1.45 12 2 12H9C9.55 12 10 11.55 10 11S9.55 10 9 10Z" fill="black"/>
        </svg>
      </IconButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Zoom */}
      <IconButton onClick={handleZoomIn} title="Zoom">
        <span className="text-sm font-normal">100%</span>
      </IconButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Select All */}
      <IconButton onClick={handleSelectAll} title="Select all (Ctrl+A)">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M3 3H15V15H3V3ZM4 4V14H14V4H4Z" fill="black"/>
        </svg>
      </IconButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Font Family */}
      <select 
        value={fontFamily}
        onChange={(e) => setFontFamily(e.target.value)}
        className="px-2 py-1 border border-gray-300 rounded text-sm bg-white min-w-[80px]"
        title="Font family"
      >
        <option value="Arial">Arial</option>
        <option value="Calibri">Calibri</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Helvetica">Helvetica</option>
        <option value="Georgia">Georgia</option>
      </select>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Font Size Controls */}
      <IconButton onClick={handleDecreaseFontSize} title="Decrease font size">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 5H10V7H2V5Z" fill="black"/>
        </svg>
      </IconButton>

      <input
        type="text"
        value={fontSize}
        onChange={(e) => setFontSize(e.target.value)}
        className="w-8 px-1 text-sm text-center border border-gray-300 rounded"
        title="Font size"
      />

      <IconButton onClick={handleIncreaseFontSize} title="Increase font size">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M5 2H7V5H10V7H7V10H5V7H2V5H5V2Z" fill="black"/>
        </svg>
      </IconButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Text Formatting */}
      <IconButton 
        onClick={handleBold} 
        title="Bold (Ctrl+B)"
        className={isBold ? 'bg-gray-200' : ''}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M4 2V12H7.5C9.43 12 11 10.43 11 8.5C11 7.16 10.23 6.01 9.12 5.48C9.65 4.93 10 4.21 10 3.5C10 1.57 8.43 0 6.5 0H4V2ZM6 4H6.5C7.33 4 8 4.67 8 5.5S7.33 7 6.5 7H6V4ZM6 9V11H7.5C8.33 11 9 10.33 9 9.5S8.33 8 7.5 8H6V9Z" fill="black"/>
        </svg>
      </IconButton>

      <IconButton 
        onClick={handleItalic} 
        title="Italic (Ctrl+I)"
        className={isItalic ? 'bg-gray-200' : ''}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M6 2V4H7.21L5.79 10H4V12H8V10H6.79L8.21 4H10V2H6Z" fill="black"/>
        </svg>
      </IconButton>

      <IconButton onClick={handleStrikethrough} title="Strikethrough">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7.6 9C8.1 9.3 8.8 9.5 9.5 9.5C10.4 9.5 11 9.1 11 8.5C11 8.1 10.8 7.8 10.4 7.6H12.2C12.7 8.2 13 8.9 13 9.7C13 11.4 11.4 12.5 9.5 12.5C7.9 12.5 6.7 11.9 5.9 11L7.6 9ZM3.4 7C2.8 6.4 2.5 5.6 2.5 4.8C2.5 3.1 4.1 2 6 2C7.6 2 8.8 2.6 9.6 3.5L8 5C7.5 4.7 6.8 4.5 6.1 4.5C5.2 4.5 4.6 4.9 4.6 5.5C4.6 5.9 4.8 6.2 5.2 6.4L3.4 7ZM1 8H13V9H1V8Z" fill="black"/>
        </svg>
      </IconButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Text Color */}
      <div className="relative">
        <IconButton onClick={() => handleTextColor(selectedColor)} title="Text color">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 12H4.5L10.5 6L8.5 4L2.5 10V12ZM11.91 4.59C12.1 4.4 12.1 4.1 11.91 3.91L10.09 2.09C9.9 1.9 9.6 1.9 9.41 2.09L8.17 3.33L10.67 5.83L11.91 4.59Z" fill="black"/>
            <rect x="2" y="12" width="10" height="2" fill={selectedColor}/>
          </svg>
        </IconButton>
      </div>

      {/* Fill Color */}
      <IconButton onClick={handleFillColor} title="Fill color">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 3H11V11H3V3ZM2 2V12H12V2H2Z" fill="none" stroke="black"/>
          <rect x="3" y="10" width="8" height="2" fill="#FFD700"/>
        </svg>
      </IconButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Borders */}
      <IconButton onClick={handleBorders} title="Borders">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 3H11V11H3V3ZM2 2V12H12V2H2Z" fill="none" stroke="black" strokeWidth="1"/>
          <path d="M5 5H9V9H5V5Z" fill="none" stroke="black" strokeWidth="1"/>
        </svg>
      </IconButton>

      {/* Merge Cells */}
      <IconButton onClick={handleMerge} title="Merge cells">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2H6V4H4V6H2V2ZM8 2H12V6H10V4H8V2ZM2 8H4V10H6V12H2V8ZM10 10H8V12H12V8H10V10Z" fill="black"/>
        </svg>
      </IconButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Horizontal Alignment */}
      <IconButton onClick={() => handleHorizontalAlign('left')} title="Align left">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 3H12V5H2V3ZM2 7H10V9H2V7ZM2 11H12V13H2V11Z" fill="black"/>
        </svg>
      </IconButton>

      <IconButton onClick={() => handleHorizontalAlign('center')} title="Align center">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 3H12V5H2V3ZM4 7H10V9H4V7ZM2 11H12V13H2V11Z" fill="black"/>
        </svg>
      </IconButton>

      <IconButton onClick={() => handleHorizontalAlign('right')} title="Align right">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 3H12V5H2V3ZM4 7H12V9H4V7ZM2 11H12V13H2V11Z" fill="black"/>
        </svg>
      </IconButton>

      {/* Vertical Alignment */}
      <IconButton onClick={handleVerticalAlign} title="Vertical align">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M4 2H10V6H4V2ZM4 8H10V12H4V8Z" fill="black"/>
        </svg>
      </IconButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Text Wrapping */}
      <IconButton onClick={handleWrapText} title="Wrap text">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 3H12V4H2V3ZM2 6H10C11.1 6 12 6.9 12 8S11.1 10 10 10H8.5L9.79 8.71L9.09 8L7 10.09L9.09 12.18L9.79 11.47L8.5 10.24H10C11.66 10.24 13 8.9 13 7.24S11.66 4.24 10 4.24H2V6ZM2 9H6V10H2V9ZM2 11H6V12H2V11Z" fill="black"/>
        </svg>
      </IconButton>

      {/* Text Rotation */}
      <IconButton onClick={handleTextRotation} title="Text rotation">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7.5 5.5L9.09 4L7 1.91L4.91 4L6.5 5.5V8.5L4.91 10L7 12.09L9.09 10L7.5 8.5V5.5Z" fill="black"/>
        </svg>
      </IconButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Number Format */}
      <IconButton onClick={handleNumberFormat} title="Number format">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 2C4.24 2 2 4.24 2 7S4.24 12 7 12S12 9.76 12 7S9.76 2 7 2ZM7 10C5.34 10 4 8.66 4 7S5.34 4 7 4S10 5.34 10 7S8.66 10 7 10ZM7.5 5H6.5V8L9 9.5L9.5 8.75L7.5 7.5V5Z" fill="black"/>
        </svg>
      </IconButton>

      {/* More Formats Dropdown */}
      <IconButton onClick={handleMoreFormats} title="More formats">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 3C7.55 3 8 2.55 8 2S7.55 1 7 1S6 1.45 6 2S6.45 3 7 3ZM7 6C7.55 6 8 5.55 8 5S7.55 4 7 4S6 4.45 6 5S6.45 6 7 6ZM7 9C7.55 9 8 8.55 8 8S7.55 7 7 7S6 7.45 6 8S6.45 9 7 9Z" fill="black"/>
        </svg>
      </IconButton>
    </section>
  );
};

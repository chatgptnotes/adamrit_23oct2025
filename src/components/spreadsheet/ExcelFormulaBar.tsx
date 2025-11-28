
import React, { useState, useEffect } from 'react';

interface ExcelFormulaBarProps {
  selectedCell?: { row: number; col: number } | null;
  cellValue?: string;
  onFormulaChange?: (formula: string) => void;
}

export const ExcelFormulaBar: React.FC<ExcelFormulaBarProps> = ({
  selectedCell,
  cellValue = '',
  onFormulaChange
}) => {
  const [cellReference, setCellReference] = useState('A1');
  const [formula, setFormula] = useState('');

  // Update cell reference when selected cell changes
  useEffect(() => {
    if (selectedCell) {
      const columnLabel = getColumnLabel(selectedCell.col);
      const newRef = `${columnLabel}${selectedCell.row + 1}`;
      setCellReference(newRef);
      setFormula(cellValue);
    }
  }, [selectedCell, cellValue]);

  const getColumnLabel = (index: number): string => {
    let result = '';
    while (index >= 0) {
      result = String.fromCharCode(65 + (index % 26)) + result;
      index = Math.floor(index / 26) - 1;
    }
    return result;
  };

  const handleFormulaChange = (value: string) => {
    setFormula(value);
  };

  const handleFormulaSubmit = () => {
    console.log('Formula submitted:', formula);
    onFormulaChange?.(formula);
  };

  const handleFormulaCancel = () => {
    setFormula(cellValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFormulaSubmit();
    } else if (e.key === 'Escape') {
      handleFormulaCancel();
    }
  };

  const handleFunctionClick = () => {
    console.log('Function wizard clicked');
    // Open function wizard/selector
    const commonFunctions = ['SUM', 'AVERAGE', 'COUNT', 'MAX', 'MIN', 'IF'];
    const selectedFunction = prompt(`Select function:\n${commonFunctions.join(', ')}`);
    if (selectedFunction && commonFunctions.includes(selectedFunction.toUpperCase())) {
      const newFormula = `=${selectedFunction.toUpperCase()}()`;
      setFormula(newFormula);
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-300 bg-white">
      {/* Name Box */}
      <div className="flex items-center">
        <input
          type="text"
          value={cellReference}
          onChange={(e) => setCellReference(e.target.value)}
          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          placeholder="A1"
          readOnly
        />
      </div>

      {/* Function Button */}
      <button 
        className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:border-blue-500"
        onClick={handleFunctionClick}
        title="Insert Function"
      >
        fx
      </button>

      {/* Formula Bar */}
      <div className="flex-1">
        <input
          type="text"
          value={formula}
          onChange={(e) => handleFormulaChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          placeholder="Enter formula or value..."
        />
      </div>

      {/* Accept/Cancel Buttons */}
      <div className="flex items-center gap-1">
        <button 
          className="w-6 h-6 flex items-center justify-center text-green-600 hover:bg-green-50 rounded transition-colors"
          onClick={handleFormulaSubmit}
          title="Accept (Enter)"
        >
          ✓
        </button>
        <button 
          className="w-6 h-6 flex items-center justify-center text-red-600 hover:bg-red-50 rounded transition-colors"
          onClick={handleFormulaCancel}
          title="Cancel (Escape)"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

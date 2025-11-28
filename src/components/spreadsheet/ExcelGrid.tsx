import React, { useState, useEffect, useRef } from 'react';
import { SpreadsheetCell, fetchSpreadsheetData } from './spreadsheetData';
import { supabaseClient as supabase } from '@/utils/supabase-client';

interface CellPosition {
  row: number;
  col: number;
}

interface CellFormatting {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  borders?: boolean;
}

interface FormattedCell extends SpreadsheetCell {
  formatting?: CellFormatting;
}

interface SearchMatch {
  row: number;
  col: number;
}

const COLUMN_MAPPING = [
  'sr_no', 'patient_name', 'sst_or_secondary_treatment', 'mrn', 'patient_id', 'age',
  'referral_original_yes_no', 'e_pahachan_card_yes_no', 'hitlabh_or_entitelment_benefits_yes_no',
  'adhar_card_yes_no', 'sex', 'patient_type', 'reff_dr_name', 'date_of_admission',
  'date_of_discharge', 'claim_id', 'intimation_done_not_done', 'cghs_surgery_esic_referral',
  'diagnosis_and_surgery_performed', 'total_package_amount', 'bill_amount', 'surgery_performed_by',
  'surgery_name_with_cghs_amount_with_cghs_code', 'surgery1_in_referral_letter', 'surgery2',
  'surgery3', 'surgery4', 'date_of_surgery', 'cghs_code_unlisted_with_approval_from_esic',
  'cghs_package_amount_approved_unlisted_amount', 'payment_status', 'on_portal_submission_date',
  'bill_made_by_name_of_billing_executive', 'extension_taken_not_taken_not_required',
  'delay_waiver_for_intimation_bill_submission_taken_not_required',
  'surgical_additional_approval_taken_not_taken_not_required_both_', 'remark_1', 'remark_2',
  'date_column_1', 'date_column_2', 'date_column_3', 'date_column_4', 'date_column_5'
];

export const ExcelGrid: React.FC<{ 
  onCellSelection?: (cell: CellPosition | null, cells: CellPosition[]) => void;
  onFormatChange?: (formatting: CellFormatting) => void;
  searchTerm?: string;
  searchMatches?: SearchMatch[];
  currentSearchIndex?: number;
}> = ({ onCellSelection, onFormatChange, searchTerm = '', searchMatches = [], currentSearchIndex = -1 }) => {
  const [data, setData] = useState<FormattedCell[][]>([]);
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [selectedRange, setSelectedRange] = useState<CellPosition[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editValue, setEditValue] = useState('');
  const [collapsedColumns, setCollapsedColumns] = useState(false);
  
  // Resizing state
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const [rowHeights, setRowHeights] = useState<number[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState<'column' | 'row' | null>(null);
  const [resizeIndex, setResizeIndex] = useState<number>(-1);
  const [startPos, setStartPos] = useState<number>(0);
  const [startSize, setStartSize] = useState<number>(0);

  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load spreadsheet data
        const spreadsheetData = await fetchSpreadsheetData();
        
        // Apply basic formatting to cells
        const formattedData = spreadsheetData.map((row, rowIndex) => 
          row.map((cell, colIndex) => {
            return { 
              ...cell, 
              formatting: {}
            };
          })
        );
        
        setData(formattedData);
        
        if (spreadsheetData.length > 0) {
          setColumnWidths(new Array(spreadsheetData[0].length).fill(128));
          setRowHeights(new Array(spreadsheetData.length).fill(24));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Save cell data to database
  const saveCellToDatabase = async (row: number, col: number, value: string) => {
    if (row === 0) return; // Don't save header row
    
    const columnName = COLUMN_MAPPING[col];
    if (!columnName) return;

    // Get the sr_no for this row (assuming it's in the first column)
    const srNo = data[row][0]?.value;
    if (!srNo) return;

    console.log('Saving to database:', { srNo, columnName, value });

    try {
      const { error } = await supabase
        .from('patient_data')
        .update({ [columnName]: value })
        .eq('sr_no', parseInt(srNo));

      if (error) {
        console.error('Error saving to database:', error);
        alert('Error saving data to database');
      } else {
        console.log('Data saved successfully');
      }
    } catch (error) {
      console.error('Database save error:', error);
      alert('Error saving data to database');
    }
  };

  // Apply formatting to selected cells
  const applyFormatting = async (formatting: CellFormatting) => {
    if (!selectedCell && selectedRange.length === 0) return;

    const cellsToFormat = selectedRange.length > 0 ? selectedRange : [selectedCell!];
    
    const newData = data.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const isTargetCell = cellsToFormat.some(pos => pos.row === rowIndex && pos.col === colIndex);
        if (isTargetCell) {
          const newFormatting = { ...cell.formatting, ...formatting };
          
          return {
            ...cell,
            formatting: newFormatting
          };
        }
        return cell;
      })
    );
    
    setData(newData);
    console.log('Applied formatting:', formatting, 'to cells:', cellsToFormat);
  };

  // Expose formatting function
  useEffect(() => {
    if (onFormatChange) {
      (window as any).applyExcelFormatting = applyFormatting;
    }
  }, [onFormatChange, selectedCell, selectedRange, data]);

  const getColumnLabel = (index: number): string => {
    let result = '';
    while (index >= 0) {
      result = String.fromCharCode(65 + (index % 26)) + result;
      index = Math.floor(index / 26) - 1;
    }
    return result;
  };

  const handleCellClick = (row: number, col: number) => {
    if (isResizing) return;
    
    // Check if this is one of the special columns (AM, AN, AO, AP, AQ = 38, 39, 40, 41, 42)
    if (col >= 38 && col <= 42 && row > 0) { // Skip header row
      // Single click = right symbol
      const newData = [...data];
      newData[row][col] = {
        ...newData[row][col],
        value: '✓'
      };
      setData(newData);
      saveCellToDatabase(row, col, '1'); // Save as '1' for date_status enum
      return;
    }
    
    setSelectedCell({ row, col });
    if (!isSelecting) {
      setSelectedRange([]);
    }
    if (editingCell && (editingCell.row !== row || editingCell.col !== col)) {
      setEditingCell(null);
    }
    onCellSelection?.({ row, col }, []);
  };

  const handleCellDoubleClick = (row: number, col: number) => {
    if (isResizing) return;
    
    // Check if this is one of the special columns (AM, AN, AO, AP, AQ = 38, 39, 40, 41, 42)
    if (col >= 38 && col <= 42 && row > 0) { // Skip header row
      // Double click = wrong symbol
      const newData = [...data];
      newData[row][col] = {
        ...newData[row][col],
        value: '✗'
      };
      setData(newData);
      saveCellToDatabase(row, col, '2'); // Save as '2' for date_status enum
      return;
    }
    
    setEditingCell({ row, col });
    setEditValue(data[row][col].value);
    setSelectedCell({ row, col });
  };

  const handleCellMouseDown = (row: number, col: number) => {
    if (isResizing) return;
    setIsSelecting(true);
    setSelectedCell({ row, col });
    setSelectedRange([{ row, col }]);
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (isSelecting && selectedCell && !isResizing) {
      const startRow = Math.min(selectedCell.row, row);
      const endRow = Math.max(selectedCell.row, row);
      const startCol = Math.min(selectedCell.col, col);
      const endCol = Math.max(selectedCell.col, col);
      
      const range: CellPosition[] = [];
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          range.push({ row: r, col: c });
        }
      }
      setSelectedRange(range);
      onCellSelection?.(selectedCell, range);
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    if (isResizing) {
      setIsResizing(false);
      setResizeType(null);
      setResizeIndex(-1);
    }
  };

  // Column resize handlers
  const handleColumnResizeStart = (e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeType('column');
    setResizeIndex(colIndex);
    setStartPos(e.clientX);
    setStartSize(columnWidths[colIndex] || 128);
  };

  // Row resize handlers
  const handleRowResizeStart = (e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeType('row');
    setResizeIndex(rowIndex);
    setStartPos(e.clientY);
    setStartSize(rowHeights[rowIndex] || 24);
  };

  // Mouse move handler for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      if (resizeType === 'column' && resizeIndex >= 0) {
        const deltaX = e.clientX - startPos;
        const newWidth = Math.max(50, startSize + deltaX);
        const newWidths = [...columnWidths];
        newWidths[resizeIndex] = newWidth;
        setColumnWidths(newWidths);
      } else if (resizeType === 'row' && resizeIndex >= 0) {
        const deltaY = e.clientY - startPos;
        const newHeight = Math.max(20, startSize + deltaY);
        const newHeights = [...rowHeights];
        newHeights[resizeIndex] = newHeight;
        setRowHeights(newHeights);
      }
    };

    const handleMouseUpGlobal = () => {
      if (isResizing) {
        setIsResizing(false);
        setResizeType(null);
        setResizeIndex(-1);
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUpGlobal);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUpGlobal);
    };
  }, [isResizing, resizeType, resizeIndex, startPos, startSize, columnWidths, rowHeights]);

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleEditBlur = () => {
    saveEdit();
  };

  const saveEdit = async () => {
    if (editingCell) {
      // Update local data
      const newData = [...data];
      newData[editingCell.row][editingCell.col] = {
        ...newData[editingCell.row][editingCell.col],
        value: editValue
      };
      setData(newData);
      
      // Save to database
      await saveCellToDatabase(editingCell.row, editingCell.col, editValue);
      
      setEditingCell(null);
      setEditValue('');
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const isCellSelected = (row: number, col: number): boolean => {
    return selectedRange.some(pos => pos.row === row && pos.col === col) ||
           (selectedCell?.row === row && selectedCell?.col === col);
  };

  const isCellEditing = (row: number, col: number): boolean => {
    return editingCell?.row === row && editingCell?.col === col;
  };

  const isCellSearchMatch = (row: number, col: number): boolean => {
    return searchMatches.some(pos => pos.row === row && pos.col === col);
  };

  const isCellCurrentSearchMatch = (row: number, col: number): boolean => {
    if (currentSearchIndex === -1 || !searchMatches[currentSearchIndex]) return false;
    const currentMatch = searchMatches[currentSearchIndex];
    return currentMatch.row === row && currentMatch.col === col;
  };

  const getCellStyle = (cell: FormattedCell): React.CSSProperties => {
    const formatting = cell.formatting || {};
    return {
      fontWeight: formatting.bold ? 'bold' : cell.bold ? 'bold' : 'normal',
      fontStyle: formatting.italic ? 'italic' : 'normal',
      textDecoration: formatting.underline ? 'underline' : 'none',
      fontSize: formatting.fontSize ? `${formatting.fontSize}px` : '12px',
      fontFamily: formatting.fontFamily || 'Arial',
      color: formatting.textColor || cell.color || '#000000',
      backgroundColor: formatting.backgroundColor || cell.background || 'transparent',
      textAlign: formatting.textAlign || 'left',
      border: formatting.borders ? '1px solid #333' : undefined,
    };
  };

  const highlightSearchTerm = (text: string, searchTerm: string): React.ReactNode => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-semibold">
          {part}
        </span>
      ) : part
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading spreadsheet data...</div>
      </div>
    );
  }

  return (
    <div ref={gridRef} className="flex-1 overflow-auto bg-white" onMouseUp={handleMouseUp}>
      <div className="relative">
        {/* Collapse Toggle Button - Fixed at top */}
        <div className="sticky top-0 left-0 z-50 p-2 bg-white border-b shadow-sm">
          <button
            onClick={() => setCollapsedColumns(!collapsedColumns)}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {collapsedColumns ? 'Show Columns C-AL' : 'Hide Columns C-AL'}
          </button>
        </div>
        

        {/* Data Rows */}
        {data.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {/* Row Header */}
            <div 
              className="w-12 bg-gray-200 border-r border-b border-gray-400 flex items-center justify-center text-xs font-medium cursor-pointer hover:bg-gray-300 sticky left-0 z-20 relative"
              style={{ height: `${rowHeights[rowIndex] || 24}px` }}
            >
              {rowIndex + 1}
              {/* Row resize handle */}
              <div
                className="absolute bottom-0 left-0 w-full h-1 cursor-row-resize hover:bg-blue-400 opacity-0 hover:opacity-100"
                onMouseDown={(e) => handleRowResizeStart(e, rowIndex)}
              />
            </div>
            
            {/* Data Cells */}
            {row.map((cell, colIndex) => {
              // Hide columns C-AL (indices 2-37) when collapsed
              if (collapsedColumns && colIndex >= 2 && colIndex <= 37) {
                return null;
              }
              
               const isSelected = isCellSelected(rowIndex, colIndex);
               const isEditing = isCellEditing(rowIndex, colIndex);
                const isHeader = rowIndex === 0;
                const isDataHeader = rowIndex === 1; // Sr no, Patient Name row
                const isSearchMatch = isCellSearchMatch(rowIndex, colIndex);
                const isCurrentSearchMatch = isCellCurrentSearchMatch(rowIndex, colIndex);
                const cellStyle = getCellStyle(cell);
               
                // Freeze first 2 columns: Sr No (0), Patient Name (1) and last 5 columns: AM-AQ (38-42)
                const isFrozenColumn = colIndex <= 1 || (colIndex >= 38 && colIndex <= 42);
               
               // Calculate left position for frozen columns
               let leftPosition = 48; // Start after row header (48px)
               if (isFrozenColumn) {
                 if (colIndex <= 1) {
                   // Left frozen columns
                   for (let i = 0; i < colIndex; i++) {
                     leftPosition += columnWidths[i] || 128;
                   }
                 } else {
                   // Right frozen columns (AM-AQ)
                   leftPosition = 0; // Will be calculated from the right
                 }
               }
              
              return (
                <div
                  key={colIndex}
                  className={`
                    border-r border-b border-gray-300 text-xs cursor-cell relative flex items-center
                    ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : 'hover:bg-gray-50'}
                      ${isHeader ? 'font-semibold bg-gray-50 sticky top-[48px] z-10' : ''}
                      ${isDataHeader ? 'font-semibold bg-gray-100 sticky top-[48px] z-20' : ''}
                      ${isFrozenColumn && !isHeader && !isDataHeader ? 'sticky z-10 bg-white' : ''}
                      ${isFrozenColumn && isHeader ? 'sticky top-[48px] z-30 bg-gray-50' : ''}
                      ${isFrozenColumn && isDataHeader ? 'sticky top-[48px] z-40 bg-gray-100' : ''}
                      ${!isFrozenColumn && isDataHeader ? 'sticky top-[48px] z-20 bg-gray-100' : ''}
                    ${isSearchMatch ? 'bg-yellow-100' : ''}
                    ${isCurrentSearchMatch ? 'ring-2 ring-orange-400 ring-inset' : ''}
                    ${isSearchMatch ? 'bg-yellow-100' : ''}
                    ${isCurrentSearchMatch ? 'ring-2 ring-orange-400 ring-inset' : ''}
                    ${cell.value === 'Yes' && !cell.formatting?.backgroundColor ? 'bg-green-50 text-green-800' : ''}
                    ${cell.value === 'No' && !cell.formatting?.backgroundColor ? 'bg-red-50 text-red-800' : ''}
                    ${cell.value === '✓' && !cell.formatting?.backgroundColor ? 'text-green-600 font-extrabold' : ''}
                    ${cell.value === '✗' && !cell.formatting?.backgroundColor ? 'text-red-600 font-extrabold' : ''}
                  `}
                  style={{ 
                    width: `${columnWidths[colIndex] || 128}px`,
                    height: `${rowHeights[rowIndex] || 24}px`,
                     left: isFrozenColumn && colIndex <= 1 ? `${leftPosition}px` : undefined,
                     right: isFrozenColumn && colIndex >= 38 ? `${(42 - colIndex) * 128}px` : undefined,
                    ...cellStyle
                  }}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                  onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                  onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                >
                  {isEditing ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      onBlur={handleEditBlur}
                      className="w-full h-full px-2 text-xs bg-transparent border-none outline-none"
                      autoFocus
                      style={cellStyle}
                    />
                  ) : (
                    <div className="w-full px-2 truncate overflow-hidden" style={{ textAlign: cellStyle.textAlign }}>
                      {searchTerm ? highlightSearchTerm(cell.value, searchTerm) : cell.value}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

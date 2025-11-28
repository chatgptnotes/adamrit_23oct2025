
import React, { useEffect, useState } from 'react';
import { Cell } from './Cell';
import { SpreadsheetCell, fetchSpreadsheetData } from './spreadsheetData';

export const SpreadsheetGrid: React.FC = () => {
  const [data, setData] = useState<SpreadsheetCell[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const spreadsheetData = await fetchSpreadsheetData();
        console.log('Loaded spreadsheet data:', spreadsheetData);
        setData(spreadsheetData);
        setError(null);
      } catch (err) {
        setError('Error loading patient data. Please try again later.');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center w-full">
        <div className="inline-flex items-center px-4 py-2 rounded-md bg-blue-50 text-blue-700">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading patient data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center w-full">
        <div className="inline-flex items-center px-4 py-2 rounded-md bg-red-50 text-red-700">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center w-full">
        <div className="inline-flex items-center px-4 py-2 rounded-md bg-yellow-50 text-yellow-700">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          No patient data available
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white flex-1 overflow-auto">
      <div className="min-w-full">
        {data.map((row, rowIndex) => (
          <div 
            key={rowIndex} 
            className={`flex ${rowIndex === 0 ? 'bg-gray-50 sticky top-0 z-10' : 'hover:bg-gray-50'}`}
          >
            {row.map((cell, colIndex) => (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                value={cell.value}
                color={cell.color}
                bold={cell.bold || rowIndex === 0}
                background={cell.background}
                isHeader={rowIndex === 0}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

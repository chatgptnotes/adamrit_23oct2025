import React from 'react';
import { Button } from '@/components/ui/button';

const GoodsReceivedNote: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded shadow-md w-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-blue-800">Goods Received Note</h2>
        <div className="flex gap-2">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">Add Purchase Order</Button>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">Back</Button>
        </div>
      </div>
      {/* Colored line */}
      <div className="h-1 w-full rounded mb-4" style={{background: 'linear-gradient(90deg, #7ed957, #f9d923, #ff6f3c, #0074d9, #b967ff)'}} />
      {/* Filter/Search Bar */}
      <div className="bg-gray-400 p-4 rounded flex flex-wrap gap-4 items-center mb-6">
        <label className="flex items-center gap-2 text-white font-semibold">
          From :
          <input type="date" className="border border-green-700 rounded px-2 py-1" />
        </label>
        <label className="flex items-center gap-2 text-white font-semibold">
          To :
          <input type="date" className="border border-green-700 rounded px-2 py-1" />
        </label>
        <label className="flex items-center gap-2 text-white font-semibold">
          Supplier :
          <input type="text" placeholder="Type To Search" className="border border-green-700 rounded px-2 py-1" />
        </label>
        <label className="flex items-center gap-2 text-white font-semibold">
          Location :
          <select className="border border-green-700 rounded px-2 py-1">
            <option value="all">all</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-white font-semibold">
          GRN No :
          <input type="text" placeholder="Type To Search" className="border border-green-700 rounded px-2 py-1" />
        </label>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white ml-2">Search</Button>
      </div>
      {/* Grand Total */}
      <div className="text-right text-lg font-bold text-red-600 mb-4">
        Grand Total : Rs 144,275,102.54
      </div>
      {/* Placeholder for table/list */}
      <div className="mt-8 text-center text-gray-400">(Table will go here)</div>
    </div>
  );
};

export default GoodsReceivedNote; 
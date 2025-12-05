import React from 'react';
import { Button } from '@/components/ui/button';

const InventoryTracking: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded shadow-md w-full">
      <h2 className="text-xl font-bold text-blue-800 mb-2">Store Inventory Tracking</h2>
      {/* Colored line */}
      <div className="h-1 w-full rounded mb-4" style={{background: 'linear-gradient(90deg, #7ed957, #f9d923, #ff6f3c, #0074d9, #b967ff)'}} />
      {/* Filter/Search Bar */}
      <div className="bg-gray-400 p-4 rounded flex flex-wrap gap-4 items-center mb-6">
        <label className="flex items-center gap-2 text-white font-semibold">
          Item :
          <input type="text" placeholder="Type To Search" className="border border-green-700 rounded px-2 py-1" />
        </label>
        <label className="flex items-center gap-2 text-white font-semibold">
          From :
          <input type="date" placeholder="From date" className="border border-green-700 rounded px-2 py-1" />
        </label>
        <label className="flex items-center gap-2 text-white font-semibold">
          To :
          <input type="date" placeholder="To date" className="border border-green-700 rounded px-2 py-1" />
        </label>
        <label className="flex items-center gap-2 text-white font-semibold">
          Supplier :
          <input type="text" placeholder="Type To Search" className="border border-green-700 rounded px-2 py-1" />
        </label>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white ml-2">Search</Button>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white ml-2">Generate Excel</Button>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-100 border border-gray-300">
          <thead>
            <tr className="bg-gray-500 text-white text-sm">
              <th className="px-2 py-1 border" rowSpan={2}>Sr.no</th>
              <th className="px-2 py-1 border" rowSpan={2}>Item Name</th>
              <th className="px-2 py-1 border" colSpan={4}>Previous</th>
              <th className="px-2 py-1 border" colSpan={4}>Current</th>
            </tr>
            <tr className="bg-gray-500 text-white text-xs">
              <th className="px-2 py-1 border">Qty</th>
              <th className="px-2 py-1 border">Price</th>
              <th className="px-2 py-1 border">Supplier</th>
              <th className="px-2 py-1 border">Date</th>
              <th className="px-2 py-1 border">Qty</th>
              <th className="px-2 py-1 border">Price</th>
              <th className="px-2 py-1 border">Supplier</th>
              <th className="px-2 py-1 border">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-2 py-1 border text-center text-gray-500" colSpan={10}>No Record Found!</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTracking; 
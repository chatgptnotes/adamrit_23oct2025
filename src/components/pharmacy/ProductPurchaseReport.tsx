import React from 'react';
import { Button } from '@/components/ui/button';

const ProductPurchaseReport: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded shadow-md w-full">
      <h2 className="text-xl font-bold text-blue-800 mb-2">Product Purchase Reports</h2>
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
          Product :
          <input type="text" placeholder="Type To Search" className="border border-green-700 rounded px-2 py-1" />
        </label>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white ml-2">Search</Button>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white ml-2">Generate Excel</Button>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-100 border border-gray-300">
          <thead>
            <tr className="bg-gray-200 text-gray-700 text-sm">
              <th className="px-2 py-1 border">Sr.No</th>
              <th className="px-2 py-1 border">Order From</th>
              <th className="px-2 py-1 border">Supplier</th>
              <th className="px-2 py-1 border">GRN No</th>
              <th className="px-2 py-1 border">Date</th>
              <th className="px-2 py-1 border">Product Name</th>
              <th className="px-2 py-1 border">Batch No</th>
              <th className="px-2 py-1 border">Quantity</th>
              <th className="px-2 py-1 border">Purchase Price</th>
              <th className="px-2 py-1 border">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-2 py-1 border text-center text-gray-500" colSpan={10}>No Record found!</td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Total Value */}
      <div className="text-right text-lg font-bold text-red-600 mt-2">
        Total Value: 0
      </div>
    </div>
  );
};

export default ProductPurchaseReport; 
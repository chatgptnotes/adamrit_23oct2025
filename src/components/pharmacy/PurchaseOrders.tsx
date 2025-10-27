// Purchase Orders Component
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PurchaseOrderService, PurchaseOrder } from '@/lib/purchase-order-service';
import { SupplierService, Supplier } from '@/lib/supplier-service';
import { useToast } from '@/hooks/use-toast';

interface PurchaseOrdersProps {
  onAddClick?: () => void;
}

interface PurchaseOrderWithSupplier extends PurchaseOrder {
  supplier_name?: string;
}

const PurchaseOrders: React.FC<PurchaseOrdersProps> = ({ onAddClick }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderWithSupplier[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrderWithSupplier[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [supplierSearch, setSupplierSearch] = useState('');
  const [poSearch, setPoSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 13;

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Apply filters whenever search terms or data changes
  useEffect(() => {
    applyFilters();
  }, [purchaseOrders, supplierSearch, poSearch, statusFilter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch purchase orders and suppliers in parallel
      const [ordersData, suppliersData] = await Promise.all([
        PurchaseOrderService.getAll(),
        SupplierService.getAll(),
      ]);

      // Map supplier names to purchase orders
      const ordersWithSuppliers = ordersData.map(order => {
        const supplier = suppliersData.find(s => s.id === order.supplier_id);
        return {
          ...order,
          supplier_name: supplier?.supplier_name || 'N/A',
        };
      });

      setPurchaseOrders(ordersWithSuppliers);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch purchase orders',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...purchaseOrders];

    // Filter by supplier name
    if (supplierSearch.trim()) {
      filtered = filtered.filter(order =>
        order.supplier_name?.toLowerCase().includes(supplierSearch.toLowerCase())
      );
    }

    // Filter by PO number
    if (poSearch.trim()) {
      filtered = filtered.filter(order =>
        order.po_number.toLowerCase().includes(poSearch.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'All') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
    setPage(1); // Reset to first page when filters change
  };

  const handleSearch = () => {
    applyFilters();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const handleAddClick = () => {
    if (onAddClick) {
      onAddClick();
    } else {
      navigate('/pharmacy/purchase-orders/add');
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 9;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 5) {
        for (let i = 1; i <= maxPagesToShow; i++) {
          pages.push(i);
        }
      } else if (page >= totalPages - 4) {
        for (let i = totalPages - maxPagesToShow + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = page - 4; i <= page + 4; i++) {
          pages.push(i);
        }
      }
    }

    return pages;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-blue-800">Purchase Orders list</h2>
        <div className="flex gap-2">
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white"
            onClick={handleAddClick}
          >
            Add Purchase Order
          </Button>
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => navigate('/pharmacy')}
          >
            Back
          </Button>
        </div>
      </div>
      <div className="h-1 w-full mb-2 bg-gradient-to-r from-lime-400 via-pink-500 to-blue-500 rounded" />
      <div className="bg-gray-200 p-4 rounded flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span>Service Provider :</span>
          <input
            type="text"
            placeholder="Type To Search"
            className="border px-2 py-1 rounded min-w-[180px]"
            value={supplierSearch}
            onChange={e => setSupplierSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span>Purchase Order No :</span>
          <input
            type="text"
            placeholder="Type To Search"
            className="border px-2 py-1 rounded min-w-[180px]"
            value={poSearch}
            onChange={e => setPoSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span>Status:</span>
          <select
            className="border px-2 py-1 rounded"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option>All</option>
            <option>Pending</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
        </div>
        <Button
          className="bg-blue-500 hover:bg-blue-600 text-white"
          onClick={handleSearch}
        >
          Search
        </Button>
      </div>
      <div className="overflow-x-auto mt-2">
        <table className="min-w-full border border-gray-400 text-sm">
          <thead className="bg-gray-300 text-black">
            <tr>
              <th className="border border-gray-400 p-2">Sr.No.</th>
              <th className="border border-gray-400 p-2">Purchase Order No.</th>
              <th className="border border-gray-400 p-2">Order For.</th>
              <th className="border border-gray-400 p-2">Supplier</th>
              <th className="border border-gray-400 p-2">Type</th>
              <th className="border border-gray-400 p-2">Status</th>
              <th className="border border-gray-400 p-2">Created Date</th>
              <th className="border border-gray-400 p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="border border-gray-400 p-8 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span>Loading purchase orders...</span>
                  </div>
                </td>
              </tr>
            ) : currentOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="border border-gray-400 p-8 text-center text-gray-500">
                  {purchaseOrders.length === 0
                    ? 'No purchase orders found. Click "Add Purchase Order" to create one.'
                    : 'No purchase orders match your search criteria.'}
                </td>
              </tr>
            ) : (
              currentOrders.map((order, index) => (
                <tr key={order.id} className="even:bg-gray-100">
                  <td className="border border-gray-400 p-2 text-center">
                    {startIndex + index + 1}
                  </td>
                  <td className="border border-gray-400 p-2">{order.po_number}</td>
                  <td className="border border-gray-400 p-2">{order.order_for || 'Pharmacy'}</td>
                  <td className="border border-gray-400 p-2">{order.supplier_name}</td>
                  <td className="border border-gray-400 p-2">Pharmacy</td>
                  <td className="border border-gray-400 p-2">{order.status}</td>
                  <td className="border border-gray-400 p-2">{formatDate(order.created_at)}</td>
                  <td className="border border-gray-400 p-2 text-center">
                    <span className="inline-flex gap-2">
                      <span title="View" className="cursor-pointer text-blue-600">🔍</span>
                      <span title="Edit" className="cursor-pointer text-green-600">✏️</span>
                      <span title="Delete" className="cursor-pointer text-red-600">🗑️</span>
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!isLoading && filteredOrders.length > 0 && (
        <div className="flex items-center gap-2 mt-2">
          {getPageNumbers().map((pageNum, idx) => (
            <React.Fragment key={pageNum}>
              {idx > 0 && <span>|</span>}
              <span
                className={`cursor-pointer ${
                  page === pageNum ? 'font-bold text-blue-600' : 'text-gray-700'
                }`}
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </span>
            </React.Fragment>
          ))}
          <span
            className={`ml-2 cursor-pointer ${
              page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600'
            }`}
            onClick={() => page > 1 && handlePageChange(page - 1)}
          >
            &laquo; Previous
          </span>
          <span
            className={`cursor-pointer ${
              page === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600'
            }`}
            onClick={() => page < totalPages && handlePageChange(page + 1)}
          >
            Next &raquo;
          </span>
          <span className="ml-2">
            {page} of {totalPages}
          </span>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders; 
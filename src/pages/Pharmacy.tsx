import React from 'react';
import PharmacyDashboard from '../components/pharmacy/PharmacyDashboard';
import AddPurchaseOrder from '../components/pharmacy/AddPurchaseOrder';
import PurchaseOrders from '../components/pharmacy/PurchaseOrders';
import GoodsReceivedNote from '../components/pharmacy/GoodsReceivedNote';
import ProductPurchaseReport from '../components/pharmacy/ProductPurchaseReport';
import InventoryTracking from '../components/pharmacy/InventoryTracking';
import { useLocation } from 'react-router-dom';

const Pharmacy: React.FC = () => {
  const location = useLocation();
  if (location.pathname === '/pharmacy/purchase-orders/add') {
    return <AddPurchaseOrder />;
  }
  if (location.pathname === '/pharmacy/purchase-orders/list') {
    return <PurchaseOrders />;
  }
  if (location.pathname === '/pharmacy/goods-received-note') {
    return <GoodsReceivedNote />;
  }
  if (location.pathname === '/pharmacy/product-purchase-report') {
    return <ProductPurchaseReport />;
  }
  if (location.pathname === '/pharmacy/inventory-tracking') {
    return <InventoryTracking />;
  }
  return <PharmacyDashboard />;
};

export default Pharmacy;
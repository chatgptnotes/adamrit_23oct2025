import React from 'react';
import EnhancedRadiologyOrders from './EnhancedRadiologyOrders';

interface RadiologyDashboardProps {
  onBack?: () => void;
}

const RadiologyDashboard: React.FC<RadiologyDashboardProps> = ({ onBack }) => {
  return <EnhancedRadiologyOrders onBack={onBack} />;
};

export default RadiologyDashboard;

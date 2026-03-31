import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import RadiologyManagement from '../components/radiology/RadiologyManagement';

const MASTER_ADMIN_EMAILS = [
  'admin@hopehospital.com',
  'admin@ayushmanhospital.com',
  'admin@test.com',
];

const RadiologyMaster = () => {
  const { user } = useAuth();
  const userEmail = user?.email?.toLowerCase() || '';
  const userRole = user?.role;

  if (userRole !== 'superadmin' && !MASTER_ADMIN_EMAILS.includes(userEmail)) {
    return <Navigate to="/" replace />;
  }

  return <RadiologyManagement masterOnly />;
};

export default RadiologyMaster;

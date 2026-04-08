
import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeftRight } from 'lucide-react';
import { SidebarHeader } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { HOSPITAL_CONFIGS, HospitalType } from '@/types/hospital';

export const SidebarHeaderComponent = () => {
  const navigate = useNavigate();
  const { user, logout, hospitalConfig, isSuperAdmin, isAdmin, switchHospital } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleSwitchHospital = () => {
    if (!user) return;
    // Toggle between hospitals
    const allHospitals = Object.keys(HOSPITAL_CONFIGS) as HospitalType[];
    const otherHospitals = allHospitals.filter(h => h !== user.hospitalType);
    if (otherHospitals.length === 1) {
      switchHospital(otherHospitals[0]);
    }
  };

  const otherHospitalName = user
    ? Object.entries(HOSPITAL_CONFIGS)
        .find(([key]) => key !== user.hospitalType)?.[1]?.fullName
    : null;

  return (
    <SidebarHeader className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
               style={{ backgroundColor: hospitalConfig.primaryColor }}>
            {hospitalConfig.name.charAt(0)}
          </div>
          <h2 className="font-semibold text-lg truncate" style={{ color: hospitalConfig.primaryColor }}>
            {hospitalConfig.name} HMIS
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <span className="text-sm text-muted-foreground">
              {user.username}
            </span>
          )}
          {(isSuperAdmin || isAdmin) && otherHospitalName && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSwitchHospital}
              className="h-8 px-2 hover:bg-blue-50 hover:border-blue-200 flex items-center gap-1"
              title={`Switch to ${otherHospitalName}`}
            >
              <ArrowLeftRight className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-600 hidden sm:inline">Switch</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="h-8 px-2 hover:bg-red-50 hover:border-red-200 flex items-center gap-1"
            title="Logout"
          >
            <LogOut className="h-4 w-4 text-red-600" />
            <span className="text-xs text-red-600">Logout</span>
          </Button>
        </div>
      </div>
    </SidebarHeader>
  );
};

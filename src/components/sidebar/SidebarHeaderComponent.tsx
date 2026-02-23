
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import { SidebarHeader } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export const SidebarHeaderComponent = () => {
  const navigate = useNavigate();
  const { user, logout, hospitalConfig } = useAuth();

  const handleLogout = () => {
    logout();
  };

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

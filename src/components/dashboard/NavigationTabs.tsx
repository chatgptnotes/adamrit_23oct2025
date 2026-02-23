
import { useNavigate } from 'react-router-dom';

interface NavigationTabsProps {
  activeTab: string;
}

export const NavigationTabs = ({ activeTab }: NavigationTabsProps) => {
  const navigate = useNavigate();

  const handleTabClick = (tabName: string) => {
    console.log('Tab clicked:', tabName); // Debug log
    switch (tabName) {
      case 'Dashboard':
        navigate('/dashboard');
        break;
      case 'IPD':
        navigate('/todays-ipd');
        break;
      case 'OPD':
        navigate('/todays-opd');
        break;
      case 'Patients':
        navigate('/patients');
        break;
      case 'Doctors':
        console.log('Doctors page not implemented yet');
        break;
      case 'Reports':
        console.log('Navigating to reports...');
        navigate('/reports');
        break;
      case 'Settings':
        console.log('Settings page not implemented yet');
        break;
      default:
        console.log('Unknown tab:', tabName);
        break;
    }
  };

  const tabs = ['Dashboard', 'IPD', 'OPD', 'Patients', 'Doctors', 'Reports', 'Settings'];

  return (
    <div className="flex items-center gap-6 border-b">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => handleTabClick(tab)}
          className={`flex items-center gap-2 px-4 py-2 transition-colors cursor-pointer ${
            tab === activeTab
              ? 'text-primary border-b-2 border-primary font-medium'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>{tab}</span>
        </button>
      ))}
    </div>
  );
};


import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ClinicalMgmtContent from './ClinicalMgmtContent';
import HistoryContent from './HistoryContent';
import ExaminationContent from './ExaminationContent';

interface PatientClinicalSidebarProps {
  onSectionChange: (section: string) => void;
  activeSection: string;
}

const PatientClinicalSidebar = ({ onSectionChange, activeSection }: PatientClinicalSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const clinicalSections = [
    {
      id: 'clinical-mgmt',
      title: 'Clinical Mgmt'
    },
    {
      id: 'history',
      title: 'History'
    },
    {
      id: 'examination',
      title: 'Examination'
    }
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'clinical-mgmt':
        return <ClinicalMgmtContent />;
      case 'history':
        return <HistoryContent />;
      case 'examination':
        return <ExaminationContent />;
      default:
        return <ClinicalMgmtContent />;
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Card className={`transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-80'} h-full border border-gray-200 flex flex-col`}>
        <CardContent className="p-0 h-full flex flex-col">
          <div className="bg-blue-50 p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <div>
                  <h3 className="font-semibold text-lg text-blue-600">Patient Details</h3>
                  <p className="text-sm text-gray-600">Diagnoses and Complications</p>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-8 w-8 hover:bg-blue-100"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {!isCollapsed && (
            <>
              <div className="flex-shrink-0">
                <div className="flex border-b">
                  {clinicalSections.map((section) => {
                    const isActive = activeSection === section.id;
                    
                    return (
                      <button
                        key={section.id}
                        className={`flex-1 px-4 py-3 text-sm font-medium border-r last:border-r-0 transition-colors ${
                          isActive 
                            ? "bg-blue-500 text-white" 
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => onSectionChange(section.id)}
                      >
                        {section.title}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {renderSectionContent()}
              </div>
            </>
          )}
          
          {isCollapsed && (
            <div className="p-2 space-y-1">
              {clinicalSections.map((section) => {
                const isActive = activeSection === section.id;
                
                return (
                  <Button
                    key={section.id}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`w-full p-2 text-xs ${
                      isActive ? "bg-blue-500 text-white hover:bg-blue-600" : "hover:bg-gray-100"
                    }`}
                    onClick={() => onSectionChange(section.id)}
                    title={section.title}
                  >
                    {section.title.charAt(0)}
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientClinicalSidebar;

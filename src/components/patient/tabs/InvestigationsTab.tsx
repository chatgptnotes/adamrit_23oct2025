
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useVisitMedicalData } from '@/hooks/useVisitMedicalData';
import { useMedicalDataMutations } from '@/hooks/useMedicalDataMutations';

interface InvestigationsTabProps {
  patient: any;
  visitId?: string;
}

const InvestigationsTab = ({ patient, visitId }: InvestigationsTabProps) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRadiology, setSelectedRadiology] = useState<string[]>([]);
  const [selectedLab, setSelectedLab] = useState<string[]>([]);

  // Get current visit's medical data
  const { labs: currentLabs, radiology: currentRadiology } = useVisitMedicalData(visitId);
  
  // Get mutations for storing data
  const { addLabs, addRadiology, isAddingLabs, isAddingRadiology } = useMedicalDataMutations();

  const { data: radiologyTests = [] } = useQuery({
    queryKey: ['radiology'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radiology')
        .select('id, name, category, description, private, NABH_NABL_Rate, Non_NABH_NABL_Rate, bhopal_nabh, bhopal_non_nabh, created_at, updated_at')
        .order('name');
      
      if (error) {
        console.error('Error fetching radiology tests:', error);
        throw error;
      }
      
      return data;
    }
  });

  const { data: labTests = [] } = useQuery({
    queryKey: ['lab'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching lab tests:', error);
        throw error;
      }
      
      return data;
    }
  });

  const filteredRadiologyTests = radiologyTests.filter(test =>
    test.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLabTests = labTests.filter(test =>
    test.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRadiologyToggle = (testId: string) => {
    setSelectedRadiology(prev =>
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handleLabToggle = (testId: string) => {
    setSelectedLab(prev =>
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handleStore = () => {
    if (!visitId) {
      console.error('No visit ID provided');
      return;
    }

    if (activeFilter === 'Radiology' && selectedRadiology.length > 0) {
      addRadiology({ 
        visitId, 
        radiologyIds: selectedRadiology 
      });
      setSelectedRadiology([]);
    } else if (activeFilter === 'Lab' && selectedLab.length > 0) {
      addLabs({ 
        visitId, 
        labIds: selectedLab 
      });
      setSelectedLab([]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Investigations
        </CardTitle>
        <p className="text-sm text-muted-foreground">All investigations and reports</p>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button 
            variant={activeFilter === 'All' ? "default" : "outline"} 
            size="sm"
            onClick={() => setActiveFilter('All')}
          >
            All
          </Button>
          <Button 
            variant={activeFilter === 'Radiology' ? "default" : "outline"} 
            size="sm"
            onClick={() => setActiveFilter('Radiology')}
          >
            Radiology
          </Button>
          <Button 
            variant={activeFilter === 'Lab' ? "default" : "outline"} 
            size="sm"
            onClick={() => setActiveFilter('Lab')}
          >
            Lab
          </Button>
          <Button 
            variant={activeFilter === 'Other' ? "default" : "outline"} 
            size="sm"
            onClick={() => setActiveFilter('Other')}
          >
            Other
          </Button>
        </div>

        {activeFilter === 'Radiology' ? (
          <div className="space-y-4">
            {/* Day Range Display */}
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 10 }, (_, i) => (
                <Button
                  key={i + 1}
                  variant="outline"
                  size="sm"
                  className="h-8 w-12 p-0 text-xs"
                >
                  D{i + 1}
                </Button>
              ))}
            </div>

            {/* Search */}
            <Input
              placeholder="Search radiology investigations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />

            {/* Radiology Tests List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredRadiologyTests.map((test) => (
                <div key={test.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={test.id}
                    checked={selectedRadiology.includes(test.id)}
                    onCheckedChange={() => handleRadiologyToggle(test.id)}
                  />
                  <label htmlFor={test.id} className="text-sm cursor-pointer flex-1">
                    {test.name}
                  </label>
                </div>
              ))}
            </div>

            {/* Store Button */}
            <Button 
              onClick={handleStore} 
              className="w-full"
              disabled={selectedRadiology.length === 0 || isAddingRadiology || !visitId}
            >
              {isAddingRadiology ? 'Storing...' : 'Store'}
            </Button>

            {/* Stored Investigations Section */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-2">Stored Radiology Studies:</h4>
              {currentRadiology.length > 0 ? (
                <div className="space-y-2">
                  {currentRadiology.map((radiology) => (
                    <div key={radiology.id} className="flex items-center justify-between">
                      <span className="text-sm">{radiology.radiology_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {radiology.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No radiology studies ordered.</p>
              )}
            </div>
          </div>
        ) : activeFilter === 'Lab' ? (
          <div className="space-y-4">
            {/* Day Range Display */}
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 12 }, (_, i) => (
                <Button
                  key={i + 1}
                  variant="outline"
                  size="sm"
                  className="h-8 w-12 p-0 text-xs"
                >
                  D{i + 1}
                </Button>
              ))}
            </div>

            {/* Search */}
            <Input
              placeholder="Search lab investigations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />

            {/* Lab Tests List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredLabTests.map((test) => (
                <div key={test.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={test.id}
                    checked={selectedLab.includes(test.id)}
                    onCheckedChange={() => handleLabToggle(test.id)}
                  />
                  <label htmlFor={test.id} className="text-sm cursor-pointer flex-1">
                    {test.name}
                  </label>
                </div>
              ))}
            </div>

            {/* Store Button */}
            <Button 
              onClick={handleStore} 
              className="w-full"
              disabled={selectedLab.length === 0 || isAddingLabs || !visitId}
            >
              {isAddingLabs ? 'Storing...' : 'Store'}
            </Button>

            {/* Stored Lab Investigations Section */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-2">Stored Lab Tests:</h4>
              {currentLabs.length > 0 ? (
                <div className="space-y-2">
                  {currentLabs.map((lab) => (
                    <div key={lab.id} className="flex items-center justify-between">
                      <span className="text-sm">{lab.lab_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {lab.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No lab tests ordered.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Labs & Radiology: {patient?.labs_radiology || 'None recorded'}</p>
            <p className="text-sm text-muted-foreground">Lab Tests: {patient?.labs || 'None recorded'}</p>
            <p className="text-sm text-muted-foreground">Radiology: {patient?.radiology || 'None recorded'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvestigationsTab;

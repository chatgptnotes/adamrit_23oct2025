
import { useState } from 'react';
import { useDiagnoses } from '@/hooks/useDiagnoses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Stethoscope } from 'lucide-react';
import { AddDiagnosisDialog } from '@/components/AddDiagnosisDialog';

const Diagnoses = () => {
  const { diagnoses, isLoading, addDiagnosis, isAddingDiagnosis } = useDiagnoses();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredDiagnoses = diagnoses.filter(diagnosis =>
    diagnosis.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (diagnosis.description && diagnosis.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddDiagnosis = (name: string, description?: string) => {
    console.log('Calling addDiagnosis with:', { name, description });
    addDiagnosis({ name, description });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading diagnoses...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-16 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Stethoscope className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-primary">
              Diagnoses Master List
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Manage all medical diagnosis categories
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search diagnoses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Diagnosis
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDiagnoses.map((diagnosis) => (
            <Card key={diagnosis.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{diagnosis.name}</CardTitle>
              </CardHeader>
              {diagnosis.description && (
                <CardContent>
                  <p className="text-muted-foreground">{diagnosis.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {filteredDiagnoses.length === 0 && (
          <div className="text-center py-12">
            <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              {searchTerm ? 'No diagnoses found matching your search.' : 'No diagnoses available.'}
            </p>
          </div>
        )}

        <AddDiagnosisDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAddDiagnosis={handleAddDiagnosis}
        />
      </div>
    </div>
  );
};

export default Diagnoses;

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PatientRegistrationForm } from '@/components/PatientRegistrationForm';
import { EditPatientRegistrationDialog } from '@/components/EditPatientRegistrationDialog';
import { VisitRegistrationForm } from '@/components/VisitRegistrationForm';
import { PatientDetailsModal } from '@/components/PatientDetailsModal';
import { PatientLookup } from '@/components/PatientLookup';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { NavigationTabs } from '@/components/dashboard/NavigationTabs';
import { ActionButtons } from '@/components/dashboard/ActionButtons';
import { PatientsTable } from '@/components/dashboard/PatientsTable';
import { PatientWorkflowVisual } from '@/components/dashboard/PatientWorkflowVisual';
import { DeletePatientDialog } from '@/components/dashboard/DeletePatientDialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const PatientDashboard = () => {
  const { hospitalConfig } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-persisted state
  const searchTerm = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const itemsPerPage = 10;

  // Helper to update URL params
  const updateParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || (key === 'page' && value === '1')) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams, { replace: true });
  };

  // Setter functions
  const setSearchTerm = (value: string) => updateParams({ search: value, page: '1' });
  const setCurrentPage = (value: number) => updateParams({ page: value.toString() });

  // Non-persisted state
  const [isRegistrationFormOpen, setIsRegistrationFormOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isVisitFormOpen, setIsVisitFormOpen] = useState(false);
  const [isPatientDetailsOpen, setIsPatientDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPatientLookupOpen, setIsPatientLookupOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string; patients_id?: string } | null>(null);
  const [patientToEdit, setPatientToEdit] = useState<any>(null);
  const [patientToDelete, setPatientToDelete] = useState<{ id: string; name: string; patients_id?: string } | null>(null);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['dashboard-patients', hospitalConfig?.name || 'default'],
    queryFn: async () => {
      console.log('🏥 PatientDashboard: Fetching patients for hospital:', hospitalConfig?.name);
      console.log('🔍 PatientDashboard: Full hospitalConfig:', hospitalConfig);
      
      let query = supabase
        .from('patients')
        .select('*, patients_id, corporate')
        .order('created_at', { ascending: false });
      
      // Only apply filter if hospitalConfig exists and has a name
      if (hospitalConfig?.name) {
        query = query.eq('hospital_name', hospitalConfig.name);
        console.log('🏥 PatientDashboard: Applied hospital filter for:', hospitalConfig.name);
      } else {
        console.warn('⚠️ PatientDashboard: No hospital filter applied - showing all patients');
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching patients:', error);
        throw error;
      }

      console.log(`✅ PatientDashboard: Found ${data?.length || 0} patients for ${hospitalConfig?.name}`);
      if (data && data.length > 0) {
        console.log('📋 PatientDashboard: Patient details:', data.map(p => ({
          id: p.id,
          name: p.name,
          patients_id: p.patients_id,
          hospital_name: p.hospital_name
        })));
      }
      return data || [];
    }
  });

  const handleViewPatient = (patient: { id: string; name: string; patients_id?: string }) => {
    setSelectedPatient(patient);
    setIsPatientDetailsOpen(true);
  };

  const handleVisitRegistration = (patient: { id: string; name: string; patients_id?: string }) => {
    setSelectedPatient(patient);
    setIsVisitFormOpen(true);
  };

  const handleEditPatient = (patient: any) => {
    setPatientToEdit(patient);
    setIsEditDialogOpen(true);
  };

  const handleDeletePatient = (patient: { id: string; name: string; patients_id?: string }) => {
    setPatientToDelete(patient);
    setIsDeleteDialogOpen(true);
  };

  const handlePatientDeleted = () => {
    window.location.reload();
  };

  const handlePatientLookupSelect = (patient: any) => {
    // Use patients_id if available, otherwise fallback to id
    const patientForVisit = {
      id: patient.id,
      name: patient.name,
      patients_id: patient.patients_id
    };
    setSelectedPatient(patientForVisit);
    setIsVisitFormOpen(true);
  };

  const handleNewPatientFromLookup = () => {
    setIsRegistrationFormOpen(true);
  };

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patients_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalCount = filteredPatients.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, endIndex);

  // Pagination helper functions
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Reset page to 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading patients...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <DashboardHeader 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <NavigationTabs activeTab="Patients" />

        <ActionButtons 
          onNewPatientClick={() => setIsRegistrationFormOpen(true)}
          onPatientLookupClick={() => setIsPatientLookupOpen(true)}
        />

        <PatientWorkflowVisual />

        <PatientsTable
          patients={paginatedPatients}
          onViewPatient={handleViewPatient}
          onVisitRegistration={handleVisitRegistration}
          onEditPatient={handleEditPatient}
          onDeletePatient={handleDeletePatient}
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-white rounded-lg shadow">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Showing {startIndex + 1} to {Math.min(endIndex, totalCount)} of {totalCount} patients</span>
              <span className="text-gray-400">|</span>
              <span>Page {currentPage} of {totalPages}</span>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={goToFirstPage} disabled={currentPage === 1}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {getPageNumbers().map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToLastPage} disabled={currentPage === totalPages}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {filteredPatients.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No patients found matching your search criteria.
          </div>
        )}

        <PatientRegistrationForm
          isOpen={isRegistrationFormOpen}
          onClose={() => setIsRegistrationFormOpen(false)}
        />

        <EditPatientRegistrationDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setPatientToEdit(null);
          }}
          patient={patientToEdit}
        />

        <PatientLookup
          isOpen={isPatientLookupOpen}
          onClose={() => setIsPatientLookupOpen(false)}
          onPatientSelected={handlePatientLookupSelect}
          onNewPatientRegistration={handleNewPatientFromLookup}
        />

        {selectedPatient && (
          <VisitRegistrationForm
            isOpen={isVisitFormOpen}
            onClose={() => {
              setIsVisitFormOpen(false);
              setSelectedPatient(null);
            }}
            patient={selectedPatient}
          />
        )}

        {selectedPatient && (
          <PatientDetailsModal
            isOpen={isPatientDetailsOpen}
            onClose={() => {
              setIsPatientDetailsOpen(false);
              setSelectedPatient(null);
            }}
            patient={selectedPatient}
          />
        )}

        <DeletePatientDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setPatientToDelete(null);
          }}
          patient={patientToDelete}
          onPatientDeleted={handlePatientDeleted}
        />
      </div>
    </div>
  );
};

export default PatientDashboard;

import { AddItemDialog } from '@/components/AddItemDialog';
import { useHopeRMOs } from './HopeRMOs/useHopeRMOs';
import { HopeRMOsHeader } from './HopeRMOs/HopeRMOsHeader';
import { HopeRMOsControls } from './HopeRMOs/HopeRMOsControls';
import { HopeRMOsList } from './HopeRMOs/HopeRMOsList';
import { hopeRMOFields } from './HopeRMOs/formFields';

const HopeRMOs = () => {
  const {
    searchTerm, setSearchTerm, isAddDialogOpen, setIsAddDialogOpen,
    isEditDialogOpen, setIsEditDialogOpen, editingRMO, setEditingRMO,
    isLoading, filteredRMOs, handleAdd, handleEdit, handleDelete, handleUpdate,
    handleExport, handleImport
  } = useHopeRMOs();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading Hope RMOs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <HopeRMOsHeader />

        <HopeRMOsControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddClick={() => setIsAddDialogOpen(true)}
          onExport={handleExport}
          onImport={handleImport}
        />

        <HopeRMOsList
          rmos={filteredRMOs}
          searchTerm={searchTerm}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <AddItemDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAdd={handleAdd}
          title="Add Hope RMO"
          fields={hopeRMOFields}
        />

        {editingRMO && (
          <AddItemDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setEditingRMO(null);
            }}
            onAdd={handleUpdate}
            title="Edit Hope RMO"
            defaultValues={{
              name: editingRMO.name || '',
              specialty: editingRMO.specialty || '',
              department: editingRMO.department || '',
              contact_info: editingRMO.contact_info || '',
              tpa_rate: editingRMO.tpa_rate?.toString() || '',
              non_nabh_rate: editingRMO.non_nabh_rate?.toString() || '',
              nabh_rate: editingRMO.nabh_rate?.toString() || '',
              private_rate: editingRMO.private_rate?.toString() || ''
            }}
            fields={hopeRMOFields}
          />
        )}
      </div>
    </div>
  );
};

export default HopeRMOs;

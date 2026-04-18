import { AddItemDialog } from '@/components/AddItemDialog';
import { useAyushmanRMOs } from './AyushmanRMOs/useAyushmanRMOs';
import { AyushmanRMOsHeader } from './AyushmanRMOs/AyushmanRMOsHeader';
import { AyushmanRMOsControls } from './AyushmanRMOs/AyushmanRMOsControls';
import { AyushmanRMOsList } from './AyushmanRMOs/AyushmanRMOsList';
import { ayushmanRMOFields } from './AyushmanRMOs/formFields';

const AyushmanRMOs = () => {
  const {
    searchTerm, setSearchTerm, isAddDialogOpen, setIsAddDialogOpen,
    isEditDialogOpen, setIsEditDialogOpen, editingRMO, setEditingRMO,
    isLoading, filteredRMOs, handleAdd, handleEdit, handleDelete, handleUpdate,
    handleExport, handleImport
  } = useAyushmanRMOs();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading Ayushman RMOs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <AyushmanRMOsHeader />

        <AyushmanRMOsControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddClick={() => setIsAddDialogOpen(true)}
          onExport={handleExport}
          onImport={handleImport}
        />

        <AyushmanRMOsList
          rmos={filteredRMOs}
          searchTerm={searchTerm}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <AddItemDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAdd={handleAdd}
          title="Add Ayushman RMO"
          fields={ayushmanRMOFields}
        />

        {editingRMO && (
          <AddItemDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setEditingRMO(null);
            }}
            onAdd={handleUpdate}
            title="Edit Ayushman RMO"
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
            fields={ayushmanRMOFields}
          />
        )}
      </div>
    </div>
  );
};

export default AyushmanRMOs;

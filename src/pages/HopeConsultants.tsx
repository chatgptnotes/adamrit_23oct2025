
import { AddItemDialog } from '@/components/AddItemDialog';
import { useHopeConsultants } from './HopeConsultants/useHopeConsultants';
import { HopeConsultantsHeader } from './HopeConsultants/HopeConsultantsHeader';
import { HopeConsultantsControls } from './HopeConsultants/HopeConsultantsControls';
import { HopeConsultantsList } from './HopeConsultants/HopeConsultantsList';
import { hopeConsultantFields } from './HopeConsultants/formFields';

const HopeConsultants = () => {
  const {
    searchTerm,
    setSearchTerm,
    isAddDialogOpen,
    setIsAddDialogOpen,
    isLoading,
    filteredConsultants,
    handleAdd,
    handleEdit,
    handleDelete
  } = useHopeConsultants();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading Hope consultants...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <HopeConsultantsHeader />

        <HopeConsultantsControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddClick={() => setIsAddDialogOpen(true)}
        />

        <HopeConsultantsList
          consultants={filteredConsultants}
          searchTerm={searchTerm}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <AddItemDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAdd={handleAdd}
          title="Add Hope Consultant"
          fields={hopeConsultantFields}
        />
      </div>
    </div>
  );
};

export default HopeConsultants;

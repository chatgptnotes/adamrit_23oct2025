import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  FlaskConical
} from 'lucide-react';

interface LabSubSpecialty {
  id: string;
  name: string;
  code: string;
  modality?: string;
  remark?: string;
  isActive: boolean;
}

const LabSubSpecialty: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<LabSubSpecialty | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sample data - this would come from your database
  const [subspecialties, setSubspecialties] = useState<LabSubSpecialty[]>([
    { id: '1', name: 'VITAMIN ASSAY', code: 'VITAMIN ASSAY', modality: '', remark: '', isActive: true },
    { id: '2', name: 'URINE UCT', code: 'URINE UCT', modality: '', remark: '', isActive: true },
    { id: '3', name: 'URINE EXAMINATION', code: 'URINE EXAMINATION', modality: '', remark: '', isActive: true },
    { id: '4', name: 'TUMOR MARKER', code: 'TUMOR MARKER', modality: '', remark: '', isActive: true },
    { id: '5', name: 'SEROLOGY', code: 'SEROLOGY', modality: '', remark: '', isActive: true },
    { id: '6', name: 'SEMEN ANALYSIS', code: 'SEMEN ANALYSIS', modality: '', remark: '', isActive: true },
    { id: '7', name: 'OTHERS (CULTURE/ SENSITIVITY C/S TEST)', code: 'OTHERS (CULTURE/ SENSITIVITY C/S TEST)', modality: '', remark: '', isActive: true },
    { id: '8', name: 'MICROBIOLOGY', code: 'MICROBIOLOGY', modality: '', remark: '', isActive: true },
    { id: '9', name: 'IRON STUDY', code: 'IRON STUDY', modality: '', remark: '', isActive: true },
    { id: '10', name: 'IMMUNOLOGY', code: 'IMMUNOLOGY', modality: '', remark: '', isActive: true },
    { id: '11', name: 'HORMONES', code: 'HORMONES', modality: '', remark: '', isActive: true },
    { id: '12', name: 'HISTOPATHOLOGY', code: 'HISTOPATHOLOGY', modality: '', remark: '', isActive: true },
    { id: '13', name: 'HISTO/CYTOLOGY', code: 'HISTO/CYTOLOGY', modality: '', remark: '', isActive: true },
    { id: '14', name: 'HEMATOLOGY', code: 'HEMATOLOGY', modality: '', remark: '', isActive: true },
    { id: '15', name: 'HBA1C', code: 'HBA1C', modality: '', remark: '', isActive: true },
    { id: '16', name: 'GENEXPERT MTB RIFAMPICIN RESISTANCE DETECTION', code: 'GENEXPERT MTB RIFAMPICIN RESISTANCE DETECTION', modality: '', remark: '', isActive: true },
    { id: '17', name: 'CORTISOL', code: 'CORTISOL', modality: '', remark: '', isActive: true },
    { id: '18', name: 'COAGULATION PROFILE', code: 'COAGULATION PROFILE', modality: '', remark: '', isActive: true },
    { id: '19', name: 'CLINICAL PATHOLOGY', code: 'CLINICAL PATHOLOGY', modality: '', remark: '', isActive: true },
    { id: '20', name: 'BODY FLUID EXAMINATION', code: 'BODY FLUID EXAMINATION', modality: '', remark: '', isActive: true }
  ]);

  const filteredSubspecialties = subspecialties.filter(subspecialty =>
    subspecialty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subspecialty.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredSubspecialties.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedSubspecialties = filteredSubspecialties.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize));
    setCurrentPage(1);
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
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

  const handleAddSubspecialty = (newSubspecialty: Omit<LabSubSpecialty, 'id'>) => {
    const subspecialty: LabSubSpecialty = {
      ...newSubspecialty,
      id: Date.now().toString()
    };
    setSubspecialties([...subspecialties, subspecialty]);
    setIsAddDialogOpen(false);
  };

  const handleEditSubspecialty = (updatedSubspecialty: LabSubSpecialty) => {
    setSubspecialties(subspecialties.map(sub => 
      sub.id === updatedSubspecialty.id ? updatedSubspecialty : sub
    ));
    setEditingSpecialty(null);
  };

  const handleDeleteSubspecialty = (id: string) => {
    setSubspecialties(subspecialties.filter(sub => sub.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Laboratory Sub Specialty</h2>
            <p className="text-muted-foreground">Manage laboratory subspecialties and test categories</p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Sub Specialty
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Sub Specialty</DialogTitle>
            </DialogHeader>
            <AddSubSpecialtyForm onSubmit={handleAddSubspecialty} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <Input
              placeholder="Search subspecialties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">entries</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sub Specialty Name</TableHead>
                  <TableHead>Sub Specialty Code</TableHead>
                  <TableHead>Modality</TableHead>
                  <TableHead>Remark</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSubspecialties.map((subspecialty) => (
                  <TableRow key={subspecialty.id}>
                    <TableCell className="font-medium">{subspecialty.name}</TableCell>
                    <TableCell>{subspecialty.code}</TableCell>
                    <TableCell>{subspecialty.modality || '...'}</TableCell>
                    <TableCell>{subspecialty.remark || '...'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingSpecialty(subspecialty)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteSubspecialty(subspecialty.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredSubspecialties.length)} of {filteredSubspecialties.length} entries
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={goToPreviousPage}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {getPageNumbers().map((pageNumber) => (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNumber)}
                        isActive={currentPage === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={goToNextPage}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingSpecialty} onOpenChange={() => setEditingSpecialty(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Sub Specialty</DialogTitle>
          </DialogHeader>
          {editingSpecialty && (
            <EditSubSpecialtyForm 
              subspecialty={editingSpecialty}
              onSubmit={handleEditSubspecialty}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface AddSubSpecialtyFormProps {
  onSubmit: (subspecialty: Omit<LabSubSpecialty, 'id'>) => void;
}

const AddSubSpecialtyForm: React.FC<AddSubSpecialtyFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    modality: '',
    remark: '',
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: '', code: '', modality: '', remark: '', isActive: true });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Sub Specialty Name *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Sub Specialty Code *</label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData({...formData, code: e.target.value})}
            required
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Modality</label>
        <Input
          value={formData.modality}
          onChange={(e) => setFormData({...formData, modality: e.target.value})}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Remark</label>
        <Input
          value={formData.remark}
          onChange={(e) => setFormData({...formData, remark: e.target.value})}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
};

interface EditSubSpecialtyFormProps {
  subspecialty: LabSubSpecialty;
  onSubmit: (subspecialty: LabSubSpecialty) => void;
}

const EditSubSpecialtyForm: React.FC<EditSubSpecialtyFormProps> = ({ subspecialty, onSubmit }) => {
  const [formData, setFormData] = useState(subspecialty);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Sub Specialty Name *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Sub Specialty Code *</label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData({...formData, code: e.target.value})}
            required
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Modality</label>
        <Input
          value={formData.modality}
          onChange={(e) => setFormData({...formData, modality: e.target.value})}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Remark</label>
        <Input
          value={formData.remark}
          onChange={(e) => setFormData({...formData, remark: e.target.value})}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit">Update</Button>
      </div>
    </form>
  );
};

export default LabSubSpecialty; 
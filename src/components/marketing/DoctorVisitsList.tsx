import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Stethoscope, Trash2, Edit } from 'lucide-react';
import { useDoctorVisits, useMarketingUsers, useDeleteDoctorVisit } from '@/hooks/useMarketingData';
import { useToast } from '@/hooks/use-toast';

interface DoctorVisitsListProps {
  onAddNew: () => void;
  selectedMonth?: string;
}

const DoctorVisitsList: React.FC<DoctorVisitsListProps> = ({ onAddNew, selectedMonth }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const { toast } = useToast();

  const { data: visits = [], isLoading } = useDoctorVisits(
    selectedUser !== 'all' ? selectedUser : undefined,
    selectedMonth
  );
  const { data: marketingUsers = [] } = useMarketingUsers();
  const deleteVisit = useDeleteDoctorVisit();

  const filteredVisits = visits.filter(visit =>
    visit.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visit.hospital_clinic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visit.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getOutcomeBadge = (outcome?: string) => {
    switch (outcome) {
      case 'Positive':
        return <Badge className="bg-green-100 text-green-800">Positive</Badge>;
      case 'Negative':
        return <Badge className="bg-red-100 text-red-800">Negative</Badge>;
      case 'Neutral':
        return <Badge className="bg-gray-100 text-gray-800">Neutral</Badge>;
      case 'Follow-up Required':
        return <Badge className="bg-yellow-100 text-yellow-800">Follow-up</Badge>;
      case 'Not Available':
        return <Badge className="bg-gray-100 text-gray-800">N/A</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">-</Badge>;
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this visit?')) {
      try {
        await deleteVisit.mutateAsync(id);
        toast({
          title: 'Success',
          description: 'Doctor visit deleted successfully',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete visit',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Doctor Visits - Current Month
          </CardTitle>
          <Button onClick={onAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Visit
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by doctor name, hospital, or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {marketingUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="text-center py-12">
            <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Visits Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No visits match your search criteria.' : 'No doctor visits recorded this month.'}
            </p>
            <Button onClick={onAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Visit
            </Button>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Doctor Name</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Hospital/Clinic</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Marketing Staff</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell>
                      {new Date(visit.visit_date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{visit.doctor_name}</TableCell>
                    <TableCell>{visit.specialty || '-'}</TableCell>
                    <TableCell>{visit.hospital_clinic_name || '-'}</TableCell>
                    <TableCell>{visit.contact_number || '-'}</TableCell>
                    <TableCell>{visit.marketing_users?.name || '-'}</TableCell>
                    <TableCell>{getOutcomeBadge(visit.disposition)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" disabled>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(visit.id)}
                          className="text-red-600 hover:text-red-700"
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
        )}

        {/* Summary */}
        {filteredVisits.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredVisits.length} visit(s)
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DoctorVisitsList;

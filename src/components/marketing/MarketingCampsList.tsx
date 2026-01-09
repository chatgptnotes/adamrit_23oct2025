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
import { Plus, Search, Tent, Trash2, Edit } from 'lucide-react';
import { useMarketingCamps, useMarketingUsers, useDeleteMarketingCamp, useUpdateMarketingCamp } from '@/hooks/useMarketingData';
import { useToast } from '@/hooks/use-toast';

interface MarketingCampsListProps {
  onAddNew: () => void;
  selectedMonth?: string;
}

const MarketingCampsList: React.FC<MarketingCampsListProps> = ({ onAddNew, selectedMonth }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  const { data: camps = [], isLoading } = useMarketingCamps(
    selectedUser !== 'all' ? selectedUser : undefined,
    selectedMonth
  );
  const { data: marketingUsers = [] } = useMarketingUsers();
  const deleteCamp = useDeleteMarketingCamp();
  const updateCamp = useUpdateMarketingCamp();

  const filteredCamps = camps.filter(camp => {
    const matchesSearch =
      camp.camp_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camp.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || camp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'Scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'Cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'Postponed':
        return <Badge className="bg-yellow-100 text-yellow-800">Postponed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this camp?')) {
      try {
        await deleteCamp.mutateAsync(id);
        toast({
          title: 'Success',
          description: 'Marketing camp deleted successfully',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete camp',
          variant: 'destructive',
        });
      }
    }
  };

  const handleMarkCompleted = async (id: string) => {
    try {
      await updateCamp.mutateAsync({ id, status: 'Completed' });
      toast({
        title: 'Success',
        description: 'Camp marked as completed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update camp status',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tent className="h-5 w-5" />
            Marketing Camps - Current Month
          </CardTitle>
          <Button onClick={onAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Camp
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by camp name or location..."
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Scheduled">Scheduled</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
              <SelectItem value="Postponed">Postponed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredCamps.length === 0 ? (
          <div className="text-center py-12">
            <Tent className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Camps Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No camps match your search criteria.' : 'No marketing camps recorded this month.'}
            </p>
            <Button onClick={onAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Camp
            </Button>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Camp Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Marketing Staff</TableHead>
                  <TableHead>Patients Screened</TableHead>
                  <TableHead>Referrals</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCamps.map((camp) => (
                  <TableRow key={camp.id}>
                    <TableCell>
                      {new Date(camp.camp_date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{camp.camp_name}</TableCell>
                    <TableCell>{camp.location}</TableCell>
                    <TableCell>{camp.camp_type || '-'}</TableCell>
                    <TableCell>{camp.marketing_users?.name || '-'}</TableCell>
                    <TableCell>{camp.patients_screened || 0}</TableCell>
                    <TableCell>{camp.referrals_generated || 0}</TableCell>
                    <TableCell>{getStatusBadge(camp.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {camp.status === 'Scheduled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkCompleted(camp.id)}
                          >
                            Mark Done
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" disabled>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(camp.id)}
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
        {filteredCamps.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredCamps.length} camp(s) |
            Completed: {filteredCamps.filter(c => c.status === 'Completed').length} |
            Scheduled: {filteredCamps.filter(c => c.status === 'Scheduled').length}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketingCampsList;

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Clock, UserCheck, UserX, Coffee } from 'lucide-react';
import { StaffMember, ResourceAllocation } from '@/types/operation-theatre';

interface StaffAllocationProps {
  staff: StaffMember[];
  allocations: ResourceAllocation[];
  selectedTheatre: number | null;
  onAllocate: (resourceId: string, patientId: string, quantity: number) => void;
  onDeallocate: (allocationId: string) => void;
}

export const StaffAllocation: React.FC<StaffAllocationProps> = ({
  staff,
  allocations,
  selectedTheatre,
  onAllocate,
  onDeallocate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [assignmentDialog, setAssignmentDialog] = useState<{
    open: boolean;
    staff: StaffMember | null;
  }>({ open: false, staff: null });
  const [patientId, setPatientId] = useState('');

  const roles = ['all', 'surgeon', 'anesthesiologist', 'nurse', 'technician'];

  const getStatusColor = (status: StaffMember['availability_status']) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'busy': return 'bg-red-100 text-red-800 border-red-200';
      case 'on_break': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'off_duty': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: StaffMember['role']) => {
    switch (role) {
      case 'surgeon': return <UserCheck className="w-4 h-4" />;
      case 'anesthesiologist': return <UserCheck className="w-4 h-4" />;
      case 'nurse': return <Users className="w-4 h-4" />;
      case 'technician': return <UserCheck className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: StaffMember['availability_status']) => {
    switch (status) {
      case 'available': return <UserCheck className="w-4 h-4 text-green-600" />;
      case 'busy': return <UserX className="w-4 h-4 text-red-600" />;
      case 'on_break': return <Coffee className="w-4 h-4 text-yellow-600" />;
      case 'off_duty': return <UserX className="w-4 h-4 text-gray-600" />;
      default: return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.specialization?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getStaffAllocations = (staffId: string) => {
    return allocations.filter(a => 
      a.resource_id === staffId && 
      (a.status === 'allocated' || a.status === 'in_use')
    );
  };

  const isShiftActive = (member: StaffMember) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const shiftStart = new Date(member.shift_start);
    const shiftEnd = new Date(member.shift_end);
    
    const startTime = shiftStart.getHours() * 60 + shiftStart.getMinutes();
    const endTime = shiftEnd.getHours() * 60 + shiftEnd.getMinutes();
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Shift crosses midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  };

  const handleAssignClick = (staffMember: StaffMember) => {
    setAssignmentDialog({ open: true, staff: staffMember });
    setPatientId('');
  };

  const handleAssignConfirm = () => {
    if (assignmentDialog.staff && patientId.trim()) {
      onAllocate(assignmentDialog.staff.id, patientId.trim(), 1);
      setAssignmentDialog({ open: false, staff: null });
      setPatientId('');
    }
  };

  const canAssign = (staffMember: StaffMember) => {
    return staffMember.availability_status === 'available' && isShiftActive(staffMember);
  };

  const getRoleStats = () => {
    const stats = roles.slice(1).map(role => {
      const roleStaff = staff.filter(s => s.role === role);
      const available = roleStaff.filter(s => s.availability_status === 'available').length;
      return { role, total: roleStaff.length, available };
    });
    return stats;
  };

  const roleStats = getRoleStats();

  return (
    <div className="space-y-6">
      {/* Role Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {roleStats.map(stat => (
          <Card key={stat.role}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 capitalize">{stat.role}s</p>
                  <p className="text-lg font-bold">{stat.available}/{stat.total}</p>
                </div>
                {getRoleIcon(stat.role as StaffMember['role'])}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="staff-search">Search Staff</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="staff-search"
                  placeholder="Search by name or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Role</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {roles.map(role => (
                  <Button
                    key={role}
                    variant={selectedRole === role ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedRole(role)}
                    className="capitalize"
                  >
                    {role}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map(member => {
          const memberAllocations = getStaffAllocations(member.id);
          const shiftActive = isShiftActive(member);
          
          return (
            <Card key={member.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(member.role)}
                    <div>
                      <CardTitle className="text-sm">{member.name}</CardTitle>
                      <p className="text-xs text-gray-600 capitalize">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={getStatusColor(member.availability_status)}>
                      {getStatusIcon(member.availability_status)}
                      <span className="ml-1 capitalize">
                        {member.availability_status.replace('_', ' ')}
                      </span>
                    </Badge>
                    {!shiftActive && (
                      <Badge variant="outline" className="text-xs">
                        Off Shift
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Staff Details */}
                <div className="space-y-1 text-sm text-gray-600">
                  {member.specialization && (
                    <div>
                      <span className="font-medium">Specialization:</span>
                      <p className="text-xs">{member.specialization}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span>Shift:</span>
                    <span className="text-xs flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(member.shift_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                      {new Date(member.shift_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {member.current_assignment && (
                    <div>
                      <span className="font-medium">Current Assignment:</span>
                      <p className="text-xs">{member.current_assignment}</p>
                    </div>
                  )}
                </div>

                {/* Current Allocations */}
                {memberAllocations.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs">Current Assignments:</Label>
                    {memberAllocations.map(allocation => (
                      <div key={allocation.resource_id + allocation.allocated_at} 
                           className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                        <span>Patient Assignment</span>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {allocation.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={() => onDeallocate(allocation.resource_id)}
                          >
                            Release
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleAssignClick(member)}
                    disabled={!canAssign(member)}
                    className="flex-1"
                  >
                    Assign
                  </Button>
                  
                  {member.availability_status === 'on_break' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        // Handle return from break
                      }}
                    >
                      Return from Break
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredStaff.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No staff members found matching your criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Assignment Dialog */}
      <Dialog 
        open={assignmentDialog.open} 
        onOpenChange={(open) => setAssignmentDialog({ open, staff: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Staff Member</DialogTitle>
          </DialogHeader>
          
          {assignmentDialog.staff && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{assignmentDialog.staff.name}</h4>
                <p className="text-sm text-gray-600 capitalize">
                  {assignmentDialog.staff.role}
                  {assignmentDialog.staff.specialization && ` - ${assignmentDialog.staff.specialization}`}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="patient-assignment">Patient ID</Label>
                <Input
                  id="patient-assignment"
                  placeholder="Enter patient ID..."
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAssignmentDialog({ open: false, staff: null })}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAssignConfirm}
              disabled={!patientId.trim() || !assignmentDialog.staff}
            >
              Assign Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
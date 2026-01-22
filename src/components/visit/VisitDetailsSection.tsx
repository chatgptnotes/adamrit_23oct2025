import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { supabase } from '@/integrations/supabase/client';

interface VisitDetailsSectionProps {
  visitDate: Date;
  setVisitDate: (date: Date) => void;
  formData: {
    visitType: string;
    appointmentWith: string;
    reasonForVisit: string;
    relationWithEmployee: string;
    status: string;
    patientType?: string;
    wardAllotted?: string;
    roomAllotted?: string;
    referringDoctor?: string;
    relationshipManager?: string;
    claimId?: string;
  };
  handleInputChange: (field: string, value: string) => void;
  existingVisit?: any; // Optional existing visit data for edit mode
}

export const VisitDetailsSection: React.FC<VisitDetailsSectionProps> = ({
  visitDate,
  setVisitDate,
  formData,
  handleInputChange,
  existingVisit
}) => {
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string; specialty: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Referees state
  const [referees, setReferees] = useState<Array<{ id: string; name: string; specialty: string | null; institution: string | null }>>([]);
  const [isLoadingReferees, setIsLoadingReferees] = useState(true);

  // Relationship Managers state
  const [relationshipManagers, setRelationshipManagers] = useState<Array<{ id: string; name: string; contact_no: string | null }>>([]);
  const [isLoadingRelationshipManagers, setIsLoadingRelationshipManagers] = useState(true);

  // Ward and Room Management
  const [wards, setWards] = useState<Array<{ ward_id: string; ward_type: string; maximum_rooms: number }>>([]);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<number[]>([]);
  const [selectedWard, setSelectedWard] = useState<{ ward_id: string; maximum_rooms: number } | null>(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Fetching doctors from hope_surgeons table...');
        
        const { data, error } = await supabase
          .from('hope_surgeons')
          .select('id, name, specialty')
          .order('name');
        
        if (error) {
          console.error('Error fetching doctors:', error);
          setError('Failed to load doctors');
          setDoctors([]);
        } else {
          console.log('Doctors fetched successfully:', data);
          setDoctors(data || []);
        }
      } catch (error) {
        console.error('Exception while fetching doctors:', error);
        setError('Failed to load doctors');
        setDoctors([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Fetch referees from referees table
  useEffect(() => {
    const fetchReferees = async () => {
      try {
        setIsLoadingReferees(true);
        console.log('Fetching referees from referees table...');

        const { data, error } = await supabase
          .from('referees')
          .select('id, name, specialty, institution')
          .order('name');

        if (error) {
          console.error('Error fetching referees:', error);
          setReferees([]);
        } else {
          console.log('Referees fetched successfully:', data);
          setReferees(data || []);
        }
      } catch (error) {
        console.error('Exception while fetching referees:', error);
        setReferees([]);
      } finally {
        setIsLoadingReferees(false);
      }
    };

    fetchReferees();
  }, []);

  // Fetch relationship managers from relationship_managers table
  useEffect(() => {
    const fetchRelationshipManagers = async () => {
      try {
        setIsLoadingRelationshipManagers(true);
        console.log('Fetching relationship managers...');

        const { data, error } = await supabase
          .from('relationship_managers')
          .select('id, name, contact_no')
          .order('name');

        if (error) {
          console.error('Error fetching relationship managers:', error);
          setRelationshipManagers([]);
        } else {
          console.log('Relationship managers fetched successfully:', data);
          setRelationshipManagers(data || []);
        }
      } catch (error) {
        console.error('Exception while fetching relationship managers:', error);
        setRelationshipManagers([]);
      } finally {
        setIsLoadingRelationshipManagers(false);
      }
    };

    fetchRelationshipManagers();
  }, []);

  // Fetch wards from room_management table
  useEffect(() => {
    const fetchWards = async () => {
      try {
        setIsLoadingWards(true);
        console.log('Fetching wards from room_management table...');

        const { data, error } = await supabase
          .from('room_management')
          .select('ward_id, ward_type, maximum_rooms')
          .order('ward_type');

        if (error) {
          console.error('Error fetching wards:', error);
          setWards([]);
        } else {
          console.log('Wards fetched successfully:', data);
          setWards(data || []);
        }
      } catch (error) {
        console.error('Exception while fetching wards:', error);
        setWards([]);
      } finally {
        setIsLoadingWards(false);
      }
    };

    fetchWards();
  }, []);

  // Update available rooms when ward is selected - fetch occupied rooms and filter them out
  useEffect(() => {
    const fetchAvailableRooms = async () => {
      if (formData.wardAllotted) {
        const ward = wards.find(w => w.ward_id === formData.wardAllotted);
        if (ward) {
          setSelectedWard({ ward_id: ward.ward_id, maximum_rooms: ward.maximum_rooms });

          try {
            // Fetch all occupied rooms for this ward (where discharge_date is NULL)
            const { data: occupiedVisits, error } = await supabase
              .from('visits')
              .select('room_allotted, id')
              .eq('ward_allotted', formData.wardAllotted)
              .is('discharge_date', null);

            if (error) {
              console.error('Error fetching occupied rooms:', error);
              // If error, show all rooms as fallback
              const rooms = Array.from({ length: ward.maximum_rooms }, (_, i) => i + 1);
              setAvailableRooms(rooms);
              return;
            }

            // Get list of occupied room numbers
            const occupiedRooms = occupiedVisits
              ?.map(v => parseInt(v.room_allotted))
              .filter(room => !isNaN(room)) || [];

            // If in edit mode, exclude current visit's room from occupied list
            const currentRoomNumber = existingVisit?.room_allotted ? parseInt(existingVisit.room_allotted) : null;
            const filteredOccupiedRooms = currentRoomNumber
              ? occupiedRooms.filter(room => room !== currentRoomNumber)
              : occupiedRooms;

            console.log('Occupied rooms:', filteredOccupiedRooms);
            console.log('Current room (edit mode):', currentRoomNumber);

            // Generate all room numbers and filter out occupied ones
            const allRooms = Array.from({ length: ward.maximum_rooms }, (_, i) => i + 1);
            const availableRoomsList = allRooms.filter(room => !filteredOccupiedRooms.includes(room));

            console.log('Available rooms:', availableRoomsList);
            setAvailableRooms(availableRoomsList);
          } catch (error) {
            console.error('Exception while fetching occupied rooms:', error);
            // If exception, show all rooms as fallback
            const rooms = Array.from({ length: ward.maximum_rooms }, (_, i) => i + 1);
            setAvailableRooms(rooms);
          }
        }
      } else {
        setSelectedWard(null);
        setAvailableRooms([]);
      }
    };

    fetchAvailableRooms();
  }, [formData.wardAllotted, wards, existingVisit]);

  // Check room availability
  const checkAvailability = async () => {
    if (!formData.wardAllotted) {
      alert('Please select a ward first');
      return;
    }

    try {
      // Fetch all occupied rooms for this ward
      const { data, error } = await supabase
        .from('visits')
        .select('room_allotted')
        .eq('ward_allotted', formData.wardAllotted)
        .not('room_allotted', 'is', null);

      if (error) {
        console.error('Error checking availability:', error);
        alert('Failed to check availability');
        return;
      }

      const occupiedRooms = data.map(v => parseInt(v.room_allotted));
      const totalRooms = selectedWard?.maximum_rooms || 0;
      const allRooms = Array.from({ length: totalRooms }, (_, i) => i + 1);
      const available = allRooms.filter(room => !occupiedRooms.includes(room));

      alert(`Available rooms: ${available.length}\nOccupied rooms: ${occupiedRooms.length}\nTotal rooms: ${totalRooms}\n\nAvailable: ${available.join(', ')}`);
    } catch (error) {
      console.error('Error checking availability:', error);
      alert('Failed to check availability');
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setVisitDate(date);
    }
  };

  // Show ward/room fields only for IPD or Emergency patients
  const showWardRoomFields = formData.patientType === 'IPD' ||
                             formData.patientType === 'IPD (Inpatient)' ||
                             formData.patientType === 'Emergency';

  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-blue-700 mb-4">Visit Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Row 1 */}
        <div className="space-y-2">
          <EnhancedDatePicker
            label="Visit Date"
            value={visitDate}
            onChange={handleDateChange}
            placeholder="Select visit date"
            isDOB={false}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="patientType" className="text-sm font-medium">
            Patient Type <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.patientType || ''} onValueChange={(value) => handleInputChange('patientType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Patient Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPD">OPD (Outpatient)</SelectItem>
              <SelectItem value="IPD">IPD (Inpatient)</SelectItem>
              <SelectItem value="Emergency">Emergency</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Row 2 */}
        <div className="space-y-2">
          <Label htmlFor="visitType" className="text-sm font-medium">
            Visit Type <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.visitType} onValueChange={(value) => handleInputChange('visitType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Visit Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consultation">Consultation</SelectItem>
              <SelectItem value="follow-up">Follow-up</SelectItem>
              <SelectItem value="surgery">Surgery</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="routine-checkup">Routine Checkup</SelectItem>
              <SelectItem value="patient-admission">Patient Admission</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="appointmentWith" className="text-sm font-medium">
            Appointment With <span className="text-red-500">*</span>
          </Label>
          <SearchableSelect
            options={[
              { value: 'none', label: 'None' },
              ...(formData.appointmentWith &&
                 formData.appointmentWith !== 'none' &&
                 !doctors.some(d => d.name === formData.appointmentWith)
                ? [{ value: formData.appointmentWith, label: `${formData.appointmentWith} (Current)` }]
                : []),
              ...doctors.map((doctor) => ({
                value: doctor.name,
                label: `${doctor.name}${doctor.specialty ? ` (${doctor.specialty})` : ''}`
              }))
            ]}
            value={formData.appointmentWith || ''}
            onValueChange={(value) => handleInputChange('appointmentWith', value)}
            placeholder={
              isLoading
                ? "Loading doctors..."
                : error
                ? "Error loading doctors"
                : doctors.length === 0
                ? "No doctors available"
                : "Select Doctor"
            }
            searchPlaceholder="Search doctors..."
            emptyText="No doctor found."
          />
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          {!isLoading && !error && doctors.length === 0 && (
            <p className="text-sm text-gray-500">No doctors found in the database</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reasonForVisit" className="text-sm font-medium">
            Reason for Visit <span className="text-red-500">*</span>
          </Label>
          <Input
            id="reasonForVisit"
            placeholder="Reason for visit"
            value={formData.reasonForVisit}
            onChange={(e) => handleInputChange('reasonForVisit', e.target.value)}
          />
        </div>

        {/* Row 3 */}
        <div className="space-y-2">
          <Label htmlFor="relationWithEmployee" className="text-sm font-medium">
            Relation with Employee
          </Label>
          <Select value={formData.relationWithEmployee} onValueChange={(value) => handleInputChange('relationWithEmployee', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Relation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="self">Self</SelectItem>
              <SelectItem value="spouse">Spouse</SelectItem>
              <SelectItem value="child">Child</SelectItem>
              <SelectItem value="parent">Parent</SelectItem>
              <SelectItem value="dependent">Dependent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status" className="text-sm font-medium">
            Status
          </Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Referring Doctor */}
        <div className="space-y-2">
          <Label htmlFor="referringDoctor" className="text-sm font-medium">
            Referring Doctor
          </Label>
          <SearchableSelect
            options={[
              { value: 'none', label: 'None' },
              ...referees.map((referee) => ({
                value: referee.name,
                label: `${referee.name}${referee.specialty ? ` (${referee.specialty})` : ''}`
              }))
            ]}
            value={formData.referringDoctor || ''}
            onValueChange={(value) => handleInputChange('referringDoctor', value)}
            placeholder={
              isLoadingReferees
                ? "Loading referees..."
                : referees.length === 0
                ? "No referees available"
                : "Select Referring Doctor"
            }
            searchPlaceholder="Search referees..."
            emptyText="No referee found."
          />
        </div>

        {/* Relationship Manager */}
        <div className="space-y-2">
          <Label htmlFor="relationshipManager" className="text-sm font-medium">
            Relationship Manager
          </Label>
          <SearchableSelect
            options={[
              { value: 'none', label: 'None' },
              ...relationshipManagers.map((manager) => ({
                value: manager.name,
                label: manager.name
              }))
            ]}
            value={formData.relationshipManager || ''}
            onValueChange={(value) => handleInputChange('relationshipManager', value)}
            placeholder={
              isLoadingRelationshipManagers
                ? "Loading..."
                : relationshipManagers.length === 0
                ? "No managers available"
                : "Select Relationship Manager"
            }
            searchPlaceholder="Search managers..."
            emptyText="No manager found."
          />
        </div>

        {/* Claim Id */}
        <div className="space-y-2">
          <Label htmlFor="claimId" className="text-sm font-medium">
            Claim Id <span className="text-red-500">*</span>
          </Label>
          <Input
            id="claimId"
            placeholder="Enter Claim Id"
            value={formData.claimId || ''}
            onChange={(e) => handleInputChange('claimId', e.target.value)}
          />
        </div>

        {/* Row 4 - Ward and Room Allocation (Only for IPD/Emergency) */}
        {showWardRoomFields && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="wardAllotted" className="text-sm font-medium">
                  Ward Allotted <span className="text-red-500">*</span>
                </Label>
                <button
                  type="button"
                  onClick={checkAvailability}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Check Availability
                </button>
              </div>
              <Select
                value={formData.wardAllotted || ''}
                onValueChange={(value) => {
                  handleInputChange('wardAllotted', value);
                  // Reset room when ward changes
                  handleInputChange('roomAllotted', '');
                }}
                disabled={isLoadingWards}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingWards
                        ? "Loading wards..."
                        : wards.length === 0
                        ? "No wards available"
                        : "Select Ward"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {wards.map((ward) => (
                    <SelectItem key={ward.ward_id} value={ward.ward_id}>
                      {ward.ward_type} (Max: {ward.maximum_rooms} beds)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomAllotted" className="text-sm font-medium">
                Room Allotted <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.roomAllotted || ''}
                onValueChange={(value) => handleInputChange('roomAllotted', value)}
                disabled={!formData.wardAllotted || availableRooms.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Please Select" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((roomNum) => (
                    <SelectItem key={roomNum} value={roomNum.toString()}>
                      Bed {roomNum}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.wardAllotted && availableRooms.length === 0 && (
                <p className="text-xs text-gray-500">No rooms available in selected ward</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

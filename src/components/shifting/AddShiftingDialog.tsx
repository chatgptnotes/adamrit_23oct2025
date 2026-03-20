import React, { useState } from 'react';
import { Search, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AddShiftingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hospitalName: string | undefined;
  onSuccess: () => void;
}

interface Visit {
  id: string;
  visit_id: string;
  visit_date: string;
  visit_type: string;
  status: string;
  appointment_with: string;
  patient_type: string;
  ward_allotted: string | null;
  discharge_date: string | null;
  patients?: { id: string; name: string; patients_id: string; age?: number; gender?: string; phone?: string } | null;
  room_management?: { ward_type: string } | null;
}

const AddShiftingDialog: React.FC<AddShiftingDialogProps> = ({
  open,
  onOpenChange,
  hospitalName,
  onSuccess,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [fromWard, setFromWard] = useState('');
  const [shiftingWard, setShiftingWard] = useState('');
  const [shiftingDate, setShiftingDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Search active visits by patient name
  const { data: visits = [], isLoading: searchLoading } = useQuery({
    queryKey: ['shifting-visit-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];

      // Single query: find all IPD/Emergency visits where patient name matches
      const { data: visitsData, error } = await supabase
        .from('visits')
        .select('*, patients!inner(id, name, patients_id, age, gender, phone)')
        .ilike('patients.name', `%${searchTerm}%`)
        .in('patient_type', ['IPD', 'Emergency'])
        .order('visit_date', { ascending: false });

      if (error) {
        console.error('Error searching visits:', error);
        return [];
      }
      if (!visitsData?.length) return [];

      // Step 3: Fetch ward types from room_management using ward_allotted
      const wardIds = visitsData
        .map((v: any) => v.ward_allotted)
        .filter((id: string | null): id is string => !!id);
      const uniqueWardIds = [...new Set(wardIds)];

      let wardMapping: Record<string, string> = {};
      if (uniqueWardIds.length > 0) {
        const { data: wardData } = await supabase
          .from('room_management')
          .select('ward_id, ward_type')
          .in('ward_id', uniqueWardIds);
        if (wardData) {
          wardMapping = wardData.reduce((acc, w) => {
            acc[w.ward_id] = w.ward_type;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      const mapped = visitsData.map((v: any) => ({
        ...v,
        room_management: v.ward_allotted && wardMapping[v.ward_allotted]
          ? { ward_type: wardMapping[v.ward_allotted] }
          : null,
      }));
      const sorted = mapped.sort((a, b) => {
        if (!a.discharge_date && b.discharge_date) return -1;
        if (a.discharge_date && !b.discharge_date) return 1;
        return 0;
      });
      return sorted as Visit[];
    },
    enabled: searchTerm.length >= 2 && !selectedVisit,
  });

  // Fetch ward types from room_management
  const { data: wardTypes = [] } = useQuery({
    queryKey: ['ward-types-for-shifting', hospitalName],
    queryFn: async () => {
      let query = supabase.from('room_management').select('ward_type');
      if (hospitalName) {
        query = query.eq('hospital_name', hospitalName);
      }
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching ward types:', error);
        return [];
      }
      const unique = [...new Set((data || []).map((d: any) => d.ward_type))].filter(Boolean);
      return unique as string[];
    },
  });

  const resetForm = () => {
    setSearchTerm('');
    setSelectedVisit(null);
    setFromWard('');
    setShiftingWard('');
    setShiftingDate(new Date().toISOString().slice(0, 16));
    setRemark('');
  };

  const handleSubmit = async () => {
    if (!selectedVisit) {
      toast.error('Please select a visit');
      return;
    }
    if (!shiftingWard) {
      toast.error('Please select a shifting ward');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('ward_shiftings').insert([
        {
          visit_id: selectedVisit.id,
          patient_name: selectedVisit.patients?.name || 'Unknown',
          shifting_date: new Date(shiftingDate).toISOString(),
          from_ward: fromWard || null,
          shifting_ward: shiftingWard,
          remark: remark || null,
          hospital_name: hospitalName || null,
        },
      ]);

      if (error) throw error;

      toast.success('Shifting record added successfully');
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error adding shifting:', error);
      toast.error('Failed to add shifting record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetForm();
        onOpenChange(val);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Shifting</DialogTitle>
          <DialogDescription>
            Search by patient name, select a visit, and assign a new ward.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Visit Search */}
          <div className="space-y-2">
            <Label>Visit</Label>
            {selectedVisit ? (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedVisit.visit_id}</Badge>
                    <Badge variant="secondary">{selectedVisit.status}</Badge>
                    {selectedVisit.room_management?.ward_type && (
                      <Badge>{selectedVisit.room_management.ward_type}</Badge>
                    )}
                    <Badge variant={selectedVisit.discharge_date ? 'destructive' : 'default'} className={!selectedVisit.discharge_date ? 'bg-green-600' : ''}>
                      {selectedVisit.discharge_date ? 'Discharged' : 'Admitted'}
                    </Badge>
                  </div>
                  <p className="font-medium mt-1">
                    {selectedVisit.patients?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Patient ID: {selectedVisit.patients?.patients_id || 'N/A'} | Age: {selectedVisit.patients?.age || 'N/A'} | Gender: {selectedVisit.patients?.gender || 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedVisit.visit_date).toLocaleDateString()} | {selectedVisit.visit_type} | Dr. {selectedVisit.appointment_with}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedVisit(null);
                    setFromWard('');
                    setSearchTerm('');
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by patient name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {searchLoading && (
                  <p className="text-sm text-muted-foreground">Searching...</p>
                )}

                {visits.length > 0 && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {visits.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={async () => {
                          setSelectedVisit(v);
                          // Check for most recent shifting record to determine current ward
                          const { data: lastShifting } = await supabase
                            .from('ward_shiftings')
                            .select('shifting_ward')
                            .eq('visit_id', v.id)
                            .order('shifting_date', { ascending: false })
                            .order('created_at', { ascending: false })
                            .limit(1);
                          if (lastShifting && lastShifting.length > 0) {
                            setFromWard(lastShifting[0].shifting_ward);
                          } else if (v.room_management?.ward_type) {
                            setFromWard(v.room_management.ward_type);
                          }
                        }}
                      >
                        <div>
                          <p className="font-semibold">
                            {v.patients?.name || 'Unknown'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{v.visit_id}</Badge>
                            {v.room_management?.ward_type && (
                              <Badge>{v.room_management.ward_type}</Badge>
                            )}
                            <Badge variant={v.discharge_date ? 'destructive' : 'default'} className={!v.discharge_date ? 'bg-green-600' : ''}>
                              {v.discharge_date ? 'Discharged' : 'Admitted'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(v.visit_date).toLocaleDateString()} | {v.visit_type} | Dr. {v.appointment_with}
                          </p>
                        </div>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="space-y-2">
            <Label>Date & Time</Label>
            <Input
              type="datetime-local"
              value={shiftingDate}
              onChange={(e) => setShiftingDate(e.target.value)}
            />
          </div>

          {/* From Ward (auto-filled, read-only) */}
          <div className="space-y-2">
            <Label>From Ward</Label>
            <Input
              value={fromWard}
              readOnly
              disabled
              placeholder="Auto-filled when visit is selected"
            />
          </div>

          {/* To Ward */}
          <div className="space-y-2">
            <Label>To Ward</Label>
            <Select value={shiftingWard} onValueChange={setShiftingWard}>
              <SelectTrigger>
                <SelectValue placeholder="Select to ward" />
              </SelectTrigger>
              <SelectContent>
                {wardTypes.map((ward) => (
                  <SelectItem key={ward} value={ward}>
                    {ward}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Remark */}
          <div className="space-y-2">
            <Label>Remark</Label>
            <Input
              placeholder="Enter remark (optional)"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Shifting'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddShiftingDialog;

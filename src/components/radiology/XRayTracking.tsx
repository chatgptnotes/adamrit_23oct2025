import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Search,
  Clock,
  CheckCircle,
  FileText,
  User,
  Calendar,
  Play,
  ScanLine,
  FileCheck,
  RefreshCw
} from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  patients_id?: string;
  primary_diagnosis?: string;
  admission_date?: string;
  created_at: string;
  surgeon?: string;
  consultant?: string;
}

interface XRayRecord {
  id: string;
  visit_id: string;
  radiology_id: string;
  ordered_date: string | null;
  completed_date: string | null;
  report_given_date: string | null; // stored in scheduled_date column
  status: string | null;
  patient_name?: string;
  patients_id?: string;
  radiology_name?: string;
}

const XRayTracking: React.FC = () => {
  const { hospitalConfig } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [xrayRecord, setXrayRecord] = useState<XRayRecord | null>(null);
  const [allRecords, setAllRecords] = useState<XRayRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load all records on mount
  useEffect(() => {
    loadAllRecords();
  }, [selectedDate]);

  const loadAllRecords = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('visit_radiology')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !data) {
        setAllRecords([]);
        return;
      }

      const records: XRayRecord[] = [];
      for (const r of data) {
        let patient_name = '';
        let patients_id = '';
        let radiology_name = '';

        // Get patient info via visit
        const { data: visitData } = await supabase
          .from('visits')
          .select('patient_id')
          .eq('id', r.visit_id)
          .single();

        if (visitData?.patient_id) {
          const { data: patientData } = await supabase
            .from('patients')
            .select('name, patients_id')
            .eq('id', visitData.patient_id)
            .single();
          if (patientData) {
            patient_name = patientData.name;
            patients_id = patientData.patients_id || '';
          }
        }

        // Get radiology name
        const { data: radData } = await supabase
          .from('radiology')
          .select('name')
          .eq('id', r.radiology_id)
          .single();
        if (radData) radiology_name = radData.name;

        records.push({
          id: r.id,
          visit_id: r.visit_id,
          radiology_id: r.radiology_id,
          ordered_date: r.ordered_date,
          completed_date: r.completed_date,
          report_given_date: r.scheduled_date,
          status: r.status,
          patient_name,
          patients_id,
          radiology_name
        });
      }

      setAllRecords(records);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Search patients
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a patient name or ID to search');
      return;
    }

    try {
      setSearchLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('hospital_name', hospitalConfig.name)
        .or(`name.ilike.%${searchTerm}%,patients_id.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        toast.error('Error searching patients');
        return;
      }

      setPatients(data || []);
      if (!data || data.length === 0) {
        toast.info('No patients found');
      }
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  // Select patient → auto-create X-Ray entry if none exists for today
  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setPatients([]);
    setSearchTerm('');

    try {
      setLoading(true);

      // Get latest visit for this patient
      const { data: visits } = await supabase
        .from('visits')
        .select('id')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });

      if (!visits || visits.length === 0) {
        toast.error('No visit found for this patient. Please register a visit first.');
        setXrayRecord(null);
        return;
      }

      const latestVisitId = visits[0].id;

      // Get a default radiology ID
      let radiologyId = '';
      const { data: radData } = await supabase
        .from('radiology')
        .select('id')
        .ilike('name', '%x-ray%')
        .limit(1);

      if (radData && radData.length > 0) {
        radiologyId = radData[0].id;
      } else {
        const { data: anyRad } = await supabase
          .from('radiology')
          .select('id')
          .limit(1);
        if (anyRad && anyRad.length > 0) {
          radiologyId = anyRad[0].id;
        }
      }

      if (!radiologyId) {
        toast.error('No radiology tests found in master list');
        return;
      }

      // Always create a fresh X-Ray entry (explicitly set timestamps to null so DB defaults don't auto-fill)
      const { data: newRecord, error: insertError } = await supabase
        .from('visit_radiology')
        .insert({
          visit_id: latestVisitId,
          radiology_id: radiologyId,
          ordered_date: null as any,
          completed_date: null as any
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        toast.error('Failed to create X-Ray entry: ' + insertError.message);
        return;
      }

      if (!newRecord) {
        toast.error('Failed to create X-Ray entry');
        return;
      }

      setXrayRecord({
        id: newRecord.id,
        visit_id: newRecord.visit_id,
        radiology_id: newRecord.radiology_id,
        ordered_date: newRecord.ordered_date,
        completed_date: newRecord.completed_date,
        report_given_date: newRecord.scheduled_date,
        status: newRecord.status,
        patient_name: patient.name,
        patients_id: patient.patients_id || ''
      });
    } catch (err) {
      console.error('Error:', err);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Refresh current record from DB
  const refreshRecord = async () => {
    if (!xrayRecord) return;
    const { data } = await supabase
      .from('visit_radiology')
      .select('*')
      .eq('id', xrayRecord.id)
      .single();

    if (data) {
      setXrayRecord(prev => prev ? {
        ...prev,
        ordered_date: data.ordered_date,
        completed_date: data.completed_date,
        report_given_date: data.scheduled_date,
        status: data.status
      } : null);
    }
  };

  // Mark X-Ray Started
  const markXRayStarted = async (recordId: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('visit_radiology')
      .update({ ordered_date: now })
      .eq('id', recordId);

    if (error) {
      console.error('Start error:', error);
      toast.error('Failed to update: ' + error.message);
      return;
    }
    toast.success('X-Ray Started - time recorded');
    await refreshRecord();
    loadAllRecords();
  };

  // Mark Scan Completed
  const markXRayCompleted = async (recordId: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('visit_radiology')
      .update({ completed_date: now })
      .eq('id', recordId);

    if (error) {
      console.error('Complete error:', error);
      toast.error('Failed to update: ' + error.message);
      return;
    }
    toast.success('Scan Completed - time recorded');
    await refreshRecord();
    loadAllRecords();
  };

  // Mark Report Given (using scheduled_date since result_date doesn't exist in DB)
  const markReportGiven = async (recordId: string) => {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('visit_radiology')
      .update({ scheduled_date: now })
      .eq('id', recordId);

    if (error) {
      console.error('Report given error:', error);
      toast.error('Failed to update: ' + error.message);
      return;
    }

    toast.success('Report Given - time recorded');
    await refreshRecord();
    loadAllRecords();
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return null;
    try { return format(new Date(dateStr), 'hh:mm a'); } catch { return null; }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try { return format(new Date(dateStr), 'dd/MM/yyyy'); } catch { return null; }
  };

  const getStatusBadge = (record: XRayRecord) => {
    if (record.report_given_date) return <Badge className="bg-green-100 text-green-800 border-green-300">Report Given</Badge>;
    if (record.completed_date) return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Scan Completed</Badge>;
    if (record.ordered_date) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">X-Ray Started</Badge>;
    return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Pending</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Search & Select Patient */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Patient
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Search by patient name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={searchLoading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {searchLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Search
            </Button>
            {selectedPatient && (
              <Button variant="outline" onClick={() => { setSelectedPatient(null); setXrayRecord(null); }}>
                Clear
              </Button>
            )}
          </div>

          {/* Search Results */}
          {patients.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Select a patient:</p>
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => handleSelectPatient(patient)}
                >
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {patient.patients_id || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">Select</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Capture 3 Times (shown after patient selected) */}
      {selectedPatient && xrayRecord && (
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                {selectedPatient.name}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({selectedPatient.patients_id || 'N/A'})
                </span>
              </CardTitle>
              {getStatusBadge(xrayRecord)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              {/* Time 1: X-Ray Started */}
              <div className="text-center border rounded-xl p-6 space-y-3">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
                  xrayRecord.ordered_date ? 'bg-yellow-100' : 'bg-gray-100'
                }`}>
                  <Play className={`h-7 w-7 ${xrayRecord.ordered_date ? 'text-yellow-700' : 'text-gray-400'}`} />
                </div>
                <h3 className="font-semibold text-sm">X-Ray Started</h3>
                <p className="text-xs text-muted-foreground">Patient arrives & X-Ray begins</p>
                {xrayRecord.ordered_date ? (
                  <div>
                    <p className="text-xl font-bold text-yellow-700">{formatTime(xrayRecord.ordered_date)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(xrayRecord.ordered_date)}</p>
                  </div>
                ) : (
                  <Button
                    onClick={() => markXRayStarted(xrayRecord.id)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Mark Started
                  </Button>
                )}
              </div>

              {/* Time 2: Scan Completed */}
              <div className="text-center border rounded-xl p-6 space-y-3">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
                  xrayRecord.completed_date ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <ScanLine className={`h-7 w-7 ${xrayRecord.completed_date ? 'text-blue-700' : 'text-gray-400'}`} />
                </div>
                <h3 className="font-semibold text-sm">Scan Completed</h3>
                <p className="text-xs text-muted-foreground">X-Ray scan is done</p>
                {xrayRecord.completed_date ? (
                  <div>
                    <p className="text-xl font-bold text-blue-700">{formatTime(xrayRecord.completed_date)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(xrayRecord.completed_date)}</p>
                  </div>
                ) : xrayRecord.ordered_date ? (
                  <Button
                    onClick={() => markXRayCompleted(xrayRecord.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white w-full"
                  >
                    <ScanLine className="h-4 w-4 mr-2" />
                    Mark Completed
                  </Button>
                ) : (
                  <p className="text-xs text-gray-400 italic">Start X-Ray first</p>
                )}
              </div>

              {/* Time 3: Report Given */}
              <div className="text-center border rounded-xl p-6 space-y-3">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
                  xrayRecord.report_given_date ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <FileCheck className={`h-7 w-7 ${xrayRecord.report_given_date ? 'text-green-700' : 'text-gray-400'}`} />
                </div>
                <h3 className="font-semibold text-sm">Report Given</h3>
                <p className="text-xs text-muted-foreground">Report generated or given</p>
                {xrayRecord.report_given_date ? (
                  <div>
                    <p className="text-xl font-bold text-green-700">{formatTime(xrayRecord.report_given_date)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(xrayRecord.report_given_date)}</p>
                  </div>
                ) : xrayRecord.completed_date ? (
                  <Button
                    onClick={() => markReportGiven(xrayRecord.id)}
                    className="bg-green-500 hover:bg-green-600 text-white w-full"
                  >
                    <FileCheck className="h-4 w-4 mr-2" />
                    Mark Report Given
                  </Button>
                ) : (
                  <p className="text-xs text-gray-400 italic">Complete scan first</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Records Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ScanLine className="h-5 w-5" />
              All X-Ray Records
            </CardTitle>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-44"
              />
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={loadAllRecords}>
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading...
            </div>
          ) : allRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ScanLine className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No X-Ray records found. Search a patient above to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">X-Ray Started</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Scan Completed</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Report Given</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allRecords.map((record, index) => (
                    <tr key={record.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3 text-sm">
                        <p className="font-medium">{record.patient_name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{record.patients_id || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">{getStatusBadge(record)}</td>
                      <td className="px-4 py-3 text-center text-sm">
                        {formatTime(record.ordered_date) ? (
                          <div>
                            <p className="font-medium text-yellow-700">{formatTime(record.ordered_date)}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(record.ordered_date)}</p>
                          </div>
                        ) : <span className="text-gray-400">--</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {formatTime(record.completed_date) ? (
                          <div>
                            <p className="font-medium text-blue-700">{formatTime(record.completed_date)}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(record.completed_date)}</p>
                          </div>
                        ) : <span className="text-gray-400">--</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {formatTime(record.report_given_date) ? (
                          <div>
                            <p className="font-medium text-green-700">{formatTime(record.report_given_date)}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(record.report_given_date)}</p>
                          </div>
                        ) : <span className="text-gray-400">--</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default XRayTracking;

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Calendar, FileText, User, Building2, Search } from 'lucide-react';
import TreatmentSheetForm from './TreatmentSheetForm';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TreatmentRow {
  id: string;
  drugName: string;
  dosage: string;
  route: string;
  qty: string;
  stock: string;
  mrp: string;
  amount: string;
}

const TreatmentSheetList: React.FC = () => {
  const { hospitalConfig } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showTreatmentSheet, setShowTreatmentSheet] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Admitted' | 'Discharged'>('All');
  const [treatmentRows, setTreatmentRows] = useState<TreatmentRow[]>([]);

  // Get the logged-in hospital name
  const loggedInHospital = hospitalConfig?.name || 'hope';

  // Fetch patients with visits - filtered by logged-in hospital
  const { data: patientsData = [], isLoading } = useQuery({
    queryKey: ['treatment-sheet-patients', loggedInHospital],
    queryFn: async () => {
      const query = supabase
        .from('patients')
        .select(`
          id,
          name,
          patients_id,
          hospital_name,
          visits(
            id,
            visit_id,
            admission_date,
            discharge_date,
            status
          )
        `)
        .eq('hospital_name', loggedInHospital)
        .order('name');

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to include visit information
      return data.flatMap(patient =>
        patient.visits?.map(visit => ({
          id: visit.id,
          patientId: patient.id,
          name: patient.name,
          regNo: patient.patients_id,
          admissionDate: visit.admission_date,
          dischargeDate: visit.discharge_date,
          status: visit.discharge_date ? 'Discharged' : 'Admitted',
          hospitalId: patient.hospital_name,
          hospitalName: patient.hospital_name ? patient.hospital_name.charAt(0).toUpperCase() + patient.hospital_name.slice(1) : 'Unknown',
          visitId: visit.visit_id
        })) || []
      );
    }
  });

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Search for patients by name
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['patient-search', patientSearchTerm, loggedInHospital],
    queryFn: async () => {
      if (!patientSearchTerm || patientSearchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('patients')
        .select(`
          id,
          name,
          patients_id,
          hospital_name
        `)
        .eq('hospital_name', loggedInHospital)
        .ilike('name', `%${patientSearchTerm}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: patientSearchTerm.length >= 2
  });

  // Generate date range for selected patient
  const dateRange = useMemo(() => {
    if (!selectedPatient?.admissionDate) return [];

    const startDate = new Date(selectedPatient.admissionDate);
    const endDate = selectedPatient.dischargeDate
      ? new Date(selectedPatient.dischargeDate)
      : new Date();

    const dates: string[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }, [selectedPatient]);

  const handleSelectPatient = (patient: any) => {
    // Fetch patient's visit details
    supabase
      .from('patients')
      .select(`
        id,
        name,
        patients_id,
        hospital_name,
        visits(
          id,
          visit_id,
          admission_date,
          discharge_date,
          status
        )
      `)
      .eq('id', patient.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data && data.visits && data.visits.length > 0) {
          const visit = data.visits[0];
          setSelectedPatient({
            ...patient,
            admissionDate: visit.admission_date,
            dischargeDate: visit.discharge_date,
            visitId: visit.visit_id
          });
          setPatientSearchTerm(patient.name);
          setShowDropdown(false); // Hide dropdown after selection
          // Auto-select first date
          if (visit.admission_date) {
            setSelectedDate(visit.admission_date);
          }
        }
      });
  };

  const addTreatmentRow = () => {
    const newRow: TreatmentRow = {
      id: Date.now().toString(),
      drugName: '',
      dosage: '',
      route: 'Oral',
      qty: '',
      stock: '',
      mrp: '',
      amount: ''
    };
    setTreatmentRows([...treatmentRows, newRow]);
  };

  const removeTreatmentRow = (id: string) => {
    setTreatmentRows(treatmentRows.filter(row => row.id !== id));
  };

  const updateTreatmentRow = (id: string, field: keyof TreatmentRow, value: string) => {
    setTreatmentRows(treatmentRows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleSubmitTreatment = () => {
    // TODO: Save treatment data to database
    console.log('Submitting treatment data:', {
      patient: selectedPatient,
      date: selectedDate,
      treatments: treatmentRows
    });
    alert('Treatment data saved successfully!');
  };

  const calculateTotal = () => {
    return treatmentRows.reduce((sum, row) => {
      const amount = parseFloat(row.amount) || 0;
      return sum + amount;
    }, 0).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Treatment Sheet
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Patient Search */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Select Patient:</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search patient by name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                value={patientSearchTerm}
                onChange={(e) => {
                  setPatientSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
              />
              <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
            </div>

            {/* Search Results Dropdown */}
            {showDropdown && patientSearchTerm.length >= 2 && searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((patient) => (
                  <div
                    key={patient.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                    onClick={() => handleSelectPatient(patient)}
                  >
                    <User className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium">{patient.name}</p>
                      <p className="text-xs text-gray-500">{patient.patients_id}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main Content - Date Range and Treatment Sheet */}
          {selectedPatient && (
            <div className="grid grid-cols-12 gap-6">
              {/* Left Side - Date Range List */}
              <div className="col-span-2">
                <Card className="h-[600px] overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-gray-100 p-3 border-b">
                      <p className="font-semibold text-sm">Date Range</p>
                    </div>
                    <div className="overflow-y-auto h-[550px]">
                      {dateRange.map((date) => (
                        <div
                          key={date}
                          className={`px-4 py-2 cursor-pointer border-b hover:bg-blue-50 ${
                            selectedDate === date ? 'bg-blue-100 font-semibold' : ''
                          }`}
                          onClick={() => setSelectedDate(date)}
                        >
                          {new Date(date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Side - Treatment Sheet Details */}
              <div className="col-span-10">
                <Card>
                  <CardHeader className="bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-bold">{selectedPatient.name}</h3>
                        <p className="text-sm text-gray-600">Reg. No: {selectedPatient.patients_id}</p>
                      </div>
                      {selectedDate && (
                        <div className="text-right">
                          <p className="text-sm font-semibold">Selected Date:</p>
                          <p className="text-lg font-bold text-blue-600">
                            {new Date(selectedDate).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {selectedDate ? (
                      <div>
                        <h4 className="font-semibold mb-4 text-lg">Treatment Details</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-2 py-2 text-left w-12">#</th>
                                <th className="border border-gray-300 px-2 py-2 text-left">
                                  Drug Name<span className="text-red-500">*</span>
                                </th>
                                <th className="border border-gray-300 px-2 py-2 text-left">Dosage</th>
                                <th className="border border-gray-300 px-2 py-2 text-left">Route</th>
                                <th className="border border-gray-300 px-2 py-2 text-left">
                                  Qty<span className="text-red-500">*</span>
                                </th>
                                <th className="border border-gray-300 px-2 py-2 text-left">Stock</th>
                                <th className="border border-gray-300 px-2 py-2 text-left">MRP</th>
                                <th className="border border-gray-300 px-2 py-2 text-left">Amount</th>
                                <th className="border border-gray-300 px-2 py-2 text-center w-12">#</th>
                              </tr>
                            </thead>
                            <tbody>
                              {treatmentRows.length === 0 ? (
                                <tr>
                                  <td colSpan={9} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                                    Click "Add Row" to add treatment entries for this date
                                  </td>
                                </tr>
                              ) : (
                                treatmentRows.map((row, index) => (
                                  <tr key={row.id}>
                                    <td className="border border-gray-300 px-2 py-2 text-center">
                                      <input
                                        type="checkbox"
                                        className="w-4 h-4"
                                      />
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2">
                                      <input
                                        type="text"
                                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={row.drugName}
                                        onChange={(e) => updateTreatmentRow(row.id, 'drugName', e.target.value)}
                                        placeholder="Enter drug name"
                                      />
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2">
                                      <input
                                        type="text"
                                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={row.dosage}
                                        onChange={(e) => updateTreatmentRow(row.id, 'dosage', e.target.value)}
                                        placeholder="Dosage"
                                      />
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2">
                                      <select
                                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={row.route}
                                        onChange={(e) => updateTreatmentRow(row.id, 'route', e.target.value)}
                                      >
                                        <option value="">Select</option>
                                        <option value="Oral">Oral</option>
                                        <option value="IV">IV</option>
                                        <option value="IM">IM</option>
                                        <option value="SC">SC</option>
                                        <option value="Topical">Topical</option>
                                        <option value="Inhalation">Inhalation</option>
                                      </select>
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2">
                                      <input
                                        type="number"
                                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={row.qty}
                                        onChange={(e) => updateTreatmentRow(row.id, 'qty', e.target.value)}
                                        placeholder="Qty"
                                      />
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2">
                                      <input
                                        type="text"
                                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
                                        value={row.stock}
                                        readOnly
                                        placeholder="Stock"
                                      />
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2">
                                      <input
                                        type="number"
                                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={row.mrp}
                                        onChange={(e) => updateTreatmentRow(row.id, 'mrp', e.target.value)}
                                        placeholder="MRP"
                                      />
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2">
                                      <input
                                        type="number"
                                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={row.amount}
                                        onChange={(e) => updateTreatmentRow(row.id, 'amount', e.target.value)}
                                        placeholder="Amount"
                                      />
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2 text-center">
                                      <button
                                        onClick={() => removeTreatmentRow(row.id)}
                                        className="text-red-500 hover:text-red-700 font-bold text-xl"
                                        title="Remove row"
                                      >
                                        ×
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Add Row and Total */}
                        <div className="mt-4 flex justify-between items-center">
                          <Button
                            onClick={addTreatmentRow}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            Add Row
                          </Button>

                          <div className="flex items-center gap-8">
                            <div className="text-lg font-semibold">
                              Total: ₹{calculateTotal()}
                            </div>
                            <Button
                              onClick={handleSubmitTreatment}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              disabled={treatmentRows.length === 0}
                            >
                              Submit
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        Please select a date from the left panel to view treatment details
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {!selectedPatient && (
            <div className="text-center py-12 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Search and select a patient to view their treatment sheet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TreatmentSheetList;

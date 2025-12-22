import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Loader2, ArrowLeft, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  usePatientServiceTransactions,
  usePatientPaymentTransactions
} from '@/hooks/usePatientTransactions';
import * as XLSX from 'xlsx';

const PatientLedger: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const navigate = useNavigate();
  const { hospitalConfig } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-persisted state
  const fromDate = searchParams.get('from') || today;
  const toDate = searchParams.get('to') || today;
  const selectedPatientId = searchParams.get('patientId') || '';
  const selectedPatientName = searchParams.get('patientName') || '';
  const searchTerm = searchParams.get('search') || '';

  // Helper to update URL params
  const updateParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || (key === 'from' && value === today) || (key === 'to' && value === today)) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams, { replace: true });
  };

  // Setter functions
  const setFromDate = (value: string) => updateParams({ from: value });
  const setToDate = (value: string) => updateParams({ to: value });
  const setSelectedPatientId = (value: string) => updateParams({ patientId: value });
  const setSelectedPatientName = (value: string) => updateParams({ patientName: value });
  const setSearchTerm = (value: string) => updateParams({ search: value });

  // Patient autocomplete state
  const [patientSuggestions, setPatientSuggestions] = useState<Array<{id: string, name: string, phone?: string}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Use existing hooks for patient transactions
  const { data: services = [], isLoading: servicesLoading } = usePatientServiceTransactions(
    selectedPatientId || undefined,
    undefined,
    undefined, // No date filter - we'll filter locally
    hospitalConfig?.name // Pass hospital name for RPC call
  );

  const { data: payments = [], isLoading: paymentsLoading } = usePatientPaymentTransactions(
    selectedPatientId || undefined,
    undefined // No date filter - we'll filter locally
  );

  const isLoading = servicesLoading || paymentsLoading;

  // Patient search function
  const searchPatients = async (term: string) => {
    if (term.length < 2) {
      setPatientSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setIsSearchingPatients(true);
    try {
      const { data } = await supabase
        .from('patients')
        .select('id, name, phone')
        .eq('hospital_name', hospitalConfig.name)
        .or(`name.ilike.%${term}%,phone.ilike.%${term}%`)
        .order('name')
        .limit(10);
      setPatientSuggestions(data || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching patients:', error);
    }
    setIsSearchingPatients(false);
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Combine and filter transactions by date
  const filteredTransactions = useMemo(() => {
    const allTransactions: Array<{
      id: string;
      date: string;
      description: string;
      type: string;
      debit: number;
      credit: number;
    }> = [];

    // Filter services by date and add as debits
    (services || []).forEach((txn: any) => {
      const txnDate = txn.transaction_date;
      if (txnDate >= fromDate && txnDate <= toDate) {
        allTransactions.push({
          id: txn.transaction_id || `svc-${Math.random()}`,
          date: txnDate,
          description: txn.description || txn.transaction_type || 'Service',
          type: txn.transaction_type || 'SERVICE',
          debit: txn.amount || 0,
          credit: 0
        });
      }
    });

    // Filter payments by date and add as credits
    (payments || []).forEach((payment: any) => {
      const paymentDate = payment.transaction_date || payment.payment_date;
      if (paymentDate >= fromDate && paymentDate <= toDate) {
        allTransactions.push({
          id: payment.transaction_id || payment.id || `pay-${Math.random()}`,
          date: paymentDate,
          description: payment.description || `Advance Payment - ${payment.payment_mode || 'N/A'}`,
          type: 'ADVANCE_PAYMENT',
          debit: 0,
          credit: payment.amount || 0
        });
      }
    });

    // Sort by date
    allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return allTransactions;
  }, [services, payments, fromDate, toDate]);

  // Calculate totals
  const { totalDebit, totalCredit, balance } = useMemo(() => {
    let debit = 0;
    let credit = 0;

    filteredTransactions.forEach((txn) => {
      debit += txn.debit;
      credit += txn.credit;
    });

    return {
      totalDebit: debit,
      totalCredit: credit,
      balance: debit - credit
    };
  }, [filteredTransactions]);

  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const handleBack = () => {
    navigate('/ledger-statement');
  };

  const handleExportToExcel = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) return;

    const exportData = filteredTransactions.map((txn) => ({
      'Date': formatDate(txn.date),
      'Particulars': txn.description,
      'Debit': txn.debit || '',
      'Credit': txn.credit || '',
    }));

    // Add totals row
    exportData.push({
      'Date': '',
      'Particulars': 'Total',
      'Debit': totalDebit as any,
      'Credit': totalCredit as any,
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Patient Ledger');
    XLSX.writeFile(wb, `Patient_Ledger_${selectedPatientName}_${fromDate}_to_${toDate}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Control Bar */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleBack}
            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <h1 className="text-xl font-bold">Patient Ledger</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportToExcel}
            disabled={!filteredTransactions || filteredTransactions.length === 0}
            className="bg-green-600 hover:bg-green-500 disabled:bg-gray-400 px-4 py-1.5 rounded text-sm font-medium"
          >
            Export To Excel
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded text-sm font-medium"
          >
            Print
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-gray-200 px-4 py-3 border-b border-gray-300">
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          {/* Patient Search */}
          <div className="relative" ref={suggestionRef}>
            <div className="flex items-center bg-white border border-gray-300 rounded px-2 py-1">
              <Search className="h-4 w-4 text-gray-500 mr-1" />
              <input
                type="text"
                placeholder="Search Patient..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchPatients(e.target.value);
                }}
                onFocus={() => {
                  if (searchTerm.length >= 2 && patientSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                className="w-56 outline-none text-sm"
              />
            </div>
            {/* Suggestions Dropdown */}
            {showSuggestions && patientSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-b shadow-lg max-h-48 overflow-y-auto">
                {patientSuggestions.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatientId(patient.id);
                      setSelectedPatientName(patient.name);
                      setSearchTerm(patient.name);
                      setShowSuggestions(false);
                    }}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium">{patient.name}</div>
                    {patient.phone && <div className="text-xs text-gray-500">{patient.phone}</div>}
                  </div>
                ))}
              </div>
            )}
            {isSearchingPatients && (
              <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-b shadow-lg px-3 py-2 text-sm text-gray-500">
                Searching...
              </div>
            )}
          </div>

          {/* From Date */}
          <div className="flex items-center bg-white border border-gray-300 rounded px-2 py-1">
            <Calendar className="h-4 w-4 text-gray-500 mr-1" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-32 outline-none text-sm"
            />
          </div>

          {/* To Date */}
          <div className="flex items-center bg-white border border-gray-300 rounded px-2 py-1">
            <Calendar className="h-4 w-4 text-gray-500 mr-1" />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-32 outline-none text-sm"
            />
          </div>

          {/* Clear Button */}
          {selectedPatientId && (
            <button
              onClick={() => {
                setSelectedPatientId('');
                setSelectedPatientName('');
                setSearchTerm('');
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-1.5 rounded text-sm font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Patient Info Display */}
      {selectedPatientName && (
        <div className="bg-white px-4 py-2 border-b border-gray-300">
          <h2 className="text-lg font-semibold text-blue-800">
            Patient Ledger: {selectedPatientName}
          </h2>
          <p className="text-sm text-gray-600">
            {formatDate(fromDate)} To {formatDate(toDate)}
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-4 py-4 bg-white">
        {!selectedPatientId ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Search and select a patient to view their ledger</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading transactions...</span>
          </div>
        ) : filteredTransactions && filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-blue-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-blue-800 border-b-2 border-blue-200 w-32">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-blue-800 border-b-2 border-blue-200">
                    Particulars
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-blue-800 border-b-2 border-blue-200 w-40">
                    Debit (Charges)
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-blue-800 border-b-2 border-blue-200 w-40">
                    Credit (Payments)
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((txn, index) => (
                  <tr key={txn.id + index} className="hover:bg-gray-50 border-b border-gray-200">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(txn.date)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{txn.description}</div>
                      <div className="text-xs text-gray-500">{txn.type}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
                      {txn.debit > 0 ? formatCurrency(txn.debit) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                      {txn.credit > 0 ? formatCurrency(txn.credit) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100">
                <tr className="border-t-2 border-gray-300">
                  <td colSpan={2} className="px-4 py-3 text-sm font-bold text-gray-900">
                    Total
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-red-700">
                    {formatCurrency(totalDebit)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-green-700">
                    {formatCurrency(totalCredit)}
                  </td>
                </tr>
                <tr className="bg-blue-100">
                  <td colSpan={2} className="px-4 py-3 text-sm font-bold text-blue-900">
                    Balance Due
                  </td>
                  <td colSpan={2} className="px-4 py-3 text-sm text-right font-bold text-blue-900">
                    {formatCurrency(Math.abs(balance))} {balance > 0 ? '(DR)' : balance < 0 ? '(CR)' : ''}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-yellow-600">
            No transactions found for the selected date range
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientLedger;

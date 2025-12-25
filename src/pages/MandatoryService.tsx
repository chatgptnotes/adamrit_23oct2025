import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, AlertCircle, CheckCircle, Plus, Edit, Eye, Trash2, X, Download, Upload, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MandatoryService as MandatoryServiceType } from '@/types/mandatoryService';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';

const MandatoryService = () => {
  const navigate = useNavigate();
  const { hospitalConfig } = useAuth();
  const queryClient = useQueryClient();
  const { canEditMasters } = usePermissions();

  // State for modals and forms
  const [viewingService, setViewingService] = useState<MandatoryServiceType | null>(null);
  const [editingService, setEditingService] = useState<MandatoryServiceType | null>(null);
  const [deletingService, setDeletingService] = useState<MandatoryServiceType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editFormData, setEditFormData] = useState({
    serviceName: '',
    tpaRate: '',
    privateRate: '',
    nabhRate: '',
    nabhBhopal: '',
    nonNabhRate: '',
    nonNabhBhopal: '',
    status: 'Active'
  });

  // Fetch mandatory services from database
  const { data: mandatoryServices, isLoading, error } = useQuery({
    queryKey: ['mandatory-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mandatory_services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data as MandatoryServiceType[];
    }
  });

  // Filter services based on search term
  const filteredServices = mandatoryServices?.filter(service =>
    service.service_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Handler functions for actions
  const handleView = (service: MandatoryServiceType) => {
    setViewingService(service);
  };

  const handleEdit = (service: MandatoryServiceType) => {
    setEditingService(service);
    setEditFormData({
      serviceName: service.service_name,
      tpaRate: service.tpa_rate?.toString() || '',
      privateRate: service.private_rate?.toString() || '',
      nabhRate: service.nabh_rate?.toString() || '',
      nabhBhopal: service.nabh_bhopal?.toString() || '',
      nonNabhRate: service.non_nabh_rate?.toString() || '',
      nonNabhBhopal: service.non_nabh_bhopal?.toString() || '',
      status: service.status
    });
  };

  const handleDelete = (service: MandatoryServiceType) => {
    setDeletingService(service);
  };

  const handleConfirmDelete = async () => {
    if (!deletingService) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('mandatory_services')
        .delete()
        .eq('id', deletingService.id);

      if (error) throw error;

      toast.success('Service deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['mandatory-services'] });
      setDeletingService(null);
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      const { error } = await supabase
        .from('mandatory_services')
        .update({
          service_name: editFormData.serviceName,
          tpa_rate: editFormData.tpaRate ? parseFloat(editFormData.tpaRate) : null,
          private_rate: editFormData.privateRate ? parseFloat(editFormData.privateRate) : null,
          nabh_rate: editFormData.nabhRate ? parseFloat(editFormData.nabhRate) : null,
          nabh_bhopal: editFormData.nabhBhopal ? parseFloat(editFormData.nabhBhopal) : null,
          non_nabh_rate: editFormData.nonNabhRate ? parseFloat(editFormData.nonNabhRate) : null,
          non_nabh_bhopal: editFormData.nonNabhBhopal ? parseFloat(editFormData.nonNabhBhopal) : null,
          status: editFormData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingService.id);

      if (error) throw error;

      toast.success('Service updated successfully');
      queryClient.invalidateQueries({ queryKey: ['mandatory-services'] });
      setEditingService(null);
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Failed to update service');
    }
  };

  const handleCreateService = () => {
    navigate('/mandatory-service-create');
  };

  // Export function - downloads all data as Excel
  const handleExport = async () => {
    try {
      const { data, error } = await supabase
        .from('mandatory_services')
        .select('*')
        .not('service_name', 'is', null)
        .neq('service_name', '')
        .order('service_name', { ascending: true });

      if (error) {
        toast.error('Failed to export data');
        return;
      }

      // Column keys matching the requested columns
      const headers = ['service_name', 'tpa_rate', 'private_rate', 'nabh_rate', 'non_nabh_rate', 'nabh_bhopal', 'non_nabh_bhopal'];
      // Human-readable labels for Excel header row
      const headerLabels = ['Service Name', 'TPA Rate', 'Private Rate', 'NABH Rate', 'Non-NABH Rate', 'NABH Bhopal', 'Non-NABH Bhopal'];

      // Prepare data for Excel - filter out empty rows and add Sr No
      const excelData = data
        .filter(row => row.service_name && typeof row.service_name === 'string' && row.service_name.trim().length > 0)
        .map((row, index) => {
          const obj: any = { 'Sr No': index + 1 }; // Add serial number
          headers.forEach((h, i) => {
            obj[headerLabels[i]] = (row as any)[h] ?? '';
          });
          return obj;
        });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'Mandatory Services');

      // Download Excel file
      XLSX.writeFile(wb, `mandatory_services_export_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast.success(`Exported ${excelData.length} records`);
    } catch (err) {
      toast.error('Export failed');
    }
  };

  // Import function - uploads Excel/CSV file and adds records
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Map Excel headers to database columns
        const records = jsonData.map((row: any) => ({
          service_name: row['Service Name'] || row['service_name'] || '',
          tpa_rate: row['TPA Rate'] || row['tpa_rate'] || null,
          private_rate: row['Private Rate'] || row['private_rate'] || null,
          nabh_rate: row['NABH Rate'] || row['nabh_rate'] || null,
          non_nabh_rate: row['Non-NABH Rate'] || row['non_nabh_rate'] || null,
          nabh_bhopal: row['NABH Bhopal'] || row['nabh_bhopal'] || null,
          non_nabh_bhopal: row['Non-NABH Bhopal'] || row['non_nabh_bhopal'] || null,
          status: 'Active'
        })).filter((r: any) => r.service_name && r.service_name.trim());

        if (records.length === 0) {
          toast.error('No valid records found in file');
          return;
        }

        const { error } = await supabase.from('mandatory_services').insert(records);

        if (error) {
          toast.error('Failed to import: ' + error.message);
        } else {
          toast.success(`Imported ${records.length} records`);
          queryClient.invalidateQueries({ queryKey: ['mandatory-services'] });
        }
      } catch (err) {
        toast.error('Import failed - invalid file format');
      }
    };
    reader.readAsBinaryString(file);
    event.target.value = '';
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-blue-600" />
            Mandatory Service
          </h1>
          <p className="text-gray-600 mt-2">
            Manage and track mandatory service requirements and compliance
          </p>
        </div>
        <button 
          onClick={handleCreateService}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Mandatory Service
        </button>
      </div>


      {/* Mandatory Services Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Mandatory Services</span>
            <div className="flex items-center gap-4">
              <span className="text-sm font-normal text-gray-500">
                {isLoading ? 'Loading...' : `${mandatoryServices?.length || 0} services`}
              </span>
              {canEditMasters && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              {canEditMasters && (
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </span>
                  </Button>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
                </label>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading mandatory services...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Error loading mandatory services. Please try again.
            </div>
          ) : mandatoryServices && mandatoryServices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-gray-700">Service Name</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                    <th className="text-left p-3 font-semibold text-gray-700">TPA Rate</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Private Rate</th>
                    <th className="text-left p-3 font-semibold text-gray-700">NABH Rate</th>
                    <th className="text-left p-3 font-semibold text-gray-700">NABH Bhopal</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Non-NABH Rate</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Non-NABH Bhopal</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Created</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mandatoryServices.map((service) => (
                    <tr key={service.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{service.service_name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          service.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : service.status === 'Completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {service.status}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-blue-600">
                        {service.tpa_rate ? `₹${service.tpa_rate.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 font-medium text-green-600">
                        {service.private_rate ? `₹${service.private_rate.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 font-medium text-purple-600">
                        {service.nabh_rate ? `₹${service.nabh_rate.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 font-medium text-indigo-600">
                        {service.nabh_bhopal ? `₹${service.nabh_bhopal.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 font-medium text-orange-600">
                        {service.non_nabh_rate ? `₹${service.non_nabh_rate.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 font-medium text-pink-600">
                        {service.non_nabh_bhopal ? `₹${service.non_nabh_bhopal.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 text-gray-600 text-sm">
                        {new Date(service.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(service)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="View service details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canEditMasters && (
                            <button
                              onClick={() => handleEdit(service)}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Edit service"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {canEditMasters && (
                            <button
                              onClick={() => handleDelete(service)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Delete service"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <ShieldCheck className="h-12 w-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No mandatory services found</p>
              <p className="text-sm text-center">
                Create your first mandatory service for {hospitalConfig.fullName}
              </p>
              <button 
                onClick={handleCreateService}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Mandatory Service
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Modal */}
      {viewingService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Service Details</h2>
              <button
                onClick={() => setViewingService(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Service Name</label>
                <p className="mt-1 text-sm text-gray-900">{viewingService.service_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">TPA Rate</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingService.tpa_rate ? `₹${viewingService.tpa_rate.toLocaleString()}` : 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Private Rate</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingService.private_rate ? `₹${viewingService.private_rate.toLocaleString()}` : 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">NABH Rate</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingService.nabh_rate ? `₹${viewingService.nabh_rate.toLocaleString()}` : 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">NABH Bhopal</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingService.nabh_bhopal ? `₹${viewingService.nabh_bhopal.toLocaleString()}` : 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Non-NABH Rate</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingService.non_nabh_rate ? `₹${viewingService.non_nabh_rate.toLocaleString()}` : 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Non-NABH Bhopal</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingService.non_nabh_bhopal ? `₹${viewingService.non_nabh_bhopal.toLocaleString()}` : 'Not set'}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  viewingService.status === 'Active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {viewingService.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(viewingService.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(viewingService.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingService(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Service</h2>
              <button
                onClick={() => setEditingService(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={editFormData.serviceName}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, serviceName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TPA Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={editFormData.tpaRate}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, tpaRate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Private Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={editFormData.privateRate}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, privateRate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NABH Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={editFormData.nabhRate}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, nabhRate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NABH Bhopal (₹)
                  </label>
                  <input
                    type="number"
                    value={editFormData.nabhBhopal}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, nabhBhopal: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Non-NABH Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={editFormData.nonNabhRate}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, nonNabhRate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Non-NABH Bhopal (₹)
                  </label>
                  <input
                    type="number"
                    value={editFormData.nonNabhBhopal}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, nonNabhBhopal: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-0 ml-4">
                <h3 className="text-lg font-medium text-gray-900">Delete Service</h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete "<strong>{deletingService.service_name}</strong>"?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingService(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MandatoryService;
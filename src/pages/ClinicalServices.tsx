import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartHandshake, AlertCircle, Plus, Edit, Eye, Trash2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { ClinicalService } from '@/types/clinicalService';
import { toast } from 'sonner';

const ClinicalServices = () => {
  const navigate = useNavigate();
  const { hospitalConfig } = useAuth();
  const { canEditMasters } = usePermissions();
  const queryClient = useQueryClient();

  // State for modals and forms
  const [viewingService, setViewingService] = useState<ClinicalService | null>(null);
  const [editingService, setEditingService] = useState<ClinicalService | null>(null);
  const [deletingService, setDeletingService] = useState<ClinicalService | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  // Fetch clinical services from database
  const { data: clinicalServices, isLoading, error } = useQuery({
    queryKey: ['clinical-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinical_services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data as ClinicalService[];
    }
  });

  // Handler functions for actions
  const handleView = (service: ClinicalService) => {
    setViewingService(service);
  };

  const handleEdit = (service: ClinicalService) => {
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

  const handleDelete = (service: ClinicalService) => {
    setDeletingService(service);
  };

  const handleConfirmDelete = async () => {
    if (!deletingService) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('clinical_services')
        .delete()
        .eq('id', deletingService.id);

      if (error) throw error;

      toast.success('Clinical service deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['clinical-services'] });
      setDeletingService(null);
    } catch (error) {
      console.error('Error deleting clinical service:', error);
      toast.error('Failed to delete clinical service');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      const { error } = await supabase
        .from('clinical_services')
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

      toast.success('Clinical service updated successfully');
      queryClient.invalidateQueries({ queryKey: ['clinical-services'] });
      setEditingService(null);
    } catch (error) {
      console.error('Error updating clinical service:', error);
      toast.error('Failed to update clinical service');
    }
  };

  const handleCreateService = () => {
    navigate('/clinical-service-create');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <HeartHandshake className="h-8 w-8 text-blue-600" />
            Clinical Services
          </h1>
          <p className="text-gray-600 mt-2">
            Manage and track clinical service requirements and compliance
          </p>
        </div>
        <button
          onClick={handleCreateService}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Clinical Service
        </button>
      </div>

      {/* Clinical Services Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Clinical Services</span>
            <span className="text-sm font-normal text-gray-500">
              {isLoading ? 'Loading...' : `${clinicalServices?.length || 0} services`}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading clinical services...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Error loading clinical services. Please try again.
            </div>
          ) : clinicalServices && clinicalServices.length > 0 ? (
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
                  {clinicalServices.map((service) => (
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
              <HeartHandshake className="h-12 w-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No clinical services found</p>
              <p className="text-sm text-center">
                Create your first clinical service for {hospitalConfig.fullName}
              </p>
              <button
                onClick={handleCreateService}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Clinical Service
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

export default ClinicalServices;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertCircle, CheckCircle, Plus, Edit, Eye, Trash2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ExternalRequisition as ExternalRequisitionType } from '@/types/externalRequisition';
import { toast } from 'sonner';

const ExternalRequisition = () => {
  const navigate = useNavigate();
  const { hospitalConfig } = useAuth();
  const queryClient = useQueryClient();

  // State for modals and forms
  const [viewingService, setViewingService] = useState<ExternalRequisitionType | null>(null);
  const [editingService, setEditingService] = useState<ExternalRequisitionType | null>(null);
  const [deletingService, setDeletingService] = useState<ExternalRequisitionType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    serviceName: ''
  });

  // Fetch external requisition services from database
  const { data: externalRequisitions, isLoading, error } = useQuery({
    queryKey: ['external-requisitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('external_requisitions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data as ExternalRequisitionType[];
    }
  });

  // Handler functions for actions
  const handleView = (service: ExternalRequisitionType) => {
    setViewingService(service);
  };

  const handleEdit = (service: ExternalRequisitionType) => {
    setEditingService(service);
    setEditFormData({
      serviceName: service.service_name
    });
  };

  const handleDelete = (service: ExternalRequisitionType) => {
    setDeletingService(service);
  };

  const handleConfirmDelete = async () => {
    if (!deletingService) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('external_requisitions')
        .delete()
        .eq('id', deletingService.id);

      if (error) throw error;

      toast.success('External requisition deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['external-requisitions'] });
      setDeletingService(null);
    } catch (error) {
      console.error('Error deleting external requisition:', error);
      toast.error('Failed to delete external requisition');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      const { error } = await supabase
        .from('external_requisitions')
        .update({
          service_name: editFormData.serviceName,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingService.id);

      if (error) throw error;

      toast.success('External requisition updated successfully');
      queryClient.invalidateQueries({ queryKey: ['external-requisitions'] });
      setEditingService(null);
    } catch (error) {
      console.error('Error updating external requisition:', error);
      toast.error('Failed to update external requisition');
    }
  };

  const handleCreateService = () => {
    navigate('/external-requisition-create');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-purple-600" />
            External Requisition
          </h1>
          <p className="text-gray-600 mt-2">
            Manage and track external requisition services and rates
          </p>
        </div>
        <button
          onClick={handleCreateService}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create External Requisition
        </button>
      </div>

      {/* External Requisitions Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>External Requisitions</span>
            <span className="text-sm font-normal text-gray-500">
              {isLoading ? 'Loading...' : `${externalRequisitions?.length || 0} services`}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Loading external requisitions...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Error loading external requisitions. Please try again.
            </div>
          ) : externalRequisitions && externalRequisitions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-gray-700">Service Name</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Created</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {externalRequisitions.map((service) => (
                    <tr key={service.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{service.service_name}</td>
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
                          <button
                            onClick={() => handleEdit(service)}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Edit service"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(service)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Delete service"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No external requisitions found</p>
              <p className="text-sm text-center">
                Create your first external requisition service
              </p>
              <button
                onClick={handleCreateService}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Create External Requisition
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
              <h2 className="text-xl font-bold text-gray-900">External Requisition Details</h2>
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
              <h2 className="text-xl font-bold text-gray-900">Edit External Requisition</h2>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
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
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Update External Requisition
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
                <h3 className="text-lg font-medium text-gray-900">Delete External Requisition</h3>
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

export default ExternalRequisition;
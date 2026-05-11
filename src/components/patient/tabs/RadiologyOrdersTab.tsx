import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ScanLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RadiologyOrdersTabProps {
  patient: any;
}

const statusColor: Record<string, string> = {
  Ordered: 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const RadiologyOrdersTab = ({ patient }: RadiologyOrdersTabProps) => {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['radiology-orders-all', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      const { data, error } = await supabase
        .from('radiology_orders')
        .select('*')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: !!patient?.id,
  });

  const parseNotes = (notes: string) => {
    const typeMatch = notes?.match(/Type:\s*([^.]+)/);
    const procMatch = notes?.match(/Procedure:\s*([^.]+)/);
    const outsourceMatch = notes?.match(/Outsource:\s*([^.]+)/);
    return {
      scanType: typeMatch?.[1]?.trim() || '—',
      procedure: procMatch?.[1]?.trim() || '—',
      outsource: outsourceMatch?.[1]?.trim() || null,
    };
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading radiology orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <ScanLine className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No radiology orders found for this patient.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <ScanLine className="h-5 w-5 text-violet-600" />
        <h3 className="font-semibold text-gray-800">Radiology Orders ({orders.length})</h3>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Order No.</th>
              <th className="text-left px-4 py-3 font-medium">Scan Type</th>
              <th className="text-left px-4 py-3 font-medium">Procedure</th>
              <th className="text-left px-4 py-3 font-medium">Dept</th>
              <th className="text-left px-4 py-3 font-medium">Priority</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Cost</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => {
              const { scanType, procedure, outsource } = parseNotes(order.notes || '');
              const statusClass = statusColor[order.status] || 'bg-gray-100 text-gray-600';
              return (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{order.order_number}</td>
                  <td className="px-4 py-3 font-medium">{scanType}</td>
                  <td className="px-4 py-3">
                    {procedure}
                    {outsource && (
                      <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                        Outsource: {outsource}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${order.ordering_department === 'IPD' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {order.ordering_department || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize">{order.priority || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusClass}`}>
                      {order.status || 'Ordered'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {order.estimated_cost ? `₹${order.estimated_cost.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {order.created_at ? format(new Date(order.created_at), 'dd/MM/yyyy HH:mm') : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RadiologyOrdersTab;

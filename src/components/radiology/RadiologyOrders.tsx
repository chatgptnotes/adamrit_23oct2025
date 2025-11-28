// Enhanced Radiology Orders Component - Dashboard Style
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Search, 
  Download,
  Edit,
  Eye,
  User,
  RefreshCw
} from 'lucide-react';

const RadiologyOrders: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('01/06/2015');
  const [toDate, setToDate] = useState('05/06/2025');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Enhanced stats to match second image
  const orderStats = {
    pending: 2511,
    completed: 338,
    total: 2849
  };

  // Sample data matching second image format
  const orders = [
    {
      id: 1,
      srNo: 1,
      sex: 'F',
      patientName: 'Fpkv8k W99h2g',
      patientId: 'HG/O-02224',
      service: 'MRI LS Spine With Complete Spinogram',
      primaryCareProvider: '',
      status: 'Pending',
      orderDate: '06/10/2024 10:01:33',
      icon: '👩‍⚕️'
    },
    {
      id: 2,
      srNo: 2,
      sex: 'F',
      patientName: 'L6mpzb U9y1pc',
      patientId: 'HG/O-02223',
      service: 'USG abdomen & Pelvis',
      primaryCareProvider: '',
      status: 'Pending',
      orderDate: '06/10/2024 10:16:11',
      icon: '👩‍⚕️'
    },
    {
      id: 3,
      srNo: 3,
      sex: 'F',
      patientName: 'L6mpzb U9y1pc',
      patientId: 'HG/O-02223',
      service: 'Upper G.I Endoscopy',
      primaryCareProvider: '',
      status: 'Pending',
      orderDate: '06/10/2024 10:17:07',
      icon: '👩‍⚕️'
    },
    {
      id: 4,
      srNo: 4,
      sex: 'F',
      patientName: 'Qfvdqw Fhp19b',
      patientId: 'HG/O-02220',
      service: 'Ct Abdomen (pelvis)',
      primaryCareProvider: '',
      status: 'Pending',
      orderDate: '06/10/2024 15:51:49',
      icon: '👩‍⚕️'
    },
    {
      id: 5,
      srNo: 5,
      sex: 'F',
      patientName: 'Qfvdqw Fhp19b',
      patientId: 'HG/O-02220',
      service: 'CHEST - PA',
      primaryCareProvider: '',
      status: 'Pending',
      orderDate: '06/10/2024 13:30:57',
      icon: '👩‍⚕️'
    },
    {
      id: 6,
      srNo: 6,
      sex: 'F',
      patientName: 'Rd52li Xgdlg2',
      patientId: 'HG/O-02218',
      service: 'CT Pulmonary Angiography',
      primaryCareProvider: '',
      status: 'Pending',
      orderDate: '05/10/2024 18:23:50',
      icon: '👩‍⚕️'
    },
    {
      id: 7,
      srNo: 7,
      sex: 'F',
      patientName: 'Rd52li Xgdlg2',
      patientId: 'HG/O-02218',
      service: 'HRCT Chest',
      primaryCareProvider: '',
      status: 'Pending',
      orderDate: '05/10/2024 18:24:00',
      icon: '👩‍⚕️'
    },
    {
      id: 8,
      srNo: 8,
      sex: 'F',
      patientName: 'Myhu7n Fqj1yz',
      patientId: 'HG/O-02215',
      service: 'Upper G.I Endoscopy',
      primaryCareProvider: '',
      status: 'Pending',
      orderDate: '05/10/2024 14:12:28',
      icon: '👩‍⚕️'
    },
    {
      id: 9,
      srNo: 9,
      sex: 'F',
      patientName: 'Myhu7n Fqj1yz',
      patientId: 'HG/O-02215',
      service: 'X-RAY CHEST -AP',
      primaryCareProvider: '',
      status: 'Pending',
      orderDate: '05/10/2024 14:12:28',
      icon: '👩‍⚕️'
    },
    {
      id: 10,
      srNo: 10,
      sex: 'F',
      patientName: 'Rqcdv1 Koe7o6',
      patientId: 'HG/O-02214',
      service: '2D Echo Charges',
      primaryCareProvider: '',
      status: 'Pending',
      orderDate: '05/10/2024 20:26:15',
      icon: '👩‍⚕️'
    }
  ];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.service.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedStatus === 'all') return matchesSearch;
    return matchesSearch && order.status.toLowerCase() === selectedStatus.toLowerCase();
  });

  const handleExportExcel = () => {
    console.log('Exporting to Excel...');
    // Export functionality will be implemented
  };

  const handlePACS = () => {
    console.log('Opening PACS...');
    // PACS functionality will be implemented
  };

  const handleEnterResult = (orderId: number) => {
    console.log('Enter result for order:', orderId);
    // Result entry functionality will be implemented
  };

  const handleViewDICOM = (orderId: number) => {
    console.log('View DICOM for order:', orderId);
    // DICOM viewer functionality will be implemented
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
          <div>
          <h2 className="text-2xl font-bold">Radiology Dashboard</h2>
            <p className="text-sm text-muted-foreground">
            Enterprise-level radiology operations and imaging management
            </p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Enhanced Search and Filters Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Patient Name Search */}
            <div className="relative">
              <Input
                placeholder="Patient Name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            {/* From Date */}
            <div>
              <Input
                type="text"
                placeholder="From Date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            
            {/* To Date */}
            <div>
              <Input
                type="text"
                placeholder="To Date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            
            {/* Status Filter */}
            <div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Please Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={() => console.log('Searching...')}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" onClick={handlePACS}>
              PACS
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Bar */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-center text-sm">
          <span className="text-red-600 font-semibold">Pending: {orderStats.pending}</span>
          <span className="mx-4">|</span>
          <span className="text-green-600 font-semibold">Completed: {orderStats.completed}</span>
          <span className="mx-4">|</span>
          <span className="text-blue-600 font-semibold">Total: {orderStats.total}</span>
          <span className="mx-4">|</span>
                      </div>
                    </div>

      {/* Export Controls */}
      <div className="flex justify-start gap-2">
        <Button variant="outline" onClick={handleExportExcel} className="bg-green-600 text-white hover:bg-green-700">
          <Download className="h-4 w-4 mr-2" />
          Download as Excel
        </Button>
        <Button variant="outline" onClick={handlePACS} className="bg-blue-600 text-white hover:bg-blue-700">
          PACS
        </Button>
      </div>

      {/* Main Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="w-16">Sr.No</TableHead>
                  <TableHead className="w-16">Sex</TableHead>
                  <TableHead className="min-w-[150px]">Patient Name</TableHead>
                  <TableHead className="min-w-[120px]">Patient ID</TableHead>
                  <TableHead className="min-w-[200px]">Service</TableHead>
                  <TableHead className="min-w-[150px]">Primary care provider</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="min-w-[150px]">Order Date</TableHead>
                  <TableHead className="w-32">Enter Rad Result</TableHead>
                  <TableHead className="w-32">View DICOM Image</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50">
                    <TableCell className="text-center">{order.srNo}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-2xl">{order.icon}</span>
                    </TableCell>
                    <TableCell className="font-medium">{order.patientName}</TableCell>
                    <TableCell>{order.patientId}</TableCell>
                    <TableCell>{order.service}</TableCell>
                    <TableCell>{order.primaryCareProvider || '-'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={order.status === 'Pending' ? 'destructive' : 'default'}
                        className={order.status === 'Pending' ? 'bg-red-500' : 'bg-green-500'}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.orderDate}</TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEnterResult(order.id)}
                        className="w-8 h-8 p-0"
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewDICOM(order.id)}
                        className="w-8 h-8 p-0 bg-red-500 text-white hover:bg-red-600"
                      >
                        <Eye className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
                </div>
              </CardContent>
            </Card>

      {/* No Results Message */}
      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-muted-foreground mb-2">No orders found</div>
            <div className="text-sm">Try adjusting your search criteria or filters</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RadiologyOrders;
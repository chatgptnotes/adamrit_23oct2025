// Test Catalog Management Component
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
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
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TestTube, 
  Search, 
  Filter, 
  Plus,
  Edit,
  Eye,
  Copy,
  Clock,
  DollarSign,
  FlaskConical,
  Microscope,
  Building,
  Package,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';

interface LabTest {
  id: string;
  test_name: string;
  test_code: string;
  short_name?: string;
  category: string;
  department: string;
  test_type: 'QUALITATIVE' | 'QUANTITATIVE' | 'SEMI_QUANTITATIVE';
  sample_type: string;
  sample_volume?: string;
  container_type?: string;
  processing_time_hours: number;
  method?: string;
  analyzer?: string;
  test_price: number;
  outsourced: boolean;
  outsource_lab?: string;
  reporting_units?: string;
  reference_range?: string;
  is_active: boolean;
  clinical_significance?: string;
}

interface TestPanel {
  id: string;
  panel_name: string;
  panel_code: string;
  description?: string;
  category: string;
  panel_price: number;
  discount_percentage: number;
  test_count: number;
  is_active: boolean;
}

const TestCatalog: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tests');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [isAddTestDialogOpen, setIsAddTestDialogOpen] = useState(false);
  const [isAddPanelDialogOpen, setIsAddPanelDialogOpen] = useState(false);

  // Mock data - will be replaced with real data from hooks
  const labTests: LabTest[] = [
    {
      id: '1',
      test_name: 'Complete Blood Count',
      test_code: 'CBC',
      short_name: 'CBC',
      category: 'Hematology',
      department: 'Hematology',
      test_type: 'QUANTITATIVE',
      sample_type: 'Whole Blood',
      sample_volume: '3 mL',
      container_type: 'EDTA Tube',
      processing_time_hours: 2,
      method: 'Flow Cytometry',
      analyzer: 'Sysmex XN-1000',
      test_price: 450.00,
      outsourced: false,
      reporting_units: 'Various',
      reference_range: 'Age and Gender specific',
      is_active: true,
      clinical_significance: 'Screening for blood disorders, infections, and general health assessment'
    },
    {
      id: '2',
      test_name: 'Basic Metabolic Panel',
      test_code: 'BMP',
      short_name: 'BMP',
      category: 'Clinical Chemistry',
      department: 'Chemistry',
      test_type: 'QUANTITATIVE',
      sample_type: 'Serum',
      sample_volume: '2 mL',
      container_type: 'SST Tube',
      processing_time_hours: 1,
      method: 'Ion Selective Electrode',
      analyzer: 'Roche Cobas 8000',
      test_price: 350.00,
      outsourced: false,
      reporting_units: 'mmol/L, mg/dL',
      reference_range: 'Adult normal ranges',
      is_active: true,
      clinical_significance: 'Assessment of kidney function, electrolyte balance, and blood sugar'
    },
    {
      id: '3',
      test_name: 'Thyroid Stimulating Hormone',
      test_code: 'TSH',
      short_name: 'TSH',
      category: 'Immunology',
      department: 'Immunology',
      test_type: 'QUANTITATIVE',
      sample_type: 'Serum',
      sample_volume: '1 mL',
      container_type: 'SST Tube',
      processing_time_hours: 4,
      method: 'Electrochemiluminescence',
      analyzer: 'Roche Cobas e801',
      test_price: 650.00,
      outsourced: false,
      reporting_units: 'mIU/L',
      reference_range: '0.35 - 5.50 mIU/L',
      is_active: true,
      clinical_significance: 'Primary screening test for thyroid function disorders'
    },
    {
      id: '4',
      test_name: 'COVID-19 RT-PCR',
      test_code: 'COVID19',
      short_name: 'COVID PCR',
      category: 'Molecular Biology',
      department: 'Molecular Biology',
      test_type: 'QUALITATIVE',
      sample_type: 'Nasopharyngeal Swab',
      sample_volume: '1 Swab',
      container_type: 'VTM Tube',
      processing_time_hours: 6,
      method: 'Real-time PCR',
      analyzer: 'Applied Biosystems 7500',
      test_price: 1200.00,
      outsourced: false,
      reporting_units: 'Positive/Negative',
      reference_range: 'Negative',
      is_active: true,
      clinical_significance: 'Detection of SARS-CoV-2 viral RNA'
    },
    {
      id: '5',
      test_name: 'Vitamin B12',
      test_code: 'VIT_B12',
      short_name: 'B12',
      category: 'Immunology',
      department: 'Immunology',
      test_type: 'QUANTITATIVE',
      sample_type: 'Serum',
      sample_volume: '1 mL',
      container_type: 'SST Tube',
      processing_time_hours: 24,
      method: 'Chemiluminescence',
      analyzer: 'Abbott Architect i2000SR',
      test_price: 850.00,
      outsourced: true,
      outsource_lab: 'Reference Lab Inc.',
      reporting_units: 'pg/mL',
      reference_range: '200 - 900 pg/mL',
      is_active: true,
      clinical_significance: 'Assessment of vitamin B12 deficiency and pernicious anemia'
    }
  ];

  const testPanels: TestPanel[] = [
    {
      id: '1',
      panel_name: 'Comprehensive Metabolic Panel',
      panel_code: 'CMP',
      description: 'Complete metabolic assessment including liver and kidney function',
      category: 'Clinical Chemistry',
      panel_price: 750.00,
      discount_percentage: 15,
      test_count: 14,
      is_active: true
    },
    {
      id: '2',
      panel_name: 'Lipid Profile',
      panel_code: 'LIPID',
      description: 'Cardiovascular risk assessment panel',
      category: 'Clinical Chemistry',
      panel_price: 450.00,
      discount_percentage: 10,
      test_count: 4,
      is_active: true
    },
    {
      id: '3',
      panel_name: 'Liver Function Tests',
      panel_code: 'LFT',
      description: 'Comprehensive liver function assessment',
      category: 'Clinical Chemistry',
      panel_price: 650.00,
      discount_percentage: 12,
      test_count: 8,
      is_active: true
    },
    {
      id: '4',
      panel_name: 'Thyroid Function Panel',
      panel_code: 'TFT',
      description: 'Complete thyroid function evaluation',
      category: 'Immunology',
      panel_price: 1200.00,
      discount_percentage: 20,
      test_count: 3,
      is_active: true
    }
  ];

  const categories = ['All', 'Hematology', 'Clinical Chemistry', 'Immunology', 'Microbiology', 'Molecular Biology'];
  const departments = ['All', 'Hematology', 'Chemistry', 'Immunology', 'Microbiology', 'Molecular Biology'];

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);

  const formatTime = (hours: number) => {
    if (hours < 24) {
      return `${hours} hrs`;
    }
    return `${Math.floor(hours / 24)} days`;
  };

  const getTestTypeColor = (type: string) => {
    switch (type) {
      case 'QUANTITATIVE': return 'bg-blue-100 text-blue-800';
      case 'QUALITATIVE': return 'bg-green-100 text-green-800';
      case 'SEMI_QUANTITATIVE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTests = labTests.filter(test => {
    const matchesSearch = test.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.test_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.short_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || test.category === categoryFilter;
    const matchesDepartment = departmentFilter === 'all' || test.department === departmentFilter;
    
    return matchesSearch && matchesCategory && matchesDepartment;
  });

  const filteredPanels = testPanels.filter(panel => {
    const matchesSearch = panel.panel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         panel.panel_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || panel.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const catalogStats = {
    totalTests: labTests.length,
    activeTests: labTests.filter(t => t.is_active).length,
    totalPanels: testPanels.length,
    outsourcedTests: labTests.filter(t => t.outsourced).length,
    avgProcessingTime: labTests.reduce((sum, t) => sum + t.processing_time_hours, 0) / labTests.length
  };

  // Export catalog to Excel
  const handleExportCatalog = () => {
    const exportData = labTests.map((test, index) => ({
      'Sr No': index + 1,
      'Test Name': test.test_name,
      'Test Code': test.test_code,
      'Category': test.category,
      'Department': test.department,
      'Test Type': test.test_type,
      'Sample Type': test.sample_type,
      'Sample Volume': test.sample_volume || '',
      'Container Type': test.container_type || '',
      'Processing Time (hrs)': test.processing_time_hours,
      'Price': test.test_price,
      'Outsourced': test.outsourced ? 'Yes' : 'No',
      'Outsource Lab': test.outsource_lab || '',
      'Status': test.is_active ? 'Active' : 'Inactive',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Lab Tests');
    XLSX.writeFile(wb, `lab_test_catalog_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Import tests from Excel/CSV
  const handleImportTests = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log('Imported data:', jsonData);
        alert(`Imported ${jsonData.length} tests (mock - no database save)`);
      } catch (err) {
        alert('Import failed - invalid file format');
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Test Catalog Management</h2>
            <p className="text-sm text-muted-foreground">
              Manage laboratory tests, panels, and test configurations
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Import Tests
              </span>
            </Button>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleImportTests} className="hidden" />
          </label>
          <Button variant="outline" onClick={handleExportCatalog}>
            <Download className="h-4 w-4 mr-2" />
            Export Catalog
          </Button>
          <Dialog open={isAddTestDialogOpen} onOpenChange={setIsAddTestDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Add New Test</DialogTitle>
              </DialogHeader>
              <AddTestForm onSuccess={() => setIsAddTestDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
                <p className="text-2xl font-bold">{catalogStats.totalTests}</p>
              </div>
              <TestTube className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Tests</p>
                <p className="text-2xl font-bold text-green-600">{catalogStats.activeTests}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Test Panels</p>
                <p className="text-2xl font-bold text-purple-600">{catalogStats.totalPanels}</p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Outsourced</p>
                <p className="text-2xl font-bold text-orange-600">{catalogStats.outsourcedTests}</p>
              </div>
              <Building className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg TAT</p>
                <p className="text-2xl font-bold">{formatTime(catalogStats.avgProcessingTime)}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tests by name, code, or short name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              className="px-3 py-2 border rounded-md"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category.toLowerCase() === 'all' ? 'all' : category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              className="px-3 py-2 border rounded-md"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              {departments.map(department => (
                <option key={department} value={department.toLowerCase() === 'all' ? 'all' : department}>
                  {department}
                </option>
              ))}
            </select>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tests">Individual Tests ({filteredTests.length})</TabsTrigger>
          <TabsTrigger value="panels">Test Panels ({filteredPanels.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Laboratory Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Details</TableHead>
                      <TableHead>Category/Department</TableHead>
                      <TableHead>Sample Requirements</TableHead>
                      <TableHead>Processing</TableHead>
                      <TableHead>Pricing</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{test.test_name}</div>
                            <div className="text-sm text-muted-foreground">
                              Code: {test.test_code} • {test.short_name}
                            </div>
                            <Badge className={getTestTypeColor(test.test_type)}>
                              {test.test_type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{test.category}</div>
                            <div className="text-sm text-muted-foreground">
                              Dept: {test.department}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{test.sample_type}</div>
                            <div className="text-xs text-muted-foreground">
                              {test.sample_volume} • {test.container_type}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="text-sm">{formatTime(test.processing_time_hours)}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {test.method}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {test.analyzer}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatCurrency(test.test_price)}</div>
                            {test.outsourced && (
                              <Badge variant="outline" className="text-xs">
                                Outsourced
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant={test.is_active ? "default" : "secondary"}>
                              {test.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedTest(test)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="panels" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={isAddPanelDialogOpen} onOpenChange={setIsAddPanelDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Panel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Test Panel</DialogTitle>
                </DialogHeader>
                <AddPanelForm onSuccess={() => setIsAddPanelDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPanels.map((panel) => (
              <Card key={panel.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{panel.panel_name}</span>
                    <Badge variant={panel.is_active ? "default" : "secondary"}>
                      {panel.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Panel Code</div>
                      <div className="font-mono">{panel.panel_code}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Category</div>
                      <div>{panel.category}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Tests Included</div>
                      <div className="font-medium">{panel.test_count} tests</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Pricing</div>
                      <div className="font-bold text-lg">{formatCurrency(panel.panel_price)}</div>
                      {panel.discount_percentage > 0 && (
                        <div className="text-xs text-green-600">
                          {panel.discount_percentage}% discount applied
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Test Details Dialog */}
      <Dialog open={!!selectedTest} onOpenChange={() => setSelectedTest(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Test Details - {selectedTest?.test_name}</DialogTitle>
          </DialogHeader>
          {selectedTest && (
            <TestDetailsView test={selectedTest} onClose={() => setSelectedTest(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Add Test Form Component
const AddTestForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    test_name: '',
    test_code: '',
    short_name: '',
    category: '',
    department: '',
    test_type: 'QUANTITATIVE' as const,
    sample_type: '',
    sample_volume: '',
    container_type: '',
    processing_time_hours: 24,
    method: '',
    analyzer: '',
    test_price: 0,
    outsourced: false,
    reporting_units: '',
    clinical_significance: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding test:', formData);
    alert('Test added successfully! (Demo mode)');
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Test Name *</label>
          <Input
            required
            value={formData.test_name}
            onChange={(e) => setFormData(prev => ({ ...prev, test_name: e.target.value }))}
            placeholder="Enter test name"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Test Code *</label>
          <Input
            required
            value={formData.test_code}
            onChange={(e) => setFormData(prev => ({ ...prev, test_code: e.target.value }))}
            placeholder="Enter test code"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Category</label>
          <select
            className="w-full p-2 border rounded"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="">Select Category</option>
            <option value="Hematology">Hematology</option>
            <option value="Clinical Chemistry">Clinical Chemistry</option>
            <option value="Immunology">Immunology</option>
            <option value="Microbiology">Microbiology</option>
            <option value="Molecular Biology">Molecular Biology</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Department</label>
          <select
            className="w-full p-2 border rounded"
            value={formData.department}
            onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
          >
            <option value="">Select Department</option>
            <option value="Hematology">Hematology</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Immunology">Immunology</option>
            <option value="Microbiology">Microbiology</option>
            <option value="Molecular Biology">Molecular Biology</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Test Type</label>
          <select
            className="w-full p-2 border rounded"
            value={formData.test_type}
            onChange={(e) => setFormData(prev => ({ ...prev, test_type: e.target.value as any }))}
          >
            <option value="QUANTITATIVE">Quantitative</option>
            <option value="QUALITATIVE">Qualitative</option>
            <option value="SEMI_QUANTITATIVE">Semi-Quantitative</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Sample Type</label>
          <Input
            value={formData.sample_type}
            onChange={(e) => setFormData(prev => ({ ...prev, sample_type: e.target.value }))}
            placeholder="e.g., Serum, Whole Blood"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Processing Time (hours)</label>
          <Input
            type="number"
            value={formData.processing_time_hours}
            onChange={(e) => setFormData(prev => ({ ...prev, processing_time_hours: parseInt(e.target.value) || 24 }))}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Clinical Significance</label>
        <textarea
          className="w-full p-2 border rounded"
          rows={3}
          value={formData.clinical_significance}
          onChange={(e) => setFormData(prev => ({ ...prev, clinical_significance: e.target.value }))}
          placeholder="Describe the clinical significance of this test"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit">Add Test</Button>
      </div>
    </form>
  );
};

// Add Panel Form Component  
const AddPanelForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Panel added successfully! (Demo mode)');
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Panel Name *</label>
        <Input required placeholder="Enter panel name" />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit">Add Panel</Button>
      </div>
    </form>
  );
};

// Test Details View Component
const TestDetailsView: React.FC<{ test: LabTest; onClose: () => void }> = ({ test }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Test Name</label>
          <p className="font-medium">{test.test_name}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Test Code</label>
          <p className="font-mono">{test.test_code}</p>
        </div>
      </div>
      {test.clinical_significance && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">Clinical Significance</label>
          <p className="text-sm">{test.clinical_significance}</p>
        </div>
      )}
    </div>
  );
};

export default TestCatalog;
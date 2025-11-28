import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TestParameter {
  id: string;
  isCategory: boolean;
  attributeName: string;
  type: 'Numeric' | 'Text';
  isMandatory: boolean;
  rangeType: 'By Sex' | 'By Age' | 'By Range';
  normalRanges: {
    male: { ll: string; ul: string; default: string };
    female: { ll: string; ul: string; default: string };
    child: { ll: string; ul: string; default: string };
  };
  units: string;
}

const LabTestFormBuilder: React.FC = () => {
  const [categoryName, setCategoryName] = useState('');
  const [parameters, setParameters] = useState<TestParameter[]>([
    {
      id: '1',
      isCategory: false,
      attributeName: '',
      type: 'Numeric',
      isMandatory: false,
      rangeType: 'By Sex',
      normalRanges: {
        male: { ll: '', ul: '', default: '' },
        female: { ll: '', ul: '', default: '' },
        child: { ll: '', ul: '', default: '' }
      },
      units: ''
    }
  ]);
  const { toast } = useToast();

  const addNewParameter = () => {
    const newParameter: TestParameter = {
      id: Date.now().toString(),
      isCategory: false,
      attributeName: '',
      type: 'Numeric',
      isMandatory: false,
      rangeType: 'By Sex',
      normalRanges: {
        male: { ll: '', ul: '', default: '' },
        female: { ll: '', ul: '', default: '' },
        child: { ll: '', ul: '', default: '' }
      },
      units: ''
    };
    setParameters([...parameters, newParameter]);
  };

  const updateParameter = (id: string, updates: Partial<TestParameter>) => {
    setParameters(parameters.map(param =>
      param.id === id ? { ...param, ...updates } : param
    ));
  };

  const handleSave = () => {
    if (!categoryName.trim()) {
      toast({
        title: "Category Name Required",
        description: "Please enter a category name.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Form Saved",
      description: "Lab test form has been saved successfully!",
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Simple Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Lab Test Form Builder</h1>
        <p className="text-gray-600">Create and manage lab test parameters</p>
      </div>

      {/* Category Name Input */}
      <div className="mb-6">
        <Label className="text-sm font-medium">Category Name</Label>
        <Input
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          placeholder="Enter category name"
          className="mt-1 max-w-md"
        />
      </div>

      {/* Parameters Table */}
      <div className="space-y-6">
        {parameters.map((parameter, index) => (
          <Card key={parameter.id} className="border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Test Parameter #{index + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Basic Parameter Info */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-sm font-medium">Category Name</Label>
                  <Input
                    value={parameter.attributeName}
                    onChange={(e) => updateParameter(parameter.id, { attributeName: e.target.value })}
                    placeholder="Enter test name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Units</Label>
                  <Input
                    value={parameter.units}
                    onChange={(e) => updateParameter(parameter.id, { units: e.target.value })}
                    placeholder="mg/dL"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Is Category and Type Row */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`isCategory-${parameter.id}`}
                    checked={parameter.isCategory}
                    onCheckedChange={(checked) => updateParameter(parameter.id, { isCategory: !!checked })}
                  />
                  <Label htmlFor={`isCategory-${parameter.id}`} className="text-sm">
                    Yes/No
                  </Label>
                </div>
                <div>
                  <Label className="text-sm font-medium">Attribute Name:</Label>
                  <Input className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <Select
                    value={parameter.type}
                    onValueChange={(value: 'Numeric' | 'Text') => updateParameter(parameter.id, { type: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Numeric">Numeric</SelectItem>
                      <SelectItem value="Text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={parameter.isMandatory}
                    onCheckedChange={(checked) => updateParameter(parameter.id, { isMandatory: !!checked })}
                  />
                  <Label className="text-sm">Is Mandatory</Label>
                </div>
              </div>

              {/* Range Type Selection */}
              <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block">Normal Range Type:</Label>
                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`bySex-${parameter.id}`}
                      name={`rangeType-${parameter.id}`}
                      checked={parameter.rangeType === 'By Sex'}
                      onChange={() => updateParameter(parameter.id, { rangeType: 'By Sex' })}
                    />
                    <Label htmlFor={`bySex-${parameter.id}`} className="text-sm">By Sex</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`byAge-${parameter.id}`}
                      name={`rangeType-${parameter.id}`}
                      checked={parameter.rangeType === 'By Age'}
                      onChange={() => updateParameter(parameter.id, { rangeType: 'By Age' })}
                    />
                    <Label htmlFor={`byAge-${parameter.id}`} className="text-sm">By Age</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`byRange-${parameter.id}`}
                      name={`rangeType-${parameter.id}`}
                      checked={parameter.rangeType === 'By Range'}
                      onChange={() => updateParameter(parameter.id, { rangeType: 'By Range' })}
                    />
                    <Label htmlFor={`byRange-${parameter.id}`} className="text-sm">By Range</Label>
                  </div>
                </div>
              </div>

              {/* Simple Normal Range Table */}
              <div className="border rounded">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-16"></TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">LL</TableHead>
                      <TableHead className="text-center">UL</TableHead>
                      <TableHead className="text-center">Default</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Checkbox defaultChecked />
                      </TableCell>
                      <TableCell className="font-medium">Male</TableCell>
                      <TableCell>
                        <Input
                          className="w-20 text-center"
                          value={parameter.normalRanges.male.ll}
                          onChange={(e) => updateParameter(parameter.id, {
                            normalRanges: {
                              ...parameter.normalRanges,
                              male: { ...parameter.normalRanges.male, ll: e.target.value }
                            }
                          })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="w-20 text-center"
                          value={parameter.normalRanges.male.ul}
                          onChange={(e) => updateParameter(parameter.id, {
                            normalRanges: {
                              ...parameter.normalRanges,
                              male: { ...parameter.normalRanges.male, ul: e.target.value }
                            }
                          })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="w-32 text-center"
                          value={parameter.normalRanges.male.default}
                          onChange={(e) => updateParameter(parameter.id, {
                            normalRanges: {
                              ...parameter.normalRanges,
                              male: { ...parameter.normalRanges.male, default: e.target.value }
                            }
                          })}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox defaultChecked />
                      </TableCell>
                      <TableCell className="font-medium">Female</TableCell>
                      <TableCell>
                        <Input
                          className="w-20 text-center"
                          value={parameter.normalRanges.female.ll}
                          onChange={(e) => updateParameter(parameter.id, {
                            normalRanges: {
                              ...parameter.normalRanges,
                              female: { ...parameter.normalRanges.female, ll: e.target.value }
                            }
                          })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="w-20 text-center"
                          value={parameter.normalRanges.female.ul}
                          onChange={(e) => updateParameter(parameter.id, {
                            normalRanges: {
                              ...parameter.normalRanges,
                              female: { ...parameter.normalRanges.female, ul: e.target.value }
                            }
                          })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="w-32 text-center"
                          value={parameter.normalRanges.female.default}
                          onChange={(e) => updateParameter(parameter.id, {
                            normalRanges: {
                              ...parameter.normalRanges,
                              female: { ...parameter.normalRanges.female, default: e.target.value }
                            }
                          })}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell className="font-medium">Child</TableCell>
                      <TableCell>
                        <Input
                          className="w-20 text-center"
                          value={parameter.normalRanges.child.ll}
                          onChange={(e) => updateParameter(parameter.id, {
                            normalRanges: {
                              ...parameter.normalRanges,
                              child: { ...parameter.normalRanges.child, ll: e.target.value }
                            }
                          })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="w-20 text-center"
                          value={parameter.normalRanges.child.ul}
                          onChange={(e) => updateParameter(parameter.id, {
                            normalRanges: {
                              ...parameter.normalRanges,
                              child: { ...parameter.normalRanges.child, ul: e.target.value }
                            }
                          })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="w-32 text-center"
                          value={parameter.normalRanges.child.default}
                          onChange={(e) => updateParameter(parameter.id, {
                            normalRanges: {
                              ...parameter.normalRanges,
                              child: { ...parameter.normalRanges.child, default: e.target.value }
                            }
                          })}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-6">
        <Button
          onClick={addNewParameter}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add More Category
        </Button>
        <Button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700"
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default LabTestFormBuilder;

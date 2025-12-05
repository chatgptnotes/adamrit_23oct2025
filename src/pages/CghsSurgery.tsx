
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExtendedFormField } from '@/types/forms';

const CghsSurgery = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSurgery, setEditingSurgery] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [codeType, setCodeType] = useState('code'); // 'code' or 'unlisted'
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [Procedure_Name, setProcedure_Name] = useState('');
  const [NABH_NABL_Rate, setNABH_NABL_Rate] = useState('');
  const [Non_NABH_NABL_Rate, setNon_NABH_NABL_Rate] = useState('');
  const [private_rate, setPrivate_rate] = useState('');
  const [category, setCategory] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle code type change
  const handleCodeTypeChange = (value: string) => {
    setCodeType(value);
    if (value === 'unlisted') {
      setCode('UNLISTED');
    } else {
      setCode('');
    }
  };

  // Category options for surgery classification
  const categoryOptions = [
    'HERNIA SURGERIES',
    'UROLOGICAL -Circumcision related',
    'UROLOGICAL - stones related',
    'UROLOGICAL - urethra related',
    'UROLOGICAL - Scrotum related',
    'VASCULAR PROCEDURES',
    'PLASTIC/RECONSTRUCTIVE SURGERY',
    'ORTHOPEDIC PROCEDURES',
    'GENERAL SURGERY',
    'WOUND CARE & DEBRIDEMENT',
    'COLORECTAL PROCEDURES'
  ];

  const { data: surgeries, isLoading, error } = useQuery({
    queryKey: ['cghs-surgeries', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('cghs_surgery')
        .select('*')
        .order('name');

      if (searchTerm && searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching CGHS surgeries:', error);
        throw error;
      }

      return data || [];
    }
  });

  const addSurgeryMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('cghs_surgery')
        .insert({
          name,
          code,
          description,
          cost,
          Procedure_Name,
          NABH_NABL_Rate,
          Non_NABH_NABL_Rate,
          private: private_rate,
          category,
          created_at: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding CGHS surgery:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cghs-surgeries'] });
      toast({
        title: "Success",
        description: "CGHS surgery added successfully",
      });
      setIsCreateDialogOpen(false);
      setName('');
      setCode('');
      setCodeType('code');
      setDescription('');
      setCost('');
      setProcedure_Name('');
      setNABH_NABL_Rate('');
      setNon_NABH_NABL_Rate('');
      setPrivate_rate('');
      setCategory('');
    },
    onError: (error) => {
      console.error('Add CGHS surgery error:', error);
      toast({
        title: "Error",
        description: "Failed to add CGHS surgery",
        variant: "destructive"
      });
    }
  });

  const updateSurgeryMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('cghs_surgery')
        .update({
          name: editingSurgery.name,
          code: editingSurgery.code,
          description: editingSurgery.description,
          cost: editingSurgery.cost,
          Procedure_Name: editingSurgery.Procedure_Name,
          NABH_NABL_Rate: editingSurgery.NABH_NABL_Rate,
          Non_NABH_NABL_Rate: editingSurgery.Non_NABH_NABL_Rate,
          private: editingSurgery.private,
          category: editingSurgery.category,
          updated_at: new Date().toISOString().split('T')[0]
        })
        .eq('id', editingSurgery.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating CGHS surgery:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cghs-surgeries'] });
      toast({
        title: "Success",
        description: "CGHS surgery updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingSurgery(null);
    },
    onError: (error) => {
      console.error('Update CGHS surgery error:', error);
      toast({
        title: "Error",
        description: "Failed to update CGHS surgery",
        variant: "destructive"
      });
    }
  });

  const deleteSurgeryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cghs_surgery')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting CGHS surgery:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cghs-surgeries'] });
      toast({
        title: "Success",
        description: "CGHS surgery deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete CGHS surgery error:', error);
      toast({
        title: "Error",
        description: "Failed to delete CGHS surgery",
        variant: "destructive"
      });
    }
  });

  const handleEdit = (surgery) => {
    setEditingSurgery(surgery);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this surgery?")) {
      await deleteSurgeryMutation.mutateAsync(id);
    }
  };

  const formFields: ExtendedFormField[] = [
    {
      name: 'name',
      label: 'Surgery Name',
      type: 'text',
      required: true,
      placeholder: 'Enter surgery name'
    },
    {
      name: 'code',
      label: 'Surgery Code',
      type: 'text',
      placeholder: 'Enter surgery code'
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter description'
    },
    {
      name: 'cost',
      label: 'Cost',
      type: 'text',
      placeholder: 'Enter cost'
    },
    {
      name: 'Procedure_Name',
      label: 'Procedure Name',
      type: 'text',
      placeholder: 'Enter procedure name'
    },
    {
      name: 'NABH_NABL_Rate',
      label: 'NABH/NABL Rate',
      type: 'text',
      placeholder: 'Enter NABH/NABL rate'
    },
    {
      name: 'Non_NABH_NABL_Rate',
      label: 'Non-NABH/NABL Rate',
      type: 'text',
      placeholder: 'Enter non-NABH/NABL rate'
    },
    {
      name: 'private_rate',
      label: 'Private Rate',
      type: 'text',
      placeholder: 'Enter private rate'
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      placeholder: 'Select surgery category',
      options: categoryOptions
    }
  ];

  const editFormFields: ExtendedFormField[] = [
    {
      name: 'name',
      label: 'Surgery Name',
      type: 'text',
      required: true,
      defaultValue: editingSurgery?.name || ''
    },
    {
      name: 'code',
      label: 'Surgery Code',
      type: 'text',
      defaultValue: editingSurgery?.code || ''
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      defaultValue: editingSurgery?.description || ''
    },
    {
      name: 'cost',
      label: 'Cost',
      type: 'text',
      defaultValue: editingSurgery?.cost || ''
    },
    {
      name: 'Procedure_Name',
      label: 'Procedure Name',
      type: 'text',
      defaultValue: editingSurgery?.Procedure_Name || ''
    },
    {
      name: 'NABH_NABL_Rate',
      label: 'NABH/NABL Rate',
      type: 'text',
      defaultValue: editingSurgery?.NABH_NABL_Rate?.toString() || ''
    },
    {
      name: 'Non_NABH_NABL_Rate',
      label: 'Non-NABH/NABL Rate',
      type: 'text',
      defaultValue: editingSurgery?.Non_NABH_NABL_Rate?.toString() || ''
    },
    {
      name: 'private',
      label: 'Private Rate',
      type: 'text',
      defaultValue: editingSurgery?.private?.toString() || ''
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      defaultValue: editingSurgery?.category || '',
      options: categoryOptions
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">CGHS Surgeries Management</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          Create New Surgery
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Surgeries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by surgery name, code, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p>Loading surgeries...</p>
      ) : error ? (
        <p className="text-red-500">Error: {error.message}</p>
      ) : (
        <div className="grid gap-4">
          {surgeries?.map((surgery) => (
            <Card key={surgery.id}>
              <CardHeader>
                <CardTitle>{surgery.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p><strong>Code:</strong> {surgery.code}</p>
                <p><strong>Description:</strong> {surgery.description}</p>
                <p><strong>Cost:</strong> {surgery.cost}</p>
                <p><strong>Procedure Name:</strong> {surgery.Procedure_Name}</p>
                <p><strong>NABH/NABL Rate:</strong> {surgery.NABH_NABL_Rate}</p>
                <p><strong>Non-NABH/NABL Rate:</strong> {surgery.Non_NABH_NABL_Rate}</p>
                <p><strong>Private Rate:</strong> {surgery.private}</p>
                <p><strong>Category:</strong> {surgery.category || 'Not specified'}</p>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="secondary" onClick={() => handleEdit(surgery)}>
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={() => handleDelete(surgery.id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {surgeries?.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No surgeries found matching your search.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create Surgery Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) {
          setCodeType('code');
          setCode('');
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New CGHS Surgery</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {formFields.map((field) => (
              <div key={field.name} className="grid gap-2">
                {field.name === 'code' ? (
                  <div className="space-y-3">
                    <Label>{field.label}</Label>
                    <RadioGroup value={codeType} onValueChange={handleCodeTypeChange} className="flex gap-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="code" id="code-option" />
                        <Label htmlFor="code-option">Code</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="unlisted" id="unlisted-option" />
                        <Label htmlFor="unlisted-option">UNLISTED</Label>
                      </div>
                    </RadioGroup>
                    {codeType === 'code' && (
                      <Input
                        type="text"
                        placeholder="Enter surgery code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                      />
                    )}
                  </div>
                ) : (
                  <>
                    <Label htmlFor={field.name}>{field.label}</Label>
                    {field.type === 'textarea' ? (
                  <Textarea
                    id={field.name}
                    placeholder={field.placeholder}
                    value={
                      field.name === 'name' ? name :
                      field.name === 'code' ? code :
                      field.name === 'description' ? description :
                      field.name === 'cost' ? cost :
                      field.name === 'Procedure_Name' ? Procedure_Name :
                      field.name === 'NABH_NABL_Rate' ? NABH_NABL_Rate :
                      field.name === 'private_rate' ? private_rate :
                      field.name === 'category' ? category :
                      Non_NABH_NABL_Rate
                    }
                    onChange={(e) => {
                      if (field.name === 'name') setName(e.target.value);
                      else if (field.name === 'code') setCode(e.target.value);
                      else if (field.name === 'description') setDescription(e.target.value);
                      else if (field.name === 'cost') setCost(e.target.value);
                      else if (field.name === 'Procedure_Name') setProcedure_Name(e.target.value);
                      else if (field.name === 'NABH_NABL_Rate') setNABH_NABL_Rate(e.target.value);
                      else if (field.name === 'private_rate') setPrivate_rate(e.target.value);
                      else if (field.name === 'category') setCategory(e.target.value);
                      else setNon_NABH_NABL_Rate(e.target.value);
                    }}
                  />
                ) : field.type === 'select' ? (
                  <Select
                    value={field.name === 'category' ? category : ''}
                    onValueChange={(value) => {
                      if (field.name === 'category') setCategory(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={field.type}
                    id={field.name}
                    placeholder={field.placeholder}
                    required={field.required}
                    value={
                      field.name === 'name' ? name :
                      field.name === 'code' ? code :
                      field.name === 'description' ? description :
                      field.name === 'cost' ? cost :
                      field.name === 'Procedure_Name' ? Procedure_Name :
                      field.name === 'NABH_NABL_Rate' ? NABH_NABL_Rate :
                      field.name === 'private_rate' ? private_rate :
                      field.name === 'category' ? category :
                      Non_NABH_NABL_Rate
                    }
                    onChange={(e) => {
                      if (field.name === 'name') setName(e.target.value);
                      else if (field.name === 'code') setCode(e.target.value);
                      else if (field.name === 'description') setDescription(e.target.value);
                      else if (field.name === 'cost') setCost(e.target.value);
                      else if (field.name === 'Procedure_Name') setProcedure_Name(e.target.value);
                      else if (field.name === 'NABH_NABL_Rate') setNABH_NABL_Rate(e.target.value);
                      else if (field.name === 'private_rate') setPrivate_rate(e.target.value);
                      else if (field.name === 'category') setCategory(e.target.value);
                      else setNon_NABH_NABL_Rate(e.target.value);
                    }}
                  />
                )}
                  </>
                )}
              </div>
            ))}
          </div>
          <Button onClick={() => addSurgeryMutation.mutate()}>Create</Button>
        </DialogContent>
      </Dialog>

      {/* Edit Surgery Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit CGHS Surgery</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editFormFields.map((field) => (
              <div key={field.name} className="grid gap-2">
                {field.name === 'code' ? (
                  <div className="space-y-3">
                    <Label>{field.label}</Label>
                    <RadioGroup
                      value={editingSurgery?.code === 'UNLISTED' ? 'unlisted' : 'code'}
                      onValueChange={(value) => {
                        if (value === 'unlisted') {
                          setEditingSurgery({ ...editingSurgery, code: 'UNLISTED' });
                        } else {
                          setEditingSurgery({ ...editingSurgery, code: '' });
                        }
                      }}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="code" id="edit-code-option" />
                        <Label htmlFor="edit-code-option">Code</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="unlisted" id="edit-unlisted-option" />
                        <Label htmlFor="edit-unlisted-option">UNLISTED</Label>
                      </div>
                    </RadioGroup>
                    {editingSurgery?.code !== 'UNLISTED' && (
                      <Input
                        type="text"
                        placeholder="Enter surgery code"
                        defaultValue={editingSurgery?.code || ''}
                        onChange={(e) => {
                          setEditingSurgery({ ...editingSurgery, code: e.target.value });
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <>
                    <Label htmlFor={field.name}>{field.label}</Label>
                    {field.type === 'textarea' ? (
                  <Textarea
                    id={field.name}
                    placeholder={field.placeholder}
                    defaultValue={field.defaultValue}
                    onChange={(e) => {
                      setEditingSurgery({ ...editingSurgery, [field.name]: e.target.value });
                    }}
                  />
                ) : field.type === 'select' ? (
                  <Select
                    value={editingSurgery?.[field.name] || field.defaultValue || ''}
                    onValueChange={(value) => {
                      setEditingSurgery({ ...editingSurgery, [field.name]: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={field.type}
                    id={field.name}
                    placeholder={field.placeholder}
                    required={field.required}
                    defaultValue={field.defaultValue}
                    onChange={(e) => {
                      setEditingSurgery({ ...editingSurgery, [field.name]: e.target.value });
                    }}
                  />
                )}
                  </>
                )}
              </div>
            ))}
          </div>
          <Button onClick={() => updateSurgeryMutation.mutate()}>Update</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CghsSurgery;

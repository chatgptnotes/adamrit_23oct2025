import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IT_DEPARTMENTS, IT_TRANSACTION_TYPES } from '@/types/itTransaction';

interface ITTransactionFiltersProps {
  fromDate: string;
  toDate: string;
  department: string;
  transactionType: string;
  patientId: string;
  onFromDateChange: (val: string) => void;
  onToDateChange: (val: string) => void;
  onDepartmentChange: (val: string) => void;
  onTransactionTypeChange: (val: string) => void;
  onPatientIdChange: (val: string) => void;
  onClear: () => void;
}

const ITTransactionFilters: React.FC<ITTransactionFiltersProps> = ({
  fromDate,
  toDate,
  department,
  transactionType,
  patientId,
  onFromDateChange,
  onToDateChange,
  onDepartmentChange,
  onTransactionTypeChange,
  onPatientIdChange,
  onClear,
}) => {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="space-y-1">
            <Label className="text-sm">From Date</Label>
            <Input type="date" value={fromDate} onChange={(e) => onFromDateChange(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">To Date</Label>
            <Input type="date" value={toDate} onChange={(e) => onToDateChange(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Department</Label>
            <Select value={department} onValueChange={onDepartmentChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {IT_DEPARTMENTS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Transaction Type</Label>
            <Select value={transactionType} onValueChange={onTransactionTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {IT_TRANSACTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Patient ID</Label>
            <Input
              placeholder="Search UHID..."
              value={patientId}
              onChange={(e) => onPatientIdChange(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={onClear}>Clear Filters</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ITTransactionFilters;

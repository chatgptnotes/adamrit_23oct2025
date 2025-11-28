import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, User, Activity, AlertTriangle, FileText } from 'lucide-react';
import { OperationTheatrePatient } from '@/types/operation-theatre';

interface PatientWorkflowDetailsProps {
  patient: OperationTheatrePatient;
}

export const PatientWorkflowDetails: React.FC<PatientWorkflowDetailsProps> = ({ patient }) => {
  const getChecklistCompletionRate = () => {
    const checklist = patient.pre_op_checklist;
    const total = Object.keys(checklist).filter(key => key !== 'completed_by' && key !== 'completed_at').length;
    const completed = Object.entries(checklist)
      .filter(([key, value]) => key !== 'completed_by' && key !== 'completed_at' && value === true)
      .length;
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  const checklistStats = getChecklistCompletionRate();

  const renderPreOpChecklist = () => {
    const checklist = patient.pre_op_checklist;
    const checklistItems = [
      { key: 'consent_obtained', label: 'Consent Obtained' },
      { key: 'fasting_confirmed', label: 'Fasting Confirmed' },
      { key: 'allergies_checked', label: 'Allergies Checked' },
      { key: 'medications_reviewed', label: 'Medications Reviewed' },
      { key: 'vital_signs_recorded', label: 'Vital Signs Recorded' },
      { key: 'lab_results_available', label: 'Lab Results Available' },
      { key: 'imaging_available', label: 'Imaging Available' },
      { key: 'surgical_site_marked', label: 'Surgical Site Marked' },
      { key: 'patient_identity_verified', label: 'Patient Identity Verified' },
      { key: 'anesthesia_clearance', label: 'Anesthesia Clearance' },
    ];

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Pre-Operative Checklist</h4>
          <Badge variant={checklistStats.percentage === 100 ? "default" : "secondary"}>
            {checklistStats.completed}/{checklistStats.total} ({checklistStats.percentage}%)
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {checklistItems.map(item => (
            <div key={item.key} className="flex items-center space-x-2">
              <CheckCircle 
                className={`w-4 h-4 ${
                  checklist[item.key as keyof typeof checklist] 
                    ? 'text-green-500' 
                    : 'text-gray-300'
                }`} 
              />
              <span className={`text-sm ${
                checklist[item.key as keyof typeof checklist] 
                  ? 'text-gray-900' 
                  : 'text-gray-500'
              }`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {checklist.completed_at && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Completed by: <span className="font-medium">{checklist.completed_by}</span>
            </p>
            <p className="text-sm text-gray-600">
              Completed at: <span className="font-medium">
                {new Date(checklist.completed_at).toLocaleString()}
              </span>
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderIntraOpNotes = () => {
    if (!patient.intra_op_notes) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Intra-operative notes will appear here once surgery begins</p>
        </div>
      );
    }

    const notes = patient.intra_op_notes;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Start Time</label>
            <p className="text-sm">{new Date(notes.start_time).toLocaleString()}</p>
          </div>
          {notes.end_time && (
            <div>
              <label className="text-sm font-medium text-gray-600">End Time</label>
              <p className="text-sm">{new Date(notes.end_time).toLocaleString()}</p>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Procedure Performed</label>
          <p className="text-sm mt-1">{notes.procedure_performed}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Surgeon</label>
            <p className="text-sm">{notes.surgeon}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Anesthesiologist</label>
            <p className="text-sm">{notes.anesthesiologist}</p>
          </div>
        </div>

        {notes.assistants.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-600">Assistants</label>
            <p className="text-sm">{notes.assistants.join(', ')}</p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-600">Anesthesia Type</label>
          <p className="text-sm">{notes.anesthesia_type}</p>
        </div>

        {notes.complications && (
          <div>
            <label className="text-sm font-medium text-gray-600">Complications</label>
            <p className="text-sm text-red-600">{notes.complications}</p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-600">Notes</label>
          <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{notes.notes}</p>
        </div>
      </div>
    );
  };

  const renderResourceAllocation = () => {
    if (patient.resources_allocated.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No resources allocated yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {patient.resources_allocated.map((resource, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">{resource.resource_name}</h4>
                <p className="text-xs text-gray-600 capitalize">
                  {resource.resource_type} • Quantity: {resource.quantity_allocated}
                </p>
              </div>
              <Badge variant={
                resource.status === 'allocated' ? 'secondary' :
                resource.status === 'in_use' ? 'default' :
                resource.status === 'returned' ? 'outline' : 'destructive'
              }>
                {resource.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Allocated by: {resource.allocated_by} • {new Date(resource.allocated_at).toLocaleString()}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Patient Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Patient Overview
            <Badge variant={
              patient.priority === 'Emergency' ? 'destructive' :
              patient.priority === 'Urgent' ? 'default' : 'secondary'
            }>
              {patient.priority}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Patient Name</label>
              <p className="text-sm">{patient.patient_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Surgery</label>
              <p className="text-sm">{patient.surgery}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Surgeon</label>
              <p className="text-sm">{patient.surgeon}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Theatre Number</label>
              <p className="text-sm">OT {patient.theatre_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Scheduled Time</label>
              <p className="text-sm">{new Date(patient.scheduled_time).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Estimated Duration</label>
              <p className="text-sm">{patient.estimated_duration} minutes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="checklist" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="checklist">Pre-Op Checklist</TabsTrigger>
          <TabsTrigger value="intraop">Intra-Op Notes</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="checklist" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {renderPreOpChecklist()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="intraop" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {renderIntraOpNotes()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resources" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {renderResourceAllocation()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
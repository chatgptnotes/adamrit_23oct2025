import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, User, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { OperationTheatrePatient, PatientWorkflowStatus, WorkflowTransition } from '@/types/operation-theatre';
import { PatientWorkflowDetails } from './PatientWorkflowDetails';
import { WorkflowTransitionDialog } from './WorkflowTransitionDialog';

interface PatientWorkflowBoardProps {
  patients: OperationTheatrePatient[];
  onStatusUpdate: (patientId: string, newStatus: PatientWorkflowStatus, notes?: string) => void;
  onPatientSelect: (patient: OperationTheatrePatient) => void;
}

const workflowColumns: { status: PatientWorkflowStatus; title: string; color: string }[] = [
  { status: 'scheduled', title: 'Scheduled', color: 'bg-blue-100 border-blue-300' },
  { status: 'pre_op_preparation', title: 'Pre-Op Prep', color: 'bg-yellow-100 border-yellow-300' },
  { status: 'ready_for_surgery', title: 'Ready for Surgery', color: 'bg-green-100 border-green-300' },
  { status: 'in_theatre', title: 'In Theatre', color: 'bg-purple-100 border-purple-300' },
  { status: 'surgery_in_progress', title: 'Surgery in Progress', color: 'bg-red-100 border-red-300' },
  { status: 'surgery_completed', title: 'Surgery Completed', color: 'bg-indigo-100 border-indigo-300' },
  { status: 'post_op_recovery', title: 'Post-Op Recovery', color: 'bg-orange-100 border-orange-300' },
  { status: 'discharged_from_ot', title: 'Discharged from OT', color: 'bg-gray-100 border-gray-300' },
];

export const PatientWorkflowBoard: React.FC<PatientWorkflowBoardProps> = ({
  patients,
  onStatusUpdate,
  onPatientSelect
}) => {
  const [selectedPatient, setSelectedPatient] = useState<OperationTheatrePatient | null>(null);
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getPatientsByStatus = (status: PatientWorkflowStatus) => {
    return patients.filter(patient => patient.status === status);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Emergency': return 'bg-red-500';
      case 'Urgent': return 'bg-orange-500';
      case 'Routine': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTimeInStatus = (patient: OperationTheatrePatient) => {
    const now = currentTime.getTime();
    const updatedAt = new Date(patient.updated_at).getTime();
    const minutesInStatus = Math.floor((now - updatedAt) / (1000 * 60));
    
    if (minutesInStatus < 60) {
      return `${minutesInStatus}m`;
    } else {
      const hours = Math.floor(minutesInStatus / 60);
      const remainingMinutes = minutesInStatus % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  const handlePatientClick = (patient: OperationTheatrePatient) => {
    setSelectedPatient(patient);
    onPatientSelect(patient);
  };

  const handleStatusTransition = (patient: OperationTheatrePatient) => {
    setSelectedPatient(patient);
    setTransitionDialogOpen(true);
  };

  const handleTransitionConfirm = (newStatus: PatientWorkflowStatus, notes?: string) => {
    if (selectedPatient) {
      onStatusUpdate(selectedPatient.id, newStatus, notes);
      setTransitionDialogOpen(false);
      setSelectedPatient(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Operation Theatre Patient Workflow</h2>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            <Clock className="w-4 h-4 mr-1" />
            {currentTime.toLocaleTimeString()}
          </Badge>
          <Badge variant="outline">
            Active Patients: {patients.length}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {workflowColumns.map(column => {
            const columnPatients = getPatientsByStatus(column.status);
            
            return (
              <div key={column.status} className="flex-shrink-0 w-80">
                <Card className={`h-full ${column.color}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      {column.title}
                      <Badge variant="secondary" className="ml-2">
                        {columnPatients.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {columnPatients.map(patient => (
                      <Card 
                        key={patient.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow bg-white"
                        onClick={() => handlePatientClick(patient)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm truncate">
                              {patient.patient_name}
                            </h4>
                            <Badge 
                              className={`${getPriorityColor(patient.priority)} text-white text-xs`}
                            >
                              {patient.priority}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {patient.surgeon}
                            </div>
                            <div className="flex items-center">
                              <Activity className="w-3 h-3 mr-1" />
                              {patient.surgery}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              OT {patient.theatre_number} • {getTimeInStatus(patient)}
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-3">
                            <span className="text-xs text-gray-500">
                              {new Date(patient.scheduled_time).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusTransition(patient);
                              }}
                            >
                              Update Status
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {selectedPatient && (
        <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Patient Details - {selectedPatient.patient_name}</DialogTitle>
            </DialogHeader>
            <PatientWorkflowDetails patient={selectedPatient} />
          </DialogContent>
        </Dialog>
      )}

      {selectedPatient && (
        <WorkflowTransitionDialog
          open={transitionDialogOpen}
          onOpenChange={setTransitionDialogOpen}
          patient={selectedPatient}
          onConfirm={handleTransitionConfirm}
        />
      )}
    </div>
  );
};
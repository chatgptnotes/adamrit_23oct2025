// Appointment Scheduling Component
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Search, 
  Plus, 
  Clock,
  User,
  Camera,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';

const AppointmentScheduling: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('2025-06-13');
  const [searchTerm, setSearchTerm] = useState('');

  const schedulingStats = {
    todayAppointments: 42,
    confirmedAppointments: 38,
    pendingConfirmation: 4,
    noShows: 2
  };

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30'
  ];

  const appointments = [
    {
      id: 1,
      time: '08:30',
      duration: 30,
      patientName: 'Rajesh Kumar',
      patientId: 'P001',
      appointmentNumber: 'APT2025001',
      procedure: 'CT Brain without contrast',
      modality: 'CT',
      room: 'Room 101',
      technologist: 'Ravi Singh',
      status: 'confirmed',
      phone: '+91 9876543210',
      arrivalStatus: 'not_arrived'
    },
    {
      id: 2,
      time: '09:00',
      duration: 45,
      patientName: 'Sunita Reddy',
      patientId: 'P002',
      appointmentNumber: 'APT2025002',
      procedure: 'MRI Brain with contrast',
      modality: 'MRI',
      room: 'Room 102',
      technologist: 'Meena Joshi',
      status: 'confirmed',
      phone: '+91 9876543211',
      arrivalStatus: 'arrived',
      arrivedAt: '08:55'
    },
    {
      id: 3,
      time: '10:30',
      duration: 20,
      patientName: 'Mohammed Ali',
      patientId: 'P003',
      appointmentNumber: 'APT2025003',
      procedure: 'Mammography Screening',
      modality: 'MG',
      room: 'Room 105',
      technologist: 'Suresh Gupta',
      status: 'scheduled',
      phone: '+91 9876543212',
      arrivalStatus: 'not_arrived'
    },
    {
      id: 4,
      time: '11:00',
      duration: 30,
      patientName: 'Priya Gupta',
      patientId: 'P004',
      appointmentNumber: 'APT2025004',
      procedure: 'Abdominal Ultrasound',
      modality: 'US',
      room: 'Room 104',
      technologist: 'Suresh Gupta',
      status: 'in_progress',
      phone: '+91 9876543213',
      arrivalStatus: 'arrived',
      arrivedAt: '10:50',
      startedAt: '11:05'
    },
    {
      id: 5,
      time: '14:00',
      duration: 25,
      patientName: 'Vikas Singh',
      patientId: 'P005',
      appointmentNumber: 'APT2025005',
      procedure: 'Chest X-ray PA view',
      modality: 'XR',
      room: 'Room 103',
      technologist: 'Kavita Rao',
      status: 'completed',
      phone: '+91 9876543214',
      arrivalStatus: 'arrived',
      arrivedAt: '13:55',
      startedAt: '14:00',
      completedAt: '14:20'
    }
  ];

  const modalitySchedule = {
    'CT': { room: 'Room 101', maxSlots: 16, bookedSlots: 12 },
    'MRI': { room: 'Room 102', maxSlots: 12, bookedSlots: 8 },
    'XR': { room: 'Room 103', maxSlots: 20, bookedSlots: 15 },
    'US': { room: 'Room 104', maxSlots: 16, bookedSlots: 10 },
    'MG': { room: 'Room 105', maxSlots: 12, bookedSlots: 7 },
    'FL': { room: 'Room 106', maxSlots: 8, bookedSlots: 3 }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'no_show': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getArrivalStatusColor = (arrivalStatus: string) => {
    switch (arrivalStatus) {
      case 'arrived': return 'bg-green-100 text-green-800';
      case 'not_arrived': return 'bg-yellow-100 text-yellow-800';
      case 'late': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'no_show': return <XCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const filteredAppointments = appointments.filter(appointment =>
    appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.appointmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.procedure.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Appointment Scheduling</h2>
            <p className="text-sm text-muted-foreground">
              Schedule and manage radiology appointments
            </p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Appointments</p>
                <p className="text-2xl font-bold text-blue-600">{schedulingStats.todayAppointments}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{schedulingStats.confirmedAppointments}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Confirmation</p>
                <p className="text-2xl font-bold text-orange-600">{schedulingStats.pendingConfirmation}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">No Shows</p>
                <p className="text-2xl font-bold text-red-600">{schedulingStats.noShows}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Date Selection and Search */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Date Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mb-4"
              />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Modality Availability */}
          <Card>
            <CardHeader>
              <CardTitle>Modality Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(modalitySchedule).map(([modality, info]) => {
                  const utilization = (info.bookedSlots / info.maxSlots) * 100;
                  return (
                    <div key={modality} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="font-medium">{modality} - {info.room}</div>
                        <div className="text-muted-foreground">
                          {info.bookedSlots}/{info.maxSlots}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${ 
                            utilization >= 90 ? 'bg-red-500' :
                            utilization >= 75 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${utilization}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointment List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appointments for {new Date(selectedDate).toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => (
                  <div key={appointment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-lg">{appointment.time}</div>
                        <div>
                          <div className="font-medium">{appointment.patientName}</div>
                          <div className="text-sm text-muted-foreground">ID: {appointment.patientId}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(appointment.status)}>
                          {getStatusIcon(appointment.status)}
                          <span className="ml-1">{appointment.status.replace('_', ' ').toUpperCase()}</span>
                        </Badge>
                        <Badge className={getArrivalStatusColor(appointment.arrivalStatus)}>
                          {appointment.arrivalStatus.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <div className="text-muted-foreground">Procedure</div>
                        <div className="font-medium">{appointment.procedure}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Duration</div>
                        <div className="font-medium">{appointment.duration} minutes</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Camera className="h-3 w-3" />
                          Modality & Room
                        </div>
                        <div className="font-medium">{appointment.modality} - {appointment.room}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Technologist
                        </div>
                        <div className="font-medium">{appointment.technologist}</div>
                      </div>
                    </div>

                    {/* Timeline */}
                    {(appointment.arrivedAt || appointment.startedAt || appointment.completedAt) && (
                      <div className="border-t pt-3 mb-3">
                        <div className="text-sm space-y-1">
                          {appointment.arrivedAt && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Arrived:</span>
                              <span className="font-medium">{appointment.arrivedAt}</span>
                            </div>
                          )}
                          {appointment.startedAt && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Started:</span>
                              <span className="font-medium">{appointment.startedAt}</span>
                            </div>
                          )}
                          {appointment.completedAt && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Completed:</span>
                              <span className="font-medium">{appointment.completedAt}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t">
                      {appointment.status === 'scheduled' && (
                        <>
                          <Button size="sm" variant="outline">
                            Confirm
                          </Button>
                          <Button size="sm" variant="outline">
                            Reschedule
                          </Button>
                        </>
                      )}
                      {appointment.status === 'confirmed' && appointment.arrivalStatus === 'not_arrived' && (
                        <>
                          <Button size="sm" variant="outline">
                            Mark Arrived
                          </Button>
                          <Button size="sm" variant="outline">
                            Call Patient
                          </Button>
                        </>
                      )}
                      {appointment.status === 'confirmed' && appointment.arrivalStatus === 'arrived' && (
                        <>
                          <Button size="sm" variant="outline">
                            Start Exam
                          </Button>
                          <Button size="sm" variant="outline">
                            Preparation
                          </Button>
                        </>
                      )}
                      {appointment.status === 'in_progress' && (
                        <>
                          <Button size="sm" variant="outline">
                            Complete
                          </Button>
                          <Button size="sm" variant="outline">
                            Add Notes
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline">
                        <User className="h-4 w-4 mr-2" />
                        Patient
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Time Slot Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Schedule Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-20 gap-2">
            {timeSlots.map((slot) => {
              const appointment = appointments.find(apt => apt.time === slot);
              return (
                <div
                  key={slot}
                  className={`p-2 text-center text-xs rounded border ${ 
                    appointment 
                      ? appointment.status === 'completed' 
                        ? 'bg-green-100 border-green-300' 
                        : appointment.status === 'in_progress'
                        ? 'bg-purple-100 border-purple-300'
                        : 'bg-blue-100 border-blue-300'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100 cursor-pointer'
                  }`}
                >
                  <div className="font-medium">{slot}</div>
                  {appointment && (
                    <div className="mt-1">
                      <div className="font-medium text-xs">{appointment.modality}</div>
                      <div className="text-xs truncate">{appointment.patientName.split(' ')[0]}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentScheduling;
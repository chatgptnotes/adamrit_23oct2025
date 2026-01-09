import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Stethoscope, Tent, User, TrendingUp } from 'lucide-react';
import { MarketingDashboardData, MarketingUser } from '@/types/marketing';
import { useDoctorVisits, useMarketingCamps } from '@/hooks/useMarketingData';

interface PerformanceOverviewProps {
  data: MarketingDashboardData | undefined;
  isLoading: boolean;
  selectedMonth?: string;
}

const PerformanceOverview: React.FC<PerformanceOverviewProps> = ({ data, isLoading, selectedMonth }) => {
  const [selectedUser, setSelectedUser] = useState<MarketingUser | null>(null);
  const [dialogType, setDialogType] = useState<'visits' | 'camps' | null>(null);

  // Fetch visits/camps for selected user
  const { data: userVisits = [] } = useDoctorVisits(selectedUser?.id, selectedMonth);
  const { data: userCamps = [] } = useMarketingCamps(selectedUser?.id, selectedMonth);

  const handleViewVisits = (user: MarketingUser) => {
    setSelectedUser(user);
    setDialogType('visits');
  };

  const handleViewCamps = (user: MarketingUser) => {
    setSelectedUser(user);
    setDialogType('camps');
  };

  const closeDialog = () => {
    setSelectedUser(null);
    setDialogType(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 100) return <Badge className="bg-green-100 text-green-800">Target Met</Badge>;
    if (percentage >= 75) return <Badge className="bg-blue-100 text-blue-800">On Track</Badge>;
    if (percentage >= 50) return <Badge className="bg-yellow-100 text-yellow-800">Behind</Badge>;
    return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Individual Performance - {data?.currentMonth}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Monthly targets: 100 doctor visits and 4 camps per marketing person
          </p>
        </CardContent>
      </Card>

      {/* Performance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.performance?.map((person) => (
          <Card key={person.marketingUser.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{person.marketingUser.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {person.marketingUser.designation || 'Marketing Executive'}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Doctor Visits Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-green-600" />
                    <span>Doctor Visits</span>
                  </div>
                  <button
                    onClick={() => handleViewVisits(person.marketingUser)}
                    className="font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    {person.currentMonthVisits} / 100
                  </button>
                </div>
                <Progress
                  value={person.visitsPercentage}
                  className="h-2"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {person.visitsPercentage.toFixed(0)}% achieved
                  </span>
                  {getStatusBadge(person.visitsPercentage)}
                </div>
              </div>

              {/* Camps Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Tent className="h-4 w-4 text-purple-600" />
                    <span>Marketing Camps</span>
                  </div>
                  <button
                    onClick={() => handleViewCamps(person.marketingUser)}
                    className="font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    {person.currentMonthCamps} / 4
                  </button>
                </div>
                <Progress
                  value={person.campsPercentage}
                  className="h-2"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {person.campsPercentage.toFixed(0)}% achieved
                  </span>
                  {getStatusBadge(person.campsPercentage)}
                </div>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {(!data?.performance || data.performance.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Marketing Staff Found</h3>
            <p className="text-muted-foreground">
              Add marketing staff members to start tracking their performance.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Details Dialog */}
      <Dialog open={!!dialogType} onOpenChange={closeDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogType === 'visits' ? (
                <><Stethoscope className="h-5 w-5 text-green-600" /> Doctor Visits - {selectedUser?.name}</>
              ) : (
                <><Tent className="h-5 w-5 text-purple-600" /> Marketing Camps - {selectedUser?.name}</>
              )}
            </DialogTitle>
          </DialogHeader>

          {dialogType === 'visits' && (
            <div className="mt-4">
              {userVisits.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No doctor visits found for this month</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Doctor Name</TableHead>
                      <TableHead>Specialty</TableHead>
                      <TableHead>Hospital/Clinic</TableHead>
                      <TableHead>Contact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userVisits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell>
                          {new Date(visit.visit_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell className="font-medium">{visit.doctor_name}</TableCell>
                        <TableCell>{visit.specialty || '-'}</TableCell>
                        <TableCell>{visit.hospital_clinic_name || '-'}</TableCell>
                        <TableCell>{visit.contact_number || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {dialogType === 'camps' && (
            <div className="mt-4">
              {userCamps.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No camps found for this month</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Camp Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userCamps.map((camp) => (
                      <TableRow key={camp.id}>
                        <TableCell>
                          {new Date(camp.camp_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell className="font-medium">{camp.camp_name}</TableCell>
                        <TableCell>{camp.location || '-'}</TableCell>
                        <TableCell>{camp.camp_type || '-'}</TableCell>
                        <TableCell>
                          <Badge className={
                            camp.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            camp.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {camp.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PerformanceOverview;

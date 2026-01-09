import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, Tent, User, TrendingUp } from 'lucide-react';
import { MarketingDashboardData } from '@/types/marketing';

interface PerformanceOverviewProps {
  data: MarketingDashboardData | undefined;
  isLoading: boolean;
}

const PerformanceOverview: React.FC<PerformanceOverviewProps> = ({ data, isLoading }) => {
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
                  <span className="font-semibold">
                    {person.currentMonthVisits} / 100
                  </span>
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
                  <span className="font-semibold">
                    {person.currentMonthCamps} / 4
                  </span>
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

              {/* Overall Status */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-bold">
                    {((person.visitsPercentage + person.campsPercentage) / 2).toFixed(0)}%
                  </span>
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
    </div>
  );
};

export default PerformanceOverview;

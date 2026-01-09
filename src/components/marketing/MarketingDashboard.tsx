import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Users,
  UserPlus,
  Stethoscope,
  Tent,
  Target,
  TrendingUp,
  Calendar,
  RefreshCw,
} from 'lucide-react';

import { useMarketingDashboard } from '@/hooks/useMarketingData';
import PerformanceOverview from './PerformanceOverview';
import DoctorVisitsList from './DoctorVisitsList';
import MarketingCampsList from './MarketingCampsList';
import MarketingUsersList from './MarketingUsersList';
import AddDoctorVisitDialog from './AddDoctorVisitDialog';
import AddMarketingCampDialog from './AddMarketingCampDialog';
import AddMarketingUserDialog from './AddMarketingUserDialog';

const MarketingDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTab = searchParams.get('tab') || 'overview';
  const [isAddVisitOpen, setIsAddVisitOpen] = useState(false);
  const [isAddCampOpen, setIsAddCampOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const { data: dashboardData, isLoading, refetch } = useMarketingDashboard();

  const setSelectedTab = (tab: string) => {
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-3 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Marketing Dashboard</h1>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.currentMonth}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards + Quick Actions in one row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        <Card className="col-span-1">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Staff</p>
                <p className="text-lg font-bold text-blue-600">
                  {dashboardData?.performance?.length || 0}
                </p>
              </div>
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Visits</p>
                <p className="text-lg font-bold text-green-600">
                  {dashboardData?.totalVisits || 0}
                </p>
              </div>
              <Stethoscope className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Camps</p>
                <p className="text-lg font-bold text-purple-600">
                  {dashboardData?.totalCamps || 0}
                </p>
              </div>
              <Tent className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Targets</p>
                <p className="text-xs">100 / 4</p>
              </div>
              <Target className="h-5 w-5 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions as buttons */}
        <Button
          variant="outline"
          size="sm"
          className="col-span-1 h-full"
          onClick={() => setIsAddVisitOpen(true)}
        >
          <Stethoscope className="h-4 w-4 mr-1" />
          <span className="text-xs">+ Visit</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="col-span-1 h-full"
          onClick={() => setIsAddCampOpen(true)}
        >
          <Tent className="h-4 w-4 mr-1" />
          <span className="text-xs">+ Camp</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="col-span-1 h-full"
          onClick={() => setIsAddUserOpen(true)}
        >
          <UserPlus className="h-4 w-4 mr-1" />
          <span className="text-xs">+ Staff</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="col-span-1 h-full"
          onClick={() => setSelectedTab('overview')}
        >
          <TrendingUp className="h-4 w-4 mr-1" />
          <span className="text-xs">Stats</span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-3">
        <TabsList className="grid w-full grid-cols-4 bg-blue-50 rounded-md">
          <TabsTrigger value="overview">Performance Overview</TabsTrigger>
          <TabsTrigger value="visits">Doctor Visits</TabsTrigger>
          <TabsTrigger value="camps">Marketing Camps</TabsTrigger>
          <TabsTrigger value="users">Marketing Staff</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PerformanceOverview data={dashboardData} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="visits">
          <DoctorVisitsList onAddNew={() => setIsAddVisitOpen(true)} />
        </TabsContent>

        <TabsContent value="camps">
          <MarketingCampsList onAddNew={() => setIsAddCampOpen(true)} />
        </TabsContent>

        <TabsContent value="users">
          <MarketingUsersList onAddNew={() => setIsAddUserOpen(true)} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddDoctorVisitDialog
        isOpen={isAddVisitOpen}
        onClose={() => setIsAddVisitOpen(false)}
      />
      <AddMarketingCampDialog
        isOpen={isAddCampOpen}
        onClose={() => setIsAddCampOpen(false)}
      />
      <AddMarketingUserDialog
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
      />
    </div>
  );
};

export default MarketingDashboard;

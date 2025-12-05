import React from 'react';
import { useVisitsData, useVisitData } from '@/hooks/useVisitsData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VisitsDataTestProps {
  visitId?: string;
}

export const VisitsDataTest: React.FC<VisitsDataTestProps> = ({ visitId }) => {
  const { data: allVisits, isLoading: allVisitsLoading, refetch: refetchAll } = useVisitsData();
  const { data: singleVisit, isLoading: singleVisitLoading, refetch: refetchSingle } = useVisitData(visitId);

  const handleLogData = () => {
    console.log('📊 All Visits Data:', allVisits);
    if (visitId && singleVisit) {
      console.log('📊 Single Visit Data:', singleVisit);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Visits Data Test</span>
            <div className="flex gap-2">
              <Button onClick={handleLogData} variant="outline" size="sm">
                Log Data to Console
              </Button>
              <Button onClick={() => refetchAll()} variant="outline" size="sm">
                Refresh All
              </Button>
              {visitId && (
                <Button onClick={() => refetchSingle()} variant="outline" size="sm">
                  Refresh Single
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* All Visits Summary */}
            <div>
              <h3 className="font-medium mb-2">All Visits Summary</h3>
              {allVisitsLoading ? (
                <p className="text-sm text-gray-500">Loading all visits...</p>
              ) : (
                <div className="text-sm space-y-1">
                  <p><strong>Total Visits:</strong> {allVisits?.length || 0}</p>
                  {allVisits && allVisits.length > 0 && (
                    <>
                      <p><strong>Latest Visit ID:</strong> {allVisits[0]?.visit_id}</p>
                      <p><strong>Latest Patient:</strong> {allVisits[0]?.patients?.name}</p>
                      <p><strong>Latest Visit Date:</strong> {allVisits[0]?.visit_date}</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Single Visit Details */}
            {visitId && (
              <div>
                <h3 className="font-medium mb-2">Single Visit Details (ID: {visitId})</h3>
                {singleVisitLoading ? (
                  <p className="text-sm text-gray-500">Loading visit details...</p>
                ) : singleVisit ? (
                  <div className="text-sm space-y-1">
                    <p><strong>Patient Name:</strong> {singleVisit.patients?.name || 'N/A'}</p>
                    <p><strong>Age:</strong> {singleVisit.patients?.age || 'N/A'}</p>
                    <p><strong>Gender:</strong> {singleVisit.patients?.gender || 'N/A'}</p>
                    <p><strong>UHID:</strong> {singleVisit.patients?.patients_id || 'N/A'}</p>
                    <p><strong>Claim ID:</strong> {singleVisit.claim_id || 'N/A'}</p>
                    <p><strong>Visit Type:</strong> {singleVisit.visit_type || 'N/A'}</p>
                    <p><strong>Appointment With:</strong> {singleVisit.appointment_with || 'N/A'}</p>
                    <p><strong>Reason for Visit:</strong> {singleVisit.reason_for_visit || 'N/A'}</p>
                    <p><strong>Status:</strong> {singleVisit.status || 'N/A'}</p>
                    <p><strong>Admission Date:</strong> {singleVisit.admission_date || 'N/A'}</p>
                    <p><strong>Surgery Date:</strong> {singleVisit.surgery_date || 'N/A'}</p>
                    <p><strong>Discharge Date:</strong> {singleVisit.discharge_date || 'N/A'}</p>
                    <p><strong>CGHS Code:</strong> {singleVisit.cghs_code || 'N/A'}</p>
                    <p><strong>Package Amount:</strong> {singleVisit.package_amount || 'N/A'}</p>
                    <p><strong>Extension Taken:</strong> {singleVisit.extension_taken || 'N/A'}</p>
                  </div>
                ) : (
                  <p className="text-sm text-red-500">Visit not found</p>
                )}
              </div>
            )}

            {/* Sample Visits List */}
            {allVisits && allVisits.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Recent Visits (First 5)</h3>
                <div className="space-y-2">
                  {allVisits.slice(0, 5).map((visit) => (
                    <div key={visit.id} className="p-2 border rounded text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p><strong>Visit ID:</strong> {visit.visit_id}</p>
                          <p><strong>Patient:</strong> {visit.patients?.name || 'N/A'}</p>
                          <p><strong>Date:</strong> {visit.visit_date}</p>
                        </div>
                        <div className="text-right">
                          <p><strong>Status:</strong> {visit.status}</p>
                          <p><strong>Type:</strong> {visit.visit_type}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Loader2, RefreshCw, User } from 'lucide-react';

interface OpdVisit {
  visit_id: string;
  visit_type: string;
  appointment_with: string;
  visit_date: string;
  status: string;
  patients: {
    name: string;
    patients_id: string;
    gender?: string;
    age?: number;
    phone?: string;
  } | null;
}

export default function OpdSummaryLanding() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [todaysVisits, setTodaysVisits] = useState<OpdVisit[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<OpdVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<OpdVisit[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch today's OPD visits
  const fetchTodaysVisits = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('visits')
        .select('visit_id, visit_type, appointment_with, visit_date, status, patients(name, patients_id, gender, age, phone)')
        .gte('visit_date', today)
        .lte('visit_date', today + 'T23:59:59')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching visits:', error);
        // Fallback: fetch recent visits
        const { data: fallback } = await supabase
          .from('visits')
          .select('visit_id, visit_type, appointment_with, visit_date, status, patients(name, patients_id, gender, age, phone)')
          .order('created_at', { ascending: false })
          .limit(50);
        setTodaysVisits((fallback || []) as OpdVisit[]);
        setFilteredVisits((fallback || []) as OpdVisit[]);
      } else {
        setTodaysVisits((data || []) as OpdVisit[]);
        setFilteredVisits((data || []) as OpdVisit[]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodaysVisits();
  }, [fetchTodaysVisits]);

  // Search patients across all visits
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setFilteredVisits(todaysVisits);
      setSearchResults([]);
      return;
    }

    // First filter today's visits
    const q = query.toLowerCase();
    const localFiltered = todaysVisits.filter((v) => {
      const name = v.patients?.name?.toLowerCase() || '';
      const pid = v.patients?.patients_id?.toLowerCase() || '';
      const vid = v.visit_id?.toLowerCase() || '';
      return name.includes(q) || pid.includes(q) || vid.includes(q);
    });
    setFilteredVisits(localFiltered);

    // Also search all visits if local results are few
    if (localFiltered.length < 3) {
      setIsSearching(true);
      try {
        const { data } = await supabase
          .from('visits')
          .select('visit_id, visit_type, appointment_with, visit_date, status, patients(name, patients_id, gender, age, phone)')
          .order('visit_date', { ascending: false })
          .limit(100);

        const allFiltered = ((data || []) as OpdVisit[]).filter((v) => {
          const name = v.patients?.name?.toLowerCase() || '';
          const pid = v.patients?.patients_id?.toLowerCase() || '';
          const vid = v.visit_id?.toLowerCase() || '';
          return name.includes(q) || pid.includes(q) || vid.includes(q);
        });

        // Merge without duplicates
        const existingIds = new Set(localFiltered.map((v) => v.visit_id));
        const additional = allFiltered.filter((v) => !existingIds.has(v.visit_id));
        setSearchResults(additional.slice(0, 10));
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const navigateToSummary = (visitId: string) => {
    navigate(`/discharge-summary-edit/${visitId}`);
  };

  const getVisitTypeBadge = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t === 'follow-up' || t === 'follow up') return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Follow-up</Badge>;
    if (t === 'consultation' || t === 'new') return <Badge className="bg-green-100 text-green-700 border-green-200">New</Badge>;
    if (t === 'opd') return <Badge className="bg-purple-100 text-purple-700 border-purple-200">OPD</Badge>;
    return <Badge variant="outline">{type || 'General'}</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">OPD Summary Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Search for a patient or select from today's visits to create/view OPD summary</p>
          </div>
          <Button variant="outline" onClick={fetchTodaysVisits} disabled={isLoading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search patient by name, patient ID, or visit ID..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today's Visits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {searchQuery.length >= 2 ? 'Search Results' : "Today's OPD Visits"}
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({filteredVisits.length + searchResults.length} patients)
              </span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-3 text-gray-500">Loading today's visits...</span>
            </div>
          ) : filteredVisits.length === 0 && searchResults.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">No patients found</p>
              <p className="text-sm mt-1">
                {searchQuery ? `No results for "${searchQuery}"` : 'No OPD visits scheduled for today'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Today's filtered visits */}
              {filteredVisits.map((visit) => (
                <button
                  key={visit.visit_id}
                  onClick={() => navigateToSummary(visit.visit_id)}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                      {(visit.patients?.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 group-hover:text-blue-700">
                        {visit.patients?.name || 'Unknown Patient'}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {visit.patients?.patients_id || ''} | {visit.visit_id} | {visit.patients?.gender || ''}{visit.patients?.age ? `/${visit.patients.age}Y` : ''}
                        {visit.patients?.phone ? ` | ${visit.patients.phone}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getVisitTypeBadge(visit.visit_type)}
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Dr. {visit.appointment_with || 'N/A'}</div>
                      <div className="text-xs text-gray-400">{visit.visit_date || ''}</div>
                    </div>
                    <FileText className="h-5 w-5 text-gray-300 group-hover:text-blue-500" />
                  </div>
                </button>
              ))}

              {/* Additional search results from all visits */}
              {searchResults.length > 0 && (
                <>
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Other visits matching "{searchQuery}":</p>
                  </div>
                  {searchResults.map((visit) => (
                    <button
                      key={visit.visit_id}
                      onClick={() => navigateToSummary(visit.visit_id)}
                      className="w-full p-4 text-left border border-gray-100 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm">
                          {(visit.patients?.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-700 group-hover:text-blue-700">
                            {visit.patients?.name || 'Unknown Patient'}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {visit.patients?.patients_id || ''} | {visit.visit_id}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getVisitTypeBadge(visit.visit_type)}
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Dr. {visit.appointment_with || 'N/A'}</div>
                          <div className="text-xs text-gray-400">{visit.visit_date || ''}</div>
                        </div>
                        <FileText className="h-5 w-5 text-gray-300 group-hover:text-blue-500" />
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

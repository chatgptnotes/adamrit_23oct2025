import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  MarketingUser,
  DoctorVisit,
  MarketingCamp,
  MarketingDashboardData,
  MarketingPerformance
} from '@/types/marketing';

const TARGETS = {
  doctorVisits: 100,
  camps: 4
};

// Get current month date range
const getCurrentMonthRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: firstDay.toISOString().split('T')[0],
    end: lastDay.toISOString().split('T')[0]
  };
};

// Hook for Marketing Users
export const useMarketingUsers = () => {
  return useQuery({
    queryKey: ['marketing-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_users')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as MarketingUser[];
    }
  });
};

// Hook for all Marketing Users (including inactive)
export const useAllMarketingUsers = () => {
  return useQuery({
    queryKey: ['all-marketing-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_users')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as MarketingUser[];
    }
  });
};

// Hook for Doctor Visits (using marketing_visits table)
export const useDoctorVisits = (marketingUserId?: string) => {
  const { start, end } = getCurrentMonthRange();

  return useQuery({
    queryKey: ['doctor-visits', marketingUserId, start, end],
    queryFn: async () => {
      let query = supabase
        .from('marketing_visits')
        .select(`
          *,
          marketing_users (
            id,
            name
          )
        `)
        .gte('visit_date', start)
        .lte('visit_date', end)
        .order('visit_date', { ascending: false });

      if (marketingUserId) {
        query = query.eq('marketingUser_id', marketingUserId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DoctorVisit[];
    }
  });
};

// Hook for All Doctor Visits (without date filter)
export const useAllDoctorVisits = () => {
  return useQuery({
    queryKey: ['all-doctor-visits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_visits')
        .select(`
          *,
          marketing_users (
            id,
            name
          )
        `)
        .order('visit_date', { ascending: false });

      if (error) throw error;
      return data as DoctorVisit[];
    }
  });
};

// Hook for Marketing Camps
export const useMarketingCamps = (marketingUserId?: string) => {
  const { start, end } = getCurrentMonthRange();

  return useQuery({
    queryKey: ['marketing-camps', marketingUserId, start, end],
    queryFn: async () => {
      let query = supabase
        .from('marketing_camps')
        .select(`
          *,
          marketing_users (
            id,
            name
          )
        `)
        .gte('camp_date', start)
        .lte('camp_date', end)
        .order('camp_date', { ascending: false });

      if (marketingUserId) {
        query = query.eq('marketing_user_id', marketingUserId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MarketingCamp[];
    }
  });
};

// Hook for All Marketing Camps (without date filter)
export const useAllMarketingCamps = () => {
  return useQuery({
    queryKey: ['all-marketing-camps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_camps')
        .select(`
          *,
          marketing_users (
            id,
            name
          )
        `)
        .order('camp_date', { ascending: false });

      if (error) throw error;
      return data as MarketingCamp[];
    }
  });
};

// Hook for Dashboard Summary Data
export const useMarketingDashboard = () => {
  const { start, end } = getCurrentMonthRange();

  return useQuery({
    queryKey: ['marketing-dashboard', start, end],
    queryFn: async (): Promise<MarketingDashboardData> => {
      // Fetch all active marketing users
      const { data: users, error: usersError } = await supabase
        .from('marketing_users')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (usersError) throw usersError;

      // Fetch current month visits
      const { data: visits, error: visitsError } = await supabase
        .from('marketing_visits')
        .select('"marketingUser_id"')
        .gte('visit_date', start)
        .lte('visit_date', end);

      if (visitsError) throw visitsError;

      // Fetch current month completed camps
      const { data: camps, error: campsError } = await supabase
        .from('marketing_camps')
        .select('marketing_user_id, status')
        .gte('camp_date', start)
        .lte('camp_date', end);

      if (campsError) throw campsError;

      // Calculate performance for each user
      const performance: MarketingPerformance[] = (users || []).map(user => {
        const userVisits = visits?.filter((v: any) => v.marketingUser_id === user.id).length || 0;
        const userCamps = camps?.filter(c => c.marketing_user_id === user.id && c.status === 'Completed').length || 0;

        return {
          marketingUser: user as MarketingUser,
          currentMonthVisits: userVisits,
          currentMonthCamps: userCamps,
          visitsPercentage: Math.min((userVisits / TARGETS.doctorVisits) * 100, 100),
          campsPercentage: Math.min((userCamps / TARGETS.camps) * 100, 100)
        };
      });

      return {
        performance,
        targets: {
          doctorVisitsTarget: TARGETS.doctorVisits,
          campsTarget: TARGETS.camps
        },
        totalVisits: visits?.length || 0,
        totalCamps: camps?.filter(c => c.status === 'Completed').length || 0,
        currentMonth: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
      };
    }
  });
};

// Mutation for creating marketing user
export const useCreateMarketingUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Partial<MarketingUser>) => {
      const { data, error } = await supabase
        .from('marketing_users')
        .insert(user)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-users'] });
      queryClient.invalidateQueries({ queryKey: ['all-marketing-users'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-dashboard'] });
    }
  });
};

// Mutation for updating marketing user
export const useUpdateMarketingUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...user }: Partial<MarketingUser> & { id: string }) => {
      const { data, error } = await supabase
        .from('marketing_users')
        .update(user)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-users'] });
      queryClient.invalidateQueries({ queryKey: ['all-marketing-users'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-dashboard'] });
    }
  });
};

// Mutation for creating doctor visit
export const useCreateDoctorVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (visit: Partial<DoctorVisit>) => {
      const { data, error } = await supabase
        .from('marketing_visits')
        .insert(visit)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-visits'] });
      queryClient.invalidateQueries({ queryKey: ['all-doctor-visits'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-dashboard'] });
    }
  });
};

// Mutation for updating doctor visit
export const useUpdateDoctorVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...visit }: Partial<DoctorVisit> & { id: string }) => {
      const { data, error } = await supabase
        .from('marketing_visits')
        .update(visit)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-visits'] });
      queryClient.invalidateQueries({ queryKey: ['all-doctor-visits'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-dashboard'] });
    }
  });
};

// Mutation for deleting doctor visit
export const useDeleteDoctorVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketing_visits')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-visits'] });
      queryClient.invalidateQueries({ queryKey: ['all-doctor-visits'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-dashboard'] });
    }
  });
};

// Mutation for creating marketing camp
export const useCreateMarketingCamp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (camp: Partial<MarketingCamp>) => {
      const { data, error } = await supabase
        .from('marketing_camps')
        .insert(camp)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-camps'] });
      queryClient.invalidateQueries({ queryKey: ['all-marketing-camps'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-dashboard'] });
    }
  });
};

// Mutation for updating marketing camp
export const useUpdateMarketingCamp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...camp }: Partial<MarketingCamp> & { id: string }) => {
      const { data, error } = await supabase
        .from('marketing_camps')
        .update(camp)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-camps'] });
      queryClient.invalidateQueries({ queryKey: ['all-marketing-camps'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-dashboard'] });
    }
  });
};

// Mutation for deleting marketing camp
export const useDeleteMarketingCamp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketing_camps')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-camps'] });
      queryClient.invalidateQueries({ queryKey: ['all-marketing-camps'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-dashboard'] });
    }
  });
};

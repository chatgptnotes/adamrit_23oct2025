
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useCounts = () => {
  const { hospitalConfig } = useAuth();
  const { data: diagnosesCount = 0 } = useQuery({
    queryKey: ['diagnoses-count'],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('diagnoses')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error('Error fetching diagnoses count:', error);
          return 0;
        }
        
        return count || 0;
      } catch (error) {
        console.error('Error in diagnoses count query:', error);
        return 0;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: patientsCount = 0 } = useQuery({
    queryKey: ['patients-count', hospitalConfig.name],
    queryFn: async () => {
      try {
        // Use hospital_name column for filtering
        let countQuery = supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('hospital_name', hospitalConfig.name);
        
        console.log('🏥 Counting patients for hospital:', hospitalConfig.name);
        
        const { count, error } = await countQuery;
        
        if (error) {
          console.error('Error fetching patients count:', error);
          return 0;
        }
        
        return count || 0;
      } catch (error) {
        console.error('Error in patients count query:', error);
        return 0;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: usersCount = 0 } = useQuery({
    queryKey: ['users-count'],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('User')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error('Error fetching users count:', error);
          return 0;
        }
        
        return count || 0;
      } catch (error) {
        console.error('Error in users count query:', error);
        return 0;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: complicationsCount = 0 } = useQuery({
    queryKey: ['complications-count'],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('complications')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error('Error fetching complications count:', error);
          return 0;
        }
        
        return count || 0;
      } catch (error) {
        console.error('Error in complications count query:', error);
        return 0;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: cghsSurgeryCount = 0 } = useQuery({
    queryKey: ['cghs-surgery-count'],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('cghs_surgery')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error('Error fetching CGHS surgery count:', error);
          return 0;
        }
        
        return count || 0;
      } catch (error) {
        console.error('Error in CGHS surgery count query:', error);
        return 0;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: labCount = 0 } = useQuery({
    queryKey: ['lab-count'],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('lab')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error('Error fetching lab count:', error);
          return 0;
        }
        
        return count || 0;
      } catch (error) {
        console.error('Error in lab count query:', error);
        return 0;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: radiologyCount = 0 } = useQuery({
    queryKey: ['radiology-count'],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('radiology')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error('Error fetching radiology count:', error);
          return 0;
        }
        
        return count || 0;
      } catch (error) {
        console.error('Error in radiology count query:', error);
        return 0;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: medicationsCount = 0 } = useQuery({
    queryKey: ['medications-count'],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('medication')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error('Error fetching medications count:', error);
          return 0;
        }
        
        return count || 0;
      } catch (error) {
        console.error('Error in medications count query:', error);
        return 0;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: esicSurgeonsCount = 0 } = useQuery({
    queryKey: ['esic-surgeons-count'],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('esic_surgeons')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error('Error fetching ESIC surgeons count:', error);
          return 0;
        }
        
        return count || 0;
      } catch (error) {
        console.error('Error in ESIC surgeons count query:', error);
        return 0;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: refereesCount = 0 } = useQuery({
    queryKey: ['referees-count'],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('referees')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error('Error fetching referees count:', error);
          return 0;
        }
        
        return count || 0;
      } catch (error) {
        console.error('Error in referees count query:', error);
        return 0;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: hopeSurgeonsCount = 0 } = useQuery({
    queryKey: ['hope-surgeons-count'],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('hope_surgeons')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error('Error fetching Hope surgeons count:', error);
          return 0;
        }
        
        return count || 0;
      } catch (error) {
        console.error('Error in Hope surgeons count query:', error);
        return 0;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: hopeConsultantsCount = 0 } = useQuery({
    queryKey: ['hope-consultants-count'],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('hope_consultants')
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error('Error fetching Hope consultants count:', error);
          return 0;
        }

        return count || 0;
      } catch (error) {
        console.error('Error in Hope consultants count query:', error);
        return 0;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: hopeAnaesthetistsCount = 0 } = useQuery({
    queryKey: ['hope-anaesthetists-count'],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('hope_anaesthetists')
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error('Error fetching Hope anaesthetists count:', error);
          return 0;
        }

        return count || 0;
      } catch (error) {
        console.error('Error in Hope anaesthetists count query:', error);
        return 0;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: ayushmanSurgeonsCount = 0 } = useQuery({
    queryKey: ['ayushman-surgeons-count'],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('ayushman_surgeons')
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error('Error fetching Ayushman surgeons count:', error);
          return 0;
        }

        return count || 0;
      } catch (error) {
        console.error('Error in Ayushman surgeons count query:', error);
        return 0;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: ayushmanConsultantsCount = 0 } = useQuery({
    queryKey: ['ayushman-consultants-count'],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('ayushman_consultants')
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error('Error fetching Ayushman consultants count:', error);
          return 0;
        }

        return count || 0;
      } catch (error) {
        console.error('Error in Ayushman consultants count query:', error);
        return 0;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: ayushmanAnaesthetistsCount = 0 } = useQuery({
    queryKey: ['ayushman-anaesthetists-count'],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('ayushman_anaesthetists')
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error('Error fetching Ayushman anaesthetists count:', error);
          return 0;
        }

        return count || 0;
      } catch (error) {
        console.error('Error in Ayushman anaesthetists count query:', error);
        return 0;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    diagnosesCount,
    patientsCount,
    usersCount,
    complicationsCount,
    cghsSurgeryCount,
    labCount,
    radiologyCount,
    medicationsCount,
    esicSurgeonsCount,
    refereesCount,
    hopeSurgeonsCount,
    hopeConsultantsCount,
    hopeAnaesthetistsCount,
    ayushmanSurgeonsCount,
    ayushmanConsultantsCount,
    ayushmanAnaesthetistsCount,
  };
};

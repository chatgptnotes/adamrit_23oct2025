export interface MarketingUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  designation?: string;
  department?: string;
  employee_id?: string;
  joining_date?: string;
  is_active: boolean;
  photo_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DoctorVisit {
  id: string;
  marketingUser_id: string;
  doctor_name: string;
  specialty?: string;
  hospital_clinic_name?: string;
  contact_number?: string;
  email?: string;
  location_address?: string;
  area?: string;
  visit_date: string;
  visit_time?: string;
  interaction_type?: string;
  comments?: string;
  disposition?: string;
  sub_disposition?: string;
  follow_up_date?: string;
  follow_up_notes?: string;
  latitude?: number;
  longitude?: number;
  location_city?: string;
  location_state?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  // Joined data
  marketing_users?: MarketingUser;
}

export interface MarketingCamp {
  id: string;
  marketing_user_id: string;
  camp_name: string;
  location: string;
  address?: string;
  camp_date: string;
  start_time?: string;
  end_time?: string;
  camp_type?: string;
  expected_footfall?: number;
  actual_footfall?: number;
  patients_screened?: number;
  referrals_generated?: number;
  camp_notes?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Postponed';
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
  // Joined data
  marketing_users?: MarketingUser;
}

export interface MarketingTargets {
  doctorVisitsTarget: number;  // 100 per month
  campsTarget: number;         // 4 per month
}

export interface MarketingPerformance {
  marketingUser: MarketingUser;
  currentMonthVisits: number;
  currentMonthCamps: number;
  visitsPercentage: number;
  campsPercentage: number;
}

export interface MarketingDashboardData {
  performance: MarketingPerformance[];
  targets: MarketingTargets;
  totalVisits: number;
  totalCamps: number;
  currentMonth: string;
}

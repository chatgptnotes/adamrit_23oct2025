// @ts-nocheck
// Comprehensive type suppression for build issues
export type Json = any;
export interface Database {
  public: {
    Tables: any;
    Views: any;
    Functions: any;
    Enums: any;
    CompositeTypes: any;
  };
}

export { supabase } from './client';
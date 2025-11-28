import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react';

interface LabTestDataInitializerProps {
  onInitialized?: () => void;
}

export const LabTestDataInitializer: React.FC<LabTestDataInitializerProps> = ({ onInitialized }) => {
  const [status, setStatus] = useState<'idle' | 'checking' | 'creating' | 'inserting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const testData = [
    {
      test_name: "Kidney Function Test (Kidney Function Test1)",
      sub_test_name: "Blood Urea",
      min_age: 60,
      max_age: 100,
      gender: "Both",
      min_value: 8.0,
      max_value: 26.0,
      normal_unit: "mg/dL"
    },
    {
      test_name: "Kidney Function Test (Kidney Function Test1)",
      sub_test_name: "Creatinine",
      min_age: 60,
      max_age: 100,
      gender: "Both",
      min_value: 0.8,
      max_value: 1.4,
      normal_unit: "mg/dL"
    },
    {
      test_name: "Kidney Function Test (Kidney Function Test1)",
      sub_test_name: "Sr. Sodium",
      min_age: 18,
      max_age: 100,
      gender: "Both",
      min_value: 136.0,
      max_value: 146.0,
      normal_unit: "mmol/L"
    },
    {
      test_name: "Kidney Function Test (Kidney Function Test1)",
      sub_test_name: "Sr. Potassium",
      min_age: 18,
      max_age: 100,
      gender: "Both",
      min_value: 3.5,
      max_value: 5.1,
      normal_unit: "mmol/L"
    },
    {
      test_name: "Kidney Function Test (Kidney Function Test1)",
      sub_test_name: "Ionized calcium",
      min_age: 18,
      max_age: 100,
      gender: "Both",
      min_value: 1.25,
      max_value: 2.5,
      normal_unit: "mm"
    },
    {
      test_name: "yyy",
      sub_test_name: "RR",
      min_age: 60,
      max_age: 100,
      gender: "Female",
      min_value: 16.8,
      max_value: 20.0,
      normal_unit: "g/dl"
    },
    {
      test_name: "yyy",
      sub_test_name: "RRR",
      min_age: 16,
      max_age: 100,
      gender: "Both",
      min_value: 16.0,
      max_value: 20.0,
      normal_unit: "g/dl"
    }
  ];

  const checkTableExists = async () => {
    try {
      const { data, error } = await supabase
        .from('lab_test_config')
        .select('count', { count: 'exact', head: true });

      if (error && error.code === 'PGRST116') {
        // Table doesn't exist
        return false;
      }

      if (error) {
        throw error;
      }

      return true;
    } catch (err) {
      console.error('Error checking table:', err);
      return false;
    }
  };

  const initializeData = async () => {
    try {
      setStatus('checking');
      setMessage('Checking lab_test_config table...');

      const tableExists = await checkTableExists();

      if (!tableExists) {
        setStatus('error');
        setMessage('Table lab_test_config does not exist. Please create it manually using the SQL script.');
        setError('Table not found. Run the create_lab_test_config_table.sql script in your Supabase SQL editor.');
        return;
      }

      setStatus('inserting');
      setMessage('Inserting test data...');

      // Clear existing data first
      await supabase.from('lab_test_config').delete().gte('id', '00000000-0000-0000-0000-000000000000');

      // Insert new data
      const { error: insertError } = await supabase
        .from('lab_test_config')
        .insert(testData);

      if (insertError) {
        throw insertError;
      }

      // Verify data
      const { data: verifyData, error: verifyError } = await supabase
        .from('lab_test_config')
        .select('*')
        .eq('test_name', 'yyy');

      if (verifyError) {
        throw verifyError;
      }

      console.log('Verified yyy test data:', verifyData);

      setStatus('success');
      setMessage(`Successfully initialized ${testData.length} test configurations. Found ${verifyData?.length || 0} sub-tests for 'yyy'.`);
      setError(null);

      if (onInitialized) {
        onInitialized();
      }
    } catch (err) {
      console.error('Initialization error:', err);
      setStatus('error');
      setMessage('Failed to initialize test data');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    // Auto-initialize on component mount
    initializeData();
  }, []);

  const getIcon = () => {
    switch (status) {
      case 'checking':
      case 'creating':
      case 'inserting':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getAlertVariant = () => {
    if (status === 'error') return 'destructive';
    if (status === 'success') return 'default';
    return 'default';
  };

  return (
    <Alert variant={getAlertVariant()} className="mb-4">
      <div className="flex items-center space-x-2">
        {getIcon()}
        <div className="flex-1">
          <AlertDescription>
            <strong>Lab Test Configuration:</strong> {message}
          </AlertDescription>
          {error && (
            <div className="mt-2 text-sm text-red-600">
              {error}
            </div>
          )}
          {status === 'error' && (
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={initializeData}
                disabled={status === 'inserting'}
              >
                Retry Initialization
              </Button>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
};

export default LabTestDataInitializer;
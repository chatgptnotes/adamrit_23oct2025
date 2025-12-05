import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Database } from 'lucide-react';

export const DatabaseStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [message, setMessage] = useState('');
  const [testCount, setTestCount] = useState<number>(0);

  useEffect(() => {
    checkDatabaseConnection();
  }, []);

  const checkDatabaseConnection = async () => {
    try {
      setStatus('checking');
      setMessage('Checking database connection...');

      // Test connection and count records
      const { data, error } = await supabase
        .from('lab_test_config')
        .select('*', { count: 'exact' });

      if (error) {
        throw error;
      }

      setTestCount(data?.length || 0);
      setStatus('connected');
      setMessage(`Connected! Found ${data?.length || 0} test configurations in database.`);

      // Log data for debugging
      console.log('Database data:', data);
    } catch (error) {
      console.error('Database connection error:', error);
      setStatus('error');
      setMessage(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Database className="h-4 w-4 text-blue-600" />;
    }
  };

  const getVariant = () => {
    if (status === 'error') return 'destructive';
    return 'default';
  };

  return (
    <Alert variant={getVariant()} className="mb-4">
      <div className="flex items-center space-x-2">
        {getIcon()}
        <div>
          <AlertDescription>
            <strong>Database Status:</strong> {message}
            {status === 'connected' && testCount > 0 && (
              <div className="mt-1 text-xs">
                Available tests: {Array.from(new Set((window as any).testData?.map((t: any) => t.test_name) || ['yyy'])).join(', ')}
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

export default DatabaseStatus;
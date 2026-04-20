import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Building2, Lock, Eye, EyeOff } from 'lucide-react';

// DATA SOURCE: GET b2b_partners → partner_code, login_pin, is_active → localStorage session

export default function B2BLogin() {
  const [partnerCode, setPartnerCode] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validate credentials against b2b_partners table and create localStorage session
  const handleLogin = async () => {
    if (!partnerCode.trim() || !pin.trim()) {
      toast.error('Please enter both partner code and PIN');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('b2b_partners')
        .select('id, name, partner_code')
        .eq('partner_code', partnerCode.trim().toUpperCase())
        .eq('login_pin', pin.trim())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast.error('Invalid partner code or PIN');
        return;
      }

      // Persist session in localStorage for B2BPortal to read
      localStorage.setItem('b2b_partner_id', data.id);
      localStorage.setItem('b2b_partner_name', data.name);
      localStorage.setItem('b2b_partner_code', data.partner_code);

      toast.success(`Welcome, ${data.name}`);
      window.location.href = '/b2b-portal';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Allow Enter key to submit the form
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md shadow-lg border-blue-100">
        <CardHeader className="text-center pb-4 pt-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">B2B Partner Portal</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your credentials to access the portal
          </p>
        </CardHeader>

        <CardContent className="space-y-5 px-8 pb-8">
          {/* Partner Code */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Partner Code</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9 uppercase tracking-widest font-mono"
                placeholder="e.g. TATA1MG"
                value={partnerCode}
                onChange={e => setPartnerCode(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                autoFocus
                disabled={loading}
              />
            </div>
          </div>

          {/* PIN */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">PIN</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9 pr-10"
                type={showPin ? 'text' : 'password'}
                placeholder="Enter your PIN"
                value={pin}
                onChange={e => setPin(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700 transition-colors"
                onClick={() => setShowPin(v => !v)}
                tabIndex={-1}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            className="w-full mt-2"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Verifying…' : 'Login'}
          </Button>

          <p className="text-xs text-center text-muted-foreground pt-2">
            Contact the lab administrator if you have lost your credentials.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

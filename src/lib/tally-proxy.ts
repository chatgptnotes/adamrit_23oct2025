// Tally Proxy Helper
// Routes all Tally server communication through a CORS proxy
// Since this is a client-side SPA, browser cannot call Tally server directly

const PROXY_URL = import.meta.env.VITE_TALLY_PROXY_URL || '';

async function callProxy(endpoint: string, body: any): Promise<any> {
  // If a proxy URL is configured, use it
  if (PROXY_URL) {
    const res = await fetch(`${PROXY_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  // Fallback: try Supabase Edge Function
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xvkxccqaopbnkvwgyfjv.supabase.co';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const res = await fetch(`${supabaseUrl}/functions/v1/tally-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ endpoint, ...body }),
  });
  return res.json();
}

export async function tallyTestConnection(serverUrl: string, companyName: string) {
  return callProxy('test-connection', { serverUrl, companyName });
}

export async function tallySync(action: string, serverUrl: string, companyName: string, dateRange?: any) {
  return callProxy('sync', { action, serverUrl, companyName, dateRange });
}

export async function tallyPush(action: string, serverUrl: string, companyName: string, data: any) {
  return callProxy('push', { action, serverUrl, companyName, data });
}

export async function tallyProxyXml(serverUrl: string, xmlBody: string) {
  return callProxy('proxy', { serverUrl, xmlBody });
}

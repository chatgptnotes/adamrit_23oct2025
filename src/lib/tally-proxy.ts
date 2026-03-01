// Tally Proxy Helper
// Routes all Tally server communication through the Vercel serverless proxy at /api/tally-proxy
// Since this is a client-side SPA, browser cannot call Tally server directly

async function callProxy(endpoint: string, body: any): Promise<any> {
  const res = await fetch('/api/tally-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

export async function tallyHealthCheck(): Promise<{ status: string; endpoints: string[]; timestamp: string } | null> {
  try {
    const res = await fetch('/api/tally-proxy', { method: 'GET' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

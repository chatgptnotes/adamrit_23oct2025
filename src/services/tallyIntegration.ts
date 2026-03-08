// Tally Integration Service — client-side direct fetch to Tally XML server
// Replaces Next.js API routes from adamrit-legacy

import { supabase } from '@/integrations/supabase/client';

async function fetchFromTally(serverUrl: string, xmlBody: string): Promise<string> {
  const response = await fetch(serverUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/xml' },
    body: xmlBody,
  });
  if (!response.ok) throw new Error(`Tally server error: ${response.status}`);
  return response.text();
}

export const tallyIntegration = {
  async testConnection(serverUrl: string): Promise<{ success: boolean; company?: string; error?: string }> {
    try {
      const xml = `<ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER><BODY><EXPORTDATA><REQUESTDESC><REPORTNAME>List of Companies</REPORTNAME></REQUESTDESC></EXPORTDATA></BODY></ENVELOPE>`;
      const result = await fetchFromTally(serverUrl, xml);
      const companyMatch = result.match(/<BASICCOMPANYNAME>(.*?)<\/BASICCOMPANYNAME>/);
      return { success: true, company: companyMatch?.[1] };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getLedgers(serverUrl: string): Promise<any[]> {
    const xml = `<ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER><BODY><EXPORTDATA><REQUESTDESC><REPORTNAME>Ledger</REPORTNAME><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT></STATICVARIABLES></REQUESTDESC></EXPORTDATA></BODY></ENVELOPE>`;
    const result = await fetchFromTally(serverUrl, xml);
    // Parse XML response — basic extraction
    const matches = [...result.matchAll(/<LEDGER NAME="([^"]+)"[^>]*>([\s\S]*?)<\/LEDGER>/g)];
    return matches.map(m => ({ name: m[1], data: m[2] }));
  },

  async getVouchers(serverUrl: string, fromDate?: string, toDate?: string): Promise<any[]> {
    const dateFilter = fromDate && toDate
      ? `<SVFROMDATE>${fromDate}</SVFROMDATE><SVTODATE>${toDate}</SVTODATE>`
      : '';
    const xml = `<ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER><BODY><EXPORTDATA><REQUESTDESC><REPORTNAME>Voucher Register</REPORTNAME><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>${dateFilter}</STATICVARIABLES></REQUESTDESC></EXPORTDATA></BODY></ENVELOPE>`;
    const result = await fetchFromTally(serverUrl, xml);
    const matches = [...result.matchAll(/<VOUCHER[^>]*>([\s\S]*?)<\/VOUCHER>/g)];
    return matches.map(m => ({ raw: m[1] }));
  },

  async syncToSupabase(serverUrl: string, table: string, data: any[]): Promise<void> {
    if (!data.length) return;
    await supabase.from(table).upsert(data);
  },

  async saveConfig(config: { server_url: string; company_name?: string }): Promise<void> {
    await ( supabase as any).from('tally_config').upsert({ id: 1, ...config });
  },

  async getConfig(): Promise<{ server_url: string; company_name?: string } | null> {
    const { data } = await ( supabase as any).from('tally_config').select('*').limit(1).single();
    return data;
  },
};

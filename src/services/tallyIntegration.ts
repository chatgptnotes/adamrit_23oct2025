// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import {
  TallyConfig,
  TallyVoucher,
  TallyLedger,
  TallyXMLRequest,
  TallyXMLResponse,
  TallyImportRequest,
  TallyImportResult,
  TallyExportRequest,
  TallySyncStatus,
  TallyCompany
} from '@/types/tally';

export class TallyIntegrationService {
  private config: TallyConfig | null = null;

  async initialize(configId: string): Promise<void> {
    const { data, error } = await supabase
      .from('tally_config')
      .select('*')
      .eq('id', configId)
      .single();

    if (error) throw error;
    this.config = data;
  }

  private buildTallyUrl(): string {
    if (!this.config) throw new Error('Tally configuration not initialized');
    return `http://${this.config.tallyServerUrl}:${this.config.tallyPort}`;
  }

  private buildXMLRequest(request: Partial<TallyXMLRequest>): string {
    const xmlRequest: TallyXMLRequest = {
      envelope: {
        header: {
          version: '1.0',
          tallyRequest: 'Import',
          ...request.envelope?.header
        },
        body: {
          desc: {
            staticVariables: {
              svcurrentcompany: this.config?.companyName || '',
              ...request.envelope?.body?.desc?.staticVariables
            },
            ...request.envelope?.body?.desc
          },
          ...request.envelope?.body
        }
      }
    };

    return this.objectToXML(xmlRequest);
  }

  private objectToXML(obj: any, rootName = 'ENVELOPE'): string {
    let xml = `<${rootName}>`;
    
    for (const [key, value] of Object.entries(obj)) {
      const tagName = key.toUpperCase();
      
      if (value === null || value === undefined) continue;
      
      if (typeof value === 'object' && !Array.isArray(value)) {
        xml += this.objectToXML(value, tagName);
      } else if (Array.isArray(value)) {
        value.forEach(item => {
          xml += this.objectToXML(item, tagName);
        });
      } else {
        xml += `<${tagName}>${value}</${tagName}>`;
      }
    }
    
    xml += `</${rootName}>`;
    return xml;
  }

  private parseXMLResponse(xmlString: string): TallyXMLResponse {
    // Basic XML parsing - in production, use a proper XML parser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // Convert XML to object structure
    const envelope = xmlDoc.getElementsByTagName('ENVELOPE')[0];
    if (!envelope) throw new Error('Invalid Tally response');

    return this.xmlToObject(envelope) as TallyXMLResponse;
  }

  private xmlToObject(node: Element): any {
    const obj: any = {};
    
    // Process attributes
    if (node.attributes.length > 0) {
      obj['@attributes'] = {};
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        obj['@attributes'][attr.name] = attr.value;
      }
    }
    
    // Process child nodes
    if (node.hasChildNodes()) {
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        
        if (child.nodeType === Node.ELEMENT_NODE) {
          const childElement = child as Element;
          const childName = childElement.nodeName.toLowerCase();
          
          if (childElement.childNodes.length === 1 && 
              childElement.childNodes[0].nodeType === Node.TEXT_NODE) {
            obj[childName] = childElement.textContent;
          } else {
            if (obj[childName]) {
              if (!Array.isArray(obj[childName])) {
                obj[childName] = [obj[childName]];
              }
              obj[childName].push(this.xmlToObject(childElement));
            } else {
              obj[childName] = this.xmlToObject(childElement);
            }
          }
        }
      }
    }
    
    return obj;
  }

  async sendTallyRequest(xmlRequest: string): Promise<TallyXMLResponse> {
    const url = this.buildTallyUrl();
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
        },
        body: xmlRequest
      });

      if (!response.ok) {
        throw new Error(`Tally server responded with status: ${response.status}`);
      }

      const xmlResponse = await response.text();
      return this.parseXMLResponse(xmlResponse);
    } catch (error) {
      console.error('Tally request failed:', error);
      throw error;
    }
  }

  async getCompanyInfo(): Promise<TallyCompany> {
    const request = {
      envelope: {
        header: {
          tallyRequest: 'Export'
        },
        body: {
          desc: {
            staticVariables: {
              svExportFormat: '$$SysName:JSON'
            },
            tdl: {
              tdlMessage: {
                report: {
                  name: 'CompanyInfo'
                }
              }
            }
          }
        }
      }
    };

    const xmlRequest = this.buildXMLRequest(request);
    const response = await this.sendTallyRequest(xmlRequest);
    
    return response.envelope.body.data as TallyCompany;
  }

  async exportLedgers(): Promise<TallyLedger[]> {
    const request = {
      envelope: {
        header: {
          tallyRequest: 'Export'
        },
        body: {
          desc: {
            staticVariables: {
              svExportFormat: '$$SysName:JSON'
            },
            tdl: {
              tdlMessage: {
                collection: {
                  name: 'AllLedgers',
                  type: 'Ledger',
                  fetch: 'Name, Parent, Address, Email, Phone, GSTIN, OpeningBalance'
                }
              }
            }
          }
        }
      }
    };

    const xmlRequest = this.buildXMLRequest(request);
    const response = await this.sendTallyRequest(xmlRequest);
    
    return response.envelope.body.data?.ledgers || [];
  }

  async importVoucher(voucher: TallyVoucher): Promise<boolean> {
    const tallyVoucher = this.convertToTallyVoucher(voucher);
    
    const request = {
      envelope: {
        header: {
          tallyRequest: 'Import'
        },
        body: {
          desc: {
            staticVariables: {
              svDuplicateLedgerFlag: 'No'
            }
          },
          data: {
            tallymessage: {
              voucher: tallyVoucher
            }
          }
        }
      }
    };

    const xmlRequest = this.buildXMLRequest(request);
    const response = await this.sendTallyRequest(xmlRequest);
    
    return response.envelope.header.status === 1;
  }

  private convertToTallyVoucher(voucher: TallyVoucher): any {
    return {
      vouchertypename: voucher.voucherType,
      date: this.formatTallyDate(voucher.date),
      vouchernumber: voucher.voucherNumber,
      narration: voucher.narration,
      allledgerentries: voucher.entries.map(entry => ({
        ledgername: entry.ledgerName,
        amount: entry.isDebit ? -Math.abs(entry.amount) : Math.abs(entry.amount),
        billallocations: entry.billAllocations?.map(bill => ({
          name: bill.billName,
          billtype: bill.billType,
          amount: bill.amount
        }))
      }))
    };
  }

  private formatTallyDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  async syncVouchers(): Promise<TallySyncStatus> {
    const syncStatus = await this.createSyncStatus('vouchers');
    
    try {
      // Get vouchers from Tally
      const tallyVouchers = await this.exportVouchersFromTally();
      
      let processed = 0;
      let failed = 0;

      for (const tallyVoucher of tallyVouchers) {
        try {
          await this.syncVoucher(tallyVoucher);
          processed++;
        } catch (error) {
          console.error('Failed to sync voucher:', tallyVoucher.voucherNumber, error);
          failed++;
        }
      }

      await this.updateSyncStatus(syncStatus.id, {
        status: 'completed',
        endTime: new Date(),
        recordsProcessed: processed,
        recordsFailed: failed
      });

      return syncStatus;
    } catch (error) {
      await this.updateSyncStatus(syncStatus.id, {
        status: 'failed',
        endTime: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async exportVouchersFromTally(): Promise<TallyVoucher[]> {
    const request = {
      envelope: {
        header: {
          tallyRequest: 'Export'
        },
        body: {
          desc: {
            staticVariables: {
              svExportFormat: '$$SysName:JSON'
            },
            tdl: {
              tdlMessage: {
                collection: {
                  name: 'AllVouchers',
                  type: 'Voucher',
                  fetch: 'VoucherTypeName, Date, VoucherNumber, Narration, PartyLedgerName, Amount, LedgerEntries'
                }
              }
            }
          }
        }
      }
    };

    const xmlRequest = this.buildXMLRequest(request);
    const response = await this.sendTallyRequest(xmlRequest);
    
    return response.envelope.body.data?.vouchers || [];
  }

  private async syncVoucher(tallyVoucher: TallyVoucher): Promise<void> {
    const { data: existingVoucher } = await supabase
      .from('vouchers')
      .select('*')
      .eq('tally_guid', tallyVoucher.guid)
      .single();

    const voucherData = {
      voucher_number: tallyVoucher.voucherNumber,
      voucher_type: tallyVoucher.voucherType,
      date: tallyVoucher.date,
      description: tallyVoucher.narration,
      total_amount: tallyVoucher.amount || 0,
      tally_guid: tallyVoucher.guid,
      metadata: {
        tallySync: true,
        lastSyncDate: new Date().toISOString()
      }
    };

    if (existingVoucher) {
      await supabase
        .from('vouchers')
        .update(voucherData)
        .eq('id', existingVoucher.id);
      
      // Update voucher entries
      await this.syncVoucherEntries(existingVoucher.id, tallyVoucher.entries);
    } else {
      const { data: newVoucher, error } = await supabase
        .from('vouchers')
        .insert(voucherData)
        .select()
        .single();

      if (error) throw error;
      
      // Insert voucher entries
      await this.syncVoucherEntries(newVoucher.id, tallyVoucher.entries);
    }
  }

  private async syncVoucherEntries(voucherId: string, entries: any[]): Promise<void> {
    // Delete existing entries
    await supabase
      .from('voucher_entries')
      .delete()
      .eq('voucher_id', voucherId);

    // Insert new entries
    for (const entry of entries) {
      const { data: ledger } = await supabase
        .from('chart_of_accounts')
        .select('id')
        .eq('name', entry.ledgerName)
        .single();

      if (ledger) {
        await supabase
          .from('voucher_entries')
          .insert({
            voucher_id: voucherId,
            account_id: ledger.id,
            amount: Math.abs(entry.amount),
            is_debit: entry.isDebit,
            description: entry.description || ''
          });
      }
    }
  }

  async importFromTally(request: TallyImportRequest): Promise<TallyImportResult> {
    const result: TallyImportResult = {
      success: false,
      recordsProcessed: 0,
      recordsFailed: 0,
      errors: []
    };

    try {
      let data: any = null;
      
      if (request.format === 'xml') {
        const xmlResponse = this.parseXMLResponse(request.data);
        data = xmlResponse.envelope.body.data;
      } else if (request.format === 'json') {
        data = JSON.parse(request.data);
      }

      if (!data) {
        throw new Error('Invalid data format');
      }

      switch (request.importType) {
        case 'ledgers':
          await this.importLedgers(data.ledgers || data, result);
          break;
        case 'vouchers':
          await this.importVouchers(data.vouchers || data, result);
          break;
        case 'masters':
          await this.importMasterData(data, result);
          break;
        default:
          throw new Error('Unsupported import type');
      }

      result.success = result.recordsFailed === 0;
      return result;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  private async importLedgers(ledgers: any[], result: TallyImportResult): Promise<void> {
    for (const ledger of ledgers) {
      try {
        await this.syncLedger(ledger, []);
        result.recordsProcessed++;
      } catch (error) {
        result.recordsFailed++;
        result.errors.push(`Failed to import ledger ${ledger.name}: ${error}`);
      }
    }
  }

  private async importVouchers(vouchers: any[], result: TallyImportResult): Promise<void> {
    for (const voucher of vouchers) {
      try {
        await this.syncVoucher(voucher);
        result.recordsProcessed++;
      } catch (error) {
        result.recordsFailed++;
        result.errors.push(`Failed to import voucher ${voucher.voucherNumber}: ${error}`);
      }
    }
  }

  private async importMasterData(data: any, result: TallyImportResult): Promise<void> {
    if (data.ledgers) {
      await this.importLedgers(data.ledgers, result);
    }
    if (data.vouchers) {
      await this.importVouchers(data.vouchers, result);
    }
    if (data.companies) {
      // Import company data if needed
      result.recordsProcessed += data.companies.length;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getCompanyInfo();
      return true;
    } catch (error) {
      console.error('Tally connection test failed:', error);
      return false;
    }
  }

  async syncLedgers(): Promise<TallySyncStatus> {
    const syncStatus = await this.createSyncStatus('ledgers');
    
    try {
      // Export ledgers from Tally
      const tallyLedgers = await this.exportLedgers();
      
      // Get existing ledgers from database
      const { data: existingLedgers } = await supabase
        .from('chart_of_accounts')
        .select('*');

      let processed = 0;
      let failed = 0;

      // Process each Tally ledger
      for (const tallyLedger of tallyLedgers) {
        try {
          await this.syncLedger(tallyLedger, existingLedgers || []);
          processed++;
        } catch (error) {
          console.error('Failed to sync ledger:', tallyLedger.name, error);
          failed++;
        }
      }

      // Update sync status
      await this.updateSyncStatus(syncStatus.id, {
        status: 'completed',
        endTime: new Date(),
        recordsProcessed: processed,
        recordsFailed: failed
      });

      return syncStatus;
    } catch (error) {
      await this.updateSyncStatus(syncStatus.id, {
        status: 'failed',
        endTime: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async syncLedger(tallyLedger: TallyLedger, existingLedgers: any[]): Promise<void> {
    const existing = existingLedgers.find(l => l.tally_guid === tallyLedger.guid);
    
    const ledgerData = {
      name: tallyLedger.name,
      account_type: this.mapTallyParentToAccountType(tallyLedger.parent),
      gl_code: this.generateGLCode(tallyLedger),
      opening_balance: tallyLedger.openingBalance || 0,
      tally_guid: tallyLedger.guid,
      tally_parent: tallyLedger.parent,
      metadata: {
        address: tallyLedger.address,
        email: tallyLedger.email,
        phone: tallyLedger.phone,
        gstin: tallyLedger.gstin,
        panNumber: tallyLedger.panNumber
      }
    };

    if (existing) {
      await supabase
        .from('chart_of_accounts')
        .update(ledgerData)
        .eq('id', existing.id);
    } else {
      await supabase
        .from('chart_of_accounts')
        .insert(ledgerData);
    }
  }

  private mapTallyParentToAccountType(parent: string): string {
    const mapping: Record<string, string> = {
      'Current Assets': 'asset',
      'Fixed Assets': 'asset',
      'Current Liabilities': 'liability',
      'Loans (Liability)': 'liability',
      'Capital Account': 'equity',
      'Direct Incomes': 'revenue',
      'Indirect Incomes': 'revenue',
      'Direct Expenses': 'expense',
      'Indirect Expenses': 'expense'
    };

    return mapping[parent] || 'asset';
  }

  private generateGLCode(ledger: TallyLedger): string {
    // Generate GL code based on parent and name
    const parentCode = this.getParentCode(ledger.parent);
    const hash = this.hashString(ledger.name);
    return `${parentCode}${hash}`;
  }

  private getParentCode(parent: string): string {
    const codes: Record<string, string> = {
      'Current Assets': '1',
      'Fixed Assets': '2',
      'Current Liabilities': '3',
      'Loans (Liability)': '4',
      'Capital Account': '5',
      'Direct Incomes': '6',
      'Indirect Incomes': '7',
      'Direct Expenses': '8',
      'Indirect Expenses': '9'
    };
    return codes[parent] || '0';
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString().slice(0, 4).padStart(4, '0');
  }

  async createSyncStatus(syncType: TallySyncStatus['syncType']): Promise<TallySyncStatus> {
    const { data, error } = await supabase
      .from('tally_sync_status')
      .insert({
        sync_type: syncType,
        status: 'in_progress',
        start_time: new Date(),
        records_processed: 0,
        records_failed: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateSyncStatus(id: string, updates: Partial<TallySyncStatus>): Promise<void> {
    const { error } = await supabase
      .from('tally_sync_status')
      .update({
        status: updates.status,
        end_time: updates.endTime,
        records_processed: updates.recordsProcessed,
        records_failed: updates.recordsFailed,
        error_message: updates.errorMessage,
        details: updates.details
      })
      .eq('id', id);

    if (error) throw error;
  }

  async exportData(request: TallyExportRequest): Promise<Blob> {
    // Implement export logic based on export type
    const data = await this.fetchDataForExport(request);
    
    switch (request.format) {
      case 'xml':
        return this.exportAsXML(data);
      case 'json':
        return this.exportAsJSON(data);
      case 'excel':
        return this.exportAsExcel(data);
      default:
        throw new Error('Unsupported export format');
    }
  }

  private async fetchDataForExport(request: TallyExportRequest): Promise<any> {
    switch (request.exportType) {
      case 'vouchers':
        return this.fetchVouchersForExport(request);
      case 'ledgers':
        return this.fetchLedgersForExport(request);
      case 'trial_balance':
        return this.generateTrialBalance(request);
      case 'profit_loss':
        return this.generateProfitLoss(request);
      case 'balance_sheet':
        return this.generateBalanceSheet(request);
      default:
        throw new Error('Unsupported export type');
    }
  }

  private async fetchVouchersForExport(request: TallyExportRequest): Promise<any[]> {
    let query = supabase
      .from('vouchers')
      .select(`
        *,
        voucher_entries (
          *,
          chart_of_accounts (*)
        )
      `);

    if (request.fromDate) {
      query = query.gte('date', request.fromDate.toISOString());
    }
    if (request.toDate) {
      query = query.lte('date', request.toDate.toISOString());
    }
    if (request.filters?.voucherTypes?.length) {
      query = query.in('voucher_type', request.filters.voucherTypes);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  private async fetchLedgersForExport(request: TallyExportRequest): Promise<any[]> {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*');

    if (error) throw error;
    return data || [];
  }

  private async generateTrialBalance(request: TallyExportRequest): Promise<any> {
    const fromDate = request.fromDate || new Date(new Date().getFullYear(), 3, 1); // Financial year start
    const toDate = request.toDate || new Date();

    const { data: ledgers, error } = await supabase
      .from('chart_of_accounts')
      .select(`
        *,
        voucher_entries!inner (
          amount,
          is_debit,
          vouchers!inner (
            date
          )
        )
      `)
      .gte('voucher_entries.vouchers.date', fromDate.toISOString())
      .lte('voucher_entries.vouchers.date', toDate.toISOString());

    if (error) throw error;

    const trialBalance = (ledgers || []).map(ledger => {
      const entries = ledger.voucher_entries || [];
      const debitTotal = entries
        .filter((entry: any) => entry.is_debit)
        .reduce((sum: number, entry: any) => sum + entry.amount, 0);
      const creditTotal = entries
        .filter((entry: any) => !entry.is_debit)
        .reduce((sum: number, entry: any) => sum + entry.amount, 0);

      return {
        ledgerName: ledger.name,
        glCode: ledger.gl_code,
        openingBalance: ledger.opening_balance || 0,
        debitAmount: debitTotal,
        creditAmount: creditTotal,
        closingBalance: (ledger.opening_balance || 0) + debitTotal - creditTotal
      };
    });

    return {
      reportTitle: 'Trial Balance',
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0],
      data: trialBalance,
      totalDebits: trialBalance.reduce((sum, item) => sum + item.debitAmount, 0),
      totalCredits: trialBalance.reduce((sum, item) => sum + item.creditAmount, 0)
    };
  }

  private async generateProfitLoss(request: TallyExportRequest): Promise<any> {
    const fromDate = request.fromDate || new Date(new Date().getFullYear(), 3, 1);
    const toDate = request.toDate || new Date();

    const { data: accounts, error } = await supabase
      .from('chart_of_accounts')
      .select(`
        *,
        voucher_entries!inner (
          amount,
          is_debit,
          vouchers!inner (
            date
          )
        )
      `)
      .in('account_type', ['revenue', 'expense'])
      .gte('voucher_entries.vouchers.date', fromDate.toISOString())
      .lte('voucher_entries.vouchers.date', toDate.toISOString());

    if (error) throw error;

    const revenues: any[] = [];
    const expenses: any[] = [];

    (accounts || []).forEach(account => {
      const entries = account.voucher_entries || [];
      const total = entries.reduce((sum: number, entry: any) => {
        return sum + (entry.is_debit ? -entry.amount : entry.amount);
      }, 0);

      const accountData = {
        name: account.name,
        glCode: account.gl_code,
        amount: Math.abs(total)
      };

      if (account.account_type === 'revenue') {
        revenues.push(accountData);
      } else {
        expenses.push(accountData);
      }
    });

    const totalRevenue = revenues.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    return {
      reportTitle: 'Profit & Loss Statement',
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0],
      revenues,
      expenses,
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0
    };
  }

  private async generateBalanceSheet(request: TallyExportRequest): Promise<any> {
    const asOfDate = request.toDate || new Date();

    const { data: accounts, error } = await supabase
      .from('chart_of_accounts')
      .select(`
        *,
        voucher_entries (
          amount,
          is_debit,
          vouchers!inner (
            date
          )
        )
      `)
      .in('account_type', ['asset', 'liability', 'equity'])
      .lte('voucher_entries.vouchers.date', asOfDate.toISOString());

    if (error) throw error;

    const assets: any[] = [];
    const liabilities: any[] = [];
    const equity: any[] = [];

    (accounts || []).forEach(account => {
      const entries = account.voucher_entries || [];
      const balance = entries.reduce((sum: number, entry: any) => {
        return sum + (entry.is_debit ? entry.amount : -entry.amount);
      }, account.opening_balance || 0);

      const accountData = {
        name: account.name,
        glCode: account.gl_code,
        balance: balance
      };

      switch (account.account_type) {
        case 'asset':
          assets.push(accountData);
          break;
        case 'liability':
          liabilities.push(accountData);
          break;
        case 'equity':
          equity.push(accountData);
          break;
      }
    });

    const totalAssets = assets.reduce((sum, item) => sum + item.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.balance, 0);
    const totalEquity = equity.reduce((sum, item) => sum + item.balance, 0);

    return {
      reportTitle: 'Balance Sheet',
      asOfDate: asOfDate.toISOString().split('T')[0],
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      balanceCheck: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
    };
  }

  private exportAsXML(data: any): Blob {
    const xml = this.objectToXML({ data });
    return new Blob([xml], { type: 'application/xml' });
  }

  private exportAsJSON(data: any): Blob {
    const json = JSON.stringify(data, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  private exportAsExcel(data: any): Blob {
    let csv = '';
    
    if (data.reportTitle) {
      // Financial report format
      csv += `${data.reportTitle}\n`;
      csv += `Date Range: ${data.fromDate || data.asOfDate} ${data.toDate ? `to ${data.toDate}` : ''}\n\n`;
      
      if (data.data) {
        // Trial Balance format
        csv += 'Ledger Name,GL Code,Opening Balance,Debit Amount,Credit Amount,Closing Balance\n';
        data.data.forEach((item: any) => {
          csv += `${item.ledgerName},${item.glCode},${item.openingBalance},${item.debitAmount},${item.creditAmount},${item.closingBalance}\n`;
        });
        csv += `\nTotal Debits:,${data.totalDebits}\nTotal Credits:,${data.totalCredits}\n`;
      } else if (data.revenues && data.expenses) {
        // P&L format
        csv += 'REVENUES\n';
        csv += 'Account Name,GL Code,Amount\n';
        data.revenues.forEach((item: any) => {
          csv += `${item.name},${item.glCode},${item.amount}\n`;
        });
        csv += `Total Revenue:,,${data.totalRevenue}\n\n`;
        
        csv += 'EXPENSES\n';
        csv += 'Account Name,GL Code,Amount\n';
        data.expenses.forEach((item: any) => {
          csv += `${item.name},${item.glCode},${item.amount}\n`;
        });
        csv += `Total Expenses:,,${data.totalExpenses}\n\n`;
        csv += `Net Profit:,,${data.netProfit}\n`;
        csv += `Profit Margin:,,${data.profitMargin}%\n`;
      } else if (data.assets) {
        // Balance Sheet format
        csv += 'ASSETS\n';
        csv += 'Account Name,GL Code,Balance\n';
        data.assets.forEach((item: any) => {
          csv += `${item.name},${item.glCode},${item.balance}\n`;
        });
        csv += `Total Assets:,,${data.totalAssets}\n\n`;
        
        csv += 'LIABILITIES\n';
        csv += 'Account Name,GL Code,Balance\n';
        data.liabilities.forEach((item: any) => {
          csv += `${item.name},${item.glCode},${item.balance}\n`;
        });
        csv += `Total Liabilities:,,${data.totalLiabilities}\n\n`;
        
        csv += 'EQUITY\n';
        csv += 'Account Name,GL Code,Balance\n';
        data.equity.forEach((item: any) => {
          csv += `${item.name},${item.glCode},${item.balance}\n`;
        });
        csv += `Total Equity:,,${data.totalEquity}\n`;
        csv += `Balance Check:,,${data.balanceCheck ? 'Balanced' : 'Unbalanced'}\n`;
      }
    } else {
      // Generic data format
      csv = this.convertToCSV(Array.isArray(data) ? data : [data]);
    }
    
    return new Blob([csv], { type: 'text/csv' });
  }

  private convertToCSV(data: any[]): string {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  }
}

export const tallyIntegration = new TallyIntegrationService();
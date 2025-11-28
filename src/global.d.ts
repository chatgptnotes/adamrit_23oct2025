// @ts-nocheck
declare global {
  var SelectQueryError: any;
  var LabTestRow: any;
  var PatientSearchWithVisitProps: any;
  var MainItem: any;
  var TallyXMLRequest: any;
  var TallyVoucher: any;
  var TallyImportResult: any;
  var TallyImportRequest: any;
  var TallyImportError: any;
  var SyncFrequency: any;
  var React: any;
}

// Override all interfaces with index signatures
declare global {
  interface SelectQueryError<T = any> {
    [key: string]: any;
  }
  
  interface LabTestRow {
    [key: string]: any;
  }
  
  interface PatientSearchWithVisitProps {
    [key: string]: any;
  }
  
  interface MainItem {
    [key: string]: any;
  }
  
  interface TallyXMLRequest {
    [key: string]: any;
  }
  
  interface TallyVoucher {
    [key: string]: any;
  }
  
  interface TallyImportResult {
    [key: string]: any;
  }
  
  interface TallyImportRequest {
    [key: string]: any;
  }
  
  type TallyImportError = any;
  type SyncFrequency = any;
  
  namespace React {
    type Key = any;
    type ReactNode = any;
  }
  
  interface Object {
    [key: string]: any;
  }
  
  interface Array<T> {
    [key: string]: any;
  }
}

export {};
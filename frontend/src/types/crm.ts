export type CRMStatus = 'GOOD_LEAD_FOLLOW_UP' | 'DID_NOT_CONNECT' | 'BAD_LEAD' | 'SALE_DONE' | '';
export type DataSource = 'leads_on_demand' | 'meridian_tower' | 'eden_park' | 'varah_swamy' | 'sarjapur_plots' | '';

export interface CRMRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: CRMStatus;
  crm_note: string;
  data_source: DataSource;
  possession_time: string;
  description: string;
}

export interface SkippedRecord {
  row: number;
  reason: string;
  data: Record<string, string>;
}

export interface ImportResult {
  success: boolean;
  total_rows: number;
  processed_rows: number;
  imported: number;
  skipped: number;
  truncated: boolean;
  records: CRMRecord[];
  skipped_records: SkippedRecord[];
}

export type Step = 1 | 2 | 3 | 4;

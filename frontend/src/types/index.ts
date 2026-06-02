export interface IOCItem {
  type: string;
  value: string;
}

export interface IOCData {
  network: IOCItem[];
  file: IOCItem[];
}

export interface IOCStats {
  total: number;
  network_total: number;
  file_total: number;
  by_type: Record<string, number>;
}

export interface Technique {
  technique_id: string;
  technique_name: string;
  tactic: string;
  tactic_id: string;
  confidence: 'High' | 'Medium' | 'Low';
  description: string;
  matched_keywords: string[];
  score?: number;
}

export interface DetectionRule {
  name: string;
  content: string;
}

export interface DetectionRules {
  sigma: DetectionRule[];
  yara: DetectionRule[];
  snort: DetectionRule[];
}

export interface RiskData {
  score: number;
  level: 'Low' | 'Medium' | 'High' | 'Critical';
  color: string;
  flags: string[];
  ioc_count: number;
  technique_count: number;
}

export interface ThreatOverview {
  main_threat: string;
  targeted_assets: string[];
  risk_level: string;
  threat_actor: string;
  tactics_observed: string[];
  top_techniques: string[];
  ioc_breakdown: {
    network: number;
    file: number;
  };
}

export interface SummaryData {
  executive_summary: string;
  threat_overview: ThreatOverview;
  recommendations: string[];
  generated_at: string;
  llm_enhanced: boolean;
  llm_provider?: string;
  llm_error?: string;
}

export interface AnalysisResult {
  analysis_id: string;
  title: string;
  iocs: IOCData;
  ioc_stats: IOCStats;
  techniques: Technique[];
  risk: RiskData;
  rules: DetectionRules;
  summary: SummaryData;
  created_at: string;
}

export interface AnalysisSummary {
  id: string;
  title: string;
  created_at: string;
  risk_level: string;
  risk_score: number;
  ioc_count: number;
  technique_count: number;
  rule_count: number;
}

export interface DashboardStats {
  total_analyses: number;
  total_iocs: number;
  total_techniques: number;
  total_rules: number;
  ioc_types: Array<{ type: string; count: number }>;
  tactic_counts: Array<{ tactic: string; count: number }>;
  recent_analyses: AnalysisSummary[];
  risk_distribution: Array<{ risk_level: string; count: number }>;
}

export interface AppSettings {
  llm_provider: string;
  openai_api_key: string;
  gemini_api_key: string;
  llm_model: string;
  max_ioc_results: string;
}

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

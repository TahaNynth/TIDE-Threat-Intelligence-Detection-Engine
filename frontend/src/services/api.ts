import axios from 'axios';
import type {
  AnalysisResult,
  AnalysisSummary,
  DashboardStats,
  AppSettings,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 120_000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.error ||
      err.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(msg));
  }
);

// ---------- Analysis ----------

export async function analyzeText(
  text: string,
  title?: string
): Promise<AnalysisResult> {
  const { data } = await api.post('/analyze', { text, title });
  return data;
}

export async function uploadFile(file: File): Promise<{ text: string; filename: string; char_count: number }> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function listAnalyses(): Promise<AnalysisSummary[]> {
  const { data } = await api.get('/analyses');
  return data;
}

export async function getAnalysis(id: string): Promise<AnalysisResult & { summary: any }> {
  const { data } = await api.get(`/analyses/${id}`);
  return data;
}

export async function deleteAnalysis(id: string): Promise<void> {
  await api.delete(`/analyses/${id}`);
}

// ---------- Stats ----------

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get('/stats');
  return data;
}

// ---------- IOCs ----------

export async function listIOCs(params: {
  analysis_id?: string;
  type?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const { data } = await api.get('/iocs', { params });
  return data;
}

// ---------- Techniques ----------

export async function listTechniques(params: {
  analysis_id?: string;
  tactic?: string;
  confidence?: string;
  search?: string;
}) {
  const { data } = await api.get('/techniques', { params });
  return data;
}

export async function listTactics() {
  const { data } = await api.get('/tactics');
  return data;
}

// ---------- Rules ----------

export async function listRules(params: {
  analysis_id?: string;
  rule_type?: string;
}) {
  const { data } = await api.get('/rules', { params });
  return data;
}

// ---------- Settings ----------

export async function getSettings(): Promise<AppSettings> {
  const { data } = await api.get('/settings');
  return data;
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<void> {
  await api.put('/settings', settings);
}

export async function testLLMConnection(): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post('/settings/test-llm');
  return data;
}

// ---------- Export ----------

export function exportIOCsCSVUrl(analysisId: string): string {
  return `/api/reports/${analysisId}/export/iocs`;
}

export function exportJSONUrl(analysisId: string): string {
  return `/api/reports/${analysisId}/export/json`;
}

// ---------- Health ----------

export async function healthCheck(): Promise<boolean> {
  try {
    await api.get('/health');
    return true;
  } catch {
    return false;
  }
}

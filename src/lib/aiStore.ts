import { AiFeedbackRow } from '@/lib/types';
import { getAppUserId, getSupabaseAdmin } from '@/lib/supabaseServer';

export async function listRecentAiFeedback(userId?: string, limit = 5): Promise<AiFeedbackRow[]> {
  const uid = userId || getAppUserId();
  if (!uid) return [];
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('ai_feedback')
    .select('user_id, query, ai_suggestion, user_explanation, timestamp')
    .eq('user_id', uid)
    .order('timestamp', { ascending: false })
    .limit(limit);
  if (error) {
    throw new Error(error.message);
  }
  return (data || []) as AiFeedbackRow[];
}

export async function insertAiFeedback(row: {
  user_id: string;
  query: string;
  ai_suggestion: string;
  user_explanation: string;
  timestamp: string;
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('ai_feedback')
    .insert(row)
    .select('user_id, query, ai_suggestion, user_explanation, timestamp')
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function insertAuditTrail(row: {
  user_id: string;
  timestamp: string;
  action: 'Chat' | 'Auto-Stash';
  suggestion: string;
  user_decision: string;
  confidence: number;
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('ai_audit_trail').insert(row);
  if (error) {
    throw new Error(error.message);
  }
}

export async function listAuditTrailForWeek(userId?: string) {
  const uid = userId || getAppUserId();
  if (!uid) return [];
  const supabase = getSupabaseAdmin();
  const weekAgoIso = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString();
  const { data, error } = await supabase
    .from('ai_audit_trail')
    .select('timestamp, action, suggestion, user_decision, confidence')
    .eq('user_id', uid)
    .gte('timestamp', weekAgoIso)
    .order('timestamp', { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return data || [];
}

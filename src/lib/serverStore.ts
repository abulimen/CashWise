import { AiFeedbackRow } from '@/lib/types';

export interface EncryptedCacheRow {
  user_id: string;
  encrypted_blob: string;
  wrapped_dek: string;
  iv: string;
  last_fetched_at: string;
  updated_at: string;
}

export interface AuditTrailRow {
  user_id: string;
  timestamp: string;
  action: 'Chat' | 'Auto-Stash';
  suggestion: string;
  user_decision: string;
  confidence: number;
}

const encryptedCacheTable = new Map<string, EncryptedCacheRow>();
const aiFeedbackTable = new Map<string, AiFeedbackRow[]>();
const auditTrailTable = new Map<string, AuditTrailRow[]>();

export function upsertEncryptedCache(row: EncryptedCacheRow): EncryptedCacheRow {
  encryptedCacheTable.set(row.user_id, row);
  return row;
}

export function getEncryptedCache(userId: string): EncryptedCacheRow | null {
  return encryptedCacheTable.get(userId) || null;
}

export function insertAiFeedback(row: AiFeedbackRow): AiFeedbackRow {
  const rows = aiFeedbackTable.get(row.user_id) || [];
  rows.unshift(row);
  aiFeedbackTable.set(row.user_id, rows.slice(0, 20));
  return row;
}

export function listRecentAiFeedback(userId: string, limit = 5): AiFeedbackRow[] {
  return (aiFeedbackTable.get(userId) || []).slice(0, limit);
}

export function insertAuditTrail(row: AuditTrailRow): AuditTrailRow {
  const rows = auditTrailTable.get(row.user_id) || [];
  rows.unshift(row);
  auditTrailTable.set(row.user_id, rows.slice(0, 200));
  return row;
}

export function listAuditTrailForWeek(userId: string): AuditTrailRow[] {
  const rows = auditTrailTable.get(userId) || [];
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  return rows.filter((row) => new Date(row.timestamp).getTime() >= weekAgo);
}

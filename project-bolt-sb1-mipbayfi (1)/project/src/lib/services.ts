import { supabase } from './supabase';
import type { Report, NotificationItem } from './types';

export async function logAudit(action: string, entity_type = '', entity_id = '', metadata: Record<string, unknown> = {}) {
  try {
    await supabase.from('audit_logs').insert({
      action, entity_type, entity_id, metadata,
      device: navigator.userAgent.slice(0, 120),
    });
  } catch { /* best-effort */ }
}

export async function notifyUser(userId: string, type: string, title: string, body: string, reportId: string | null = null) {
  await supabase.from('notifications').insert({
    user_id: userId, type, title, body, report_id: reportId,
  } as Partial<NotificationItem>);
}

export async function fetchReportsForUser(userId: string): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Report[];
}

export async function fetchAllReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports').select('*, reporter:profiles!reports_user_id_fkey(id,full_name,email,avatar_url)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Report[];
}

export async function fetchVerifiedPublicReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports').select('*').in('status', ['approved', 'maintenance_assigned', 'in_progress', 'completed'])
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Report[];
}

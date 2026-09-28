import { supabase } from './supabase';
import type { Report, NotificationItem, AuthorityComplaint } from './types';

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

export async function getAppSettings(): Promise<{ daily_report_limit: number }> {
  const { data, error } = await supabase.rpc('get_app_settings');
  if (error) throw error;
  return data as { daily_report_limit: number };
}

export async function updateDailyReportLimit(newLimit: number): Promise<void> {
  const { error } = await supabase.rpc('update_daily_report_limit', { new_limit: newLimit });
  if (error) throw error;
}

export async function countReportsToday(userId: string): Promise<number> {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from('reports').select('*', { count: 'exact', head: true })
    .eq('user_id', userId).gte('created_at', start.toISOString());
  if (error) throw error;
  return count ?? 0;
}

export async function adminDeleteUser(userId: string): Promise<void> {
  // 1. Delete the user's uploaded images from storage (can't be done from DB)
  try {
    const { data: files } = await supabase.storage.from('reports').list(userId);
    if (files && files.length > 0) {
      const paths = files.map((f) => `${userId}/${f.name}`);
      await supabase.storage.from('reports').remove(paths);
    }
  } catch { /* best-effort — don't block deletion if storage cleanup fails */ }

  // 2. Delete all DB rows + auth account via the SECURITY DEFINER function
  const { error } = await supabase.rpc('admin_delete_user', { p_user_id: userId });
  if (error) throw error;
}

export async function adminCreateUser(email: string, fullName: string, password: string): Promise<string> {
  const { data, error } = await supabase.rpc('admin_create_user', {
    p_email: email, p_full_name: fullName, p_password: password,
  });
  if (error) throw error;
  return data as string;
}

export const BBMP_AUTHORITY = {
  name: 'BBMP — Bruhat Bengaluru Mahanagara Palike',
  email: 'comm@bbmp.gov.in',
  phone: '080-22660000',
  helpline: '1533',
  website: 'https://site.bbmp.gov.in',
  address: 'Hudson Circle, Bengaluru, Karnataka 560002, India',
};

export async function fetchComplaints(): Promise<AuthorityComplaint[]> {
  const { data, error } = await supabase
    .from('authority_complaints')
    .select('*, report:reports!authority_complaints_report_id_fkey(id,damage_type,severity,image_url)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AuthorityComplaint[];
}

export async function createComplaint(c: Partial<AuthorityComplaint>): Promise<AuthorityComplaint> {
  const { data, error } = await supabase
    .from('authority_complaints')
    .insert(c)
    .select('*')
    .single();
  if (error) throw error;
  return data as AuthorityComplaint;
}

export async function updateComplaint(id: string, patch: Partial<AuthorityComplaint>): Promise<void> {
  const { error } = await supabase.from('authority_complaints').update(patch).eq('id', id);
  if (error) throw error;
}

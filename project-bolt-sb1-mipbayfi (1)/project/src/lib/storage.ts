import { supabase } from './supabase';

export async function uploadReportImage(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('reports').upload(path, file, {
    cacheControl: '3600', upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('reports').getPublicUrl(path);
  return data.publicUrl;
}

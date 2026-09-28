let ran = false;

export async function ensureAdminAccount(): Promise<void> {
  if (ran) return;
  ran = true;
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email: 'admin@roadguard', password: 'admin@2026', fullName: 'RoadGuard Admin' }),
    });
    const json = await res.json();
    console.log('[RoadGuard] Admin setup:', json);
  } catch (e) {
    console.warn('[RoadGuard] Admin setup skipped:', e);
  }
}

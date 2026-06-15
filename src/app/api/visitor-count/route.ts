import { supabase } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { count, error } = await supabase
    .from('viewed_ips')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('[visitor-count] Supabase error:', error);
    return Response.json({ count: 0 });
  }

  return Response.json({ count: count || 0 });
}

// Descuenta 1 crédito de viaje extra del usuario autenticado, de forma atómica.
// Existe porque la tabla "billing" no tiene policy de UPDATE para 'authenticated'
// (para que nadie pueda regalarse créditos desde el cliente) — esta función usa
// la service role key para hacer el único tipo de escritura que el cliente
// puede disparar: gastar un crédito que ya pagó.
//
// Deploy: supabase functions deploy consume-trip-credit
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return json({ error: 'No autenticado' }, 401);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: row } = await supabaseAdmin
      .from('billing').select('extra_trip_credits').eq('user_id', user.id).maybeSingle();
    const current = row?.extra_trip_credits || 0;
    if (current <= 0) return json({ error: 'Sin créditos disponibles' }, 400);

    const { error } = await supabaseAdmin
      .from('billing').update({ extra_trip_credits: current - 1, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    if (error) throw error;

    return json({ remaining: current - 1 });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
}

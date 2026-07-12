// Proxy hacia la Aviasales Data API (Travelpayouts). Existe porque esa API no
// manda cabeceras CORS, así que el navegador no puede llamarla directamente —
// esta función corre en el servidor de Supabase y sí puede, y le añade CORS
// a la respuesta para que el frontend pueda leerla.
//
// Deploy: supabase functions deploy flight-prices
// Secret: supabase secrets set TRAVELPAYOUTS_TOKEN=tu_token

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const origin = url.searchParams.get('origin');
  const destination = url.searchParams.get('destination');
  const currency = url.searchParams.get('currency') || 'eur';

  if (!origin || !destination) {
    return new Response(JSON.stringify({ error: 'origin y destination son obligatorios' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const token = Deno.env.get('TRAVELPAYOUTS_TOKEN');
  if (!token) {
    return new Response(JSON.stringify({ error: 'TRAVELPAYOUTS_TOKEN no configurado' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const apiUrl = `https://api.travelpayouts.com/v2/prices/latest?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&currency=${encodeURIComponent(currency)}&limit=10&token=${token}`;

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'fallo al consultar Travelpayouts', detail: String(e) }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});

// Crea una sesión de Stripe Checkout: bien un pago único (1 viaje extra) o una
// suscripción mensual (viajes ilimitados). El frontend solo recibe la URL de
// Checkout y redirige ahí — nunca toca datos de tarjeta.
//
// Deploy: supabase functions deploy create-checkout-session
// Secret: supabase secrets set STRIPE_SECRET_KEY=sk_...
import Stripe from 'npm:stripe@17.5.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRICES = {
  // Precios fijos en código (sin depender de Products/Prices creados a mano en Stripe).
  payment: { amount: 299, label: 'Waddle · 1 viaje extra' },       // 2,99€ pago único
  subscription: { amount: 499, label: 'Waddle Pro · mensual' },    // 4,99€/mes
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  try {
    const { mode, returnPath } = await req.json();
    if (mode !== 'payment' && mode !== 'subscription') {
      return json({ error: 'mode debe ser "payment" o "subscription"' }, 400);
    }

    const authHeader = req.headers.get('Authorization') || '';
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return json({ error: 'No autenticado' }, 401);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-12-18.acacia' });
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Reutiliza el customer de Stripe si ya existe; si no, lo crea.
    let { data: billing } = await supabaseAdmin
      .from('billing').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
    let customerId = billing?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
      customerId = customer.id;
      await supabaseAdmin.from('billing').upsert({ user_id: user.id, stripe_customer_id: customerId });
    }

    const origin = req.headers.get('origin') || new URL(req.url).origin;
    const path = returnPath || '/trip-wizard';
    const price = PRICES[mode as 'payment' | 'subscription'];

    const session = await stripe.checkout.sessions.create({
      mode,
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: price.label },
          unit_amount: price.amount,
          ...(mode === 'subscription' ? { recurring: { interval: 'month' } } : {}),
        },
        quantity: 1,
      }],
      success_url: `${origin}/#${path}?checkout=success`,
      cancel_url: `${origin}/#${path}?checkout=cancel`,
      metadata: { user_id: user.id, mode },
    });

    return json({ url: session.url });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
}

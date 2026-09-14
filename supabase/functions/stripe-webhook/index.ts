// Escucha los eventos de Stripe y actualiza la tabla "billing" con service role
// (salta RLS: es la ÚNICA vía por la que ese estado se escribe). Verifica la
// firma de Stripe para asegurarse de que la petición viene realmente de Stripe.
//
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
// (--no-verify-jwt: Stripe no manda un JWT de Supabase, la seguridad la da la
// firma de Stripe que se verifica más abajo)
// Secrets: supabase secrets set STRIPE_SECRET_KEY=sk_... STRIPE_WEBHOOK_SECRET=whsec_...
// Configura el endpoint en Stripe → Developers → Webhooks, apuntando a la URL
// de esta función, y copia el "Signing secret" (whsec_...) al secreto de arriba.
import Stripe from 'npm:stripe@17.5.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-12-18.acacia' });
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body, signature!, Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (e) {
    console.error('Firma de Stripe inválida:', e);
    return new Response('firma inválida', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id || session.client_reference_id;
        if (userId && session.mode === 'payment') {
          // Pago único → suma 1 viaje extra al contador de créditos.
          const { data: cur } = await supabaseAdmin
            .from('billing').select('extra_trip_credits').eq('user_id', userId).maybeSingle();
          await supabaseAdmin.from('billing').upsert({
            user_id: userId,
            extra_trip_credits: (cur?.extra_trip_credits || 0) + 1,
            updated_at: new Date().toISOString(),
          });
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id || (await findUserByCustomer(sub.customer as string));
        if (userId) {
          await supabaseAdmin.from('billing').upsert({
            user_id: userId,
            stripe_customer_id: sub.customer as string,
            stripe_subscription_id: sub.id,
            subscription_status: sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id || (await findUserByCustomer(sub.customer as string));
        if (userId) {
          await supabaseAdmin.from('billing').update({
            subscription_status: 'canceled',
            updated_at: new Date().toISOString(),
          }).eq('user_id', userId);
        }
        break;
      }
    }
    return new Response('ok', { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(String(e), { status: 500 });
  }
});

async function findUserByCustomer(customerId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('billing').select('user_id').eq('stripe_customer_id', customerId).maybeSingle();
  return data?.user_id || null;
}

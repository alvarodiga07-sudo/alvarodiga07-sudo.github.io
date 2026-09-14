// Modelo freemium: 1 viaje gratis al mes por usuario. Al superarlo, se puede
// pagar ese viaje suelto o suscribirse (viajes ilimitados). En modo local
// (sin Supabase) no hay límite: es solo una demo sin cuentas reales.
import { supabase } from '@/lib/supabaseClient';
import { isSupabaseEnabled } from '@/lib/supabaseConfig';

export const FREE_TRIPS_PER_MONTH = 1;

export async function getBillingStatus() {
  if (!isSupabaseEnabled) return { subscriptionActive: false, extraCredits: 0, hasBilling: false };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { subscriptionActive: false, extraCredits: 0, hasBilling: false };
  const { data } = await supabase.from('billing').select('*').eq('user_id', user.id).maybeSingle();
  const notExpired = !data?.current_period_end || new Date(data.current_period_end).getTime() > Date.now();
  const subscriptionActive = data?.subscription_status === 'active' && notExpired;
  return {
    subscriptionActive,
    extraCredits: data?.extra_trip_credits || 0,
    hasBilling: !!data?.stripe_customer_id,
  };
}

export async function getTripsThisMonth() {
  if (!isSupabaseEnabled) return 0;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_date', startOfMonth.toISOString());
  return count || 0;
}

// Comprueba si el usuario puede crear un viaje más ahora mismo, y por qué vía.
export async function canCreateTrip() {
  if (!isSupabaseEnabled) return { allowed: true, reason: 'local' };
  const [{ subscriptionActive, extraCredits }, tripsThisMonth] = await Promise.all([
    getBillingStatus(),
    getTripsThisMonth(),
  ]);
  if (subscriptionActive) return { allowed: true, reason: 'subscription' };
  if (tripsThisMonth < FREE_TRIPS_PER_MONTH) return { allowed: true, reason: 'free' };
  if (extraCredits > 0) return { allowed: true, reason: 'credit' };
  return { allowed: false, reason: 'limit' };
}

// Gasta 1 crédito de viaje extra (llamar SOLO tras crear el viaje con reason==='credit').
export async function consumeTripCredit() {
  const { error } = await supabase.functions.invoke('consume-trip-credit');
  if (error) throw error;
}

// Redirige a Stripe Checkout. mode: 'payment' (viaje suelto) | 'subscription' (Pro mensual).
export async function startCheckout(mode, returnPath = '/trip-wizard') {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { mode, returnPath },
  });
  if (error) throw error;
  if (data?.url) window.location.href = data.url;
}

// Abre el portal de Stripe para gestionar o cancelar la suscripción.
export async function openBillingPortal() {
  const { data, error } = await supabase.functions.invoke('billing-portal');
  if (error) throw error;
  if (data?.url) window.location.href = data.url;
}

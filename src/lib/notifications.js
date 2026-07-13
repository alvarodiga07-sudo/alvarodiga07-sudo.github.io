// Notificaciones locales: no dependen de ningún backend ni de crear entidades
// Notification — se derivan al vuelo a partir de los viajes que ya existen en
// local/nube. El estado de "leído" se guarda aparte en localStorage porque
// estas notificaciones no son filas persistidas, se recalculan cada vez.
import { differenceInCalendarDays, isPast, isToday } from 'date-fns';

const READ_KEY = 'waddle_read_notifications';

function getReadIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveReadIds(ids) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

export function markNotificationRead(id) {
  const ids = getReadIds();
  ids.add(id);
  saveReadIds(ids);
}

export function markAllNotificationsRead(notifications) {
  const ids = getReadIds();
  notifications.forEach((n) => ids.add(n.id));
  saveReadIds(ids);
}

function parseLocalDate(dateStr) {
  // Los viajes guardan fechas como 'YYYY-MM-DD'; sin hora, new Date() las
  // interpreta en UTC y puede "perder" un día según el huso horario local.
  return new Date(`${dateStr}T12:00`);
}

function destinationLabel(trip, t = (s) => s) {
  return trip.destination_city || trip.title || t('tu destino');
}

/**
 * Deriva notificaciones a partir de los viajes del usuario. `t` es opcional
 * (la función de traducción de useT) para que los textos salgan en el idioma activo.
 */
export function computeLocalNotifications(trips = [], t = (s) => s) {
  const now = new Date();
  const out = [];

  for (const trip of trips) {
    if (!trip.id) continue;
    const dest = destinationLabel(trip, t);
    const start = trip.start_date ? parseLocalDate(trip.start_date) : null;
    const end = trip.end_date ? parseLocalDate(trip.end_date) : null;

    if (start && trip.status !== 'completed') {
      const daysUntil = differenceInCalendarDays(start, now);
      if (daysUntil === 0) {
        out.push({
          id: `start-today-${trip.id}`,
          type: 'trip_reminder',
          title: `${t('¡Tu viaje a')} ${dest} ${t('empieza hoy!')}`,
          message: t('Buen viaje 🦆'),
          trip_id: trip.id,
          sortDate: start,
        });
      } else if (daysUntil > 0 && daysUntil <= 7) {
        out.push({
          id: `start-soon-${trip.id}-${daysUntil}`,
          type: 'trip_reminder',
          title: `${t('Tu viaje a')} ${dest} ${daysUntil === 1 ? t('empieza mañana') : `${t('empieza en')} ${daysUntil} ${t('días')}`}`,
          message: t('Revisa tu itinerario y prepara la maleta'),
          trip_id: trip.id,
          sortDate: start,
        });
      }

      if (!trip.flight_info?.out_flight && daysUntil >= 0 && daysUntil <= 3) {
        out.push({
          id: `ticket-${trip.id}`,
          type: 'trip_reminder',
          title: `${t('Añade los datos de tu vuelo a')} ${dest}`,
          message: t('Así ajustamos mejor tu itinerario'),
          trip_id: trip.id,
          sortDate: start,
        });
      }
    }

    if (end && trip.status === 'active' && isPast(end) && !isToday(end)) {
      out.push({
        id: `mark-completed-${trip.id}`,
        type: 'trip_reminder',
        title: `${t('¿Cómo fue tu viaje a')} ${dest}?`,
        message: t('Márcalo como completado para conseguir tu sello'),
        trip_id: trip.id,
        sortDate: end,
      });
    }
  }

  const readIds = getReadIds();
  return out
    .map((n) => ({ ...n, is_read: readIds.has(n.id) }))
    .sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));
}

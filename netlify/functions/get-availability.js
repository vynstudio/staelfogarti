// Returns Stael's available time slots from Google Calendar
// Checks her calendar for busy times and returns free slots
//
// Netlify env vars needed:
//   GOOGLE_SERVICE_ACCOUNT_JSON — service account key JSON
//   GOOGLE_IMPERSONATE          — hello@staelfogarty.com
//   AVAILABILITY_DAYS_AHEAD     — how many days to show (default 14)

const { google } = require('googleapis');

const WORK_HOURS = { start: 8, end: 20 }; // 8am - 8pm ET
const SLOT_DURATION = 60; // minutes
const TIME_SLOTS = ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM'];
const TIMEZONE = 'America/New_York';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const daysAhead = parseInt(process.env.AVAILABILITY_DAYS_AHEAD || '14');
    const calendarId = process.env.GOOGLE_IMPERSONATE || 'hello@staelfogarty.com';

    // If no Google creds, return mock availability
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ availability: getMockAvailability(daysAhead), source: 'mock' }),
      };
    }

    // Auth — JWT with domain-wide delegation impersonation
    const saKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const auth = new google.auth.JWT({
      email: saKey.client_email,
      key: saKey.private_key,
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      subject: calendarId,
    });
    await auth.authorize();

    const calendar = google.calendar({ version: 'v3', auth });

    // Get busy times for next N days
    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000).toISOString();

    const freebusyRes = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        timeZone: TIMEZONE,
        items: [{ id: calendarId }],
      },
    });

    const busySlots = freebusyRes.data.calendars[calendarId]?.busy || [];

    // Build availability for each day
    const availability = {};
    let d = new Date(now);
    d.setDate(d.getDate() + 1); // start tomorrow

    for (let i = 0; i < daysAhead; i++) {
      // Skip Sundays
      if (d.getDay() === 0) { d.setDate(d.getDate() + 1); continue; } // Skip Sundays only

      const dateKey = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: TIMEZONE });

      const freeSlots = TIME_SLOTS.filter(slot => {
        const slotStart = toUTC(dateKey, slot, TIMEZONE);
        const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION * 60000);

        // Check if this slot overlaps with any busy period
        return !busySlots.some(busy => {
          const busyStart = new Date(busy.start);
          const busyEnd = new Date(busy.end);
          return slotStart < busyEnd && slotEnd > busyStart;
        });
      });

      if (freeSlots.length > 0) {
        availability[dateKey] = { label: dayLabel, slots: freeSlots };
      }

      d.setDate(d.getDate() + 1);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ availability, source: 'google' }),
    };

  } catch (err) {
    console.error('Availability error:', err.message);
    // Fall back to mock on error
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ availability: getMockAvailability(14), source: 'fallback', error: err.message }),
    };
  }
};

function toUTC(dateKey, timeStr, tz) {
  // Parse "9:00 AM" style time
  const [time, ampm] = timeStr.split(' ');
  let [hours, mins] = time.split(':').map(Number);
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  // Create date in ET by using Intl
  const dt = new Date(`${dateKey}T${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:00`);
  // Offset for ET (EST = UTC-5, EDT = UTC-4)
  const etOffset = getETOffset(dt);
  return new Date(dt.getTime() + etOffset * 60000);
}

function getETOffset(date) {
  // Approximate DST: second Sunday in March to first Sunday in November
  const year = date.getFullYear();
  const dstStart = getNthSundayOfMonth(year, 2, 2); // March
  const dstEnd = getNthSundayOfMonth(year, 10, 1);  // November
  return date >= dstStart && date < dstEnd ? -240 : -300; // EDT = -240, EST = -300
}

function getNthSundayOfMonth(year, month, n) {
  const d = new Date(year, month - 1, 1);
  let count = 0;
  while (true) {
    if (d.getDay() === 0) { count++; if (count === n) return d; }
    d.setDate(d.getDate() + 1);
  }
}

function getMockAvailability(daysAhead) {
  const availability = {};
  let d = new Date();
  d.setDate(d.getDate() + 1);
  let count = 0;

  while (count < daysAhead) {
    if (d.getDay() !== 0) { // Mon-Sat
      const dateKey = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      availability[dateKey] = { label: dayLabel, slots: TIME_SLOTS };
      count++;
    }
    d.setDate(d.getDate() + 1);
  }
  return availability;
}

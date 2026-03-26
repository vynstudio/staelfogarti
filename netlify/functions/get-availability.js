// Returns available time slots based on Stael's weekly schedule
// No Google Calendar API needed — uses fixed weekly availability
// To update availability, change WEEKLY_SCHEDULE below

const WEEKLY_SCHEDULE = {
  // 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
  // Set to [] to mark a day as unavailable
  1: ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM'],
  2: ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM'],
  3: ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM'],
  4: ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM'],
  5: ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM'],
  6: ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM'],
};

const DAYS_AHEAD = 14;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const availability = {};
  const now = new Date();
  let d = new Date(now);
  d.setDate(d.getDate() + 1); // start tomorrow
  d.setHours(0, 0, 0, 0);

  let count = 0;
  while (count < DAYS_AHEAD) {
    const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon...6=Sat
    const slots = WEEKLY_SCHEDULE[dayOfWeek];

    if (slots && slots.length > 0) {
      const dateKey = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        timeZone: 'America/New_York'
      });
      availability[dateKey] = { label: dayLabel, slots };
      count++;
    }

    d.setDate(d.getDate() + 1);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ availability, source: 'schedule' }),
  };
};

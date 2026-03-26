// On every confirmed booking:
// 1. Creates a Google Calendar event with Google Meet link (virtual services)
// 2. Sends confirmation emails via Resend (Gmail API as fallback)
// 3. Notifies Vyn Studio with commission amount
//
// Netlify env vars needed:
//   GOOGLE_SERVICE_ACCOUNT_JSON — service account key JSON
//   GOOGLE_IMPERSONATE          — hello@staelfogarty.com
//   STAEL_EMAIL                 — hello@staelfogarty.com
//   RESEND_API_KEY              — for email delivery
//   VYN_EMAIL                   — hello@vyn.studio

const { google } = require('googleapis');
const { Resend } = require('resend');

const VIRTUAL_SERVICES = ['Remote Interpretation', '1/1 Private Lessons', 'Citizenship Test Preparation', 'Immigration Services'];
const STAEL_EMAIL = process.env.STAEL_EMAIL || 'hello@staelfogarty.com';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const data = JSON.parse(event.body);
    const { service, price, date, time, fname, lname, email, notes, sessionId } = data;
    const clientName = `${fname} ${lname}`.trim();
    const isVirtual = VIRTUAL_SERVICES.includes(service);

    let meetLink = null;
    let calendarEventLink = null;

    // ── Google Auth (Service Account with domain-wide delegation) ──
    let googleAuth = null;
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      try {
        const saKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        const impersonate = process.env.GOOGLE_IMPERSONATE || STAEL_EMAIL;
        // Use JWT for impersonation — required for domain-wide delegation
        googleAuth = new google.auth.JWT({
          email: saKey.client_email,
          key: saKey.private_key,
          scopes: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/gmail.send',
          ],
          subject: impersonate,
        });
        googleAuth.projectId = saKey.project_id;
        await googleAuth.authorize();
        console.log('✓ Google auth OK — impersonating', impersonate);
      } catch (e) {
        console.error('Google auth error:', e.message);
        googleAuth = null;
      }
    }

    // ── Create Google Calendar event with Meet link ──
    if (googleAuth) {
      try {
        const calendar = google.calendar({ version: 'v3', auth: googleAuth });
        const startISO = parseDateTime(date, time);
        const duration = service === 'Language Coaching' ? 60 : 90;
        const endISO = new Date(new Date(startISO).getTime() + duration * 60000).toISOString();

        const eventBody = {
          summary: `${service} — ${clientName}`,
          description: [
            `Service: ${service}`,
            `Price: $${price}`,
            notes ? `Notes: ${notes}` : '',
            `Stripe: ${sessionId || 'N/A'}`,
            `staelfogarty.com`,
          ].filter(Boolean).join('\n'),
          start: { dateTime: startISO, timeZone: 'America/New_York' },
          end: { dateTime: endISO, timeZone: 'America/New_York' },
          attendees: [
            { email: STAEL_EMAIL, displayName: 'Stael Gissoni', organizer: true },
            { email, displayName: clientName },
          ],
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 },
              { method: 'popup', minutes: 30 },
            ],
          },
          sendUpdates: 'all',
        };

        // Add Google Meet for virtual services
        if (isVirtual) {
          eventBody.conferenceData = {
            createRequest: {
              requestId: `stael-${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          };
        }

        const calEvent = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: eventBody,
          conferenceDataVersion: isVirtual ? 1 : 0,
          sendUpdates: 'all',
        });

        calendarEventLink = calEvent.data.htmlLink;

        // Extract Meet link
        if (isVirtual && calEvent.data.conferenceData) {
          const ep = calEvent.data.conferenceData.entryPoints?.find(e => e.entryPointType === 'video');
          if (ep) meetLink = ep.uri;
        }

        console.log(`✓ Calendar event created${meetLink ? ' with Meet link: ' + meetLink : ''}`);
      } catch (e) {
        console.error('Google Calendar error:', e.message);
      }
    }

    // ── Build email content ──
    const meetSection = meetLink
      ? `\nGoogle Meet link: ${meetLink}\n`
      : isVirtual ? '\nGoogle Meet link: Stael will send this before your session.\n' : '';

    const staelBody = `Hi Stael,\n\nNew booking confirmed!\n\nSERVICE: ${service}\nCLIENT: ${clientName}\nEMAIL: ${email}\nDATE: ${date}\nTIME: ${time} ET\nPRICE: $${price}${meetSection}\nNOTES: ${notes || 'None'}\nSTRIPE: ${sessionId || 'N/A'}\n${calendarEventLink ? '\nCalendar: ' + calendarEventLink : ''}\n\n— staelfogarty.com`;

    const clientBody = `Hi ${fname},\n\nYour session with Stael is confirmed!\n\nSERVICE: ${service}\nDATE: ${date}\nTIME: ${time} ET\nPRICE: $${price}${meetSection}\n${isVirtual && meetLink ? 'Click the Google Meet link above to join at the scheduled time.' : isVirtual ? 'Stael will send your Google Meet link before the session.' : 'Stael will meet you in person and confirm the location details.'}\n\nCANCELLATION: Free cancellation up to 24 hours before your session.\nContact: hello@staelfogarty.com\n\nThank you for choosing Stael Gissoni!\n\n— staelfogarty.com`;

    const vynBody = `New booking on staelfogarty.com!\n\nSERVICE: ${service}\nCLIENT: ${clientName}\nEMAIL: ${email}\nDATE: ${date}\nTIME: ${time} ET\nPRICE: $${price}\nCOMMISSION (20%): $${Math.round(price * 0.20 * 100) / 100}${meetSection}\nNOTES: ${notes || 'None'}\nSTRIPE: ${sessionId || 'N/A'}\n${calendarEventLink ? '\nCalendar: ' + calendarEventLink : ''}\n\n— staelfogarty.com`;

    // ── Send emails via Resend ──
    let emailsSent = false;
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const vynEmail = process.env.VYN_EMAIL || 'hello@vyn.studio';

        await resend.emails.send({ from: `Stael Gissoni <noreply@staelfogarty.com>`, to: STAEL_EMAIL, subject: `New Booking: ${service} — ${clientName}`, text: staelBody });
        await resend.emails.send({ from: `Stael Gissoni <noreply@staelfogarty.com>`, to: email, subject: `Your session is confirmed — ${service} with Stael Gissoni`, text: clientBody });
        await resend.emails.send({ from: `Stael Gissoni Site <noreply@staelfogarty.com>`, to: vynEmail, subject: `💰 New Booking: ${service} — ${clientName} — $${price}`, text: vynBody });

        emailsSent = true;
        console.log('✓ Emails sent via Resend');
      } catch (e) {
        console.error('Email error:', e.message);
      }
    }

    // Fallback Google Calendar link for success page button
    const gcalLink = buildGCalLink({ service, clientName, date, time, meetLink, isVirtual });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, meetLink, calendarEventLink, gcalLink, emailsSent, isVirtual }),
    };

  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

function parseDateTime(dateStr, timeStr) {
  try {
    const year = new Date().getFullYear();
    const clean = dateStr.replace(/^[A-Za-z]+,\s*/, '');
    const d = new Date(`${clean} ${year} ${timeStr}`);
    if (!isNaN(d)) return d.toISOString();
  } catch (e) {}
  return new Date().toISOString();
}

function buildGCalLink({ service, clientName, date, time, meetLink, isVirtual }) {
  try {
    const year = new Date().getFullYear();
    const start = new Date(`${date.replace(/^[A-Za-z]+,\s*/, '')} ${year} ${time}`);
    const end = new Date(start.getTime() + 60 * 60000);
    const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const title = encodeURIComponent(`${service} — Stael Gissoni`);
    const details = encodeURIComponent([
      meetLink ? `Google Meet: ${meetLink}` : isVirtual ? 'Meet link to be sent by Stael' : 'In-person session',
      'hello@staelfogarty.com | staelfogarty.com',
    ].join('\n'));
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}`;
  } catch (e) { return 'https://calendar.google.com'; }
}

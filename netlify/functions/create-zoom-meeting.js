// On every confirmed booking:
// 1. Creates a Zoom meeting (virtual services only)
// 2. Creates a Google Calendar event on Stael's calendar with attendees
// 3. Sends confirmation emails via Gmail API
//
// Netlify env vars needed:
//   ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET — Zoom Server-to-Server OAuth
//   ZOOM_USER_ID        — Stael's Zoom email (e.g. hello@staelfogarty.com)
//   GOOGLE_SERVICE_ACCOUNT_JSON — full JSON key file content (paste as one-line JSON string)
//   GOOGLE_IMPERSONATE  — Stael's Google Workspace email (e.g. hello@staelfogarty.com)
//   STAEL_EMAIL         — hello@staelfogarty.com

const { google } = require('googleapis');
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const VIRTUAL_SERVICES = ['Virtual Session', 'Language Coaching'];
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

    let zoomLink = null;
    let zoomMeetingId = null;
    let calendarEventLink = null;

    // ── Step 1: Create Zoom meeting (virtual only) ──
    if (isVirtual && process.env.ZOOM_ACCOUNT_ID) {
      try {
        const tokenRes = await fetch(
          `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
          {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + Buffer.from(
                `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
              ).toString('base64'),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );
        const { access_token } = await tokenRes.json();
        const startTime = parseDateTime(date, time);
        const duration = service === 'Language Coaching' ? 60 : 90;

        const meetingRes = await fetch(
          `https://api.zoom.us/v2/users/${process.env.ZOOM_USER_ID || 'me'}/meetings`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              topic: `${service} — ${clientName}`,
              type: 2,
              start_time: startTime,
              duration,
              timezone: 'America/New_York',
              agenda: `${service} with ${clientName}${notes ? '. Notes: ' + notes : ''}`,
              settings: {
                host_video: true,
                participant_video: true,
                waiting_room: true,
                join_before_host: false,
              },
            }),
          }
        );
        const meeting = await meetingRes.json();
        if (meeting.join_url) {
          zoomLink = meeting.join_url;
          zoomMeetingId = meeting.id;
          console.log('✓ Zoom meeting created:', zoomMeetingId);
        } else {
          console.error('Zoom error:', JSON.stringify(meeting));
        }
      } catch (e) {
        console.error('Zoom API error:', e.message);
      }
    }

    // ── Step 2: Google Auth (Service Account) ──
    let googleAuth = null;
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      try {
        const saKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        googleAuth = new google.auth.GoogleAuth({
          credentials: saKey,
          scopes: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/gmail.send',
          ],
          clientOptions: {
            subject: process.env.GOOGLE_IMPERSONATE || STAEL_EMAIL,
          },
        });
      } catch (e) {
        console.error('Google auth error:', e.message);
      }
    }

    // ── Step 3: Create Google Calendar event ──
    if (googleAuth) {
      try {
        const calendar = google.calendar({ version: 'v3', auth: googleAuth });
        const startISO = parseDateTime(date, time);
        const endISO = new Date(new Date(startISO).getTime() + 90 * 60000).toISOString();

        const eventBody = {
          summary: `${service} — ${clientName}`,
          description: [
            isVirtual && zoomLink ? `Zoom: ${zoomLink}` : isVirtual ? 'Zoom link to be added' : 'In-person session',
            `Service: ${service}`,
            `Price: $${price}`,
            notes ? `Notes: ${notes}` : '',
            `Stripe: ${sessionId || 'N/A'}`,
          ].filter(Boolean).join('\n'),
          start: { dateTime: startISO, timeZone: 'America/New_York' },
          end:   { dateTime: endISO,   timeZone: 'America/New_York' },
          attendees: [
            { email: STAEL_EMAIL, displayName: 'Stael Gissoni', organizer: true },
            { email, displayName: clientName },
          ],
          ...(zoomLink ? {
            conferenceData: {
              entryPoints: [{ entryPointType: 'video', uri: zoomLink, label: 'Join Zoom' }],
              conferenceSolution: { name: 'Zoom', key: { type: 'addOn' } },
            },
          } : {}),
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 },
              { method: 'popup', minutes: 30 },
            ],
          },
          sendUpdates: 'all', // sends calendar invite emails to all attendees
        };

        const calEvent = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: eventBody,
          conferenceDataVersion: zoomLink ? 1 : 0,
          sendUpdates: 'all',
        });

        calendarEventLink = calEvent.data.htmlLink;
        console.log('✓ Google Calendar event created:', calendarEventLink);
      } catch (e) {
        console.error('Google Calendar error:', e.message);
      }
    }

    // ── Step 4: Send emails via Gmail API ──
    let emailsSent = false;
    if (googleAuth) {
      try {
        const gmail = google.gmail({ version: 'v1', auth: googleAuth });

        const zoomSection = zoomLink
          ? `\nZoom link: ${zoomLink}\nMeeting ID: ${zoomMeetingId}\n`
          : isVirtual ? '\nZoom link: Stael will send this shortly before your session.\n' : '';

        // Email to Stael
        await sendEmail(gmail, {
          from: `Stael Gissoni Site <${STAEL_EMAIL}>`,
          to: STAEL_EMAIL,
          subject: `New Booking: ${service} — ${clientName}`,
          body: `Hi Stael,\n\nNew booking confirmed and paid!\n\nSERVICE: ${service}\nCLIENT: ${clientName}\nEMAIL: ${email}\nDATE: ${date}\nTIME: ${time} ET\nPRICE: $${price}${zoomSection}\nNOTES: ${notes || 'None'}\nSTRIPE: ${sessionId || 'N/A'}\n${calendarEventLink ? '\nCalendar event: ' + calendarEventLink : ''}\n\n— staelfogarty.com`,
        });

        // Email to client
        await sendEmail(gmail, {
          from: `Stael Gissoni <${STAEL_EMAIL}>`,
          to: email,
          subject: `Your session is confirmed — ${service} with Stael Gissoni`,
          body: `Hi ${fname},\n\nYour session with Stael is confirmed!\n\nSERVICE: ${service}\nDATE: ${date}\nTIME: ${time} ET\nPRICE: $${price}${zoomSection}\n${isVirtual && zoomLink ? 'Click the Zoom link above to join at the scheduled time.' : isVirtual ? 'Stael will send your Zoom link before the session.' : 'Stael will meet you in person and confirm the location details.'}\n\nCANCELLATION: Free cancellation up to 24 hours before your session.\nContact: hello@staelfogarty.com\n\nThank you for choosing Stael Gissoni!\n\n— staelfogarty.com`,
        });

        // Notification to Vyn Studio
        const vynEmail = process.env.VYN_EMAIL || 'hello@vyn.studio';
        await sendEmail(gmail, {
          from: `Stael Gissoni Site <${STAEL_EMAIL}>`,
          to: vynEmail,
          subject: `💰 New Booking: ${service} — ${clientName} — $${price}`,
          body: `New booking on staelfogarty.com!\n\nSERVICE: ${service}\nCLIENT: ${clientName}\nEMAIL: ${email}\nDATE: ${date}\nTIME: ${time} ET\nPRICE: $${price}\nCOMMISSION (20%): $${Math.round(price * 0.20 * 100) / 100}${zoomSection}\nNOTES: ${notes || 'None'}\nSTRIPE: ${sessionId || 'N/A'}\n${calendarEventLink ? '\nCalendar: ' + calendarEventLink : ''}\n\n— staelfogarty.com`,
        });

        emailsSent = true;
        console.log('✓ Emails sent via Gmail + Vyn Studio notified');
      } catch (e) {
        console.error('Gmail error:', e.message);
      }
    }

    // Fallback Google Calendar link (clickable button on success page)
    const gcalLink = buildGCalLink({ service, clientName, date, time, zoomLink, notes, isVirtual });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, zoomLink, zoomMeetingId, calendarEventLink, gcalLink, emailsSent, isVirtual }),
    };

  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

// ── Helpers ──

async function sendEmail(gmail, { from, to, subject, body }) {
  // Use Resend if available, otherwise fall back to Gmail API
  if (process.env.RESEND_API_KEY) {
    await resend.emails.send({ from, to, subject, text: body });
  } else if (gmail) {
    const raw = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      '',
      body,
    ].join('\n');
    const encoded = Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encoded } });
  }
}

function parseDateTime(dateStr, timeStr) {
  try {
    const year = new Date().getFullYear();
    const clean = dateStr.replace(/^[A-Za-z]+,\s*/, '');
    const d = new Date(`${clean} ${year} ${timeStr}`);
    if (!isNaN(d)) return d.toISOString();
  } catch (e) {}
  return new Date().toISOString();
}

function buildGCalLink({ service, clientName, date, time, zoomLink, isVirtual }) {
  try {
    const year = new Date().getFullYear();
    const start = new Date(`${date.replace(/^[A-Za-z]+,\s*/, '')} ${year} ${time}`);
    const end = new Date(start.getTime() + 60 * 60000);
    const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const title = encodeURIComponent(`${service} — Stael Gissoni`);
    const details = encodeURIComponent([
      zoomLink ? `Zoom: ${zoomLink}` : isVirtual ? 'Zoom link to be sent by Stael' : 'In-person session',
      'hello@staelfogarty.com | staelfogarty.com',
    ].join('\n'));
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}`;
  } catch (e) { return 'https://calendar.google.com'; }
}

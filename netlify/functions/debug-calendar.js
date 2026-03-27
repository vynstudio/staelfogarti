const { google } = require('googleapis');

exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  const result = {
    hasJSON: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    jsonLength: process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.length || 0,
    impersonate: process.env.GOOGLE_IMPERSONATE || 'NOT SET',
    authTest: null, calendarTest: null, error: null,
  };

  try {
    const saKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    result.keyId = saKey.private_key_id;
    result.serviceAccountEmail = saKey.client_email;
    result.projectId = saKey.project_id;

    const auth = new google.auth.JWT({
      email: saKey.client_email,
      key: saKey.private_key,
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      subject: process.env.GOOGLE_IMPERSONATE || 'hello@staelfogarty.com',
    });
    await auth.authorize();
    result.authTest = 'SUCCESS';

    const cal = google.calendar({ version: 'v3', auth });
    const now = new Date();
    const res = await cal.freebusy.query({
      requestBody: {
        timeMin: now.toISOString(),
        timeMax: new Date(now.getTime() + 7*24*60*60*1000).toISOString(),
        timeZone: 'America/New_York',
        items: [{ id: process.env.GOOGLE_IMPERSONATE || 'hello@staelfogarty.com' }],
      }
    });
    result.calendarTest = 'SUCCESS';
    result.busySlots = res.data.calendars?.[process.env.GOOGLE_IMPERSONATE || 'hello@staelfogarty.com']?.busy?.length || 0;
  } catch(e) {
    result.error = e.message;
    result.errorCode = e.code;
  }

  return { statusCode: 200, headers, body: JSON.stringify(result, null, 2) };
};

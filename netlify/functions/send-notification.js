// This function sends booking confirmation emails
// It's called after a successful Stripe payment via webhook or from the success page
//
// SETUP: Add these environment variables in Netlify:
// - STAEL_EMAIL: hello@staelfogarty.com (or her actual email)
// - NOTIFICATION_FROM: noreply@staelfogarty.com
//
// For production email delivery, connect one of these:
// Option A: Netlify Email Integration (free tier available)
// Option B: SendGrid (100 emails/day free)
// Option C: Resend (free tier)
//
// For now, this logs the booking and can be wired to any email provider

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const data = JSON.parse(event.body);
    const { service, price, date, time, fname, lname, email, phone, notes, sessionId } = data;

    const clientName = `${fname} ${lname}`;
    const staelEmail = process.env.STAEL_EMAIL || 'hello@staelfogarty.com';

    // Email content for Stael (notification of new booking)
    const staelSubject = `New Booking: ${service} — ${clientName}`;
    const staelBody = `
Hi Stael,

You have a new booking!

SERVICE: ${service}
CLIENT: ${clientName}
EMAIL: ${email}
PHONE: ${phone || 'Not provided'}
DATE: ${date}
TIME: ${time} ET
PRICE: $${price}

NOTES FROM CLIENT:
${notes || 'None'}

STRIPE SESSION: ${sessionId || 'N/A'}

The client has already paid. Please confirm the session details with them.

— Your Website (staelfogarty.com)
    `.trim();

    // Email content for the client (booking confirmation)
    const clientSubject = `Booking Confirmed — ${service} with Stael Fogarty`;
    const clientBody = `
Hi ${fname},

Your session has been confirmed! Here are the details:

SERVICE: ${service}
DATE: ${date}
TIME: ${time} ET
PRICE: $${price}

Stael will reach out to you shortly with any additional details or preparation instructions.

CANCELLATION POLICY:
- Free cancellation up to 24 hours before your session
- Contact hello@staelfogarty.com to reschedule or cancel

If you have any questions before your session, feel free to reply to this email or contact Stael directly.

Thank you for choosing Stael Fogarty!

— staelfogarty.com
    `.trim();

    // Log the booking (always works, no email provider needed)
    console.log('=== NEW BOOKING ===');
    console.log('To Stael:', staelEmail);
    console.log('Subject:', staelSubject);
    console.log('Body:', staelBody);
    console.log('---');
    console.log('To Client:', email);
    console.log('Subject:', clientSubject);
    console.log('---');

    // ────────────────────────────────────────────
    // UNCOMMENT ONE OF THESE WHEN EMAIL IS SET UP:
    // ────────────────────────────────────────────

    // OPTION A: Using Resend (recommended - free tier)
    // const { Resend } = require('resend');
    // const resend = new Resend(process.env.RESEND_API_KEY);
    //
    // // Email to Stael
    // await resend.emails.send({
    //   from: 'Stael Fogarty Website <noreply@staelfogarty.com>',
    //   to: staelEmail,
    //   subject: staelSubject,
    //   text: staelBody,
    // });
    //
    // // Email to client
    // await resend.emails.send({
    //   from: 'Stael Fogarty <noreply@staelfogarty.com>',
    //   to: email,
    //   subject: clientSubject,
    //   text: clientBody,
    // });

    // OPTION B: Using SendGrid
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({ to: staelEmail, from: 'noreply@staelfogarty.com', subject: staelSubject, text: staelBody });
    // await sgMail.send({ to: email, from: 'noreply@staelfogarty.com', subject: clientSubject, text: clientBody });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Booking notification logged',
        stael_email: staelSubject,
        client_email: clientSubject,
      }),
    };
  } catch (err) {
    console.error('Notification error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

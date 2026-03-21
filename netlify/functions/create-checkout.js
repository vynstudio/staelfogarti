const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // CORS headers
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
    const { service, price, unit, date, time, fname, lname, email, phone, notes } = data;

    if (!service || !price || !email || !fname) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Build line item description
    const description = `${service} — ${date} at ${time} ET`;

    // Create Stripe Checkout Session
    // application_fee_amount = $20 commission (2000 cents)
    const sessionParams = {
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: service,
              description: description,
            },
            unit_amount: price * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        service,
        date,
        time,
        client_name: `${fname} ${lname}`,
        client_email: email,
        client_phone: phone || '',
        notes: notes || '',
      },
      success_url: `${process.env.URL || 'https://staelfogarty.com'}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL || 'https://staelfogarty.com'}/contact.html`,
    };

    // Stripe Connect — 20% platform commission, remainder to Stael
    const staelAccountId = process.env.STAEL_STRIPE_ACCOUNT_ID || 'acct_1TDSoKQe7O4V0tdq';
    const commissionAmount = Math.round(price * 100 * 0.20);
    sessionParams.payment_intent_data = {
      application_fee_amount: commissionAmount,
      transfer_data: {
        destination: staelAccountId,
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        url: session.url,
        sessionId: session.id,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      }),
    };
  } catch (err) {
    console.error('Stripe error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

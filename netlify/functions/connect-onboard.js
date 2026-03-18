const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Step 1: Create a connected account for Stael (only needs to run once)
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: 'hello@staelfogarty.com', // Stael's email
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      business_profile: {
        name: 'Stael Fogarty',
        mcc: '7299', // Miscellaneous personal services
        url: 'https://staelfogarty.com',
      },
    });

    // Step 2: Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.URL || 'https://staelfogarty.com'}/contact.html`,
      return_url: `${process.env.URL || 'https://staelfogarty.com'}/success.html?onboarded=true`,
      type: 'account_onboarding',
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        url: accountLink.url,
        accountId: account.id,
        message: `IMPORTANT: Save this account ID and add it as STAEL_STRIPE_ACCOUNT_ID in Netlify env vars: ${account.id}`,
      }),
    };
  } catch (err) {
    console.error('Stripe Connect error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

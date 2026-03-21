// Stripe Connect — onboard Stael as an Express connected account
// This function does two things:
// 1. If called with ?existing=true, creates an account link for an EXISTING account
// 2. If called fresh, creates a new Express account and returns the onboarding link
//
// Since Stael already has acct_1TDSoKQe7O4V0tdq, use ?existing=true

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const params = event.queryStringParameters || {};
    const existingAccountId = params.account || process.env.STAEL_STRIPE_ACCOUNT_ID;

    let accountId;

    if (existingAccountId) {
      // Use existing account — just create a new account link for it
      accountId = existingAccountId;
      console.log('Using existing account:', accountId);
    } else {
      // Create a new Express connected account
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: 'hello@staelfogarty.com',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        business_profile: {
          name: 'Stael Fogarty',
          mcc: '7299',
          url: 'https://staelfogarty.com',
        },
      });
      accountId = account.id;
      console.log('Created new account:', accountId);
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.URL || 'https://staelfogarty.com'}/.netlify/functions/connect-onboard?account=${accountId}`,
      return_url: `${process.env.URL || 'https://staelfogarty.com'}/connect-success.html?account=${accountId}`,
      type: 'account_onboarding',
    });

    // If called from browser directly, redirect
    if (event.httpMethod === 'GET') {
      return {
        statusCode: 302,
        headers: { ...headers, Location: accountLink.url },
        body: '',
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        url: accountLink.url,
        accountId,
        message: `Add to Netlify env vars: STAEL_STRIPE_ACCOUNT_ID = ${accountId}`,
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

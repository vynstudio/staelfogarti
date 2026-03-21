// Check if Stael's connected account has completed onboarding
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const accountId = process.env.STAEL_STRIPE_ACCOUNT_ID || 'acct_1TDSoKQe7O4V0tdq';
    const account = await stripe.accounts.retrieve(accountId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirementsCurrentlyDue: account.requirements?.currently_due || [],
        requirementsEventuallyDue: account.requirements?.eventually_due || [],
        ready: account.charges_enabled && account.payouts_enabled,
      }),
    };
  } catch (err) {
    console.error('Status check error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

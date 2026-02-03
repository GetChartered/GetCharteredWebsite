import 'server-only'

import Stripe from 'stripe'

// Validate Stripe secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

// Initialize Stripe with enhanced configuration
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  maxNetworkRetries: 2, // Retry failed requests up to 2 times
  timeout: 30000, // 30 second timeout for requests
  appInfo: {
    name: 'GetCharteredWebsite',
    version: '1.0.0',
  },
})

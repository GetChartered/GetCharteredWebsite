import 'server-only'

import Stripe from 'stripe'

let stripeInstance = null

// Initialize Stripe lazily on first use. Doing this at module-evaluation time
// would throw during `next build` (page-data collection imports every route),
// failing builds in any environment without STRIPE_SECRET_KEY set — e.g. CI or
// preview deploys without secrets. Deferring to runtime keeps the build green
// and surfaces a clear error only when Stripe is actually called.
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      maxNetworkRetries: 2, // Retry failed requests up to 2 times
      timeout: 30000, // 30 second timeout for requests
      appInfo: {
        name: 'GetCharteredWebsite',
        version: '1.0.0',
      },
    })
  }
  return stripeInstance
}

// Proxy preserves the `stripe.resource.method(...)` API at every call site
// while ensuring the client is only constructed (and the env var validated)
// on first property access at request time. The @type cast keeps the full
// Stripe typings for TypeScript consumers.
export const stripe = /** @type {Stripe} */ (
  new Proxy(
    {},
    {
      get(_target, prop) {
        const client = getStripe()
        const value = client[prop]
        return typeof value === 'function' ? value.bind(client) : value
      },
    }
  )
)

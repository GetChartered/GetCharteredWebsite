import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

/**
 * Fetch pricing information from Stripe
 *
 * Returns all active products with their pricing details
 */
export async function GET() {
  try {
    // Fetch all active prices with their product data
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });

    // Transform Stripe data into a format suitable for our UI
    const pricingData = prices.data.map((price) => {
      const product = price.product as any;

      return {
        id: price.id,
        productId: product.id,
        productName: product.name,
        description: product.description || '',
        amount: price.unit_amount ? price.unit_amount / 100 : 0, // Convert cents to pounds
        currency: price.currency.toUpperCase(),
        interval: price.recurring?.interval || 'one_time',
        intervalCount: price.recurring?.interval_count || 1,
        metadata: product.metadata || {},
        features: product.metadata?.features
          ? JSON.parse(product.metadata.features)
          : [],
        active: price.active && product.active,
      };
    });

    // Sort by amount (free first, then by price)
    pricingData.sort((a, b) => a.amount - b.amount);

    return NextResponse.json({
      success: true,
      data: pricingData,
    });

  } catch (error) {
    console.error('Error fetching Stripe pricing:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pricing information',
      },
      { status: 500 }
    );
  }
}

import { redirect } from 'next/navigation'
import Link from 'next/link'

import { stripe } from '../../lib/stripe'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'

function SuccessContent({ customerEmail }) {
    return (
        <div className="min-h-screen">
            <Navigation />

            <section className="py-24">
                <div className="container">
                    <div className="max-w-lg mx-auto">
                        <div className="card p-8 text-center">
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                                style={{ backgroundColor: 'rgba(74, 222, 128, 0.12)' }}
                            >
                                <svg
                                    width="40"
                                    height="40"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="var(--color-success)"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M20 6 9 17l-5-5" />
                                </svg>
                            </div>

                            <h1 className="text-display mb-4">Payment Successful!</h1>

                            <p
                                className="text-lg mb-6"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                Thank you for your purchase. A confirmation email will be sent
                                to{' '}
                                <strong style={{ color: 'var(--color-text)' }}>
                                    {customerEmail}
                                </strong>
                                .
                            </p>

                            <p
                                className="text-sm mb-8"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                If you have any questions, please email{' '}
                                <a
                                    href="mailto:orders@example.com"
                                    style={{ color: 'var(--color-tint)' }}
                                >
                                    orders@example.com
                                </a>
                                .
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/my-account" className="btn btn-primary btn-md">
                                    Go to My Account
                                </Link>
                                <Link href="/" className="btn btn-outline btn-md">
                                    Return Home
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

export default async function Success({ searchParams }) {
    const { session_id } = await searchParams

    if (!session_id)
        throw new Error('Please provide a valid session_id (`cs_test_...`)')

    const {
        status,
        customer_details: { email: customerEmail }
    } = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ['line_items', 'payment_intent']
    })

    if (status === 'open') {
        return redirect('/')
    }

    if (status === 'complete') {
        return <SuccessContent customerEmail={customerEmail} />
    }
}

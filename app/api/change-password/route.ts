import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { sendPasswordResetEmail } from '@/lib/auth0-management';

export async function POST() {
  const session = await auth0.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const sub = session.user.sub as string | undefined;
  const email = session.user.email as string | undefined;

  if (!email) {
    return NextResponse.json(
      { error: 'No email on file for this account' },
      { status: 400 }
    );
  }

  // Social-login users (google-oauth2|..., apple|..., etc.) don't have a password
  // we can reset — they manage credentials through their identity provider.
  if (!sub?.startsWith('auth0|')) {
    return NextResponse.json(
      {
        error:
          "Your account uses a social login provider, so there's no password to reset here. Manage your credentials through that provider.",
      },
      { status: 400 }
    );
  }

  try {
    await sendPasswordResetEmail(email);
    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to send password reset email. Please try again.' },
      { status: 500 }
    );
  }
}

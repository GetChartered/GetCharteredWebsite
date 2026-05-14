import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { updateUserMetadata, updateUserProfile } from '@/lib/auth0-management';

export async function PATCH(request: Request) {
  const session = await auth0.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { name } = await request.json();

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const trimmedName = name.trim();
  // Root `name` is read-only for non-database connections (Auth0 treats it
  // as IdP-owned). For social users we mirror the value into
  // `user_metadata.full_name` so the rest of the app still has the user's
  // chosen display name.
  const isDatabaseUser = session.user.sub?.startsWith('auth0|') ?? false;

  try {
    if (isDatabaseUser) {
      await updateUserProfile(session.user.sub, { name: trimmedName });
    } else {
      await updateUserMetadata(session.user.sub, {
        metadata: { full_name: trimmedName },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

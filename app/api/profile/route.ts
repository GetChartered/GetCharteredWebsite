import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { updateUserProfile } from '@/lib/auth0-management';

export async function PATCH(request: Request) {
  const session = await auth0.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { name } = await request.json();

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  try {
    await updateUserProfile(session.user.sub, { name: name.trim() });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

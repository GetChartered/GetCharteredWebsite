import 'server-only';

// Validate environment variables at module load time
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;

if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_CLIENT_SECRET) {
  throw new Error(
    'Missing required Auth0 environment variables: AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET'
  );
}

const AUTH0_BASE = `https://${AUTH0_DOMAIN}`;

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getManagementToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const response = await fetch(`${AUTH0_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: AUTH0_CLIENT_ID,
      client_secret: AUTH0_CLIENT_SECRET,
      audience: `${AUTH0_BASE}/api/v2/`,
    }),
  });

  if (!response.ok) {
    let errorMessage = 'Auth0 API error';
    try {
      const error = await response.json();
      errorMessage = error.error_description || error.message || errorMessage;
    } catch {
      // JSON parse failed, response might be HTML
      errorMessage = `HTTP ${response.status}`;
    }

    console.error('Auth0 Management API Error:', {
      status: response.status,
      message: errorMessage,
    });

    throw new Error('Failed to get Auth0 Management API token');
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

export async function updateUserProfile(userId: string, data: { name?: string }) {
  const token = await getManagementToken();

  const response = await fetch(`${AUTH0_BASE}/api/v2/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = 'Auth0 API error';
    try {
      const error = await response.json();
      errorMessage = error.error_description || error.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${response.status}`;
    }

    console.error('Auth0 Profile Update Error:', {
      status: response.status,
      userId,
      message: errorMessage,
    });

    throw new Error('Failed to update user profile');
  }

  return response.json();
}

export async function deleteUser(userId: string) {
  const token = await getManagementToken();

  const response = await fetch(`${AUTH0_BASE}/api/v2/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let errorMessage = 'Auth0 API error';
    try {
      const error = await response.json();
      errorMessage = error.error_description || error.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${response.status}`;
    }

    console.error('Auth0 User Deletion Error:', {
      status: response.status,
      userId,
      message: errorMessage,
    });

    throw new Error('Failed to delete user');
  }
}

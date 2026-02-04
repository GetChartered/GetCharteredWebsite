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

/**
 * Custom error class for Auth0 Management API errors
 */
class Auth0ManagementError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'Auth0ManagementError';
  }
}

/**
 * Standardized error handler for Auth0 API responses
 */
async function handleAuth0Error(
  response: Response,
  operation: string,
  context?: Record<string, any>
): Promise<never> {
  let errorMessage = 'Auth0 API error';

  try {
    const error = await response.json();
    errorMessage = error.error_description || error.message || errorMessage;
  } catch {
    // JSON parse failed, response might be HTML
    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  }

  const errorContext = {
    operation,
    status: response.status,
    ...context,
  };

  console.error('Auth0 Management API Error:', errorContext, errorMessage);

  throw new Auth0ManagementError(
    `${operation} failed: ${errorMessage}`,
    response.status,
    errorContext
  );
}

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
    await handleAuth0Error(response, 'Get Management Token');
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
    await handleAuth0Error(response, 'Update User Profile', { userId });
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
    await handleAuth0Error(response, 'Delete User', { userId });
  }
}

"use client";

import useSWR from "swr";

type OptionalUser = { sub: string; [key: string]: unknown } | null;

// Drop-in replacement for `useUser()` on public pages where the visitor is
// expected to be logged out most of the time. The SDK's useUser throws on 401,
// which makes SWR retry 5 times with exponential backoff — generating a storm
// of /auth/profile calls per anonymous page view. This fetcher returns null on
// 401 instead, so SWR treats logged-out as a successful "no user" result and
 // fires exactly one request per mount (no focus/reconnect revalidation).
export function useOptionalUser(): { user: OptionalUser; isLoading: boolean } {
  const { data, isLoading } = useSWR<OptionalUser>(
    process.env.NEXT_PUBLIC_PROFILE_ROUTE || "/auth/profile",
    async (url: string) => {
      const res = await fetch(url);
      if (res.status === 401 || res.status === 204) return null;
      if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
      return res.json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    } 
  );

  return { user: data ?? null, isLoading };
}

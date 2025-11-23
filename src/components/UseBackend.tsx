import { getAccessToken } from "@auth0/nextjs-auth0";

import { useCallback } from "react";

// Types for structured result
export type FetchErrorReason =
    | "NO_ENTITLEMENT"
    | "NO_DATA"
    | "NETWORK_ERROR"
    | "NO_TOKEN"
    | "BACKEND_ERROR";

export type FetchResult =
    | { ok: true; user: any[] }
    | { ok: false; reason: FetchErrorReason; message?: string };

// Interface describing the expected shape of the backend response
interface BackendResponseBody {
    selectedUser?: any[];
    error?: string; // e.g. "NO_ENTITLEMENT"
    message?: string;
}

interface BackendResponse {
    // Old aggregated shape
    getUser?: {
        statusCode?: number;
        body?: BackendResponseBody | string;
    };

    // New direct shape (Lambda returning straight out)
    selectedUser?: any[];
    error?: string;
    message?: string;
}

export function UseBackend() {
    // Base URL for the API Gateway

    const fetchData = useCallback(
        async (): Promise<FetchResult> => {
            try {
                // AUTH0: get access token for current user
                const credentials = await getAccessToken();

                if (!credentials) {
                    console.log(
                        "useBackendData → no access token from Auth0, treating as NO_TOKEN"
                    );
                    return {
                        ok: false,
                        reason: "NO_TOKEN",
                        message: "Missing access token",
                    };
                }

                const API_BASE = "https://mqtt2y9shf.execute-api.eu-west-2.amazonaws.com";

                const url = `${API_BASE}/GetAccountDetails/`;

                console.log("useBackendData → fetching with Auth0 token:", url);

                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${credentials}`,
                    },
                });

                if (!response.ok) {
                    console.log(
                        `non-OK HTTP response: ${response.status} - ${response.statusText}`
                    );

                    // Treat 403 as "no entitlement"
                    if (response.status === 403) {
                        return {
                            ok: false,
                            reason: "NO_ENTITLEMENT",
                            message:
                                "You don't have access to this course or module yet.",
                        };
                    }

                    return {
                        ok: false,
                        reason: "BACKEND_ERROR",
                        message: `HTTP ${response.status}`,
                    };
                }

                const data = (await response.json()) as BackendResponse;
                console.log("useBackendData → success, got raw data:", data);

                // 1) Normalise "body" if we're in the old getQuestionsData shape
                const rawBody = data.getUser?.body;
                let body: BackendResponseBody | null = null;

                if (typeof rawBody === "string") {
                    try {
                        body = JSON.parse(rawBody) as BackendResponseBody;
                        console.log(
                            "useBackendData → parsed string body into object:",
                            body
                        );
                    } catch (e) {
                        console.log(
                            "useBackendData → failed to parse string body as JSON:",
                            e
                        );
                        body = null;
                    }
                } else if (rawBody && typeof rawBody === "object") {
                    body = rawBody as BackendResponseBody;
                }

                // 2) Prefer error info from body (old shape), else from top level
                const effectiveError = body?.error ?? data.error;
                const effectiveMessage = body?.message ?? data.message;

                if (effectiveError) {
                    console.log(
                        `useBackendData -> backend reported error: ${effectiveError} - ${
                            effectiveMessage ?? "no message"
                        }`
                    );

                    if (effectiveError === "NO_ENTITLEMENT") {
                        return {
                            ok: false,
                            reason: "NO_ENTITLEMENT",
                            message:
                                effectiveMessage ??
                                "You don't have access to this course or module.",
                        };
                    }

                    return {
                        ok: false,
                        reason: "BACKEND_ERROR",
                        message: effectiveMessage ?? effectiveError,
                    };
                }

                // 3) Normalise questions array from any of the supported shapes
                let user: any[] | null = null;

                // a) New simple shape: top-level chosenQuestions
                if (Array.isArray(data.selectedUser)) {
                    user = data.selectedUser;
                }

                // b) Old aggregated shape: body.chosenQuestions
                if (!user && body && Array.isArray(body.selectedUser)) {
                    user = body.selectedUser;
                }

                // c) Absolute fallback: backend returned an array directly
                if (!user && Array.isArray((data as unknown) as any[])) {
                    user = (data as unknown) as any[];
                }

                if (!user || user.length === 0) {
                    console.log(
                        "useBackendData -> no questions returned from backend, treating as NO_DATA"
                    );
                    return {
                        ok: false,
                        reason: "NO_DATA",
                        message: "No questions available for this selection.",
                    };
                }

                console.log(
                    `useBackendData -> normalised questions array (length=${user.length})`
                );

                return { ok: true, user };
            } catch (error: any) {
                console.log(
                    "fetch failed, treating as NETWORK_ERROR:",
                    error
                );
                return {
                    ok: false,
                    reason: "NETWORK_ERROR",
                    message: String(error?.message ?? error),
                };
            }
        },
        [getAccessToken]
    );

    return { fetchData };
}
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://broverse-api-20260127.azurewebsites.net';

export function getApiBaseUrl() {
    return API_BASE_URL;
}

export function getAuthTokens() {
    const raw = localStorage.getItem('broverse_tokens');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function setAuthTokens(tokens) {
    localStorage.setItem('broverse_tokens', JSON.stringify(tokens));
}

export function clearAuthTokens() {
    localStorage.removeItem('broverse_tokens');
    localStorage.removeItem('broverse_user');
    window.dispatchEvent(new CustomEvent('broverse:auth:expired'));
}

// Track refresh in progress to avoid multiple simultaneous refreshes
let refreshPromise = null;

async function refreshAccessToken() {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            const tokens = getAuthTokens();
            if (!tokens?.refreshToken) throw new Error('No refresh token');

            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: tokens.refreshToken })
            });

            if (!response.ok) throw new Error('Refresh failed');

            const data = await response.json();
            setAuthTokens({
                accessToken: data.accessToken,
                refreshToken: data.refreshToken
            });
            return data.accessToken;
        } catch {
            clearAuthTokens();
            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

export async function apiRequest(path, options = {}) {
    const { method = 'GET', body, auth = true, raw = false } = options;
    const headers = {
        'Content-Type': 'application/json'
    };

    if (auth) {
        const tokens = getAuthTokens();
        if (tokens?.accessToken) {
            headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
    }

    let response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    // Auto-refresh on 401 and retry once
    if (response.status === 401 && auth) {
        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
            headers.Authorization = `Bearer ${newAccessToken}`;
            response = await fetch(`${API_BASE_URL}${path}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined
            });
        }
    }

    if (!response.ok) {
        let message = 'Request failed';
        const contentType = response.headers.get('content-type') || '';
        try {
            if (contentType.includes('application/json')) {
                const data = await response.json();
                message = data?.error || data?.message || message;
            } else {
                const text = await response.text();
                message = text || message;
            }
        } catch {
            // ignore parsing errors
        }

        if (response.status === 401 && auth) {
            clearAuthTokens();
        }

        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    if (raw) return response;
    if (response.status === 204) return null;
    return response.json();
}

/**
 * Stream an SSE response from a POST endpoint.
 * Returns an async generator yielding parsed SSE data objects.
 */
export async function apiStream(path, body) {
    const tokens = getAuthTokens();
    const headers = { 'Content-Type': 'application/json' };
    if (tokens?.accessToken) {
        headers.Authorization = `Bearer ${tokens.accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Stream request failed');
    }

    return response.body;
}

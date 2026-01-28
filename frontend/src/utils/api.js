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
}

export async function apiRequest(path, options = {}) {
    const { method = 'GET', body, auth = true } = options;
    const headers = {
        'Content-Type': 'application/json'
    };

    if (auth) {
        const tokens = getAuthTokens();
        if (tokens?.accessToken) {
            headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

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
            localStorage.removeItem('broverse_user');
            window.dispatchEvent(new CustomEvent('broverse:auth:expired'));
        }

        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    if (response.status === 204) return null;
    return response.json();
}

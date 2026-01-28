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
        const errorText = await response.text();
        throw new Error(errorText || 'Request failed');
    }

    if (response.status === 204) return null;
    return response.json();
}

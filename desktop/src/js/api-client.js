const API_BASE_URL = 'http://localhost:8080/api'; // dev
// const API_BASE_URL = 'https://your-vps.com/api'; // prod

class ApiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    }

    async request(method, endpoint, data = null, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const config = { method, headers };
        if (data && method !== 'GET') {
            config.body = JSON.stringify(data);
        }

        try {
            let response = await fetch(url, config);

            // Handle 401 — token expired atau session berakhir
            if (response.status === 401) {
                const refreshed = await this.tryRefreshToken();
                if (refreshed) {
                    // Retry request dengan token baru
                    config.headers['Authorization'] = `Bearer ${this.token}`;
                    response = await fetch(url, config);
                } else {
                    // Refresh gagal → logout paksa
                    this.clearToken();
                    window.location.href = '../views/login.html';
                    return null;
                }
            }

            const result = await response.json();
            if (!result.status) {
                throw new Error(result.message || 'Terjadi kesalahan');
            }
            return result.data;

        } catch (error) {
            if (error.name === 'TypeError') {
                // Network error — server tidak bisa diakses
                throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet.');
            }
            throw error;
        }
    }

    async tryRefreshToken() {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken })
            });
            const result = await response.json();
            if (result.status && result.data?.token) {
                this.setToken(result.data.token);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    get(endpoint, params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = query ? `${endpoint}?${query}` : endpoint;
        return this.request('GET', url);
    }

    post(endpoint, data) { return this.request('POST', endpoint, data); }
    put(endpoint, data)  { return this.request('PUT', endpoint, data); }
    patch(endpoint, data){ return this.request('PATCH', endpoint, data); }
    delete(endpoint)     { return this.request('DELETE', endpoint); }

    async uploadFile(endpoint, formData) {
        const headers = {};
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers,
            body: formData
        });
        const result = await response.json();
        if (!result.status) throw new Error(result.message);
        return result.data;
    }
}

// Singleton instance
const apiClient = new ApiClient();

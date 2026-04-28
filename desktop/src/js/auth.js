// Auth utility functions (used in login.html and other pages)
// Uses apiClient (HTTP fetch) — no IPC

async function login(username, password) {
    try {
        const data = await apiClient.post('/auth/login', {
            username,
            password,
            device_info: 'desktop'
        });

        apiClient.setToken(data.token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.user));

        window.location.href = 'dashboard.html';
    } catch (error) {
        showError(error.message);
    }
}

async function logout() {
    try {
        await apiClient.post('/auth/logout');
    } finally {
        apiClient.clearToken();
        window.location.href = 'login.html';
    }
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('user') || 'null');
}

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// PIN Lock functions
async function hasPin() {
    const data = await apiClient.get('/pin/check');
    return data.has_pin;
}

async function setPin(pin) {
    return await apiClient.post('/pin/set', { pin });
}

async function verifyPin(pin) {
    return await apiClient.post('/pin/verify', { pin });
}

async function changePin(oldPin, newPin) {
    return await apiClient.post('/pin/change', { old_pin: oldPin, new_pin: newPin });
}

// Auth utility functions (used in login.html and other pages)
// Uses apiClient (HTTP fetch) — no IPC

async function login(username, password) {
    try {
        const res = await apiClient.post('/auth/login', {
            username,
            password,
            device_info: 'desktop'
        });

        apiClient.setToken(res.data.token);
        localStorage.setItem('refresh_token', res.data.refresh_token);
        localStorage.setItem('user', JSON.stringify(res.data.user));

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

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// PIN Lock functions — endpoint belum diimplementasikan di backend
// Fungsi-fungsi ini akan selalu mengembalikan false/error hingga backend tersedia
async function hasPin() {
    try {
        const data = await apiClient.get('/pin/check');
        return data?.data?.has_pin ?? false;
    } catch {
        return false;
    }
}

async function setPin(pin) {
    try {
        return await apiClient.post('/pin/set', { pin });
    } catch (e) {
        console.error('setPin error (endpoint belum tersedia):', e);
        return null;
    }
}

async function verifyPin(pin) {
    try {
        return await apiClient.post('/pin/verify', { pin });
    } catch (e) {
        console.error('verifyPin error (endpoint belum tersedia):', e);
        return null;
    }
}

async function changePin(oldPin, newPin) {
    try {
        return await apiClient.post('/pin/change', { old_pin: oldPin, new_pin: newPin });
    } catch (e) {
        console.error('changePin error (endpoint belum tersedia):', e);
        return null;
    }
}

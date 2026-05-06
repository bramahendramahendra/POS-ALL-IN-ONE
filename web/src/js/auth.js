const AUTH_PLATFORM = 'web';

async function login(username, password) {
    const res = await apiClient.post('/auth/login', {
        username,
        password,
        platform: AUTH_PLATFORM,
    });

    localStorage.setItem('access_token',  res.access_token);
    localStorage.setItem('refresh_token', res.refresh_token);
    localStorage.setItem('user',          JSON.stringify(res.user));

    // Sync token ke apiClient agar request berikutnya terautentikasi
    apiClient.setToken(res.access_token);

    // Redirect berdasarkan role
    const role = res.user.role;
    if (role === 'kasir') {
        window.location.href = '/kasir.html';
    } else {
        window.location.href = '/dashboard.html';
    }
}

async function logout() {
    try {
        await apiClient.post('/auth/logout');
    } catch {}
    localStorage.clear();
    window.location.href = '/login.html';
}

function getCurrentUser() {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
}

function requireAuth() {
    const token = localStorage.getItem('access_token');
    if (!token) { window.location.href = '/login.html'; }
}

function requireRole(...allowedRoles) {
    const user = getCurrentUser();
    if (!user || !allowedRoles.includes(user.role)) {
        window.location.href = '/dashboard.html';
    }
}

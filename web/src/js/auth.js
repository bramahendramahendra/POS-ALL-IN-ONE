// Simpan data auth setelah login berhasil
function saveAuthData(data) {
    localStorage.setItem('access_token', data.token);
    if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
    if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
    apiClient.setToken(data.token);
}

function getUser() {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
}

function logout() {
    apiClient.clearToken();
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

async function login(username, password) {
    const data = await apiClient.post('/auth/login', { username, password });
    saveAuthData(data);
    return data;
}

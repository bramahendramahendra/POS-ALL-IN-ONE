window.APP_CONFIG = {
    backendUrl: 'https://api.namadomain.com', // selalu online, tidak ada mode offline
    platform: 'android',
    deviceSource: 'android',
};

// Override base URL api-client.js sesuai config Android
if (typeof apiClient !== 'undefined') {
    apiClient.baseURL = window.APP_CONFIG.backendUrl + '/api';

    const storedToken = localStorage.getItem('access_token');
    if (storedToken) apiClient.token = storedToken;
}

// Cek update setelah login berhasil
window.addEventListener('auth:login-success', checkForUpdate);

window.APP_CONFIG = {
    backendUrl: 'http://localhost:8080', // dev — ganti ke production URL saat deploy
    platform: 'web',
    deviceSource: 'web',
};

// Override base URL dari api-client.js sesuai config
if (typeof apiClient !== 'undefined') {
    apiClient.baseURL = window.APP_CONFIG.backendUrl + '/api';

    // Web menyimpan token dengan key 'access_token'; sync ke apiClient
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) apiClient.token = storedToken;
}

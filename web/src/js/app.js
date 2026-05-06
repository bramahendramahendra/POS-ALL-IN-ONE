window.APP_CONFIG = {
    backendUrl: 'http://localhost:8080', // dev — ganti ke production URL saat deploy
    platform: 'web',
    deviceSource: 'web',
};

// Override base URL dari api-client.js sesuai config
if (typeof apiClient !== 'undefined') {
    apiClient.baseURL = window.APP_CONFIG.backendUrl + '/api';
}

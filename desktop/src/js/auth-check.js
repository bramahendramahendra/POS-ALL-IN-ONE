// Cek auth di setiap halaman (kecuali login.html)
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user) {
        window.location.href = '../views/login.html';
        return null;
    }
    return user;
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('user') || 'null');
}

const routes = {
    '/login':        'login.html',
    '/dashboard':    'dashboard.html',
    '/kasir':        'kasir.html',
    '/products':     'products.html',
    '/transactions': 'transactions.html',
    '/finance':      'finance.html',
    '/customers':    'customers.html',
    '/receivables':  'receivables.html',
    '/suppliers':    'suppliers.html',
    '/shifts':       'shifts.html',
    '/reports':      'reports.html',
    '/settings':     'settings.html',
    '/sync-center':  'sync-center.html',
};

function navigate(path) {
    const page = routes[path];
    if (!page) { window.location.href = '/login.html'; return; }
    window.location.href = `/${page}`;
}

function requireAuth() {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login'); }
}

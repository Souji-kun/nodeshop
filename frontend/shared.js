(function () {
    const API_BASE = '/api/v1';
    const AUTH_KEY = 'plush_palette_auth_token';

    const request = (method, path, data = null) => {
        const token = localStorage.getItem(AUTH_KEY);
        return $.ajax({
            url: `${API_BASE}${path}`,
            method,
            data: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
            processData: !(data instanceof FormData),
            contentType: data instanceof FormData ? false : 'application/json',
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
    };

    const setToken = (token) => localStorage.setItem(AUTH_KEY, token);
    const getToken = () => localStorage.getItem(AUTH_KEY);
    const clearToken = () => localStorage.removeItem(AUTH_KEY);

    const money = (value) => {
        const amount = Number(value ?? 0);
        return Number.isFinite(amount) ? amount : 0;
    };

    const formatMoney = (value) => `$${money(value).toFixed(2)}`;

    const formatDate = (value) => {
        if (!value) return 'N/A';
        return new Date(value).toLocaleString();
    };

    const notify = (text, type = 'info') => {
        const node = document.getElementById('notification');
        if (!node) return;
        node.textContent = text;
        node.className = `notification ${type}`;
        node.classList.remove('hidden');
        window.clearTimeout(window.__plushNotifyTimer);
        window.__plushNotifyTimer = window.setTimeout(() => {
            node.classList.add('hidden');
        }, 2200);
    };

    const showBoot = () => document.body.classList.add('is-booting');
    const hideBoot = () => document.body.classList.remove('is-booting');

    window.PlushApp = {
        request,
        setToken,
        getToken,
        clearToken,
        money,
        formatMoney,
        formatDate,
        notify,
        showBoot,
        hideBoot
    };
})();

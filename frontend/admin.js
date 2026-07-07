(function () {
    const {
        request, setToken, getToken, clearToken, formatMoney, formatDate,
        notify, showBoot, hideBoot
    } = window.PlushApp;

    const $authScreen = $('#authScreen');
    const $adminApp = $('#adminApp');
    const $authForm = $('#authForm');
    const $authMessage = $('#authMessage');
    const $authSubmit = $('#authSubmit');
    const $nameField = $('#nameField');
    const $nameInput = $('#nameInput');
    const $emailInput = $('#emailInput');
    const $passwordInput = $('#passwordInput');
    const $authTabs = $('.auth-tab');
    const $navRoutes = $('.nav-route');
    const $panels = $('.admin-panel');

    const $statUsers = $('#statUsers');
    const $statProducts = $('#statProducts');
    const $statOrders = $('#statOrders');
    const $statRevenue = $('#statRevenue');
    const $productTable = $('#adminProductTable');
    const $orderTable = $('#adminOrderTable');
    const $userTable = $('#adminUserTable');
    const $profileCard = $('#adminProfileCard');
    const $refreshChartsBtn = $('#refreshChartsBtn');
    const $productSearch = $('#productSearch');
    const $orderSearch = $('#orderSearch');
    const $userSearch = $('#userSearch');
    const $productPager = $('#productPager');
    const $orderPager = $('#orderPager');
    const $userPager = $('#userPager');
    const $statusChart = document.getElementById('statusChart');
    const $categoryChart = document.getElementById('categoryChart');
    const $trendChart = document.getElementById('trendChart');

    let mode = 'login';
    let currentUser = null;
    let products = [];
    let orders = [];
    let users = [];
    let productPage = 1;
    let orderPage = 1;
    let userPage = 1;
    const pageSize = 6;

    const setMessage = (text, error = false) => {
        $authMessage.text(text).toggleClass('error', error);
    };

    const validateAuth = () => {
        const email = String($emailInput.val() || '').trim();
        const password = String($passwordInput.val() || '').trim();
        if (mode === 'register' && !String($nameInput.val() || '').trim()) {
            setMessage('Please enter your name.', true);
            return false;
        }
        if (!email) {
            setMessage('Please enter your email.', true);
            return false;
        }
        if (!password) {
            setMessage('Please enter your password.', true);
            return false;
        }
        return true;
    };

    const setMode = (next) => {
        mode = next;
        $authTabs.removeClass('active').filter(`[data-auth-tab="${next}"]`).addClass('active');
        $nameField.toggleClass('hidden', next !== 'register');
        $authSubmit.text(next === 'register' ? 'Create account' : 'Login');
        setMessage('');
    };

    const showAuth = () => {
        window.location.replace('/index.html');
    };
    const showApp = () => { $authScreen.addClass('hidden'); $adminApp.removeClass('hidden'); };

    const setPanel = (panel) => {
        $navRoutes.removeClass('active').filter(`[data-route="${panel}"]`).addClass('active');
        $panels.addClass('hidden').filter(`[data-panel="${panel}"]`).removeClass('hidden');
    };

    const imageUrl = (path) => path ? `/${String(path).replace(/^\/+/, '')}` : '';
    const itemName = (item) => item?.name || item?.description || 'Untitled';

    const paginate = (items, page) => {
        const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
        const safePage = Math.min(Math.max(1, page), totalPages);
        const start = (safePage - 1) * pageSize;
        return { rows: items.slice(start, start + pageSize), totalPages, page: safePage };
    };

    const renderPager = ($node, page, totalPages, onChange) => {
        $node.empty();
        if (totalPages <= 1) return;
        for (let i = 1; i <= totalPages; i += 1) {
            const btn = $(`<button type="button"${i === page ? ' class="active"' : ''}>${i}</button>`);
            btn.on('click', () => onChange(i));
            $node.append(btn);
        }
    };

    const updateStats = () => {
        $statUsers.text(String(users.length));
        $statProducts.text(String(products.length));
        $statOrders.text(String(orders.length));
        $statRevenue.text(formatMoney(orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)));
    };

    const drawPie = (canvas, labels, values, colors) => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);

        const total = values.reduce((sum, n) => sum + n, 0) || 1;
        let start = -Math.PI / 2;
        const radius = Math.min(width, height) / 3;
        const cx = width / 2;
        const cy = height / 2;

        values.forEach((value, index) => {
            const angle = (value / total) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, start, start + angle);
            ctx.closePath();
            ctx.fillStyle = colors[index % colors.length];
            ctx.fill();
            start += angle;
        });
    };

    const drawBars = (canvas, labels, values, color = '#d96c6c') => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);
        const padding = 28;
        const max = Math.max(...values, 1);
        const barWidth = (width - padding * 2) / values.length - 12;
        ctx.strokeStyle = 'rgba(42,29,25,.2)';
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        values.forEach((value, index) => {
            const barHeight = ((height - padding * 2) * value) / max;
            const x = padding + index * (barWidth + 10);
            const y = height - padding - barHeight;
            ctx.fillStyle = color;
            ctx.fillRect(x, y, barWidth, barHeight);
            ctx.fillStyle = '#2a1d19';
            ctx.font = '11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(labels[index], x + barWidth / 2, height - 8);
        });
    };

    const drawLine = (canvas, labels, values, color = '#6f91c9') => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);

        const padding = 30;
        const max = Math.max(...values, 1);
        const step = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;
        const points = values.map((value, index) => ({
            x: padding + step * index,
            y: height - padding - ((height - padding * 2) * value) / max
        }));

        ctx.strokeStyle = 'rgba(42,29,25,.2)';
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        points.forEach((point, index) => {
            if (index === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();

        points.forEach((point, index) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2a1d19';
            ctx.font = '11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(labels[index], point.x, height - 8);
        });
    };

    const renderCharts = () => {
        const statusCounts = ['pending', 'processing', 'completed', 'cancelled'].map((status) =>
            orders.filter((order) => String(order.status || 'pending') === status).length
        );
        const categoryMap = products.reduce((acc, item) => {
            const key = item.category || 'Uncategorized';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        const categoryLabels = Object.keys(categoryMap).slice(0, 4);
        const categoryValues = categoryLabels.map((key) => categoryMap[key]);
        const dailyMap = orders.reduce((acc, order) => {
            const day = new Date(order.date_placed).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            acc[day] = (acc[day] || 0) + Number(order.total_amount || 0);
            return acc;
        }, {});
        const trendLabels = Object.keys(dailyMap).slice(-5);
        const trendValues = trendLabels.map((key) => dailyMap[key]);

        drawPie($statusChart, ['Pending', 'Processing', 'Completed', 'Cancelled'], statusCounts, ['#d96c6c', '#6f91c9', '#7dbd9c', '#d8a35f']);
        drawBars($categoryChart, categoryLabels.length ? categoryLabels : ['None'], categoryValues.length ? categoryValues : [1], '#d96c6c');
        drawLine($trendChart, trendLabels.length ? trendLabels : ['No data'], trendValues.length ? trendValues : [0], '#6f91c9');
    };

    const renderProducts = () => {
        const q = String($productSearch.val() || '').toLowerCase();
        const filtered = products.filter((item) => {
            const hay = `${itemName(item)} ${item.description || ''} ${item.category || ''}`.toLowerCase();
            return !q || hay.includes(q);
        });
        const { rows, totalPages, page } = paginate(filtered, productPage);
        productPage = page;

        if (!filtered.length) {
            $productTable.html('<p class="empty-state">No products found.</p>');
            $productPager.empty();
            return;
        }

        $productTable.html(`
            <div class="table-head">
                <span>ID</span><span>Image</span><span>Category</span><span>Name</span><span>Stock</span><span>Price</span><span>Actions</span>
            </div>
            ${rows.map((item) => `
                <div class="table-row">
                    <span>#${item.item_id}</span>
                    <span class="thumb-cell">${imageUrl(item.img_path) ? `<img src="${imageUrl(item.img_path)}" alt="${itemName(item)}">` : ''}</span>
                    <span>${item.category || 'Uncategorized'}</span>
                    <span>${itemName(item)}</span>
                    <span>${Number(item.Stock?.quantity ?? item.quantity ?? 0)}</span>
                    <span>${formatMoney(item.sell_price)}</span>
                    <span class="row-actions">
                        <button type="button" class="ghost-btn edit-product" data-id="${item.item_id}">Edit</button>
                        <button type="button" class="ghost-btn toggle-product" data-id="${item.item_id}">${item.deleted_at ? 'Restore' : 'Disable'}</button>
                    </span>
                </div>
            `).join('')}
        `);
        renderPager($productPager, page, totalPages, (nextPage) => { productPage = nextPage; renderProducts(); });
    };

    const renderOrders = () => {
        const q = String($orderSearch.val() || '').toLowerCase();
        const filtered = orders.filter((order) => {
            const customer = `${order.Customer?.User?.name || ''} ${order.Customer?.User?.email || ''}`.toLowerCase();
            return !q || customer.includes(q) || String(order.order_id).includes(q) || String(order.status || '').toLowerCase().includes(q);
        });
        const { rows, totalPages, page } = paginate(filtered, orderPage);
        orderPage = page;

        if (!filtered.length) {
            $orderTable.html('<p class="empty-state">No orders found.</p>');
            $orderPager.empty();
            return;
        }

        $orderTable.html(`
            <div class="table-head">
                <span>ID</span><span>Customer</span><span>Status</span><span>Date</span><span>Total</span><span>Actions</span>
            </div>
            ${rows.map((order) => `
                <div class="table-row">
                    <span>#${order.order_id}</span>
                    <span>${order.Customer?.User?.name || order.Customer?.User?.email || `Customer #${order.customer_id}`}</span>
                    <span>
                        <select class="order-status" data-id="${order.order_id}">
                            ${['pending','processing','completed','cancelled'].map((s) => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </span>
                    <span>${formatDate(order.date_placed)}</span>
                    <span>${formatMoney(order.total_amount)}</span>
                    <span><button type="button" class="ghost-btn save-order" data-id="${order.order_id}">Save</button></span>
                </div>
            `).join('')}
        `);
        renderPager($orderPager, page, totalPages, (nextPage) => { orderPage = nextPage; renderOrders(); });
    };

    const renderUsers = () => {
        const q = String($userSearch.val() || '').toLowerCase();
        const filtered = users.filter((user) => {
            const hay = `${user.name || ''} ${user.email || ''} ${user.role || ''}`.toLowerCase();
            return !q || hay.includes(q);
        });
        const { rows, totalPages, page } = paginate(filtered, userPage);
        userPage = page;

        if (!filtered.length) {
            $userTable.html('<p class="empty-state">No users found.</p>');
            $userPager.empty();
            return;
        }

        $userTable.html(`
            <div class="table-head">
                <span>ID</span><span>Image</span><span>Name</span><span>Email</span><span>Role</span><span>Status</span><span>Actions</span>
            </div>
            ${rows.map((user) => `
                <div class="table-row">
                    <span>#${user.id}</span>
                    <span class="thumb-cell">${imageUrl(user.image_path) ? `<img src="${imageUrl(user.image_path)}" alt="${user.name || 'User'}">` : ''}</span>
                    <span>${user.fname || user.name || 'Unnamed user'}${user.lname ? ` ${user.lname}` : ''}</span>
                    <span>${user.email}</span>
                    <span>
                        <select class="user-role" data-id="${user.id}">
                            <option value="customer" ${user.role === 'customer' ? 'selected' : ''}>customer</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>admin</option>
                        </select>
                    </span>
                    <span>${user.deleted_at ? 'Disabled' : 'Active'}</span>
                    <span class="row-actions">
                        <button type="button" class="ghost-btn save-user-role" data-id="${user.id}">Save</button>
                        <button type="button" class="ghost-btn toggle-user" data-id="${user.id}">${user.deleted_at ? 'Restore' : 'Deactivate'}</button>
                    </span>
                </div>
            `).join('')}
        `);
        renderPager($userPager, page, totalPages, (nextPage) => { userPage = nextPage; renderUsers(); });
    };

    const renderProfile = async () => {
        const profile = await request('GET', '/profile');
        $profileCard.html(`
            <div class="profile-grid">
                <div><span>Name</span><strong>${profile.user.name || ''}</strong></div>
                <div><span>Email</span><strong>${profile.user.email || ''}</strong></div>
                <div><span>Role</span><strong>${profile.user.role || 'admin'}</strong></div>
                <div><span>Created</span><strong>${formatDate(profile.user.created_at)}</strong></div>
            </div>
        `);
    };

    const validateProduct = () => {
        const category = String($('#productCategory').val() || '').trim();
        const name = String($('#productName').val() || '').trim();
        const cost = String($('#productCost').val() || '').trim();
        const sell = String($('#productSell').val() || '').trim();

        if (!category) { notify('Please enter a category.', 'error'); return false; }
        if (!name) { notify('Please enter a product name.', 'error'); return false; }
        if (!cost) { notify('Please enter a cost price.', 'error'); return false; }
        if (!sell) { notify('Please enter a sell price.', 'error'); return false; }
        return true;
    };

    const loadDashboard = async () => {
        const [productRes, orderRes, userRes] = await Promise.allSettled([
            request('GET', '/items'),
            request('GET', '/orders'),
            request('GET', '/users')
        ]);

        if (productRes.status === 'fulfilled') {
            products = productRes.value.rows || [];
        } else {
            products = [];
            notify(productRes.reason?.responseJSON?.error || productRes.reason?.message || 'Products could not load', 'error');
        }

        if (orderRes.status === 'fulfilled') {
            orders = orderRes.value.orders || [];
        } else {
            orders = [];
            notify(orderRes.reason?.responseJSON?.error || orderRes.reason?.message || 'Orders could not load', 'error');
        }

        if (userRes.status === 'fulfilled') {
            users = userRes.value.rows || [];
        } else {
            users = [];
            notify(userRes.reason?.responseJSON?.error || userRes.reason?.message || 'Users could not load', 'error');
        }

        productPage = 1;
        orderPage = 1;
        userPage = 1;
        updateStats();
        renderProducts();
        renderOrders();
        renderUsers();
        renderCharts();
    };

    const loadSession = async () => {
        showBoot();
        const token = getToken();
        if (!token) {
            showAuth();
            return;
        }

        try {
            const response = await request('GET', '/me');
            currentUser = response.user;
            if (currentUser.role !== 'admin') {
                window.location.replace('/index.html');
                return;
            }
            showApp();
            setPanel('dashboard');
            await loadDashboard();
            await renderProfile();
            hideBoot();
        } catch {
            clearToken();
            showAuth();
        }
    };

    $authTabs.on('click', function () {
        setMode($(this).data('auth-tab'));
    });

    $authForm.on('submit', async function (event) {
        event.preventDefault();
        if (!validateAuth()) return;
        setMessage('Please wait...');
        try {
            const payload = {
                email: $emailInput.val(),
                password: $passwordInput.val()
            };
            if (mode === 'register') payload.name = $nameInput.val();
            const response = await request('POST', mode === 'register' ? '/register' : '/login', payload);
            setToken(response.token);
            currentUser = response.user;
            if (response.user.role !== 'admin') {
                window.location.replace('/index.html');
                return;
            }
            showApp();
            setPanel('dashboard');
            await loadDashboard();
            await renderProfile();
            hideBoot();
        } catch (error) {
            setMessage(error.responseJSON?.message || error.responseJSON?.error || error.message || 'Login failed', true);
            hideBoot();
        }
    });

    $('#logoutBtn').on('click', async () => {
        try { await request('POST', '/logout'); } catch {}
        clearToken();
        currentUser = null;
        showAuth();
        hideBoot();
    });

    $navRoutes.on('click', function () {
        const panel = $(this).data('route');
        setPanel(panel);
        if (panel === 'dashboard') loadDashboard();
        if (panel === 'charts') renderCharts();
        if (panel === 'profile') renderProfile();
    });

    $('#newProductBtn').on('click', () => setPanel('products'));
    $('#refreshProductsBtn').on('click', loadDashboard);
    $('#refreshOrdersBtn').on('click', loadDashboard);
    $('#refreshUsersBtn').on('click', loadDashboard);
    $('#refreshProfileBtn').on('click', renderProfile);
    $refreshChartsBtn.on('click', renderCharts);
    $productSearch.on('input', () => { productPage = 1; renderProducts(); });
    $orderSearch.on('input', () => { orderPage = 1; renderOrders(); });
    $userSearch.on('input', () => { userPage = 1; renderUsers(); });

    $('#adminProductTable').on('click', '.toggle-product', async function () {
        const id = $(this).data('id');
        const item = products.find((p) => Number(p.item_id) === Number(id));
        if (!item) return;
        try {
            if (item.deleted_at) {
                await request('PATCH', `/items/${id}/restore`);
            } else {
                await request('DELETE', `/items/${id}`);
            }
            await loadDashboard();
            notify('Product updated');
        } catch (error) {
            notify(error.message || 'Product update failed', 'error');
        }
    });

    $('#adminProductTable').on('click', '.edit-product', function () {
        const id = $(this).data('id');
        const item = products.find((p) => Number(p.item_id) === Number(id));
        if (!item) return;
        $('#productId').val(item.item_id);
        $('#productName').val(itemName(item));
        $('#productCategory').val(item.category || 'Uncategorized');
        $('#productDescription').val(item.description || '');
        $('#productCost').val(item.cost_price || '');
        $('#productSell').val(item.sell_price || '');
        $('#productQty').val(item.Stock?.quantity ?? item.quantity ?? 0);
        setPanel('products');
    });

    $('#productForm').on('submit', async function (event) {
        event.preventDefault();
        if (!validateProduct()) return;
        try {
            const formData = new FormData(this);
            formData.set('name', $('#productName').val());
            formData.set('category', $('#productCategory').val() || 'Uncategorized');
            formData.set('description', $('#productDescription').val());
            formData.set('quantity', $('#productQty').val());
            const id = $('#productId').val();
            const path = id ? `/items/${id}` : '/items';
            const method = id ? 'PUT' : 'POST';
            await request(method, path, formData);
            this.reset();
            await loadDashboard();
            notify('Product saved');
        } catch (error) {
            notify(error.message || 'Save failed', 'error');
        }
    });

    $('#adminOrderTable').on('click', '.save-order', async function () {
        const id = $(this).data('id');
        const status = $(`#adminOrderTable .order-status[data-id="${id}"]`).val();
        try {
            await request('PATCH', `/orders/${id}/status`, { status });
            await loadDashboard();
            notify('Order updated');
        } catch (error) {
            notify(error.message || 'Order update failed', 'error');
        }
    });

    $('#adminUserTable').on('click', '.save-user-role', async function () {
        const id = $(this).data('id');
        const role = $(`#adminUserTable .user-role[data-id="${id}"]`).val();
        try {
            await request('PATCH', `/users/${id}/role`, { role });
            await loadDashboard();
            notify('Role updated');
        } catch (error) {
            notify(error.message || 'Role update failed', 'error');
        }
    });

    $('#adminUserTable').on('click', '.toggle-user', async function () {
        const id = $(this).data('id');
        const user = users.find((u) => Number(u.id) === Number(id));
        try {
            if (user?.deleted_at) {
                await request('PATCH', `/users/${id}/restore`);
            } else {
                await request('PATCH', `/users/${id}/deactivate`);
            }
            await loadDashboard();
            notify('User updated');
        } catch (error) {
            notify(error.message || 'User update failed', 'error');
        }
    });

    setMode('login');
    loadSession();
})();

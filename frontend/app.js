const form = document.querySelector('#authForm');
const message = document.querySelector('#message');
const nameField = document.querySelector('.name-field');
const nameInput = document.querySelector('#name');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const submitButton = document.querySelector('.submit');
const tabs = document.querySelectorAll('.tab');
const authView = document.querySelector('#authView');
const homePage = document.querySelector('#homePage');
const customerHeader = document.querySelector('.customer-only');
const adminHeader = document.querySelector('#adminHeader');
const adminLogoutBtn = document.querySelector('#adminLogoutBtn');
const accountName = document.querySelector('#accountName');
const accountEmail = document.querySelector('#accountEmail');
const logoutBtn = document.querySelector('#logoutBtn');
const productSections = document.querySelector('#productSections');
const profileSection = document.querySelector('#profileSection');
const customerProfileName = document.querySelector('#customerProfileName');
const customerProfileEmail = document.querySelector('#customerProfileEmail');
const customerProfileRole = document.querySelector('#customerProfileRole');
const customerProfileMeta = document.querySelector('#customerProfileMeta');
const customerOrdersList = document.querySelector('#customerOrdersList');
const refreshCustomerProfile = document.querySelector('#refreshCustomerProfile');
const adminDashboard = document.querySelector('#adminDashboard');
const adminRouteButtons = document.querySelectorAll('[data-admin-route]');
const adminRoutePanels = document.querySelectorAll('[data-admin-panel]');
const productPage = document.querySelector('#productPage');
const openProductPageBtn = document.querySelector('#openProductPageBtn');
const addProductCard = document.querySelector('#addProductCard');
const itemManager = document.querySelector('#itemManager');
const productForm = document.querySelector('#productForm');
const productMessage = document.querySelector('#productMessage');
const productList = document.querySelector('#productList');
const reloadProducts = document.querySelector('#reloadProducts');
const orderList = document.querySelector('#orderList');
const reloadOrders = document.querySelector('#reloadOrders');
const userList = document.querySelector('#userList');
const reloadUsers = document.querySelector('#reloadUsers');
const profileName = document.querySelector('#profileName');
const profileEmail = document.querySelector('#profileEmail');
const profileRole = document.querySelector('#profileRole');
const profileDetails = document.querySelector('#profileDetails');
const refreshProfile = document.querySelector('#refreshProfile');
const adminUserCount = document.querySelector('#adminUserCount');
const adminProductCount = document.querySelector('#adminProductCount');
const adminOrderCount = document.querySelector('#adminOrderCount');
const adminRevenueCount = document.querySelector('#adminRevenueCount');
const featuredProductCard = document.querySelector('#featuredProductCard');
const featuredProductArt = document.querySelector('#featuredProductArt');
const featuredProductName = document.querySelector('#featuredProductName');
const featuredProductDescription = document.querySelector('#featuredProductDescription');
const featuredProductPrice = document.querySelector('#featuredProductPrice');
const productIdInput = document.querySelector('#productId');
const productCategoryInput = document.querySelector('#productCategory');
const productSubmit = document.querySelector('#productSubmit');
const productImageInput = document.querySelector('#productImage');
const productDescriptionInput = document.querySelector('#productDescription');
const productCostInput = document.querySelector('#productCost');
const productSellInput = document.querySelector('#productSell');
const productQuantityInput = document.querySelector('#productQuantity');
const cancelEditBtn = document.querySelector('#cancelEditBtn');

const cartSection = document.querySelector('#cartSection');
const cartBackdrop = document.querySelector('#cartBackdrop');
const cartLink = document.querySelector('#cartLink');
const cartCount = document.querySelector('#cartCount');
const cartItems = document.querySelector('#cartItems');
const cartSubtotal = document.querySelector('#cartSubtotal');
const cartTotal = document.querySelector('#cartTotal');
const cancelCartBtn = document.querySelector('#cancelCartBtn');
const checkoutBtn = document.querySelector('#checkoutBtn');
const closeCartBtn = document.querySelector('#closeCartBtn');
const continueShopping = document.querySelector('#continueShopping');
const notificationBanner = document.querySelector('#notificationBanner');
const adminOnlyNodes = document.querySelectorAll('.admin-only');
const adminHomeLink = document.querySelector('.admin-home-link');
let frontendMode = document.body.dataset.frontend || 'customer';
const currentPath = window.location.pathname.toLowerCase();
const isAdminPage = currentPath.endsWith('/adminindex.html') || currentPath.endsWith('/indexadmin.html');
const authStorageKeys = ['auth_token', 'auth_token_admin', 'auth_token_customer'];
const pageAuthStorageKey = isAdminPage ? 'auth_token_admin' : 'auth_token_customer';
const heroSection = document.querySelector('.hero');
const statsGridSection = document.querySelector('.stats-grid');
const productsSection = document.querySelector('#products');
const cartSectionHost = document.querySelector('#cartSection');
const cartBackdropHost = document.querySelector('#cartBackdrop');
const aboutSection = document.querySelector('#about');

let mode = 'login';
let editingProductId = null;
let currentUser = null;
let allProducts = [];
let sessionCart = [];
let notificationTimer = null;
let redirectTimer = null;
let customerProfileData = null;
let customerOrdersData = [];

const setCustomerHomepageVisibility = (visible) => {
    [heroSection, statsGridSection, productsSection, cartSectionHost, cartBackdropHost, aboutSection, profileSection]
        .filter(Boolean)
        .forEach((node) => {
            node.classList.toggle('hidden', !visible);
        });
};

const getToken = () => {
    const keys = [pageAuthStorageKey, ...authStorageKeys.filter((key) => key !== pageAuthStorageKey)];
    for (const key of keys) {
        const token = localStorage.getItem(key);
        if (token) {
            return token;
        }
    }
    return null;
};

const endBoot = () => {
    document.body.classList.remove('is-booting');
};

const setToken = (token) => {
    authStorageKeys.forEach((key) => localStorage.setItem(key, token));
};

const clearToken = () => {
    authStorageKeys.forEach((key) => localStorage.removeItem(key));
};

const loadSessionCart = () => {
    sessionCart = [];
};

const saveSessionCart = () => {
    updateCartUI();
};

const showMessage = (text, isError = false) => {
    message.textContent = text;
    message.classList.toggle('error', isError);
};

const showProductMessage = (text, isError = false) => {
    productMessage.textContent = text;
    productMessage.classList.toggle('error', isError);
};

const cancelRedirectTimer = () => {
    if (redirectTimer) {
        window.clearTimeout(redirectTimer);
        redirectTimer = null;
    }
};

const cancelNotificationTimer = () => {
    if (notificationTimer) {
        window.clearTimeout(notificationTimer);
        notificationTimer = null;
    }
};

const showSoftNotification = (text, detail = '', type = 'success') => {
    if (!notificationBanner) {
        return;
    }

    const bannerText = notificationBanner.querySelector('[data-banner-text]');
    const bannerDetail = notificationBanner.querySelector('[data-banner-detail]');

    notificationBanner.classList.remove('success', 'error', 'is-visible');
    notificationBanner.classList.add(type === 'error' ? 'error' : 'success');

    if (bannerText) {
        bannerText.textContent = text;
    }

    if (bannerDetail) {
        bannerDetail.textContent = detail;
        bannerDetail.style.display = detail ? 'block' : 'none';
    }

    notificationBanner.classList.add('is-visible');
    cancelNotificationTimer();
    cancelRedirectTimer();
    notificationTimer = window.setTimeout(() => {
        notificationBanner.classList.remove('is-visible');
    }, 1800);
};

const redirectToHome = () => {
    hideCart();
    if (frontendMode === 'admin') {
        location.hash = '#adminDashboard';
        return;
    }
    location.hash = '#home';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const redirectHomeAfterNotice = (message) => {
    showSoftNotification(message, 'Redirecting to the homepage.');
    cancelRedirectTimer();
    redirectTimer = window.setTimeout(() => {
        redirectToHome();
    }, 1400);
};

const api = async (path, options = {}) => {
    const token = getToken();
    const headers = { ...(options.headers || {}) };

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`/api/v1${path}`, {
        ...options,
        headers
    });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || data.error || 'Request failed');
    }

    return data;
};

const formatPrice = (value) => {
    const amount = Number(value || 0);
    return `$${amount.toFixed(2)}`;
};

const parseMoney = (value) => {
    const amount = Number(String(value ?? 0).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(amount) ? amount : 0;
};

const formatDate = (value) => {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleString();
};

const adminHashToRoute = (hash = location.hash) => {
    const normalized = String(hash || '').toLowerCase();

    if (normalized === '#adminorders' || normalized === '#admin-orders') {
        return 'orders';
    }

    if (normalized === '#adminusers' || normalized === '#admin-users') {
        return 'users';
    }

    if (normalized === '#adminprofile' || normalized === '#admin-profile') {
        return 'profile';
    }

    if (normalized === '#adminproducts' || normalized === '#admin-products') {
        return 'products';
    }

    return 'home';
};

const adminRouteToHash = (route) => {
    if (route === 'home') {
        return '#adminDashboard';
    }

    return `#admin-${route}`;
};

const renderAdminProfile = () => {
    if (!profileDetails) {
        return;
    }

    const user = currentUser || {};
    const role = user.role || 'customer';

    if (profileName) {
        profileName.textContent = user.name || 'Admin profile';
    }

    if (profileEmail) {
        profileEmail.textContent = user.email || 'No email available.';
    }

    if (profileRole) {
        profileRole.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    }

    profileDetails.innerHTML = `
        <div class="profile-row"><span>Name</span><strong>${user.name || 'Unnamed user'}</strong></div>
        <div class="profile-row"><span>Email</span><strong>${user.email || 'No email available'}</strong></div>
        <div class="profile-row"><span>Role</span><strong>${role}</strong></div>
        <div class="profile-row"><span>Account created</span><strong>${formatDate(user.created_at)}</strong></div>
        <div class="profile-row"><span>Last updated</span><strong>${formatDate(user.updated_at)}</strong></div>
    `;
};

const renderOrders = (orders) => {
    if (!orderList) {
        return;
    }

    if (!orders || orders.length === 0) {
        orderList.innerHTML = '<p class="empty-list">No orders yet.</p>';
        return;
    }

    orderList.innerHTML = `
        <div class="inventory-head order-head">
            <span>ID</span>
            <span>Customer</span>
            <span>Items</span>
            <span>Placed</span>
            <span>Status</span>
            <span>Total</span>
        </div>
        ${orders.map(order => {
            const customer = order.Customer?.User?.name || order.Customer?.User?.email || `Customer #${order.customer_id}`;
            const orderItems = Array.isArray(order.OrderItems) ? order.OrderItems : [];
            const itemsMarkup = orderItems.map((line) => {
                const itemName = line.Item?.description || `Item #${line.item_id}`;
                return `<span class="order-item-chip">${itemName} × ${line.quantity}</span>`;
            }).join('');
            const statusOptions = ['processing', 'completed', 'cancelled'];
            const adminControls = frontendMode === 'admin' ? `
                <div class="admin-order-controls">
                    <select class="order-status-select" data-order-status>
                        ${statusOptions.map((status) => `<option value="${status}" ${status === order.status ? 'selected' : ''}>${status}</option>`).join('')}
                    </select>
                    <button type="button" class="row-action save-status-action" data-action="save-order-status" data-id="${order.order_id}">Save</button>
                </div>
            ` : `<span class="item-status ${order.status === 'cancelled' ? 'status-disabled' : 'status-active'}">${order.status || 'pending'}</span>`;

            return `
                <article class="inventory-row order-row ${frontendMode === 'admin' ? 'is-editable' : ''}" data-order-id="${order.order_id}">
                    <span class="item-id">#${order.order_id}</span>
                    <span class="item-name">${customer}</span>
                    <span class="order-items">${itemsMarkup || '<span class="order-item-chip">No items</span>'}</span>
                    <span>${formatDate(order.date_placed)}</span>
                    <span class="order-status-cell">${adminControls}</span>
                    <span class="order-total">${formatPrice(order.total_amount)}</span>
                </article>
            `;
        }).join('')}
    `;
};

const formatOrderDate = (value) => {
    if (!value) {
        return 'Recently';
    }

    return new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const renderCustomerProfileCard = (user) => {
    if (!profileSection) {
        return;
    }

    const role = user?.role || 'customer';

    if (customerProfileName) {
        customerProfileName.textContent = user?.name || 'Unnamed user';
    }

    if (customerProfileEmail) {
        customerProfileEmail.textContent = user?.email || 'No email available';
    }

    if (customerProfileRole) {
        customerProfileRole.textContent = role;
    }

    if (customerProfileMeta) {
        customerProfileMeta.innerHTML = `
            <div class="profile-meta-row"><span>Status</span><strong>Verified</strong></div>
            <div class="profile-meta-row"><span>User ID</span><strong>#${user?.id || '—'}</strong></div>
            <div class="profile-meta-row"><span>Joined</span><strong>${formatDate(user?.created_at)}</strong></div>
            <div class="profile-meta-row"><span>Last update</span><strong>${formatDate(user?.updated_at)}</strong></div>
        `;
    }
};

const renderCustomerOrders = (orders = []) => {
    if (!customerOrdersList) {
        return;
    }

    if (!orders.length) {
        customerOrdersList.innerHTML = '<p class="empty-list">No orders yet.</p>';
        return;
    }

    customerOrdersList.innerHTML = orders.map((order) => {
        const orderItems = Array.isArray(order.OrderItems) ? order.OrderItems : [];
        const itemCount = orderItems.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
        const lineMarkup = orderItems.map((line) => {
            const name = line.Item?.description || `Item #${line.item_id}`;
            return `
                <div class="order-line-item">
                    <span>${name}</span>
                    <strong>x${line.quantity}</strong>
                </div>
            `;
        }).join('');

        return `
            <article class="customer-order-card" data-order-id="${order.order_id}">
                <button type="button" class="customer-order-toggle" data-action="toggle-order" aria-expanded="false">
                    <div class="customer-order-summary">
                        <span class="customer-order-number">Order #${order.order_id}</span>
                        <strong>${formatPrice(order.total_amount)}</strong>
                        <small>${formatOrderDate(order.date_placed)} · ${itemCount} item${itemCount === 1 ? '' : 's'}</small>
                    </div>
                    <span class="customer-order-chevron" data-chevron>v</span>
                </button>
                <div class="customer-order-details hidden">
                    <div class="customer-order-meta">
                        <span>Status: <strong>${order.status || 'pending'}</strong></span>
                        <span>Subtotal: <strong>${formatPrice(order.subtotal)}</strong></span>
                        <span>Shipping: <strong>${formatPrice(order.shipping)}</strong></span>
                    </div>
                    <div class="customer-order-items">
                        ${lineMarkup || '<p class="empty-list">No items found.</p>'}
                    </div>
                </div>
            </article>
        `;
    }).join('');
};

const renderCustomerProfileView = (profile) => {
    if (!profileSection) {
        return;
    }

    const user = profile?.user || currentUser || {};
    const customer = profile?.customer || {};

    if (customerProfileName) {
        customerProfileName.textContent = user.name || 'Unnamed user';
    }

    if (customerProfileEmail) {
        customerProfileEmail.textContent = user.email || 'No email available';
    }

    if (customerProfileRole) {
        customerProfileRole.textContent = user.role || 'customer';
    }

    if (customerProfileMeta) {
        customerProfileMeta.innerHTML = `
            <div class="profile-meta-row"><span>First name</span><strong>${customer.fname || '—'}</strong></div>
            <div class="profile-meta-row"><span>Last name</span><strong>${customer.lname || '—'}</strong></div>
            <div class="profile-meta-row"><span>Address</span><strong>${customer.addressline || '—'}</strong></div>
            <div class="profile-meta-row"><span>Zipcode</span><strong>${customer.zipcode || '—'}</strong></div>
            <div class="profile-meta-row"><span>Phone</span><strong>${customer.phone || '—'}</strong></div>
        `;
    }

    const refreshButton = profileSection.querySelector('#refreshCustomerProfile') || refreshCustomerProfile;
    if (refreshButton) {
        refreshButton.onclick = () => showCustomerProfile();
    }
};

const renderAdminProfileForm = (profile) => {
    if (!profileDetails) {
        return;
    }

    const user = profile?.user || currentUser || {};
    const customer = profile?.customer || {};

    if (profileName) {
        profileName.textContent = `${customer.fname || user.name || 'Admin'} ${customer.lname || ''}`.trim();
    }

    if (profileEmail) {
        profileEmail.textContent = user.email || 'No email available.';
    }

    if (profileRole) {
        profileRole.textContent = (user.role || 'admin').charAt(0).toUpperCase() + (user.role || 'admin').slice(1);
    }

    profileDetails.innerHTML = `
        <form id="adminProfileForm" class="profile-form">
            <div class="form-grid">
                <label class="field">
                    <span>First name</span>
                    <input name="fname" type="text" value="${customer.fname || ''}" placeholder="Mina">
                </label>
                <label class="field">
                    <span>Last name</span>
                    <input name="lname" type="text" value="${customer.lname || ''}" placeholder="Plushlover">
                </label>
            </div>
            <label class="field">
                <span>Address</span>
                <input name="addressline" type="text" value="${customer.addressline || ''}" placeholder="123 Cozy Lane">
            </label>
            <div class="form-grid">
                <label class="field">
                    <span>Zipcode</span>
                    <input name="zipcode" type="text" value="${customer.zipcode || ''}" placeholder="10001">
                </label>
                <label class="field">
                    <span>Phone</span>
                    <input name="phone" type="text" value="${customer.phone || ''}" placeholder="555-123-4567">
                </label>
            </div>
            <label class="field">
                <span>Profile image</span>
                <input name="image" type="file" accept="image/png, image/jpeg, image/jpg">
            </label>
            <div class="profile-form-actions">
                <button type="submit" class="submit">Save profile</button>
            </div>
            <p class="message" id="adminProfileMessage"></p>
        </form>
    `;

    profileDetails.dataset.userId = String(user.id || '');
};

const loadProfilePayload = async () => {
    const data = await api('/profile');
    currentUser = data.user;
    customerProfileData = data;
    return data;
};

const loadCustomerDashboard = async () => {
    const profile = await loadProfilePayload();
    renderCustomerProfileView(profile);
    const ordersResponse = await api('/my-orders');
    customerOrdersData = ordersResponse.orders || [];
    renderCustomerOrders(customerOrdersData);
};

const loadAdminProfile = async () => {
    const profile = await loadProfilePayload();
    renderAdminProfileForm(profile);
};

const renderAdminOverviewStats = ({ users = 0, products = 0, orders = 0, revenue = 0 } = {}) => {
    if (adminUserCount) {
        adminUserCount.textContent = String(users);
    }

    if (adminProductCount) {
        adminProductCount.textContent = String(products);
    }

    if (adminOrderCount) {
        adminOrderCount.textContent = String(orders);
    }

    if (adminRevenueCount) {
        adminRevenueCount.textContent = formatPrice(revenue);
    }
};

const loadAdminOverviewStats = async () => {
    try {
        const [usersResponse, itemsResponse, ordersResponse] = await Promise.all([
            api('/users'),
            api('/items'),
            api('/orders')
        ]);

        const users = Array.isArray(usersResponse.rows) ? usersResponse.rows : [];
        const items = Array.isArray(itemsResponse.rows) ? itemsResponse.rows : [];
        const orders = Array.isArray(ordersResponse.orders) ? ordersResponse.orders : [];
        const revenue = orders.reduce((sum, order) => sum + parseMoney(order.total_amount), 0);

        renderAdminOverviewStats({
            users: users.length,
            products: items.length,
            orders: orders.length,
            revenue
        });
    } catch (error) {
        renderAdminOverviewStats();
    }
};

const loadCustomerProfile = async () => {
    try {
        await loadCustomerDashboard();
    } catch (error) {
        clearToken();
        currentUser = null;
        showAuth();
        showMessage(error.message, true);
    }
};

const showCustomerProfile = async () => {
    if (!profileSection) {
        return;
    }

    if (frontendMode !== 'customer') {
        return;
    }

    profileSection.classList.remove('hidden');
    await loadCustomerProfile();
    profileSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const hideCustomerProfile = () => {
    if (!profileSection) {
        return;
    }

    profileSection.classList.add('hidden');
};

const toggleCustomerOrder = (orderId) => {
    const card = customerOrdersList?.querySelector(`[data-order-id="${orderId}"]`);
    if (!card) {
        return;
    }

    const details = card.querySelector('.customer-order-details');
    const toggle = card.querySelector('.customer-order-toggle');
    const chevron = card.querySelector('[data-chevron]');
    const isOpen = !details.classList.contains('hidden');

    details.classList.toggle('hidden', isOpen);
    toggle.setAttribute('aria-expanded', String(!isOpen));
    if (chevron) {
        chevron.textContent = isOpen ? 'v' : '^';
    }
};

const showAdminProfile = async () => {
    if (frontendMode !== 'admin') {
        return;
    }

    await loadAdminProfile();
};

const loadOrders = async () => {
    if (!orderList) {
        return;
    }

    try {
        const data = await api('/orders');
        renderOrders(data.orders || []);
    } catch (error) {
        orderList.innerHTML = '<p class="empty-list">Unable to load orders.</p>';
    }
};

const normalizeCartItem = (cartItem, index = 0) => ({
    cartitem_id: cartItem.cartitem_id || cartItem.id || index + 1,
    item_id: cartItem.Item?.item_id || cartItem.item_id,
    description: cartItem.Item?.description || cartItem.description,
    sell_price: cartItem.Item?.sell_price || cartItem.sell_price,
    img_path: cartItem.Item?.img_path || cartItem.img_path,
    quantity: Number(cartItem.quantity || 0)
});

const getImageUrl = (item) => {
    if (!item.img_path) {
        return '';
    }

    const normalized = String(item.img_path).replace(/^\/+/, '');
    return `/${normalized}`;
};

const getItemQuantity = (item) => {
    if (item.Stock) {
        return item.Stock.quantity;
    }

    if (Array.isArray(item.Stocks) && item.Stocks[0]) {
        return item.Stocks[0].quantity;
    }

    return item.quantity || 0;
};

const getCardArtClass = (item) => {
    const quantity = Number(getItemQuantity(item));
    const palette = ['art-one', 'art-two', 'art-three', 'art-four'];
    return palette[quantity % palette.length];
};

const normalizeCategory = (value) => String(value || '').trim() || 'Uncategorized';

const getProductCardMarkup = (item) => {
    const imageUrl = getImageUrl(item);
    const artClass = getCardArtClass(item);
    const quantity = getItemQuantity(item);
    const isOutOfStock = quantity === 0;
    const category = normalizeCategory(item.category);

    return `
        <article class="product-card ${isOutOfStock ? 'out-of-stock' : ''}">
            <div class="product-art ${artClass}" ${imageUrl ? `style="background-image: url(${imageUrl}); background-size: cover; background-position: center;"` : ''}></div>
            <span class="category-pill">${category}</span>
            <h3>${item.description || 'Untitled product'}</h3>
            <p>Stock: ${quantity}</p>
            <strong>${formatPrice(item.sell_price)}</strong>
            <button type="button" class="add-to-cart-btn" data-item-id="${item.item_id}" ${isOutOfStock ? 'disabled' : ''}>
                ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
        </article>
    `;
};

const renderGroupedProducts = (items) => {
    if (!productSections) {
        return;
    }

    const activeItems = Array.isArray(items) ? items.filter((item) => !item.deleted_at) : [];

    if (activeItems.length === 0) {
        productSections.innerHTML = '<p class="empty-list">No products yet.</p>';
        return;
    }

    const groupedItems = activeItems.reduce((groups, item) => {
        const category = normalizeCategory(item.category);
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(item);
        return groups;
    }, {});

    const groupedHtml = Object.entries(groupedItems)
        .sort(([leftCategory], [rightCategory]) => leftCategory.localeCompare(rightCategory))
        .map(([category, categoryItems]) => `
            <section class="product-section">
                <div class="section-heading product-section-heading">
                    <div>
                        <p class="eyebrow">Product section</p>
                        <h3>${category}</h3>
                    </div>
                    <span class="category-pill">${categoryItems.length} item${categoryItems.length === 1 ? '' : 's'}</span>
                </div>
                <div class="product-grid">
                    ${categoryItems.map((item) => getProductCardMarkup(item)).join('')}
                </div>
            </section>
        `)
        .join('');

    productSections.innerHTML = groupedHtml;
};

const updateCartUI = () => {
    if (!cartCount || !cartItems || !cartSubtotal || !cartTotal || !checkoutBtn) {
        return;
    }

    const totalItems = sessionCart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'inline-grid' : 'none';

    if (sessionCart.length === 0) {
        cartItems.innerHTML = '<p class="empty-list">Your cart is empty</p>';
        cartSubtotal.textContent = '$0.00';
        cartTotal.textContent = '$0.00';
        checkoutBtn.disabled = true;
    } else {
        let subtotal = 0;
        cartItems.innerHTML = sessionCart.map((cartItem, idx) => {
            const item = allProducts.find(p => p.item_id === cartItem.item_id) || cartItem;
            if (!item) return '';

            const itemTotal = Number(item.sell_price) * Number(cartItem.quantity);
            subtotal += itemTotal;

            return `
                <div class="cart-item" data-cart-idx="${idx}">
                    <div class="cart-item-image">
                        ${getImageUrl(item) ? `<img src="${getImageUrl(item)}" alt="${item.description}">` : '<div class="image-placeholder">No image</div>'}
                    </div>
                    <div class="cart-item-info">
                        <h4>${item.description}</h4>
                        <p>${formatPrice(item.sell_price)} × ${cartItem.quantity}</p>
                    </div>
                    <div class="cart-item-qty">
                        <button type="button" class="qty-btn minus-btn" data-action="decrease">−</button>
                        <span>${cartItem.quantity}</span>
                        <button type="button" class="qty-btn plus-btn" data-action="increase">+</button>
                    </div>
                    <div class="cart-item-total">
                        <strong>${formatPrice(itemTotal)}</strong>
                        <button type="button" class="remove-btn" data-action="remove">Remove</button>
                    </div>
                </div>
            `;
        }).join('');

        const shipping = subtotal > 0 ? 100 : 0;
        const total = subtotal + shipping;

        cartSubtotal.textContent = formatPrice(subtotal);
        cartTotal.textContent = formatPrice(total);
        checkoutBtn.disabled = false;
    }
};

const syncCustomerCart = async () => {
    try {
        const data = await api('/cart');
        const items = data?.cart?.items || [];
        sessionCart = items.map((item, index) => normalizeCartItem(item, index));
        updateCartUI();
        return sessionCart;
    } catch (error) {
        sessionCart = [];
        updateCartUI();
        return [];
    }
};

const addToSessionCart = async (itemId, quantity = 1) => {
    const item = allProducts.find(p => p.item_id === itemId);
    if (!item) return false;

    try {
        await api('/cart/add', {
            method: 'POST',
            body: JSON.stringify({ itemId, quantity })
        });
        await syncCustomerCart();
        showMessage('Added to cart!');
        return true;
    } catch (error) {
        showMessage(error.message, true);
        return false;
    }
};

const updateSessionCartQty = async (idx, quantity) => {
    if (idx < 0 || idx >= sessionCart.length) return false;

    const cartItem = sessionCart[idx];

    if (quantity <= 0) {
        return removeFromSessionCart(idx);
    }

    try {
        await api('/cart/item', {
            method: 'PUT',
            body: JSON.stringify({
                cartItemId: cartItem.cartitem_id,
                quantity
            })
        });
        await syncCustomerCart();
        return true;
    } catch (error) {
        showMessage(error.message, true);
        return false;
    }
};

const removeFromSessionCart = async (idx) => {
    if (idx >= 0 && idx < sessionCart.length) {
        const cartItem = sessionCart[idx];
        try {
            await api('/cart/item', {
                method: 'DELETE',
                body: JSON.stringify({ cartItemId: cartItem.cartitem_id })
            });
            await syncCustomerCart();
            return true;
        } catch (error) {
            showMessage(error.message, true);
            return false;
        }
    }
    return false;
};

const clearSessionCart = async () => {
    try {
        await api('/cart', { method: 'DELETE' });
        sessionCart = [];
        updateCartUI();
        return true;
    } catch (error) {
        showMessage(error.message, true);
        return false;
    }
};

const checkout = async () => {
    if (!sessionCart || sessionCart.length === 0) {
        showSoftNotification('Your cart is empty.', 'Add a plush before checking out.', 'error');
        return;
    }

    try {
        const response = await api('/create-order', {
            method: 'POST',
            body: JSON.stringify({ cart: sessionCart.map(item => ({ item_id: item.item_id, quantity: item.quantity })) })
        });

        if (response.success || response.order_id) {
            await clearSessionCart();
            redirectHomeAfterNotice('Checkout successful.');
        }
    } catch (error) {
        showSoftNotification('Checkout failed.', error.message, 'error');
    }
};

const renderFeaturedProduct = (item) => {
    if (!featuredProductCard || !featuredProductArt || !featuredProductName || !featuredProductDescription || !featuredProductPrice) {
        return;
    }

    if (!item) {
        featuredProductCard.className = 'product-card featured-product-card';
        featuredProductArt.className = 'product-art art-one';
        featuredProductArt.style.backgroundImage = '';
        featuredProductArt.style.backgroundSize = '';
        featuredProductArt.style.backgroundPosition = '';
        featuredProductName.textContent = 'No product yet';
        featuredProductDescription.textContent = 'Create a product to display it here.';
        featuredProductPrice.textContent = '$0.00';
        return;
    }

    const imageUrl = getImageUrl(item);
    const artClass = getCardArtClass(item);

    featuredProductCard.className = 'product-card featured-product-card has-product';
    featuredProductArt.className = `product-art ${artClass}`;
    featuredProductArt.style.backgroundImage = imageUrl ? `url(${imageUrl})` : '';
    featuredProductArt.style.backgroundSize = imageUrl ? 'cover' : '';
    featuredProductArt.style.backgroundPosition = imageUrl ? 'center' : '';
    featuredProductName.textContent = item.description || 'Untitled product';
    featuredProductDescription.textContent = `${normalizeCategory(item.category)} · Qty ${getItemQuantity(item)} · Item #${item.item_id}`;
    featuredProductPrice.textContent = formatPrice(item.sell_price);
};

const resetProductForm = () => {
    editingProductId = null;
    productIdInput.value = '';
    productSubmit.textContent = 'Add product';
    productForm.reset();
    cancelEditBtn.classList.add('hidden');
    showProductMessage('');
};

const startEditingProduct = (item) => {
    showProductPage();
    editingProductId = item.item_id;
    productIdInput.value = item.item_id;
    if (productCategoryInput) {
        productCategoryInput.value = normalizeCategory(item.category);
    }
    productDescriptionInput.value = item.description || '';
    productCostInput.value = item.cost_price || '';
    productSellInput.value = item.sell_price || '';
    productQuantityInput.value = getItemQuantity(item);
    productImageInput.value = '';
    productSubmit.textContent = 'Update product';
    cancelEditBtn.classList.remove('hidden');
    showProductMessage(`Editing item #${item.item_id}`);
    productForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const setAdminRoute = (route, syncHash = true) => {
    const activeRoute = route || 'home';

    adminRouteButtons.forEach((button) => {
        button.classList.toggle('active', button.dataset.adminRoute === activeRoute);
    });

    adminRoutePanels.forEach((panel) => {
        panel.classList.toggle('hidden', panel.dataset.adminPanel !== activeRoute);
    });

    if (activeRoute === 'profile') {
        renderAdminProfile();
    }

    if (syncHash) {
        location.hash = adminRouteToHash(activeRoute);
    }
};

const showAdminDashboard = (route = adminHashToRoute()) => {
    if (!adminDashboard || !productPage) {
        return;
    }

    adminDashboard.classList.remove('hidden');
    productPage.classList.add('hidden');

    const isAdmin = currentUser?.role === 'admin';
    addProductCard.classList.toggle('hidden', !isAdmin);

    setAdminRoute(route, false);

    if (route === 'orders') {
        loadOrders();
    } else if (route === 'home') {
        loadAdminOverviewStats();
        loadProducts();
        loadUsers();
    } else {
        loadProducts();
        loadUsers();
    }

    if (route === 'profile') {
        showAdminProfile();
    }
};

const showProductPage = () => {
    if (!adminDashboard || !productPage) {
        return;
    }

    adminDashboard.classList.add('hidden');
    productPage.classList.remove('hidden');
    location.hash = 'productPage';
};

const renderProductList = (items) => {
    if (!items.length) {
        productList.innerHTML = '<p class="empty-list">No products yet.</p>';
        return;
    }

    productList.innerHTML = `
        <div class="inventory-head">
            <span>ID</span>
            <span>Image</span>
            <span>Category</span>
            <span>Product name</span>
            <span>Quantity</span>
            <span>Price</span>
            <span class="actions-head">Status</span>
            <span class="actions-head">Actions</span>
        </div>
        ${items.map(item => {
            const imageUrl = getImageUrl(item);
            const quantity = getItemQuantity(item);
            const isDisabled = Boolean(item.deleted_at);
            return `
                <article class="inventory-row ${isDisabled ? 'is-disabled' : ''}">
                    <span class="item-id">#${item.item_id}</span>
                    <span class="item-image-cell">
                        ${imageUrl ? `<img src="${imageUrl}" alt="${item.description || 'Product'}">` : '<div class="image-placeholder">No image</div>'}
                    </span>
                    <span class="item-category">${normalizeCategory(item.category)}</span>
                    <span class="item-name">${item.description || 'Untitled product'}</span>
                    <span class="item-quantity">${quantity}</span>
                    <span class="item-price">${formatPrice(item.sell_price)}</span>
                    <span class="item-status ${isDisabled ? 'status-disabled' : 'status-active'}">${isDisabled ? 'Disabled' : 'Active'}</span>
                    <span class="item-actions">
                        <button type="button" class="row-action edit-action" data-action="edit" data-id="${item.item_id}" ${isDisabled ? 'disabled' : ''}>Edit</button>
                        ${isDisabled
                ? `<button type="button" class="row-action recover-action" data-action="restore" data-id="${item.item_id}">Recover</button>`
                : `<button type="button" class="row-action delete-action" data-action="delete" data-id="${item.item_id}">Disable</button>`}
                    </span>
                </article>
            `;
        }).join('')}
    `;
};

const renderUserList = (users) => {
    if (!users.length) {
        userList.innerHTML = '<p class="empty-list">No users yet.</p>';
        return;
    }

    userList.innerHTML = `
        <div class="inventory-head user-head">
            <span>ID</span>
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span>Actions</span>
        </div>
        ${users.map(user => {
            const isDisabled = Boolean(user.deleted_at);
            return `
                <article class="inventory-row user-row ${isDisabled ? 'is-disabled' : ''}" data-user-id="${user.id}">
                    <span class="item-id">#${user.id}</span>
                    <span class="user-name">${user.name || 'Unnamed user'}</span>
                    <span class="user-email">${user.email}</span>
                    <span>
                        <select class="user-role-select" data-user-role>
                            <option value="customer" ${user.role === 'customer' ? 'selected' : ''}>Customer</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </span>
                    <span class="item-status ${isDisabled ? 'status-disabled' : 'status-active'}">${isDisabled ? 'Disabled' : 'Active'}</span>
                    <span class="item-actions user-actions">
                        <button type="button" class="row-action save-role-action" data-action="save-role" data-id="${user.id}">Save role</button>
                        ${isDisabled
                ? `<button type="button" class="row-action recover-action" data-action="restore-user" data-id="${user.id}">Recover</button>`
                : `<button type="button" class="row-action delete-action" data-action="deactivate-user" data-id="${user.id}">Deactivate</button>`}
                    </span>
                </article>
            `;
        }).join('')}
    `;
};

const loadProducts = async () => {
    try {
        const data = await api('/items');
        const items = data.rows || [];
        allProducts = items;
        const activeItems = items.filter(item => !item.deleted_at);
        const featuredItem = activeItems
            .slice()
            .sort((leftItem, rightItem) => {
                const categoryCompare = normalizeCategory(leftItem.category).localeCompare(normalizeCategory(rightItem.category));
                if (categoryCompare !== 0) {
                    return categoryCompare;
                }
                return Number(rightItem.item_id) - Number(leftItem.item_id);
            })[0] || null;

        renderFeaturedProduct(featuredItem);
        renderGroupedProducts(activeItems);
        renderProductList(items);
        updateCartUI();
    } catch (error) {
        renderFeaturedProduct(null);
        productList.innerHTML = '<p class="empty-list">Unable to load products.</p>';
        if (productSections) {
            productSections.innerHTML = '<p class="empty-list">Unable to load products.</p>';
        }
    }
};

const loadUsers = async () => {
    try {
        const data = await api('/users');
        renderUserList(data.rows || []);
    } catch (error) {
        userList.innerHTML = '<p class="empty-list">Unable to load users.</p>';
    }
};

const setMode = (nextMode) => {
    mode = nextMode;
    tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.mode === mode));
    nameField.classList.toggle('hidden', mode !== 'register');
    nameInput.required = mode === 'register';
    submitButton.textContent = mode === 'register' ? 'Create account' : 'Login';
    showMessage('');
};

const showHome = (user) => {
    authView.classList.add('hidden');
    homePage.classList.remove('hidden');
    hideCustomerProfile();
    hideCart();
    accountName.textContent = user.name || 'Plush Palette';
    accountEmail.textContent = user.email || '';
    const isAdmin = user.role === 'admin';
    frontendMode = isAdmin ? 'admin' : 'customer';

    if (isAdminPage && !isAdmin) {
        window.location.replace('/index.html');
        return;
    }

    if (!isAdminPage && isAdmin) {
        window.location.replace('/adminindex.html');
        return;
    }

    customerHeader?.classList.toggle('hidden', isAdmin);
    adminHeader?.classList.toggle('hidden', !isAdmin);

    adminOnlyNodes.forEach((node) => {
        node.classList.toggle('hidden', !isAdmin);
    });

    if (frontendMode === 'admin' && isAdmin) {
        setCustomerHomepageVisibility(false);
        loadProducts();
        if (adminDashboard) {
            adminDashboard.classList.remove('hidden');
        }
        if (productPage) {
            productPage.classList.add('hidden');
        }
        showAdminDashboard(adminHashToRoute());
        return;
    }

    setCustomerHomepageVisibility(true);
    loadProducts();
    syncCustomerCart();

    if (adminDashboard) {
        adminDashboard.classList.add('hidden');
    }
    if (productPage) {
        productPage.classList.add('hidden');
    }

    if (frontendMode === 'customer' && (location.hash === '#profile' || location.hash === '#orders')) {
        showCustomerProfile();
    } else {
        location.hash = '#home';
    }

    endBoot();
};

const showAuth = () => {
    homePage.classList.add('hidden');
    authView.classList.remove('hidden');
    hideCustomerProfile();
    hideCart();
    customerHeader?.classList.remove('hidden');
    adminHeader?.classList.add('hidden');
    adminOnlyNodes.forEach((node) => node.classList.add('hidden'));
    endBoot();
};

const loadCurrentUser = async () => {
    const token = getToken();
    if (!token) {
        showAuth();
        return;
    }

    try {
        const data = await api('/me');
        currentUser = data.user;
        frontendMode = currentUser?.role === 'admin' ? 'admin' : 'customer';
        showHome(data.user);
        if (frontendMode === 'admin' && currentUser?.role === 'admin') {
            await loadAdminOverviewStats();
            await loadAdminProfile();
        } else {
            await api('/cart/merge', { method: 'POST' }).catch(() => {});
            await syncCustomerCart();
        }
    } catch (error) {
        clearToken();
        showAuth();
        showMessage(error.message, true);
        endBoot();
    }
};

const hideCart = () => {
    cartSection.style.display = 'none';
    cartSection.classList.add('hidden');
    cartBackdrop.classList.add('hidden');
};

tabs.forEach(tab => {
    tab.addEventListener('click', () => setMode(tab.dataset.mode));
});

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    showMessage('Please wait...');

    try {
        const payload = {
            email: emailInput.value,
            password: passwordInput.value
        };

        if (mode === 'register') {
            payload.name = nameInput.value;
        }

        const data = await api(mode === 'register' ? '/register' : '/login', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        setToken(data.token);
        currentUser = data.user;
        frontendMode = currentUser?.role === 'admin' ? 'admin' : 'customer';
        showHome(data.user);
        showMessage(data.message || 'Success');
        form.reset();
    } catch (error) {
        showMessage(error.message, true);
    } finally {
        submitButton.disabled = false;
    }
});

adminRouteButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const route = button.dataset.adminRoute || 'home';
        if (route === 'home') {
            showAdminDashboard('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        showAdminDashboard(route);
        if (route === 'profile') {
            showAdminProfile();
        }
    });
});

adminHomeLink?.addEventListener('click', (event) => {
    event.preventDefault();
    hideCustomerProfile();
    adminDashboard?.classList.add('hidden');
    productPage?.classList.add('hidden');
    location.hash = '#home';
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

cartLink?.addEventListener('click', (e) => {
    e.preventDefault();
    if (cartSection.style.display === 'none' || !cartSection.style.display) {
        cartSection.style.display = 'flex';
        cartSection.classList.remove('hidden');
        cartBackdrop.classList.remove('hidden');
        syncCustomerCart();
    } else {
        hideCart();
    }
});

closeCartBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    hideCart();
});

continueShopping?.addEventListener('click', (e) => {
    e.preventDefault();
    hideCart();
    location.hash = '#products';
});

cancelCartBtn?.addEventListener('click', async (e) => {
    e.preventDefault();

    const confirmed = window.confirm('Cancel this cart and return to the homepage?');
    if (!confirmed) {
        return;
    }

    if (await clearSessionCart()) {
        redirectHomeAfterNotice('Cart canceled.');
    }
});

cartBackdrop?.addEventListener('click', (e) => {
    if (e.target === cartBackdrop) {
        hideCart();
    }
});

checkoutBtn?.addEventListener('click', checkout);

cartItems?.addEventListener('click', async (event) => {
    const btn = event.target.closest('button');
    if (!btn) return;

    const action = btn.dataset.action;
    const cartItem = btn.closest('.cart-item');
    const cartIdx = cartItem?.dataset.cartIdx;

    if (cartIdx === undefined) return;
    const idx = Number(cartIdx);

    if (action === 'remove') {
        removeFromSessionCart(idx);
    } else if (action === 'increase') {
        const qtySpan = cartItem.querySelector('span');
        const newQty = Number(qtySpan.textContent) + 1;
        updateSessionCartQty(idx, newQty);
    } else if (action === 'decrease') {
        const qtySpan = cartItem.querySelector('span');
        const newQty = Number(qtySpan.textContent) - 1;
        updateSessionCartQty(idx, Math.max(0, newQty));
    }
});

productSections?.addEventListener('click', async (event) => {
    if (event.target.classList.contains('add-to-cart-btn')) {
        const itemId = Number(event.target.dataset.itemId);
        addToSessionCart(itemId, 1);
    }
});

reloadProducts?.addEventListener('click', loadProducts);
reloadOrders?.addEventListener('click', loadOrders);
reloadUsers?.addEventListener('click', loadUsers);
refreshProfile?.addEventListener('click', () => showAdminProfile());
if (refreshCustomerProfile) {
    refreshCustomerProfile.onclick = () => showCustomerProfile();
}

openProductPageBtn?.addEventListener('click', () => {
    resetProductForm();
    showProductPage();
});

cancelEditBtn?.addEventListener('click', () => {
    resetProductForm();
    showAdminDashboard();
});

productList?.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');

    if (!button) {
        return;
    }

    const itemId = button.dataset.id;
    const action = button.dataset.action;

    if (action === 'edit') {
        try {
            const data = await api(`/items/${itemId}`);
            const item = Array.isArray(data.result) ? data.result[0] : data.result;
            if (item && item.deleted_at) {
                showProductMessage('Disabled products cannot be edited', true);
                return;
            }
            if (item) {
                startEditingProduct(item);
            }
        } catch (error) {
            showProductMessage(error.message, true);
        }
    }

    if (action === 'delete') {
        const confirmed = window.confirm('Soft delete this product?');
        if (!confirmed) {
            return;
        }

        try {
            await api(`/items/${itemId}`, { method: 'DELETE' });
            showProductMessage('Product disabled');
            if (editingProductId === itemId) {
                resetProductForm();
            }
            await loadProducts();
        } catch (error) {
            showProductMessage(error.message, true);
        }
    }

    if (action === 'restore') {
        try {
            await api(`/items/${itemId}/restore`, { method: 'PATCH' });
            showProductMessage('Product recovered');
            await loadProducts();
        } catch (error) {
            showProductMessage(error.message, true);
        }
    }
});

userList?.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');

    if (!button) {
        return;
    }

    const userId = button.dataset.id;
    const action = button.dataset.action;
    const row = button.closest('.user-row');
    const roleSelect = row?.querySelector('[data-user-role]');

    if (action === 'save-role') {
        try {
            await api(`/users/${userId}/role`, {
                method: 'PATCH',
                body: JSON.stringify({ role: roleSelect.value })
            });
            showSoftNotification('User role updated');
            await loadUsers();
        } catch (error) {
            showSoftNotification('User update failed.', error.message, 'error');
        }
    }

    if (action === 'deactivate-user') {
        const confirmed = window.confirm('Deactivate this user?');
        if (!confirmed) {
            return;
        }

        try {
            await api(`/users/${userId}/deactivate`, { method: 'PATCH' });
            showSoftNotification('User deactivated');
            await loadUsers();
        } catch (error) {
            showSoftNotification('User update failed.', error.message, 'error');
        }
    }

    if (action === 'restore-user') {
        try {
            await api(`/users/${userId}/restore`, { method: 'PATCH' });
            showSoftNotification('User recovered');
            await loadUsers();
        } catch (error) {
            showSoftNotification('User update failed.', error.message, 'error');
        }
    }
});

profileDetails?.addEventListener('submit', async (event) => {
    const form = event.target.closest('#adminProfileForm');
    if (!form) {
        return;
    }

    event.preventDefault();

    const messageNode = profileDetails?.querySelector('#adminProfileMessage');
    if (messageNode) {
        messageNode.textContent = 'Saving profile...';
        messageNode.classList.remove('error');
    }

    try {
        const formData = new FormData(form);
        const result = await api('/update-profile', {
            method: 'POST',
            body: formData
        });

        showSoftNotification('Profile updated successfully');
        customerProfileData = { ...(customerProfileData || {}), customer: result.customer };
        await loadAdminProfile();
    } catch (error) {
        if (messageNode) {
            messageNode.textContent = error.message;
            messageNode.classList.add('error');
        }
        showSoftNotification('Profile update failed.', error.message, 'error');
    }
});

customerOrdersList?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action="toggle-order"]');
    if (!button) {
        return;
    }

    const orderCard = button.closest('[data-order-id]');
    const orderId = orderCard?.dataset.orderId;
    if (!orderId) {
        return;
    }

    toggleCustomerOrder(orderId);
});

productForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    showProductMessage('Saving...');

    try {
        const formData = new FormData(productForm);
        const itemPath = editingProductId ? `/items/${editingProductId}` : '/items';
        const method = editingProductId ? 'PUT' : 'POST';
        const wasEditing = Boolean(editingProductId);

        const data = await api(itemPath, {
            method,
            body: formData
        });

        if (data.item) {
            renderFeaturedProduct(data.item);
        }

        const messageText = wasEditing ? 'Product updated' : 'Product added';
        resetProductForm();
        showSoftNotification(messageText);
        showAdminDashboard();
    } catch (error) {
        showSoftNotification('Product save failed.', error.message, 'error');
    }
});

orderList?.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action="save-order-status"]');
    if (!button) {
        return;
    }

    const row = button.closest('[data-order-id]');
    const orderId = row?.dataset.orderId;
    const statusSelect = row?.querySelector('[data-order-status]');

    if (!orderId || !statusSelect) {
        return;
    }

    try {
        await api(`/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: statusSelect.value })
        });

        showSoftNotification('Order status updated');
        await loadOrders();
    } catch (error) {
        showSoftNotification('Order update failed.', error.message, 'error');
    }
});

window.addEventListener('hashchange', () => {
    hideCustomerProfile();

    if (frontendMode === 'customer' && (location.hash === '#profile' || location.hash === '#orders')) {
        if (!currentUser) {
            location.hash = '#home';
            return;
        }

        showCustomerProfile();
        return;
    }

    if (frontendMode === 'admin' && location.hash === '#profile') {
        if (currentUser?.role !== 'admin') {
            location.hash = '#home';
            return;
        }

        showAdminDashboard('profile');
        showAdminProfile();
        return;
    }

    if (location.hash === '#productPage') {
        if (currentUser?.role !== 'admin') {
            location.hash = '#home';
            return;
        }
        showProductPage();
        return;
    }

    if (location.hash === '#adminDashboard' || location.hash === '#admin') {
        if (currentUser?.role !== 'admin') {
            location.hash = '#home';
            return;
        }
        showAdminDashboard('home');
        return;
    }

    if (location.hash.toLowerCase().startsWith('#admin-')) {
        if (currentUser?.role !== 'admin') {
            location.hash = '#home';
            return;
        }
        showAdminDashboard(adminHashToRoute());
        if (adminHashToRoute() === 'profile') {
            showAdminProfile();
        }
    }
});

logoutBtn?.addEventListener('click', async () => {
    try {
        await api('/logout', { method: 'POST' });
    } catch (error) {
        console.log(error.message);
    }

    clearToken();
    currentUser = null;
    showAuth();
    showMessage('Logged out');
    endBoot();
});

adminLogoutBtn?.addEventListener('click', () => {
    logoutBtn.click();
});

setMode('login');
loadSessionCart();
updateCartUI();
hideCart();
loadCurrentUser();

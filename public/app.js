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
const accountName = document.querySelector('#accountName');
const accountEmail = document.querySelector('#accountEmail');
const logoutBtn = document.querySelector('#logoutBtn');
const productCarousel = document.querySelector('#productCarousel');
const prevProduct = document.querySelector('#prevProduct');
const nextProduct = document.querySelector('#nextProduct');
const adminDashboard = document.querySelector('#adminDashboard');
const productPage = document.querySelector('#productPage');
const openProductPageBtn = document.querySelector('#openProductPageBtn');
const addProductCard = document.querySelector('#addProductCard');
const itemManager = document.querySelector('#itemManager');
const productForm = document.querySelector('#productForm');
const productMessage = document.querySelector('#productMessage');
const productList = document.querySelector('#productList');
const reloadProducts = document.querySelector('#reloadProducts');
const userList = document.querySelector('#userList');
const reloadUsers = document.querySelector('#reloadUsers');
const featuredProductCard = document.querySelector('#featuredProductCard');
const featuredProductArt = document.querySelector('#featuredProductArt');
const featuredProductName = document.querySelector('#featuredProductName');
const featuredProductDescription = document.querySelector('#featuredProductDescription');
const featuredProductPrice = document.querySelector('#featuredProductPrice');
const productIdInput = document.querySelector('#productId');
const productSubmit = document.querySelector('#productSubmit');
const productImageInput = document.querySelector('#productImage');
const productDescriptionInput = document.querySelector('#productDescription');
const productCostInput = document.querySelector('#productCost');
const productSellInput = document.querySelector('#productSell');
const productQuantityInput = document.querySelector('#productQuantity');
const cancelEditBtn = document.querySelector('#cancelEditBtn');

let mode = 'login';
let editingProductId = null;
let currentUser = null;

const getToken = () => localStorage.getItem('auth_token');
const setToken = (token) => localStorage.setItem('auth_token', token);
const clearToken = () => localStorage.removeItem('auth_token');

const showMessage = (text, isError = false) => {
    message.textContent = text;
    message.classList.toggle('error', isError);
};

const showProductMessage = (text, isError = false) => {
    productMessage.textContent = text;
    productMessage.classList.toggle('error', isError);
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

const getPriceValue = (item) => Number(item.sell_price || item.cost_price || 0);

const getCardArtClass = (item) => {
    const quantity = Number(getItemQuantity(item));
    const palette = ['art-one', 'art-two', 'art-three', 'art-four'];
    return palette[quantity % palette.length];
};

const renderFeaturedProduct = (item) => {
    if (!item) {
        featuredProductCard.className = 'product-card featured-product-card';
        featuredProductArt.className = 'product-art art-one';
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
    featuredProductDescription.textContent = `Qty ${getItemQuantity(item)} · Item #${item.item_id}`;
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

const showAdminDashboard = () => {
    adminDashboard.classList.remove('hidden');
    productPage.classList.add('hidden');
    location.hash = 'adminDashboard';
    
    const isAdmin = currentUser?.role === 'admin';
    addProductCard.classList.toggle('hidden', !isAdmin);
    itemManager.classList.toggle('hidden', !isAdmin);
    
    loadProducts();
    loadUsers();
};

const showProductPage = () => {
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
        const featuredItem = items.find(item => !item.deleted_at) || items[0] || null;
        renderFeaturedProduct(featuredItem);
        renderProductList(items);
    } catch (error) {
        renderFeaturedProduct(null);
        productList.innerHTML = '<p class="empty-list">Unable to load products.</p>';
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
    accountName.textContent = user.name || 'NS Shop';
    accountEmail.textContent = user.email || '';
    
    if (user.role === 'admin') {
        showAdminDashboard();
    } else {
        adminDashboard.classList.add('hidden');
        productPage.classList.add('hidden');
    }
};

const showAuth = () => {
    homePage.classList.add('hidden');
    authView.classList.remove('hidden');
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
        showHome(data.user);
    } catch (error) {
        clearToken();
        showAuth();
        showMessage(error.message, true);
    }
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
        showHome(data.user);
        showMessage(data.message || 'Success');
        form.reset();
    } catch (error) {
        showMessage(error.message, true);
    } finally {
        submitButton.disabled = false;
    }
});

prevProduct.addEventListener('click', () => {
    productCarousel.scrollBy({ left: -280, behavior: 'smooth' });
});

nextProduct.addEventListener('click', () => {
    productCarousel.scrollBy({ left: 280, behavior: 'smooth' });
});

reloadProducts.addEventListener('click', loadProducts);
reloadUsers.addEventListener('click', loadUsers);

openProductPageBtn.addEventListener('click', () => {
    resetProductForm();
    showProductPage();
});

cancelEditBtn.addEventListener('click', () => {
    resetProductForm();
    showAdminDashboard();
});

productList.addEventListener('click', async (event) => {
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

userList.addEventListener('click', async (event) => {
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
            showProductMessage('User role updated');
            await loadUsers();
        } catch (error) {
            showProductMessage(error.message, true);
        }
    }

    if (action === 'deactivate-user') {
        const confirmed = window.confirm('Deactivate this user?');
        if (!confirmed) {
            return;
        }

        try {
            await api(`/users/${userId}/deactivate`, { method: 'PATCH' });
            showProductMessage('User deactivated');
            await loadUsers();
        } catch (error) {
            showProductMessage(error.message, true);
        }
    }

    if (action === 'restore-user') {
        try {
            await api(`/users/${userId}/restore`, { method: 'PATCH' });
            showProductMessage('User recovered');
            await loadUsers();
        } catch (error) {
            showProductMessage(error.message, true);
        }
    }
});

productForm.addEventListener('submit', async (event) => {
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
        showProductMessage(messageText);
        showAdminDashboard();
    } catch (error) {
        showProductMessage(error.message, true);
    }
});

window.addEventListener('hashchange', () => {
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
        showAdminDashboard();
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await api('/logout', { method: 'POST' });
    } catch (error) {
        console.log(error.message);
    }

    clearToken();
    currentUser = null;
    showAuth();
    showMessage('Logged out');
});

setMode('login');
loadCurrentUser();

(function () {
    const {
        request, setToken, getToken, clearToken, formatMoney, formatDate,
        notify, showBoot, hideBoot
    } = window.PlushApp;

    const $authScreen = $('#authScreen');
    const $customerApp = $('#customerApp');
    const $authForm = $('#authForm');
    const $authMessage = $('#authMessage');
    const $authSubmit = $('#authSubmit');
    const $nameField = $('#nameField');
    const $nameInput = $('#nameInput');
    const $emailInput = $('#emailInput');
    const $passwordInput = $('#passwordInput');
    const $authTabs = $('.auth-tab');
    const $cartPanel = $('#cartPanel');
    const $cartBackdrop = $('#cartBackdrop');
    const $cartList = $('#cartList');
    const $cartCount = $('#cartCount');
    const $cartSubtotal = $('#cartSubtotal');
    const $cartShipping = $('#cartShipping');
    const $cartTotal = $('#cartTotal');
    const $catalogList = $('#catalogList');
    const $searchInput = $('#searchInput');
    const $searchSuggestions = $('#searchSuggestions');
    const $profileSection = $('#profileSection');
    const $profileCard = $('#profileCard');
    const $profileForm = $('#profileForm');
    const $profileMessage = $('#profileMessage');
    const $profileAvatar = $('#profileAvatar');
    const $profileFirstName = $('#profileFirstName');
    const $profileLastName = $('#profileLastName');
    const $profileAddressLine = $('#profileAddressLine');
    const $profileZipcode = $('#profileZipcode');
    const $profilePhone = $('#profilePhone');
    const $profileImageInput = $('#profileImageInput');
    const $profileResetBtn = $('#profileResetBtn');
    const $profileTabs = $('.profile-tab');
    const $profilePanels = $('.profile-tab-panel');
    const $orderList = $('#orderList');
    const $productModal = $('#productModal');
    const $modalMainImage = $('#modalMainImage');
    const $modalThumbs = $('#modalThumbs');
    const $modalCategory = $('#modalCategory');
    const $productModalTitle = $('#productModalTitle');
    const $modalDescription = $('#modalDescription');
    const $modalPrice = $('#modalPrice');
    const $modalStock = $('#modalStock');
    const $modalAddCart = $('#modalAddCart');

    let mode = 'login';
    let currentUser = null;
    let products = [];
    let cart = [];
    let selectedProduct = null;
    let profileSnapshot = null;
    let activeProfileTab = 'details';

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

    const openApp = () => {
        $authScreen.addClass('hidden');
        $customerApp.removeClass('hidden');
    };

    const openAuth = () => {
        $customerApp.addClass('hidden');
        $authScreen.removeClass('hidden');
    };

    const renderCatalog = (items) => {
        const q = String($searchInput.val() || '').toLowerCase();
        const filtered = items.filter((item) =>
            !q ||
            String(item.description || '').toLowerCase().includes(q) ||
            String(item.category || '').toLowerCase().includes(q)
        );

        if (!filtered.length) {
            $catalogList.html('<p class="empty-state">No plushies found.</p>');
            $searchSuggestions.addClass('hidden').empty();
            return;
        }

        $catalogList.html(filtered.map((item) => {
            const stock = Number(item.Stock?.quantity ?? item.quantity ?? 0);
            const images = Array.isArray(item.images) && item.images.length ? item.images : (item.img_path ? [item.img_path] : []);
            const image = images.length ? `/${String(images[0]).replace(/^\/+/, '')}` : '';
            return `
                <article class="product-card product-open" data-id="${item.item_id}">
                    <div class="product-image"${image ? ` style="background-image:url('${image}')"` : ''}></div>
                    <span class="chip">${item.category || 'Uncategorized'}</span>
                    <h3>${item.description || 'Untitled plush'}</h3>
                    <p>Stock: ${stock}</p>
                    <strong>${formatMoney(item.sell_price)}</strong>
                    <button type="button" class="primary-btn add-cart" data-id="${item.item_id}" ${stock <= 0 ? 'disabled' : ''}>
                        ${stock <= 0 ? 'Out of stock' : 'Add to cart'}
                    </button>
                </article>
            `;
        }).join(''));

        const suggestions = filtered.slice(0, 5).map((item) => `
            <div class="suggestion-item" data-id="${item.item_id}">
                <strong>${item.description || 'Untitled plush'}</strong>
                <div>${item.category || 'Uncategorized'} · ${formatMoney(item.sell_price)}</div>
            </div>
        `).join('');
        $searchSuggestions.html(suggestions ? suggestions : '<div class="empty-state">No suggestions.</div>');
        $searchSuggestions.toggleClass('hidden', !q);
    };

    const renderCart = () => {
        $cartCount.text(cart.reduce((sum, line) => sum + Number(line.quantity || 0), 0));
        if (!cart.length) {
            $cartList.html('<p class="empty-state">Your cart is empty.</p>');
            $cartSubtotal.text('$0.00');
            $cartShipping.text('$0.00');
            $cartTotal.text('$0.00');
            return;
        }

        let subtotal = 0;
        $cartList.html(cart.map((line, index) => {
            const item = products.find((p) => Number(p.item_id) === Number(line.item_id)) || line;
            const lineTotal = Number(item.sell_price || 0) * Number(line.quantity || 0);
            subtotal += lineTotal;
            return `
                <div class="cart-line">
                    <div>
                        <strong>${item.description || 'Item'}</strong>
                        <p>${formatMoney(item.sell_price)} x ${line.quantity}</p>
                    </div>
                    <div class="cart-actions">
                        <button type="button" class="ghost-btn cart-step" data-step="-1" data-index="${index}">-</button>
                        <button type="button" class="ghost-btn cart-step" data-step="1" data-index="${index}">+</button>
                        <button type="button" class="ghost-btn cart-remove" data-index="${index}">Remove</button>
                    </div>
                </div>
            `;
        }).join(''));

        const shipping = subtotal > 0 ? 100 : 0;
        $cartSubtotal.text(formatMoney(subtotal));
        $cartShipping.text(formatMoney(shipping));
        $cartTotal.text(formatMoney(subtotal + shipping));
    };

    const openCart = () => {
        $cartPanel.removeClass('hidden is-closing');
        $cartBackdrop.removeClass('hidden');
        requestAnimationFrame(() => $cartPanel.addClass('is-open'));
    };

    const closeCart = () => {
        $cartPanel.removeClass('is-open');
        $cartBackdrop.addClass('hidden');
        window.setTimeout(() => $cartPanel.addClass('hidden'), 180);
    };

    const loadProducts = async () => {
        const response = await request('GET', '/items');
        products = response.rows || [];
        renderCatalog(products);
    };

    const openModal = (item) => {
        if (!item) return;
        selectedProduct = item;
        const images = Array.isArray(item.images) && item.images.length ? item.images : (item.img_path ? [item.img_path] : []);
        const normalizedImages = images.map((img) => `/${String(img).replace(/^\/+/, '')}`);
        const mainImage = normalizedImages[0] || '';

        $modalCategory.text(item.category || 'Uncategorized');
        $productModalTitle.text(item.description || 'Untitled plush');
        $modalDescription.text(item.description || '');
        $modalPrice.text(formatMoney(item.sell_price));
        $modalStock.text(String(Number(item.Stock?.quantity ?? item.quantity ?? 0)));
        $modalMainImage.css('background-image', mainImage ? `url("${mainImage}")` : 'none');
        $modalThumbs.html(normalizedImages.map((img, index) => `<button type="button" class="modal-thumb${index === 0 ? ' active' : ''}" data-src="${img}" style="background-image:url('${img}')"></button>`).join(''));
        $modalAddCart.prop('disabled', Number(item.Stock?.quantity ?? item.quantity ?? 0) <= 0);
        $modalAddCart.data('id', item.item_id);
        $productModal.removeClass('hidden').attr('aria-hidden', 'false');
    };

    const closeModal = () => {
        selectedProduct = null;
        $productModal.addClass('hidden').attr('aria-hidden', 'true');
    };

    const loadCart = async () => {
        try {
            const response = await request('GET', '/cart');
            cart = response?.cart?.items || [];
        } catch {
            cart = [];
        }
        renderCart();
    };

    const loadProfile = async () => {
        const profile = await request('GET', '/profile');
        const orders = await request('GET', '/my-orders');
        currentUser = profile.user;
        profileSnapshot = profile.customer || {};
        const image = profileSnapshot.image_path ? `/${String(profileSnapshot.image_path).replace(/^\/+/, '')}` : '';
        $profileCard.html(`
            <div class="profile-grid">
                <div><span>Name</span><strong>${profile.user.name || ''}</strong></div>
                <div><span>Email</span><strong>${profile.user.email || ''}</strong></div>
                <div><span>Joined</span><strong>${formatDate(profile.user.created_at)}</strong></div>
                <div><span>Role</span><strong>${profile.user.role || 'customer'}</strong></div>
            </div>
        `);
        $profileAvatar.css('background-image', image ? `url("${image}")` : 'none');
        $profileFirstName.val(profileSnapshot.fname || '');
        $profileLastName.val(profileSnapshot.lname || '');
        $profileAddressLine.val(profileSnapshot.addressline || '');
        $profileZipcode.val(profileSnapshot.zipcode || '');
        $profilePhone.val(profileSnapshot.phone || '');
        $profileImageInput.val('');
        $profileMessage.text('');

        const orderRows = (orders.orders || []).map((order) => `
            <article class="order-card">
                <strong>Order #${order.order_id}</strong>
                <p>Status: ${order.status || 'pending'}</p>
                <p>Total: ${formatMoney(order.total_amount)}</p>
                <p>Placed: ${formatDate(order.date_placed)}</p>
            </article>
        `).join('');
        $orderList.html(orderRows || '<p class="empty-state">No orders yet.</p>');
    };

    const saveProfile = async () => {
        const formData = new FormData();
        formData.append('fname', String($profileFirstName.val() || '').trim());
        formData.append('lname', String($profileLastName.val() || '').trim());
        formData.append('addressline', String($profileAddressLine.val() || '').trim());
        formData.append('zipcode', String($profileZipcode.val() || '').trim());
        formData.append('phone', String($profilePhone.val() || '').trim());
        const file = $profileImageInput[0]?.files?.[0];
        if (file) {
            formData.append('image', file);
        }
        return request('POST', '/update-profile', formData);
    };

    const setProfileTab = (tab) => {
        activeProfileTab = tab;
        $profileTabs.removeClass('active').filter(`[data-profile-tab="${tab}"]`).addClass('active');
        $profilePanels.each(function () {
            const isActive = String($(this).data('profile-panel')) === tab;
            $(this).toggleClass('hidden', !isActive);
        });
        if (tab === 'orders') {
            $profileSection[0]?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const loadSession = async () => {
        showBoot();
        const token = getToken();
        if (!token) {
            openAuth();
            hideBoot();
            return;
        }

        try {
            const response = await request('GET', '/me');
            currentUser = response.user;
            if (currentUser.role === 'admin') {
                window.location.replace('/adminindex.html');
                return;
            }
            openApp();
            await loadProducts();
            await loadCart();
            closeCart();
            hideBoot();
        } catch {
            clearToken();
            openAuth();
            hideBoot();
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
            if (response.user.role === 'admin') {
                window.location.replace('/adminindex.html');
                return;
            }
            openApp();
            await loadProducts();
            await loadCart();
            closeCart();
            setMessage(response.message || 'Success');
            hideBoot();
        } catch (error) {
            setMessage(error.responseJSON?.message || error.responseJSON?.error || error.message || 'Login failed', true);
            hideBoot();
        }
    });

    $('#logoutBtn').on('click', async function () {
        try {
            await request('POST', '/logout');
        } catch {}
        clearToken();
        currentUser = null;
        cart = [];
        openAuth();
        setMessage('Logged out');
        hideBoot();
    });

    $('#cartToggle').on('click', () => {
        if ($cartPanel.hasClass('is-open')) {
            closeCart();
        } else {
            openCart();
        }
    });
    $('#closeCartBtn, #cartBackdrop').on('click', closeCart);
    $('#refreshProfileBtn').on('click', loadProfile);
    $profileTabs.on('click', function () {
        setProfileTab(String($(this).data('profile-tab') || 'details'));
    });
    $('[data-open-profile]').on('click', async (event) => {
        event.preventDefault();
        $profileSection.removeClass('hidden');
        setProfileTab('details');
        await loadProfile();
        $profileSection[0].scrollIntoView({ behavior: 'smooth' });
    });
    $searchInput.on('input', () => renderCatalog(products));
    $searchInput.on('focus', () => {
        if (String($searchInput.val() || '').trim()) {
            $searchSuggestions.removeClass('hidden');
        }
    });
    $(document).on('click', (event) => {
        if (!$(event.target).closest('.section-head.search-head').length) {
            $searchSuggestions.addClass('hidden');
        }
    });
    $searchSuggestions.on('click', '.suggestion-item', function () {
        const id = $(this).data('id');
        const item = products.find((p) => Number(p.item_id) === Number(id));
        if (!item) return;
        $searchInput.val(item.description || '');
        renderCatalog(products);
        $('#catalog').get(0)?.scrollIntoView({ behavior: 'smooth' });
    });

    $catalogList.on('click', async function (event) {
        const button = event.target.closest('.add-cart');
        const card = event.target.closest('.product-open');
        if (card && !button) {
            const item = products.find((p) => Number(p.item_id) === Number(card.dataset.id));
            openModal(item);
            return;
        }
        if (!button) return;
        try {
            await request('POST', '/cart/add', { itemId: Number(button.dataset.id), quantity: 1 });
            await loadCart();
            notify('Added to cart');
        } catch (error) {
            notify(error.message || 'Could not add item', 'error');
        }
    });

    $modalThumbs.on('click', '.modal-thumb', function () {
        const src = $(this).data('src');
        $modalMainImage.css('background-image', `url("${src}")`);
        $('.modal-thumb').removeClass('active');
        $(this).addClass('active');
    });

    $productModal.on('click', '[data-close-modal]', closeModal);
    $modalAddCart.on('click', async function () {
        const id = $(this).data('id');
        if (!id) return;
        try {
            await request('POST', '/cart/add', { itemId: Number(id), quantity: 1 });
            await loadCart();
            closeModal();
            notify('Added to cart');
        } catch (error) {
            notify(error.message || 'Could not add item', 'error');
        }
    });

    $cartList.on('click', async function (event) {
        const remove = event.target.closest('.cart-remove');
        const step = event.target.closest('.cart-step');
        const index = Number((remove || step)?.dataset.index);
        if (Number.isNaN(index)) return;

        try {
            if (remove) {
                await request('DELETE', '/cart/item', { cartItemId: cart[index].cartitem_id });
            } else if (step) {
                const nextQty = Number(cart[index].quantity) + Number(step.dataset.step);
                if (nextQty <= 0) {
                    await request('DELETE', '/cart/item', { cartItemId: cart[index].cartitem_id });
                } else {
                    await request('PUT', '/cart/item', { cartItemId: cart[index].cartitem_id, quantity: nextQty });
                }
            }
            await loadCart();
        } catch (error) {
            notify(error.message || 'Cart update failed', 'error');
        }
    });

    $('#checkoutBtn').on('click', async () => {
        try {
            await request('POST', '/create-order', { cart });
            cart = [];
            await loadCart();
            notify('Checkout successful');
        } catch (error) {
            notify(error.message || 'Checkout failed', 'error');
        }
    });

    $profileResetBtn.on('click', () => {
        if (!profileSnapshot) return;
        $profileFirstName.val(profileSnapshot.fname || '');
        $profileLastName.val(profileSnapshot.lname || '');
        $profileAddressLine.val(profileSnapshot.addressline || '');
        $profileZipcode.val(profileSnapshot.zipcode || '');
        $profilePhone.val(profileSnapshot.phone || '');
        $profileImageInput.val('');
        $profileMessage.text('');
    });

    $profileImageInput.on('change', function () {
        const file = this.files?.[0];
        if (!file) {
            const current = profileSnapshot?.image_path ? `/${String(profileSnapshot.image_path).replace(/^\/+/, '')}` : '';
            $profileAvatar.css('background-image', current ? `url("${current}")` : 'none');
            return;
        }
        if (window.__profilePreviewUrl) {
            URL.revokeObjectURL(window.__profilePreviewUrl);
        }
        const previewUrl = URL.createObjectURL(file);
        window.__profilePreviewUrl = previewUrl;
        $profileAvatar.css('background-image', `url("${previewUrl}")`);
    });

    $profileForm.on('submit', async function (event) {
        event.preventDefault();
        $profileMessage.text('Saving profile...');
        try {
            await saveProfile();
            await loadProfile();
            notify('Profile updated');
        } catch (error) {
            const message = error.responseJSON?.message || error.responseJSON?.error || error.message || 'Profile update failed';
            $profileMessage.text(message);
            notify(message, 'error');
        }
    });

    setMode('login');
    loadSession();
})();

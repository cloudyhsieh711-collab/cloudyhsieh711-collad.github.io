document.addEventListener('DOMContentLoaded', () => {

    // === 1. 手機版漢堡選單切換 ===
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const primaryNav = document.getElementById('primary-menu');
    if (mobileMenuToggle && primaryNav) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            primaryNav.classList.toggle('active');
        });
    }

    // === 2. 服務項目 - 5 大小熊篩選功能 ===
    const filterButtons = document.querySelectorAll('.filter-btn');
    const serviceCards = document.querySelectorAll('.bear-service-card');

    function filterBears(category) {
        if (!serviceCards.length) return;
        serviceCards.forEach(card => {
            const cardCat = card.getAttribute('data-category');
            if (category === 'all' || cardCat === category) {
                card.style.display = 'block';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(15px)';
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });

        // 更新按鈕 active 樣式
        filterButtons.forEach(btn => {
            if (btn.getAttribute('data-bear') === category) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // 綁定頁面篩選按鈕
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-bear');
            filterBears(category);
        });
    });

    // 讀取 URL 參數 ?filter=xxx 進行初始篩選 (從其他頁面點選下拉選單過來時)
    const urlParams = new URLSearchParams(window.location.search);
    const initialFilter = urlParams.get('filter');
    if (initialFilter && serviceCards.length) {
        // 等待 CSS 動畫就緒後執行篩選
        setTimeout(() => {
            filterBears(initialFilter);
        }, 100);
    }


    // === 3. 購物車互動功能 (跨頁 localStorage 支援) ===
    let cart = [];
    try {
        const storedCart = localStorage.getItem('bear_cart');
        if (storedCart) {
            cart = JSON.parse(storedCart);
        }
    } catch (e) {
        console.error('讀取購物車快取失敗:', e);
    }

    const headerCartCount = document.getElementById('header-cart-count');
    const cartModal = document.getElementById('cart-modal');
    const openCartLink = document.getElementById('open-cart-link');
    const cartWidgetBtn = document.getElementById('cart-widget-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartTotalAmount = document.getElementById('cart-total-amount');

    function saveCart() {
        try {
            localStorage.setItem('bear_cart', JSON.stringify(cart));
        } catch (e) {
            console.error('儲存購物車快取失敗:', e);
        }
        updateCartBadge();
    }

    // 顯示/關閉購物車彈窗
    function toggleCartModal(show) {
        if (!cartModal) return;
        if (show) {
            cartModal.classList.add('active');
            renderCart();
        } else {
            cartModal.classList.remove('active');
        }
    }

    if (openCartLink) openCartLink.addEventListener('click', (e) => { e.preventDefault(); toggleCartModal(true); });
    if (cartWidgetBtn) cartWidgetBtn.addEventListener('click', () => toggleCartModal(true));
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCartModal(false));

    // 點擊彈窗外部關閉
    window.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            toggleCartModal(false);
        }
    });

    // 加入購物車按鈕
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.product-card');
            const id = card.getAttribute('data-id');
            const name = card.getAttribute('data-name');
            const price = parseInt(card.getAttribute('data-price'), 10);

            const existingItem = cart.find(item => item.id === id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ id, name, price, quantity: 1 });
            }

            saveCart();

            // 提示音效或簡單反饋
            btn.innerText = '已加入！';
            btn.style.backgroundColor = '#2ecc71';
            setTimeout(() => {
                btn.innerText = '加入購物車';
                btn.style.backgroundColor = 'var(--color-primary)';
            }, 1000);
        });
    });

    function updateCartBadge() {
        if (headerCartCount) {
            const totalQty = cart.reduce((acc, curr) => acc + curr.quantity, 0);
            headerCartCount.innerText = totalQty;
        }
    }

    function renderCart() {
        if (!cartItemsList) return;
        cartItemsList.innerHTML = '';
        if (cart.length === 0) {
            cartItemsList.innerHTML = '<p class="empty-cart-message">購物車目前空空如也...</p>';
            if (cartTotalAmount) cartTotalAmount.innerText = 'NT$ 0';
            return;
        }

        let total = 0;
        cart.forEach(item => {
            const row = document.createElement('div');
            row.className = 'cart-item-row';
            row.innerHTML = `
                <div>
                    <span class="cart-item-name">${item.name}</span>
                    <br>
                    <small style="color: var(--color-text-light);">數量: ${item.quantity}</small>
                </div>
                <div>
                    <span class="cart-item-price">NT$ ${(item.price * item.quantity).toLocaleString()}</span>
                    <button class="remove-item-btn" data-id="${item.id}">❌</button>
                </div>
            `;
            cartItemsList.appendChild(row);
            total += item.price * item.quantity;
        });

        if (cartTotalAmount) {
            cartTotalAmount.innerText = `NT$ ${total.toLocaleString()}`;
        }

        // 綁定刪除按鈕事件
        const removeBtns = cartItemsList.querySelectorAll('.remove-item-btn');
        removeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                cart = cart.filter(item => item.id !== id);
                saveCart();
                renderCart();
            });
        });
    }

    // 模擬結帳
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('您的購物車還是空的喔！');
                return;
            }
            alert('感謝您的訂購！系統即將跳轉到付款網頁（此為 WooCommerce 功能模擬）。');
            cart = [];
            saveCart();
            toggleCartModal(false);
        });
    }

    // 初始化購物車角標
    updateCartBadge();


    // === 4. 客服留言表單送出 ===
    const contactForm = document.getElementById('qa-contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('c-name').value;
            alert(`謝謝您，${name}！您的留言已送出，熊智 AI 心靈大使將儘速與您聯絡。`);
            contactForm.reset();
        });
    }


    // === 5. FAQ 手風琴摺疊面板 ===
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(btn => {
        btn.addEventListener('click', () => {
            const faqItem = btn.parentElement;
            const answer = faqItem.querySelector('.faq-answer');
            const isActive = faqItem.classList.contains('active');

            // 關閉其他已展開的項目
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
                const ans = item.querySelector('.faq-answer');
                if (ans) ans.style.maxHeight = null;
                const span = item.querySelector('.faq-question span');
                if (span) span.innerText = '+';
            });

            if (!isActive) {
                faqItem.classList.add('active');
                if (answer) answer.style.maxHeight = answer.scrollHeight + "px";
                const span = btn.querySelector('span');
                if (span) span.innerText = '-';
            }
        });
    });


    // === 6. 動態載入專欄文章 ===
    const blogContainer = document.getElementById('blog-posts-container');
    const emojis = ["🌃", "🧘", "🏠", "💡", "🧸", "❤️"]; // 備用隨機 Emoji

    async function loadBlogPosts() {
        if (!blogContainer) return;
        
        try {
            const res = await fetch('/api/posts');
            if (!res.ok) throw new Error('無法取得文章資料');
            const posts = await res.json();
            
            blogContainer.innerHTML = '';
            
            if (posts.length === 0) {
                blogContainer.innerHTML = '<p class="empty-blog-message" style="grid-column: 1/-1; text-align: center; color: var(--color-text-light);">目前還沒有文章發布喔。</p>';
                return;
            }

            posts.forEach((post, index) => {
                const article = document.createElement('article');
                article.className = 'blog-card';
                
                // 決定要用哪種表情符號作為圖片預覽
                const emoji = emojis[index % emojis.length];

                article.innerHTML = `
                    <div class="blog-img-placeholder">${emoji}</div>
                    <div class="blog-content">
                        <span class="blog-tag">${post.tag || '專欄文章'}</span>
                        <h3><a href="blog.html">${post.title}</a></h3>
                        <div class="blog-body-text" style="font-size: 0.9rem; color: var(--color-text-light); margin-bottom: 20px;">
                            ${post.content}
                        </div>
                        <div class="blog-footer">
                            <span class="blog-date">${post.date}</span>
                            <a href="blog.html" class="read-more">閱讀全文 →</a>
                        </div>
                    </div>
                `;
                blogContainer.appendChild(article);
            });
        } catch (err) {
            console.error('載入專欄文章失敗:', err);
            blogContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--color-text-light);">請啟動 Python 伺服器 (index.py) 以載入動態文章。</p>';
        }
    }

    // 頁面加載時若有 blogContainer 則執行加載
    if (blogContainer) {
        loadBlogPosts();
    }

});

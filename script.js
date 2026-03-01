/**
 * Hafsoo Fragrance - Core Logic
 * Optimized version with Event Delegation & Reactive State management.
 */

// --- Global App State ---
const State = {
    cart: [], // { id, title, price, size, image, qty }
    timer: 9900, // Countdown in seconds
    products: [
        {
            id: 1,
            title: "Oudh Al-Hani",
            category: "Premium Oudh",
            basePrice: 2500,
            badge: "Limited",
            notes: "Top: Saffron | Heart: Rose",
            description: "A rich, woody masterpiece blending ancient agarwood with delicate floral notes.",
            image: "images/product1.png"
        },
        {
            id: 2,
            title: "Sultani Attar",
            category: "Traditional",
            basePrice: 1500,
            badge: "Bestseller",
            notes: "Top: Bergamot | Heart: Jasmine",
            description: "An earthy, musky concentration that captures the essence of royal courts.",
            image: "images/product2.png"
        },
        {
            id: 3,
            title: "Emerald Night",
            category: "Lux EDP",
            basePrice: 3200,
            badge: "New",
            notes: "Top: Citrus | Heart: Orchid",
            description: "A fresh, nocturnal scent with crisp citrus and deep orchid undercurrents.",
            image: "images/product3.png"
        },
        {
            id: 4,
            title: "Royal White Musk",
            category: "Signature",
            basePrice: 3500,
            badge: "",
            notes: "Top: Lily | Heart: White Musk",
            description: "Pure, clean, and velvety musk with a lingering trail of white lilies.",
            image: "images/product4.png"
        },
        {
            id: 5,
            title: "Amber Luxury",
            category: "Oriental",
            basePrice: 2800,
            badge: "Trending",
            notes: "Top: Amber | Heart: Vanilla",
            description: "A warm, soul-soothing blend of golden amber and sweet Madagascan vanilla.",
            image: "images/product1.png"
        },
        {
            id: 6,
            title: "Velvet Rose",
            category: "Floral Lux",
            basePrice: 2200,
            badge: "",
            notes: "Top: Taif Rose | Heart: Honey",
            description: "Capturing the morning dew on fresh roses, mixed with a hint of wild honey.",
            image: "images/product3.png"
        }
    ],
    majidEdition: [
        { id: 101, title: "Majid Special Musk", price: 1200, category: "Majid Edition", image: "images/product2.png", notes: "Limited Collection" },
        { id: 102, title: "Royal Oud Mukhallat", price: 1800, category: "Majid Edition", image: "images/product4.png", notes: "Majid Signature" },
        { id: 103, title: "Gold Amber Gold", price: 1500, category: "Majid Edition", image: "images/product1.png", notes: "Majid Edition" }
    ],
    socialProof: {
        names: ["Ali", "Ahmed", "Sarah", "Fatima", "Zohaib", "Maryam", "Bilal", "Zainab", "Usman", "Ayesha", "Hamza", "Hania"],
        cities: ["Karachi", "Lahore", "Islamabad", "Faisalabad", "Rawalpindi", "Multan", "Peshawar", "Quetta", "Sialkot", "Hyderabad"],
        times: ["just now", "2 minutes ago", "5 minutes ago", "8 minutes ago", "12 minutes ago", "15 minutes ago"]
    },
    currentUpsellProduct: null
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

const App = {
    init() {
        this.renderProducts();
        this.initTimer();
        this.bindEvents();
        this.initScrollAnimations();
        AIChat.init();
        SocialProof.init();
        FragranceQuiz.init();
        UrgencySystem.init();
        this.updateCartUI();
    },

    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // Stagger any children cards if this is a grid
                    if (entry.target.classList.contains('product-grid')) {
                        const cards = entry.target.querySelectorAll('.product-card');
                        cards.forEach((card, index) => {
                            setTimeout(() => {
                                card.classList.add('is-visible');
                            }, index * 150);
                        });
                    }
                    // Only trigger once
                    revealObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Elements to observe
        document.querySelectorAll('.reveal, .product-grid').forEach(el => {
            revealObserver.observe(el);
        });
    },

    bindEvents() {
        // Cart Toggles
        const selectors = ['#cart-btn', '#close-cart', '#cart-overlay', '#close-quiz', '#open-quiz-btn'];
        selectors.forEach(s => {
            const el = document.querySelector(s);
            if (el) el.addEventListener('click', (e) => {
                if (s === '#open-quiz-btn') FragranceQuiz.open();
                else if (s === '#close-quiz') FragranceQuiz.close();
                else this.toggleCart();
            });
        });

        // ESC key listener for modals
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCheckout();
                this.closeUpsell();
                this.toggleCart(false);
                FragranceQuiz.close();
            }
        });
        document.getElementById('checkout-trigger')?.addEventListener('click', () => this.openCheckout());
        document.getElementById('close-checkout')?.addEventListener('click', () => this.closeCheckout());
        document.getElementById('checkout-form')?.addEventListener('submit', (e) => this.handleCheckout(e));

        // Close Modals on background click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeCheckout();
                this.closeUpsell();
            }
        });

        // Upsell buttons
        document.getElementById('add-upsell-btn')?.addEventListener('click', () => this.addUpsellToCart());
        document.getElementById('close-upsell-btn')?.addEventListener('click', () => this.closeUpsell());

        // Product Grid Delegation
        const grid = document.getElementById('product-grid');
        if (grid) {
            grid.addEventListener('click', (e) => {
                const addBtn = e.target.closest('.btn-add');
                if (addBtn) {
                    const id = parseInt(addBtn.dataset.id);
                    this.handleAddToCart(id);
                }
            });

            grid.addEventListener('change', (e) => {
                if (e.target.classList.contains('size-select')) {
                    const id = parseInt(e.target.dataset.id);
                    this.updateProductPrice(id, e.target.value);
                }
            });
        }

        // Cart Item Delegation
        const cartContainer = document.getElementById('cart-items');
        if (cartContainer) {
            cartContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-qty-change]');
                if (btn) {
                    const index = parseInt(btn.dataset.index);
                    const delta = parseInt(btn.dataset.qtyChange);
                    this.changeQty(index, delta);
                }

                const removeBtn = e.target.closest('.remove-item');
                if (removeBtn) {
                    const index = parseInt(removeBtn.dataset.index);
                    this.removeFromCart(index);
                }
            });
        }
    },

    // --- Core UI Logic ---
    renderProducts() {
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        grid.innerHTML = State.products.map(p => `
            <article class="product-card">
                ${p.badge ? `<div class="badge">${p.badge}</div>` : ''}
                <div class="img-container">
                    <img src="${p.image}" class="product-image" alt="${p.title}" loading="lazy">
                </div>
                <div class="product-info">
                    <div>
                        <span class="product-category">${p.category}</span>
                        <h3 class="product-title">${p.title}</h3>
                        <div class="urgency-wrap tooltip-trigger" id="urgency-${p.id}">
                            <div class="stock-indicator" id="stock-${p.id}">
                                <span>⚠️ Only <span class="stock-num">?</span> bottles left in stock</span>
                            </div>
                            <div class="viewer-counter">
                                <span>🔥 <span class="viewer-count-num" id="viewers-${p.id}">?</span> people are viewing this right now</span>
                            </div>
                        </div>
                        <p class="product-short-desc">${p.description}</p>
                        <select class="size-select" data-id="${p.id}">
                            <option value="100">100ML (Full Price)</option>
                            <option value="50">50ML (40% Price)</option>
                        </select>
                        <p class="fragrance-notes">${p.notes}</p>
                    </div>
                    <div>
                        <div class="product-price" id="price-${p.id}">Rs. ${p.basePrice}</div>
                        <button class="btn btn-outline btn-add" data-id="${p.id}">
                            Add to Collection
                        </button>
                    </div>
                </div>
            </article>
        `).join('');
    },

    updateProductPrice(id, size) {
        const p = State.products.find(x => x.id === id);
        if (!p) return;
        const price = size === "50" ? Math.round(p.basePrice * 0.4) : p.basePrice;
        const priceEl = document.getElementById(`price-${id}`);
        if (priceEl) priceEl.innerText = `Rs. ${price}`;
    },

    // --- Cart Actions ---
    handleAddToCart(id) {
        const p = State.products.find(x => x.id === id);
        if (!p) return;

        const select = document.querySelector(`.size-select[data-id="${id}"]`);
        const size = select.value === "50" ? "50ML" : "100ML";

        const priceText = document.getElementById(`price-${id}`).innerText;
        const price = parseInt(priceText.replace("Rs. ", ""));

        const existingIndex = State.cart.findIndex(item => item.id === id && item.size === size);

        if (existingIndex > -1) {
            State.cart[existingIndex].qty += 1;
        } else {
            State.cart.push({ ...p, price, size, qty: 1 });
        }

        this.updateCartUI();

        // 40% Chance of Smart Upsell
        if (Math.random() < 0.4) {
            this.showSmartUpsell();
        } else {
            this.toggleCart(true);
        }
    },

    updateCartUI() {
        const itemsContainer = document.getElementById('cart-items');
        const countEls = document.querySelectorAll('.cart-count');
        const totalEl = document.getElementById('cart-total-price');

        const totalQty = State.cart.reduce((sum, item) => sum + item.qty, 0);
        countEls.forEach(el => el.innerText = totalQty);

        let totalPrice = 0;
        itemsContainer.innerHTML = State.cart.map((item, i) => {
            totalPrice += (item.price * item.qty);
            return `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.title}" class="cart-item-img">
                    <div class="cart-item-info">
                        <h4>${item.title} (${item.size})</h4>
                        <p>Rs. ${item.price}</p>
                        <div class="qty-controls">
                            <button data-qty-change="-1" data-index="${i}">-</button>
                            <span>${item.qty}</span>
                            <button data-qty-change="1" data-index="${i}">+</button>
                        </div>
                    </div>
                    <button class="remove-item" data-index="${i}" aria-label="Remove item">&times;</button>
                </div>
            `;
        }).join('');

        if (State.cart.length === 0) {
            itemsContainer.innerHTML = '<p style="text-align:center; padding: 2rem; opacity:0.6;">Your collection is empty.</p>';
        }

        totalEl.innerText = `Rs. ${totalPrice}`;
    },

    changeQty(index, delta) {
        State.cart[index].qty += delta;
        if (State.cart[index].qty < 1) State.cart.splice(index, 1);
        this.updateCartUI();
    },

    removeFromCart(index) {
        State.cart.splice(index, 1);
        this.updateCartUI();
    },

    toggleCart(open) {
        const drawer = document.getElementById('cart-drawer');
        const overlay = document.getElementById('cart-overlay');
        const shouldOpen = typeof open === 'boolean' ? open : !drawer.classList.contains('active');
        drawer.classList.toggle('active', shouldOpen);
        overlay.style.display = shouldOpen ? 'block' : 'none';
        document.body.style.overflow = shouldOpen ? 'hidden' : '';
    },

    // --- Upsell Modals ---
    showSmartUpsell() {
        const p = State.majidEdition[Math.floor(Math.random() * State.majidEdition.length)];
        State.currentUpsellProduct = p;

        document.getElementById('upsell-product-img').src = p.image;
        document.getElementById('upsell-product-name').innerText = p.title;
        document.getElementById('upsell-product-price').innerText = `Rs. ${p.price}`;
        document.getElementById('upsell-modal').style.display = 'flex';
    },

    addUpsellToCart() {
        if (State.currentUpsellProduct) {
            const p = State.currentUpsellProduct;
            State.cart.push({ ...p, size: "Majid Edition", qty: 1 });
            this.updateCartUI();
        }
        this.closeUpsell();
        this.toggleCart(true);
    },

    closeUpsell() {
        document.getElementById('upsell-modal').style.display = 'none';
        State.currentUpsellProduct = null;
    },

    // --- Checkout ---
    openCheckout() {
        if (State.cart.length === 0) return alert("Add items to your collection first!");
        document.getElementById('checkout-modal').style.display = 'flex';
    },

    closeCheckout() {
        document.getElementById('checkout-modal').style.display = 'none';
    },

    handleCheckout(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const name = document.getElementById('cust-name').value;
        const phone = document.getElementById('cust-phone').value;
        const address = document.getElementById('cust-address').value;

        let details = "";
        let total = 0;
        State.cart.forEach(item => {
            total += (item.price * item.qty);
            details += `• ${item.title} (${item.size}) x ${item.qty} = Rs. ${item.price * item.qty}\n`;
        });

        const msg = encodeURIComponent(
            `🛒 *NEW ORDER - Hafsoo Fragrance*\n` +
            `---------------------------\n` +
            `👤 *Name:* ${name}\n` +
            `📞 *Phone:* ${phone}\n` +
            `📍 *Address:* ${address}\n` +
            `---------------------------\n` +
            `📦 *Items:*\n${details}` +
            `---------------------------\n` +
            `💰 *GRAND TOTAL: Rs. ${total}*\n` +
            `---------------------------\n` +
            `Please confirm my order. Shukriya!`
        );

        window.open(`https://wa.me/923159831334?text=${msg}`, '_blank');

        State.cart = [];
        this.updateCartUI();
        this.closeCheckout();
        this.toggleCart(false);
        e.target.reset();
    },

    initTimer() {
        const el = document.getElementById('countdown');
        if (!el) return;
        setInterval(() => {
            let h = Math.floor(State.timer / 3600);
            let m = Math.floor((State.timer % 3600) / 60);
            let s = State.timer % 60;
            el.innerText = [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
            if (State.timer > 0) State.timer--;
        }, 1000);
    }
};

// --- Fragrance Quiz Logic ---
const FragranceQuiz = {
    modal: null,
    currentStep: 1,
    answers: {},

    init() {
        this.modal = document.getElementById('quiz-modal');
        if (!this.modal) return;

        // Delegate option clicks
        document.querySelectorAll('.quiz-opt').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const step = e.target.closest('.quiz-step').dataset.step;
                const answer = e.target.dataset.answer;
                this.handleAnswer(parseInt(step), answer);
            });
        });
    },

    open() {
        this.currentStep = 1;
        this.answers = {};
        this.updateUI();
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    },

    close() {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
    },

    handleAnswer(step, val) {
        this.answers[step] = val;

        if (step < 3) {
            this.currentStep++;
            this.updateUI();
        } else {
            this.showResult();
        }
    },

    updateUI() {
        document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
        const stepEl = document.querySelector(`.quiz-step[data-step="${this.currentStep}"]`);
        if (stepEl) stepEl.classList.add('active');
    },

    showResult() {
        this.currentStep = 'result';
        document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
        document.getElementById('quiz-result-step').classList.add('active');

        const recommendation = this.calculateRecommendation();
        const container = document.getElementById('quiz-result-content');

        container.innerHTML = `
            <div class="quiz-result-card">
                <img src="${recommendation.image}" alt="${recommendation.title}" class="quiz-result-img">
                <h3 class="quiz-result-title">${recommendation.title}</h3>
                <p class="quiz-result-desc">${recommendation.description}</p>
                <button class="btn btn-primary" onclick="FragranceQuiz.handleBuyNow(${recommendation.id})">
                    Add to Collection
                </button>
            </div>
        `;
    },

    calculateRecommendation() {
        const { 1: occasion, 2: type, 3: intensity } = this.answers;

        // Logic Mapping
        // 1. Oudh Al-Hani: Strong, Wedding/Date, Oud
        if (type === 'Strong' || occasion === 'Wedding') {
            return State.products.find(p => p.id === 1);
        }

        // 2. Sultani Attar: Office, Woody, Medium
        if (occasion === 'Office' || type === 'Woody') {
            return State.products.find(p => p.id === 2);
        }

        // 3. Emerald Night: Daily, Fresh, Light/Medium
        if (type === 'Fresh' || occasion === 'Daily') {
            return State.products.find(p => p.id === 3);
        }

        // 4. Velvet Rose: Date, Sweet, Strong
        if (type === 'Sweet' || occasion === 'Date') {
            return State.products.find(p => p.id === 6); // Velvet Rose
        }

        // 5. Amber Luxury: Oriental/Sweet, Medium
        if (type === 'Sweet' && intensity === 'Medium') {
            return State.products.find(p => p.id === 5);
        }

        // Default shortcut
        return State.products[0];
    },

    handleBuyNow(productId) {
        App.handleAddToCart(productId);
        this.close();
    }
};

// --- Social Proof Logic ---
const SocialProof = {
    container: null,
    timeoutId: null,
    hideTimeoutId: null,

    init() {
        this.container = document.getElementById('social-proof-container');
        if (!this.container) return;

        // Start the first notification after 10 seconds
        this.scheduleNext();
    },

    scheduleNext() {
        // Random interval between 20-40 seconds
        const interval = Math.floor(Math.random() * (40000 - 20000 + 1)) + 20000;
        this.timeoutId = setTimeout(() => this.show(), interval);
    },

    show() {
        // Check if user is active/tab is visible
        if (document.hidden) {
            this.scheduleNext();
            return;
        }

        const name = State.socialProof.names[Math.floor(Math.random() * State.socialProof.names.length)];
        const city = State.socialProof.cities[Math.floor(Math.random() * State.socialProof.cities.length)];
        const time = State.socialProof.times[Math.floor(Math.random() * State.socialProof.times.length)];
        const product = State.products[Math.floor(Math.random() * State.products.length)];

        const toast = document.createElement('div');
        toast.className = 'social-proof-toast';
        toast.innerHTML = `
            <img src="${product.image}" class="social-proof-img" alt="${product.title}">
            <div class="social-proof-content">
                <p><span>${name}</span> from ${city} just purchased <span>${product.title}</span></p>
                <span class="social-proof-time">${time}</span>
            </div>
        `;

        // Interaction behavior
        toast.addEventListener('mouseenter', () => clearTimeout(this.hideTimeoutId));
        toast.addEventListener('mouseleave', () => this.startHideTimer(toast));
        toast.addEventListener('click', () => {
            window.location.hash = 'products';
            this.hide(toast);
        });

        this.container.appendChild(toast);
        this.startHideTimer(toast);
    },

    startHideTimer(toast) {
        this.hideTimeoutId = setTimeout(() => this.hide(toast), 5000);
    },

    hide(toast) {
        if (!toast) return;
        toast.classList.add('hiding');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.scheduleNext();
        }, 500);
    }
};

// --- AI Chat Logic ---
const AIChat = {
    history: JSON.parse(localStorage.getItem('hafsoo_chat_history')) || [],
    isOpen: false,

    init() {
        this.bindEvents();
        this.loadHistory();
        this.initGreeting();
        this.setupSoundHandler();
    },

    setupSoundHandler() {
        const playSound = () => {
            if (localStorage.getItem('hafsoo_sound_played')) return;
            const sound = document.getElementById('chatNotificationSound');
            if (sound) {
                sound.play().then(() => {
                    localStorage.setItem('hafsoo_sound_played', 'true');
                    // Remove listener after sound successfully plays
                    document.removeEventListener('click', playSound);
                }).catch(err => {
                    console.log("Autoplay blocked, waiting for user interaction");
                });
            }
        };

        // Attempt to play on load, but also listen for first click to satisfy browser policy
        document.addEventListener('click', playSound);
        // Clean up sound flag on window close/reload to allow replay if user didn't hear it in a previous session
    },

    bindEvents() {
        document.getElementById('aiChatToggle')?.addEventListener('click', () => this.toggle());
        document.getElementById('minimize-chat')?.addEventListener('click', () => this.toggle());
        document.getElementById('clear-chat')?.addEventListener('click', () => this.clear());
        document.getElementById('ai-chat-form')?.addEventListener('submit', (e) => this.handleSubmit(e));
    },

    toggle() {
        const win = document.getElementById('aiChatWindow');
        const toggle = document.getElementById('aiChatToggle');
        const greeting = document.getElementById('aiGreetingPopup');

        this.isOpen = !this.isOpen;
        win.style.display = this.isOpen ? 'flex' : 'none';

        if (this.isOpen) {
            toggle.classList.remove('pulse-soft');
            if (greeting) greeting.style.display = 'none';
        }
    },

    initGreeting() {
        if (sessionStorage.getItem('greeting_shown')) return;
        const popup = document.getElementById('aiGreetingPopup');
        const text = document.getElementById('greetingText');
        const typing = document.getElementById('greetingTyping');
        const toggle = document.getElementById('aiChatToggle');
        const sound = document.getElementById('chatNotificationSound');

        setTimeout(() => {
            if (!this.isOpen) {
                if (popup) popup.style.display = 'block';
                if (toggle) toggle.classList.add('pulse-soft');

                // Trigger sound on greeting popup
                if (sound && !localStorage.getItem('hafsoo_sound_played')) {
                    sound.play().then(() => {
                        localStorage.setItem('hafsoo_sound_played', 'true');
                    }).catch(() => console.log("Sound ready for first click"));
                }
            }
        }, 3000);

        setTimeout(() => { if (!this.isOpen && typing) { typing.style.display = 'none'; text.classList.remove('hidden'); } }, 5500);

        setTimeout(() => {
            if (popup && popup.style.display !== 'none') {
                popup.style.animation = 'fadeOutDown 0.5s ease forwards';
                setTimeout(() => {
                    popup.style.display = 'none';
                    sessionStorage.setItem('greeting_shown', 'true');
                }, 500);
            }
        }, 15000);
    },

    handleSubmit(e) {
        e.preventDefault();
        const input = document.getElementById('aiChatInput');
        const msg = input.value.trim();
        if (!msg) return;

        this.append('user', msg);
        input.value = '';

        const typing = document.getElementById('aiTyping');
        typing.style.display = 'block';

        setTimeout(() => {
            const reply = this.getReply(msg);
            typing.style.display = 'none';
            this.append('ai', reply);
        }, 1200);
    },

    append(sender, text) {
        const container = document.getElementById('aiChatMessages');
        const bubble = document.createElement('div');
        bubble.className = `${sender}-bubble`;
        bubble.innerText = text;
        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;

        this.history.push({ sender, text });
        localStorage.setItem('hafsoo_chat_history', JSON.stringify(this.history));
    },

    getReply(q) {
        const lowerQ = q.toLowerCase();
        const product = State.products.find(p => lowerQ.includes(p.title.toLowerCase()));
        if (product) return `${product.title} is part of our ${product.category}. ${product.description} Its price is Rs. ${product.basePrice}. Should I add it to your cart?`;

        if (lowerQ.includes('delivery') || lowerQ.includes('shipping')) return "We deliver across Pakistan in 3-5 days. Free shipping on orders above Rs. 5000!";
        if (lowerQ.includes('price')) return "Our collection starts from Rs. 1500. Check out the products section for details!";
        if (lowerQ.includes('hi') || lowerQ.includes('hello') || lowerQ.includes('assalam')) return "Assalam-o-Alaikum! I'm your Hafsoo guide. How can I assist you in finding your signature scent today?";

        return "That's a great question! For specific inquiries, you can also talk to our experts via WhatsApp. Anything else I can help with regarding our Oudh and Attars?";
    },

    loadHistory() {
        if (this.history.length === 0) return;
        const container = document.getElementById('aiChatMessages');
        container.innerHTML = '';
        this.history.forEach(m => {
            const b = document.createElement('div');
            b.className = `${m.sender}-bubble`;
            b.innerText = m.text;
            container.appendChild(b);
        });
        container.scrollTop = container.scrollHeight;
    },

    clear() {
        if (confirm("Clear chat history?")) {
            this.history = [];
            localStorage.removeItem('hafsoo_chat_history');
            document.getElementById('aiChatMessages').innerHTML = '<div class="ai-bubble">History cleared. How can I help you?</div>';
        }
    }
};

// --- Urgency System Logic ---
const UrgencySystem = {
    intervals: [],

    init() {
        // Find all products and initialize their counters
        State.products.forEach(p => {
            this.setInitialNumbers(p.id);
        });

        // Start periodic updates for viewers
        this.startViewerUpdates();

        // Pause updates if tab is inactive
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.stopUpdates();
            else this.startViewerUpdates();
        });
    },

    setInitialNumbers(id) {
        const stockEl = document.querySelector(`#stock-${id} .stock-num`);
        const viewerEl = document.querySelector(`#viewers-${id}`);
        if (!stockEl || !viewerEl) return;

        // Random stock between 3-12
        const stock = Math.floor(Math.random() * (12 - 3 + 1)) + 3;
        if (stockEl) stockEl.innerText = stock;

        if (stock < 5) {
            const stockIndicator = document.querySelector(`#stock-${id}`);
            if (stockIndicator) stockIndicator.classList.add('stock-low');
        }

        // Random viewers between 5-25
        const viewers = Math.floor(Math.random() * (25 - 5 + 1)) + 5;
        if (viewerEl) viewerEl.innerText = viewers;
    },

    startViewerUpdates() {
        this.stopUpdates(); // Clear existing to prevent overlap

        const update = () => {
            State.products.forEach(p => {
                const viewerEl = document.querySelector(`#viewers-${p.id}`);
                if (!viewerEl) return;

                let current = parseInt(viewerEl.innerText);
                // Fluctuate by +/- 1 or 2
                let change = Math.floor(Math.random() * 5) - 2;
                let next = current + change;

                // Keep within 5-30
                if (next < 5) next = 5;
                if (next > 30) next = 30;

                // Smooth transition effect
                viewerEl.style.opacity = '0.5';
                setTimeout(() => {
                    viewerEl.innerText = next;
                    viewerEl.style.opacity = '1';
                }, 300);
            });
        };

        const intervalId = setInterval(update, 15000 + Math.random() * 5000); // 15-20 seconds
        this.intervals.push(intervalId);
    },

    stopUpdates() {
        this.intervals.forEach(clearInterval);
        this.intervals = [];
    }
};

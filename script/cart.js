// /script/cart.js

// --- VARIÁVEIS DE ESTADO E ELEMENTOS DO DOM ---
let cart = [];
let cartItemsContainer, cartTotalSpan, checkoutBtn, cartCountSpan, cartIconLink, cartMessage;

// --- FUNÇÕES EXPORTADAS ---

// Inicializa o módulo do carrinho com os elementos do DOM necessários
export function initCart(elements) {
    cartItemsContainer = elements.cartItemsContainer;
    cartTotalSpan = elements.cartTotalSpan;
    checkoutBtn = elements.checkoutBtn;
    cartCountSpan = elements.cartCountSpan;
    cartIconLink = elements.cartIconLink;
    cartMessage = elements.cartMessage;
}

// Adiciona um item ao carrinho e atualiza a interface
export function addItemToCart(item) {
    cart.push(item);
    renderCart();
    showCartNotification();
}

// Remove um item do carrinho e atualiza a interface
export function removeItemFromCart(itemId) {
    cart = cart.filter(item => item.id != itemId);
    renderCart();
}

// Retorna o estado atual do carrinho (usado para gerar a mensagem do WhatsApp)
export function getCart() {
    return cart;
}

// Formata um número para a moeda brasileira
export function formatCurrency(value) {
    if (typeof value !== 'number') { return 'R$ --,--'; }
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

// --- FUNÇÕES INTERNAS ---

// Mostra a animação e a mensagem de "item adicionado"
function showCartNotification() {
    cartIconLink.classList.add('pulse');
    cartMessage.classList.add('show');
    setTimeout(() => { cartIconLink.classList.remove('pulse'); }, 500);
    setTimeout(() => { cartMessage.classList.remove('show'); }, 2500);
}

// Renderiza todos os itens do carrinho no menu lateral
function renderCart() {
    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-center text-muted mt-4 empty-cart-message">Seu carrinho está vazio.</p>';
    } else {
        cart.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item d-flex gap-3';
            const addonsHtml = item.addons.map(addon => {
                const priceText = addon.price > 0 ? `<span class="cart-addon-price">(+ ${formatCurrency(addon.price)})</span>` : '';
                return `<li class="small text-muted d-flex justify-content-between"><span>- ${addon.name}</span> ${priceText}</li>`;
            }).join('');
            itemEl.innerHTML = `
                <div class="flex-grow-1">
                    <h6 class="mb-1">${item.quantity}x ${item.name}</h6>
                    ${item.addons.length > 0 ? `<ul class="list-unstyled mb-1">${addonsHtml}</ul>` : ''}
                    <div class="fw-bold">${formatCurrency(item.unitPrice * item.quantity)}</div>
                </div>
                <button class="btn btn-sm btn-outline-danger cart-item-remove" data-item-id="${item.id}">&times;</button>
            `;
            cartItemsContainer.appendChild(itemEl);
        });
    }
    updateCartTotal();
    updateCartCount();
}

// Atualiza o valor total no rodapé do carrinho
function updateCartTotal() {
    const total = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    cartTotalSpan.textContent = formatCurrency(total);
    checkoutBtn.disabled = cart.length === 0;
}

// Atualiza o número no ícone do carrinho
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountSpan.textContent = count;
}
// /script/app.js

import { products } from './products.js';
import * as Cart from './cart.js';
import * as Modal from './modal.js';

// --- INICIALIZAÇÃO QUANDO O DOM ESTIVER PRONTO ---
document.addEventListener('DOMContentLoaded', () => {

    // --- SELEÇÃO DOS ELEMENTOS GLOBAIS DO DOM ---
    const mainContainer = document.querySelector('main.container');
    const gridTradicionais = document.getElementById('product-grid-tradicionais');
    const gridTrufados = document.getElementById('product-grid-trufados');
    const gridHotdogs = document.getElementById('product-grid-hotdogs');
    const gridCaldos = document.getElementById('product-grid-caldos');
    const categoryTabs = document.getElementById('category-tabs');
    const cartIconLink = document.getElementById('cart-icon-link');
    const generateWhatsAppBtn = document.getElementById('generate-whatsapp-btn');
    const deliveryForm = document.getElementById('delivery-form-fields');
    const pickupForm = document.getElementById('pickup-form-fields'); // Campo de retirada
    const deliveryOptionRadios = document.querySelectorAll('input[name="deliveryOption"]');
    const cartItemsContainer = document.getElementById('cart-items');
    const checkoutBtn = document.getElementById('checkout-btn');
    const deliveryFeeText = document.getElementById('delivery-fee-text'); 

    // --- INSTÂNCIAS DOS COMPONENTES BOOTSTRAP ---
    const productModalInstance = new bootstrap.Modal(document.getElementById('productModal'));
    const cartOffcanvasInstance = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));
    const checkoutModalInstance = new bootstrap.Modal(document.getElementById('checkoutModal'));
    const scrollSpy = new bootstrap.ScrollSpy(document.body, {
        target: '#category-tabs',
        offset: 150
    });

    // --- INICIALIZAÇÃO DOS MÓDULOS ---
    Cart.initCart({
        cartItemsContainer: cartItemsContainer,
        cartTotalSpan: document.getElementById('cart-total'),
        checkoutBtn: checkoutBtn,
        cartCountSpan: document.getElementById('cart-count'),
        cartIconLink: cartIconLink,
        cartMessage: document.getElementById('cart-message')
    });

    Modal.initModal({
        modalTitle: document.getElementById('productModalLabel'),
        modalBody: document.getElementById('modal-body'),
        modalFooterMain: document.getElementById('modal-footer-main'),
        modalConfirmationOverlay: document.getElementById('modal-confirmation-overlay'),
        confirmationMessage: document.getElementById('confirmation-message'),
        btnConfirmationYes: document.getElementById('btn-confirmation-yes'),
        btnConfirmationNo: document.getElementById('btn-confirmation-no'),
        decreaseQtyBtn: document.getElementById('decrease-qty'),
        increaseQtyBtn: document.getElementById('increase-qty'),
        quantitySpan: document.getElementById('quantity'),
        addToCartBtn: document.getElementById('add-to-cart-btn'),
    }, productModalInstance);

    // --- FUNÇÕES PRINCIPAIS DO APP ---
    
    function renderProducts() {
        gridTradicionais.innerHTML = '';
        gridTrufados.innerHTML = '';
        gridHotdogs.innerHTML = '';
        gridCaldos.innerHTML = '';
        products.forEach(product => {
            if (!product || typeof product.currentPrice !== 'number') {
                console.error('Produto com dados inválidos:', product);
                return;
            }
            const cardCol = document.createElement('div');
            cardCol.className = 'col-12';
            
            // A classe 'fs-5' foi removida da span .current-price para permitir o controlo via CSS
            const priceText = (product.customizationType === 'levanta' || product.customizationType === 'caldo')
                ? `<span class="price-prefix">A partir de </span><span class="current-price fw-bold">${Cart.formatCurrency(product.currentPrice)}</span>`
                : `<span class="current-price fw-bold">${Cart.formatCurrency(product.currentPrice)}</span>`;
            
            cardCol.innerHTML = `
                <div class="card product-card product-card-horizontal" data-product-id="${product.id}">
                    <div class="row g-0">
                        <div class="col-3 d-flex align-items-center justify-content-center">
                            <img src="${product.image}" class="img-fluid rounded-start" alt="${product.name}">
                        </div>
                        <div class="col-9">
                            <div class="card-body">
                                <h3 class="card-title h6 fw-bold">${product.name}</h3>
                                <p class="card-text small text-muted">${product.description || ''}</p>
                                <div class="price mt-auto">${priceText}</div>
                            </div>
                        </div>
                    </div>
                </div>`;

            if (product.type === 'tradicional') gridTradicionais.appendChild(cardCol);
            else if (product.type === 'trufado') gridTrufados.appendChild(cardCol);
            else if (product.type === 'hotdog') gridHotdogs.appendChild(cardCol);
            else if (product.type === 'caldo') gridCaldos.appendChild(cardCol);
        });

        setTimeout(() => scrollSpy.refresh(), 500);
    }
    
    function generateWhatsAppMessage() {
        const cart = Cart.getCart();
        if (cart.length === 0) return;

        const deliveryFee = 4.00; 
        const deliveryOption = document.querySelector('input[name="deliveryOption"]:checked').value;
        const paymentMethod = document.getElementById('paymentMethod').value;
        const orderNotes = document.getElementById('orderNotes').value.trim();

        let message = `Olá, *Açaí do Edy*! 👋 Gostaria de fazer o seguinte pedido:\n\n*RESUMO DO PEDIDO:*\n---------------------\n`;
        cart.forEach((item, index) => {
            message += `*Item ${index + 1}:* ${item.quantity}x (${item.name})\n`;
            if (item.addons.length > 0) {
                const addonsText = item.addons.map(addon => {
                    return addon.price > 0 ? `${addon.name} (+ ${Cart.formatCurrency(addon.price)})` : addon.name;
                }).join(', ');
                message += `*Adicionais:* ${addonsText}\n`;
            }
            message += `*Subtotal Item:* ${Cart.formatCurrency(item.unitPrice * item.quantity)}\n---------------------\n`;
        });

        const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        const finalTotal = deliveryOption === 'delivery' ? subtotal + deliveryFee : subtotal;

        message += `\n*Subtotal dos Itens:* ${Cart.formatCurrency(subtotal)}\n`;
        if (deliveryOption === 'delivery') {
            message += `*Taxa de Entrega:* ${Cart.formatCurrency(deliveryFee)}\n`;
        }
        message += `*TOTAL DO PEDIDO:* *${Cart.formatCurrency(finalTotal)}*\n\n`;

        if (deliveryOption === 'delivery') {
            const customerName = document.getElementById('customerName').value.trim();
            const customerCep = document.getElementById('customerCep').value.trim();
            const customerAddress = document.getElementById('customerAddress').value.trim();
            const customerNumber = document.getElementById('customerNumber').value.trim();

            if (!customerName || !customerAddress || !customerNumber || !customerCep) {
                alert('Por favor, preencha todos os dados de entrega: nome, CEP, endereço e número.');
                return;
            }
            
            const fullAddress = `${customerAddress}, Nº ${customerNumber}`;
            message += `*MODO DE RECEBIMENTO:* Entrega\n*DADOS DE ENTREGA:*\n*Nome:* ${customerName}\n*Endereço:* ${fullAddress}\n*CEP:* ${customerCep}\n*Pagamento:* ${paymentMethod}\n`;

        } else { 
            const customerNamePickup = document.getElementById('customerNamePickup').value.trim();
            const customerNumberPickup = document.getElementById('customerNumberPickup').value.trim();

            if (!customerNamePickup || !customerNumberPickup) {
                alert('Por favor, preencha seu nome e número para a retirada.');
                return;
            }

            message += `*MODO DE RECEBIMENTO:* Retirada no Balcão\n*DADOS PARA RETIRADA:*\n*Nome:* ${customerNamePickup}\n*Telefone:* ${customerNumberPickup}\n*PAGAMENTO:* ${paymentMethod}\n`;
        }

        if (orderNotes) {
            message += `\n*Observações:* ${orderNotes}\n`;
        }

        const whatsappNumber = '5511948768272';
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        checkoutModalInstance.hide();
    }

    function setupCepAutofill() {
        const cepInput = document.getElementById('customerCep');
        const addressInput = document.getElementById('customerAddress');
        if (!cepInput) return;
        cepInput.addEventListener('blur', () => {
            const cep = cepInput.value.replace(/\D/g, '');
            if (cep.length !== 8) return;
            addressInput.value = "Buscando endereço...";
            fetch(`https://viacep.com.br/ws/${cep}/json/`)
                .then(response => response.json())
                .then(data => {
                    if (data.erro) {
                        addressInput.value = "CEP não encontrado.";
                    } else {
                        addressInput.value = `${data.logouro}, ${data.bairro} - ${data.localidade}/${data.uf}`;
                    }
                })
                .catch(error => {
                    console.error('Erro ao buscar CEP:', error);
                    addressInput.value = "Não foi possível buscar o endereço.";
                });
        });
    }

    // --- EVENT LISTENERS GLOBAIS ---
    
    mainContainer.addEventListener('click', e => {
        const productCard = e.target.closest('.product-card');
        if (!productCard) return;
        const productId = productCard.dataset.productId;
        const product = products.find(p => p.id == productId);
        if (!product) return;
        productCard.classList.add('is-shaking');
        setTimeout(() => {
            productCard.classList.remove('is-shaking');
            if (product.customizable) {
                Modal.openModal(product);
            } else {
                const cartItem = { id: Date.now(), name: product.name, quantity: 1, addons: [], unitPrice: product.currentPrice };
                Cart.addItemToCart(cartItem);
            }
        }, 400);
    });
    
    cartIconLink.addEventListener('click', (e) => {
        e.preventDefault();
        cartOffcanvasInstance.show();
    });

    cartItemsContainer.addEventListener('click', e => {
        const targetButton = e.target.closest('.cart-item-remove');
        if (targetButton) {
            const itemId = targetButton.dataset.itemId;
            Cart.removeItemFromCart(itemId);
        }
    });

    checkoutBtn.addEventListener('click', () => {
        if (Cart.getCart().length > 0) {
            cartOffcanvasInstance.hide();
            setTimeout(() => {
                checkoutModalInstance.show();
            }, 300);
        }
    });

    generateWhatsAppBtn.addEventListener('click', generateWhatsAppMessage);
    
    deliveryOptionRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            if (event.target.value === 'delivery') {
                deliveryForm.classList.remove('hidden');
                pickupForm.classList.add('hidden');
                deliveryFeeText.classList.remove('d-none');
            } else {
                deliveryForm.classList.add('hidden');
                pickupForm.classList.remove('hidden');
                deliveryFeeText.classList.add('d-none');
            }
        });
    });
    document.querySelector('input[name="deliveryOption"]:checked').dispatchEvent(new Event('change'));

    window.addEventListener('scroll', () => {
        if (categoryTabs && categoryTabs.offsetTop > 0 && window.scrollY >= categoryTabs.offsetTop) {
            categoryTabs.classList.add('is-sticky');
        } else if (categoryTabs) {
            categoryTabs.classList.remove('is-sticky');
        }
    });

    // --- EXECUÇÃO INICIAL ---
    renderProducts();
    setupCepAutofill();
});

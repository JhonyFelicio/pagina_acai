// /script/modal.js
import { addItemToCart, formatCurrency } from './cart.js';

// --- VARIÁVEIS DE ESTADO E ELEMENTOS DO DOM ---
let currentProduct = null;
let currentQuantity = 1;
let currentBasePrice = 0;
let productModal, modalTitle, modalBody, modalFooterMain, modalConfirmationOverlay,
    confirmationMessage, btnConfirmationYes, btnConfirmationNo,
    decreaseQtyBtn, increaseQtyBtn, quantitySpan, addToCartBtn;

// --- FUNÇÕES EXPORTADAS ---

// Inicializa o módulo do modal
export function initModal(elements, bootstrapModal) {
    productModal = bootstrapModal;
    modalTitle = elements.modalTitle;
    modalBody = elements.modalBody;
    modalFooterMain = elements.modalFooterMain;
    modalConfirmationOverlay = elements.modalConfirmationOverlay;
    confirmationMessage = elements.confirmationMessage;
    btnConfirmationYes = elements.btnConfirmationYes;
    btnConfirmationNo = elements.btnConfirmationNo;
    decreaseQtyBtn = elements.decreaseQtyBtn;
    increaseQtyBtn = elements.increaseQtyBtn;
    quantitySpan = elements.quantitySpan;
    addToCartBtn = elements.addToCartBtn;

    // Adiciona os listeners de eventos uma única vez
    decreaseQtyBtn.addEventListener('click', () => {
        if (currentQuantity > 1) {
            currentQuantity--;
            quantitySpan.textContent = currentQuantity;
            updateModalFooterPrice();
        }
    });

    increaseQtyBtn.addEventListener('click', () => {
        currentQuantity++;
        quantitySpan.textContent = currentQuantity;
        updateModalFooterPrice();
    });

    addToCartBtn.addEventListener('click', handleAddToCartValidation);
    modalBody.addEventListener('change', (event) => {
        if (event.target.name === 'productSize') {
            updateModalFooterPrice();
        } else if (event.target.classList.contains('form-check-input')) {
            handleCheckboxChange(event);
        }
    });
}

// Abre o modal com os dados de um produto específico
export function openModal(product) {
    currentProduct = product;
    modalTitle.textContent = `Personalize seu ${currentProduct.name}`;
    modalBody.innerHTML = '';

    // Lógica para renderizar tamanhos se existirem
    if (currentProduct.sizes) {
        const sizeDiv = document.createElement('div');
        sizeDiv.className = 'mb-4';
        sizeDiv.innerHTML = `<h6 class="border-bottom pb-2 mb-3">Escolha o Tamanho</h6>`;
        const sizeOptions = document.createElement('div');
        sizeOptions.className = 'd-grid gap-2 size-options';
        currentProduct.sizes.forEach((size, index) => {
            const checked = index === 0 ? 'checked' : '';
            sizeOptions.innerHTML += `<div class="form-check"><input class="form-check-input" type="radio" name="productSize" id="size-${size.name.replace(/\s+/g, '')}" value="${size.price}" ${checked}><label class="form-check-label d-flex justify-content-between" for="size-${size.name.replace(/\s+/g, '')}"><span>${size.name}</span><span class="size-price">${formatCurrency(size.price)}</span></label></div>`;
        });
        sizeDiv.appendChild(sizeOptions);
        modalBody.appendChild(sizeDiv);
    }
    
    // Lógica para renderizar adicionais
// ... dentro da função openModal ...
(currentProduct.addons || []).forEach(category => {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'mb-4 addon-category';
    let ruleText = '';

    // NOVA VERIFICAÇÃO ADICIONADA AQUI
    if (category.rule.displayText) {
        ruleText = category.rule.displayText;
    } 
    // Lógica antiga continua funcionando para os outros casos
    else if (category.rule.type === 'special_charge') {
        ruleText = `(Escolha até ${category.rule.freeLimit} grátis) R$ ${category.rule.extraPrice.toFixed(2).replace('.',',')} por item extra`;
    } else if (category.rule.type === 'max') {
        const plural = category.rule.count > 1 ? 'opções' : 'opção';
        ruleText = `(Escolha até ${category.rule.count} ${plural})`;
    }
    categoryDiv.innerHTML = `<h6 class="border-bottom pb-2 mb-2">${category.title} <small class="text-muted fw-normal">${ruleText}</small></h6>`;
    // ... resto do código ...
        category.items.forEach(item => {
            const uniqueId = `addon-${Date.now()}-${Math.random()}`;
            const formCheck = document.createElement('div');
            formCheck.className = 'form-check';
            formCheck.innerHTML = `<input class="form-check-input" type="checkbox" value="${item.name}" id="${uniqueId}" data-price="${item.price}"><label class="form-check-label" for="${uniqueId}">${item.name}</label>`;
            categoryDiv.appendChild(formCheck);
        });
        modalBody.appendChild(categoryDiv);
    });

    resetAndupdateModalFooter();
    productModal.show();
}

// --- FUNÇÕES INTERNAS DO MODAL ---

function updateModalFooterPrice() {
    let addonsPrice = 0;
    if (currentProduct.sizes && currentProduct.sizes.length > 0) {
        const selectedSize = modalBody.querySelector('input[name="productSize"]:checked');
        currentBasePrice = selectedSize ? parseFloat(selectedSize.value) : currentProduct.sizes[0].price;
    } else {
        currentBasePrice = currentProduct.currentPrice;
    }

    modalBody.querySelectorAll('.dynamic-price').forEach(el => el.remove());

    modalBody.querySelectorAll('.addon-category').forEach(categoryDiv => {
        const categoryTitle = categoryDiv.querySelector('h6').textContent.split(' (')[0];
        const categoryData = currentProduct.addons.find(c => c.title === categoryTitle);
        const checkboxes = categoryDiv.querySelectorAll('input[type="checkbox"]:checked');
        
        if (categoryData && categoryData.rule.type === 'special_charge') {
            const { freeLimit, extraPrice } = categoryData.rule;
            Array.from(checkboxes).forEach((cb, index) => {
                if (index >= freeLimit) {
                    addonsPrice += extraPrice;
                    const priceSpan = document.createElement('span');
                    priceSpan.className = 'dynamic-price';
                    priceSpan.textContent = ` (+${formatCurrency(extraPrice)})`;
                    cb.nextElementSibling.appendChild(priceSpan);
                }
            });
        } else {
            checkboxes.forEach(cb => {
                const price = parseFloat(cb.dataset.price);
                if (price > 0) {
                    addonsPrice += price;
                    const priceSpan = document.createElement('span');
                    priceSpan.className = 'dynamic-price';
                    priceSpan.textContent = ` (+${formatCurrency(price)})`;
                    cb.nextElementSibling.appendChild(priceSpan);
                }
            });
        }
    });

    const totalItemPrice = (currentBasePrice + addonsPrice) * currentQuantity;
    addToCartBtn.textContent = `Adicionar (${formatCurrency(totalItemPrice)})`;
}

function handleCheckboxChange(event) {
    const checkbox = event.target;
    const categoryDiv = checkbox.closest('.addon-category');
    if (!categoryDiv) return;

    const categoryTitle = categoryDiv.querySelector('h6').textContent.split(' (')[0];
    const categoryData = currentProduct.addons.find(c => c.title === categoryTitle);

    const oldError = categoryDiv.querySelector('.addon-error-message');
    if (oldError) oldError.remove();

    if (categoryData && categoryData.rule.type === 'max') {
        const checkboxes = categoryDiv.querySelectorAll('input[type="checkbox"]');
        const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
        if (checkedCount > categoryData.rule.count) {
            checkbox.checked = false;
            const errorMessage = document.createElement('div');
            errorMessage.className = 'addon-error-message';
            const plural = categoryData.rule.count > 1 ? 'opções' : 'opção';
            errorMessage.textContent = `Atenção: Você só pode escolher até ${categoryData.rule.count} ${plural}.`;
            categoryDiv.appendChild(errorMessage);
        }
    }

    updateModalFooterPrice();
}

function resetAndupdateModalFooter() {
    modalBody.classList.remove('d-none');
    modalFooterMain.classList.remove('d-none');
    modalConfirmationOverlay.classList.add('d-none');
    currentQuantity = 1;
    quantitySpan.textContent = currentQuantity;
    updateModalFooterPrice();
}

function showConfirmation(message, yesCallback) {
    modalBody.classList.add('d-none');
    modalFooterMain.classList.add('d-none');
    modalConfirmationOverlay.classList.remove('d-none');
    confirmationMessage.textContent = message;

    const newYesButton = btnConfirmationYes.cloneNode(true);
    btnConfirmationYes.parentNode.replaceChild(newYesButton, btnConfirmationYes);
    btnConfirmationYes = newYesButton; // Atualiza a referência

    btnConfirmationYes.addEventListener('click', () => {
        yesCallback();
        resetAndupdateModalFooter();
    }, { once: true }); // Garante que o evento seja executado apenas uma vez

    btnConfirmationNo.onclick = () => {
        resetAndupdateModalFooter();
    };
}

function proceedWithAddToCart() {
    let finalAddonsPrice = 0;
    const selectedAddons = [];
    let productName = currentProduct.name;

    if (currentProduct.sizes && currentProduct.sizes.length > 0) {
        const selectedSizeRadio = modalBody.querySelector('input[name="productSize"]:checked');
        if(selectedSizeRadio){
            const sizeName = selectedSizeRadio.nextElementSibling.querySelector('span').textContent;
            productName += ` ${sizeName}`;
        }
    }

    (currentProduct.addons || []).forEach(categoryData => {
        const categoryDiv = Array.from(modalBody.querySelectorAll('.addon-category h6')).find(h6 => h6.textContent.startsWith(categoryData.title))?.parentElement;
        if (!categoryDiv) return;
        const checkedCheckboxes = categoryDiv.querySelectorAll('input[type="checkbox"]:checked');
        
        if (categoryData.rule.type === 'special_charge') {
            const { freeLimit, extraPrice } = categoryData.rule;
            checkedCheckboxes.forEach((cb, index) => {
                const price = (index >= freeLimit) ? extraPrice : 0;
                selectedAddons.push({ name: cb.value, price });
                finalAddonsPrice += price;
            });
        } else {
            checkedCheckboxes.forEach(cb => {
                const price = parseFloat(cb.dataset.price);
                selectedAddons.push({ name: cb.value, price });
                finalAddonsPrice += price;
            });
        }
    });

    const unitPrice = currentBasePrice + finalAddonsPrice;
    const cartItem = { id: Date.now(), name: productName, quantity: currentQuantity, addons: selectedAddons, unitPrice };
    
    addItemToCart(cartItem);
    productModal.hide();
}

function handleAddToCartValidation() {
    modalBody.querySelectorAll('.addon-error-message').forEach(el => el.remove());
    const getAddonCount = (title) => {
        const categoryDiv = Array.from(modalBody.querySelectorAll('.addon-category h6')).find(h6 => h6.textContent.startsWith(title))?.parentElement;
        return categoryDiv ? categoryDiv.querySelectorAll('input:checked').length : 0;
    };

    const frutaCount = getAddonCount('Frutas');
    const adicionaisCount = getAddonCount('Adicionais');

    if (currentProduct.type === 'trufado') {
        if (getAddonCount('Trufados') === 0) {
            const categoryDiv = Array.from(modalBody.querySelectorAll('.addon-category h6')).find(h6 => h6.textContent.startsWith('Trufados')).parentElement;
            const errorMessage = document.createElement('div');
            errorMessage.className = 'addon-error-message';
            errorMessage.textContent = 'Por favor, selecione um sabor trufado para continuar.';
            categoryDiv.appendChild(errorMessage);
            return;
        }
        if (frutaCount === 0) {
            showConfirmation("Deseja prosseguir sem adicionar nenhuma fruta?", proceedWithAddToCart);
            return;
        }
    } else if (currentProduct.type === 'tradicional' && currentProduct.customizationType !== 'levanta') {
        if (frutaCount === 0 && adicionaisCount === 0) {
            showConfirmation("Deseja prosseguir sem frutas e adicionais?", proceedWithAddToCart);
            return;
        }
        if (frutaCount === 0 && adicionaisCount > 0) {
            showConfirmation("Deseja prosseguir sem adicionar nenhuma fruta?", proceedWithAddToCart);
            return;
        }
        if (frutaCount > 0 && adicionaisCount === 0) {
            showConfirmation("Deseja prosseguir sem outros adicionais?", proceedWithAddToCart);
            return;
        }
    } else if (currentProduct.customizationType === 'levanta') {
        if (adicionaisCount === 0) {
            showConfirmation("Deseja prosseguir sem selecionar nenhum adicional?", proceedWithAddToCart);
            return;
        }
    }

    proceedWithAddToCart();
}
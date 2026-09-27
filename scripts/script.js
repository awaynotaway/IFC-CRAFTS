// ✅ GLOBAL VARIABLES
let allProducts = [];
let activeProduct = null;
let pendingCustomData = null;

// ✅ RUN AFTER PAGE LOAD
document.addEventListener("DOMContentLoaded", () => {
  // Sinisigurong malinis o zero ang estado sa unang bukas/login maliban kung may aktibong sesyon
  initializeCleanState();
  
  loadProducts();
  setupFilters();
  setupCustomFormLogic();
  setupNavbarAuth();
  fixBodyScrolling();
  setupProductActions();
  setupSignupFlow();
});

// ✅ LINISIN ANG STATE KUNG BAGONG LOGIN O WALANG ACTIVE SESSION
function initializeCleanState() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (!isLoggedIn) {
    // I-clear ang lahat ng lumang data sa localStorage para laging 0 at malinis
    localStorage.removeItem('ifc_user_cart');
    localStorage.removeItem('ifc_user_orders');
    localStorage.removeItem('ifc_user_profile');
    localStorage.removeItem('ifc_user_transactions');
    localStorage.removeItem('ifc_user_messages');
    localStorage.removeItem('ifc_user_notifications');
  }
}

// ✅ SIGNUP TO PROFILE FLOW
function setupSignupFlow() {
  const signupForm = document.getElementById('signupForm') || document.querySelector('form[action*="signup"]');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      const nameInput = document.getElementById('signupName') || signupForm.querySelector('input[name="name"]');
      const emailInput = document.getElementById('signupEmail') || signupForm.querySelector('input[name="email"]');
      const phoneInput = document.getElementById('signupPhone') || signupForm.querySelector('input[name="phone"]');
      
      const userData = {
        name: nameInput ? nameInput.value : 'User',
        email: emailInput ? emailInput.value : '',
        phone: phoneInput ? phoneInput.value : '',
        dateJoined: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      };

      // Direktang itong mapupunta sa profile storage para mag-reflect sa profile
      localStorage.setItem('ifc_user_profile', JSON.stringify(userData));
      localStorage.setItem('isLoggedIn', 'true');
      
      // I-reset sa 0 / empty array ang cart, orders, transactions, at messages para sa bagong user
      localStorage.setItem('ifc_user_cart', JSON.stringify([]));
      localStorage.setItem('ifc_user_orders', JSON.stringify([]));
      localStorage.setItem('ifc_user_transactions', JSON.stringify([]));
      localStorage.setItem('ifc_user_messages', JSON.stringify([]));
    });
  }
}

// ✅ FIX BODY SCROLL BUG
function fixBodyScrolling() {
  const allModals = document.querySelectorAll('.modal');
  allModals.forEach(modal => {
    modal.addEventListener('hidden.bs.modal', () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => backdrop.remove());
    });
  });
}

// ✅ HELPER PARA SA SMALL CUSTOM ALERT MODAL
function showCustomAlert(message, callback = null) {
    const msgEl = document.getElementById('smallAlertMessage');
    if (msgEl) msgEl.textContent = message;
    
    const alertModalEl = document.getElementById('smallAlertModal');
    if (alertModalEl) {
        const alertModal = new bootstrap.Modal(alertModalEl);
        alertModal.show();

        if (callback) {
            const okBtn = document.getElementById('smallAlertOkBtn');
            if (okBtn) {
                const newOkBtn = okBtn.cloneNode(true);
                okBtn.parentNode.replaceChild(newOkBtn, okBtn);
                newOkBtn.addEventListener('click', () => {
                    alertModal.hide();
                    callback();
                });
            }
        }
    }
}

// ✅ SETUP NAVBAR AUTH
function setupNavbarAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const navRightActions = document.getElementById('navRightActions');

    if (!navRightActions) return;

    const isProductPage = window.location.pathname.includes('products.html');

    let actionsHTML = '<div style="display: flex; align-items: center; gap: 16px;">';

    if (isProductPage) {
        actionsHTML += `
            <a href="#" title="Search" class="nav-flat-icon-btn">
                <i class="fas fa-search"></i>
            </a>
        `;
    }

    if (isLoggedIn) {
        actionsHTML += `
            <a href="user/userDashboard.html" title="User Profile" class="nav-flat-icon-btn">
                <i class="fas fa-user"></i>
            </a>
            <a href="user/userCart.html" title="Shopping Cart" class="nav-flat-icon-btn">
                <i class="fas fa-shopping-cart"></i>
            </a>
        `;
    } else {
        actionsHTML += `
            <a href="login.html" class="auth-action-link" style="text-decoration: none;">
                <span class="auth-text" style="font-size: 13px; font-weight: 600; color: #ffffff;">LOGIN/SIGNUP</span>
            </a>
        `;
    }

    actionsHTML += '</div>';
    navRightActions.innerHTML = actionsHTML;
}

// ✅ LOAD PRODUCTS
function loadProducts() {
  fetch('products.json')
    .then(res => res.json())
    .then(data => {
      allProducts = data;
      renderProducts(allProducts);
    })
    .catch(err => console.error('Error loading JSON:', err));
}

// ✅ RENDER PRODUCTS
function renderProducts(products) {
  const container = document.getElementById('product-container');
  if (!container) return;
  container.innerHTML = "";

  products.forEach(item => {
    const col = document.createElement('div');
    col.classList.add('col-6', 'col-sm-4', 'col-md-3', 'col-lg-2');

    const safeDesc = item.description || 'Handmade artisanal craft made with care.';

    col.innerHTML = `
      <div class="product-card shadow-sm h-100 d-flex flex-column">
        <div class="product-img-wrapper">
          <img src="${item.image}" class="product-img" alt="${item.size}">
        </div>
        <div class="product-body text-center d-flex flex-column justify-content-between flex-grow-1 p-3">
          <div>
            <h6 class="product-name">${item.name}</h6>
            <p class="text-muted small mb-1">${item.size}</p>
            <p class="product-price">${item.price}</p>
          </div>
          <button class="btn btn-dark btn-sm w-100 mt-2"
            onclick="showItem('${item.name.replace(/'/g, "\\'")}', '${item.size}', '${item.price}', '${item.image}', '${safeDesc.replace(/'/g, "\\'")}')">
            <i class="bi bi-eye"></i> View
          </button>
        </div>
      </div>
    `;
    container.appendChild(col);
  });
}

// ✅ FILTER SETUP
function setupFilters() {
  ['small','medium','large','under100','100to150','150to200','allPrice']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', applyFilters);
    });
}

// ✅ APPLY FILTERS
function applyFilters() {
  const small = document.getElementById('small')?.checked;
  const medium = document.getElementById('medium')?.checked;
  const large = document.getElementById('large')?.checked;

  const filtered = allProducts.filter(item => {
    let sizeMatch = true;
    if (small || medium || large) {
      sizeMatch =
        (small && item.size === "Small") ||
        (medium && item.size === "Medium") ||
        (large && item.size === "Large");
    }

    const num = parseInt(item.price.replace('₱',''));
    let priceMatch = true;

    const under100 = document.getElementById('under100')?.checked;
    const oneToFifty = document.getElementById('100to150')?.checked;
    const fiftyToTwo = document.getElementById('150to200')?.checked;

    if (under100) priceMatch = num < 100;
    else if (oneToFifty) priceMatch = num >= 100 && num <= 150;
    else if (fiftyToTwo) priceMatch = num > 150 && num <= 200;

    return sizeMatch && priceMatch;
  });

  renderProducts(filtered);
}

// ✅ PRODUCT MODAL VIEW
function showItem(name, size, price, image, description) {
  activeProduct = { name, size, price, image, description };

  document.getElementById('modalTitle').innerText = name;
  document.getElementById('modalPrice').innerText = price;
  document.getElementById('modalDescription').innerText = description;
  document.getElementById('modalImage').src = image;
  document.getElementById('modalSize').innerText = size;
  document.getElementById('quantity').value = 1;
  
  const modalEl = document.getElementById('itemModal');
  const modalInstance = new bootstrap.Modal(modalEl);
  modalInstance.show();
}

// ✅ SETUP ADD TO CART, BUY NOW, & CHECKOUT CONFIRMATION LOGIC
function setupProductActions() {
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            if (!activeProduct) return;
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            if (!isLoggedIn) {
                showCustomAlert('Please login first to add items to your cart.', () => {
                    window.location.href = 'login.html';
                });
                return;
            }

            const qty = parseInt(document.getElementById('quantity').value) || 1;
            const cleanPriceStr = String(activeProduct.price).replace(/[^\d.]/g, '');
            const rawPrice = parseFloat(cleanPriceStr) || 0;
            const subtotal = rawPrice * qty;
            const vatAmount = subtotal * 0.12;
            const totalWithVat = subtotal + vatAmount;

            let cart = JSON.parse(localStorage.getItem('ifc_user_cart')) || [];
            const productWithVat = {
                ...activeProduct,
                subtotal: '₱' + subtotal.toFixed(2),
                vat: '₱' + vatAmount.toFixed(2),
                totalPrice: '₱' + totalWithVat.toFixed(2)
            };

            const existingIndex = cart.findIndex(item => item.name === activeProduct.name);
            if (existingIndex > -1) {
                cart[existingIndex].quantity += qty;
                const newSub = parseFloat(String(activeProduct.price).replace(/[^\d.]/g, '')) * cart[existingIndex].quantity;
                const newVat = newSub * 0.12;
                cart[existingIndex].subtotal = '₱' + newSub.toFixed(2);
                cart[existingIndex].vat = '₱' + newVat.toFixed(2);
                cart[existingIndex].totalPrice = '₱' + (newSub + newVat).toFixed(2);
            } else {
                cart.push({ ...productWithVat, quantity: qty });
            }

            localStorage.setItem('ifc_user_cart', JSON.stringify(cart));
            showCustomAlert('Product successfully added to your Cart with 12% VAT!', () => {
                window.location.href = 'user/userCart.html'; 
            });
        });
    }

    const buyNowBtn = document.getElementById('buyNowBtn');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', () => {
            if (!activeProduct) return;
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            if (!isLoggedIn) {
                showCustomAlert('Please login first to checkout products.', () => {
                    window.location.href = 'login.html';
                });
                return;
            }

            const qty = parseInt(document.getElementById('quantity').value) || 1;
            const cleanPriceStr = String(activeProduct.price).replace(/[^\d.]/g, '');
            const rawPrice = parseFloat(cleanPriceStr) || 0;
            const subtotal = rawPrice * qty;
            const vatAmount = subtotal * 0.12;
            const totalAmount = subtotal + vatAmount;

            document.getElementById('checkoutItemName').textContent = activeProduct.name;
            document.getElementById('checkoutItemQty').textContent = qty;
            document.getElementById('checkoutItemSubtotal').textContent = '₱' + subtotal.toFixed(2);
            document.getElementById('checkoutItemVat').textContent = '₱' + vatAmount.toFixed(2);
            document.getElementById('checkoutItemTotal').textContent = '₱' + totalAmount.toFixed(2);

            const itemModalEl = document.getElementById('itemModal');
            const itemModal = bootstrap.Modal.getInstance(itemModalEl);
            if (itemModal) itemModal.hide();

            setTimeout(() => {
                const checkoutModalEl = document.getElementById('checkoutModal');
                const checkoutModal = new bootstrap.Modal(checkoutModalEl);
                checkoutModal.show();
            }, 300);
        });
    }

    const confirmOrderBtn = document.getElementById('confirmOrderBtn');
    if (confirmOrderBtn) {
        confirmOrderBtn.addEventListener('click', () => {
            const receiptInput = document.getElementById('gcashReceipt');
            if (!receiptInput.files || receiptInput.files.length === 0) {
                showCustomAlert('Please upload your GCash payment screenshot or receipt first before confirming.');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(uploadEvent) {
                const receiptBase64 = uploadEvent.target.result;
                const qty = parseInt(document.getElementById('quantity').value) || 1;
                const cleanPriceStr = String(activeProduct.price).replace(/[^\d.]/g, '');
                const rawPrice = parseFloat(cleanPriceStr) || 0;
                const subtotal = rawPrice * qty;
                const vatAmount = subtotal * 0.12;
                const totalAmount = subtotal + vatAmount;
                
                const orderItem = {
                    id: 'IFC-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
                    name: activeProduct.name,
                    product: activeProduct.name,
                    craft: activeProduct.size || 'Handmade Craft',
                    image: activeProduct.image,
                    price: '₱' + totalAmount.toFixed(2),
                    quantity: qty,
                    qty: qty,
                    subtotal: '₱' + subtotal.toFixed(2),
                    vat: '₱' + vatAmount.toFixed(2),
                    total: '₱' + totalAmount.toFixed(2),
                    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                    year: String(new Date().getFullYear()),
                    status: 'pending',
                    shipping: 'Taytay, Rizal',
                    payment: 'GCash',
                    receiptImage: receiptBase64
                };

                let orders = JSON.parse(localStorage.getItem('ifc_user_orders')) || [];
                orders.unshift(orderItem);
                localStorage.setItem('ifc_user_orders', JSON.stringify(orders));

                let transactions = JSON.parse(localStorage.getItem('ifc_user_transactions')) || [];
                transactions.unshift(orderItem);
                localStorage.setItem('ifc_user_transactions', JSON.stringify(transactions));

                let notifications = JSON.parse(localStorage.getItem('ifc_user_notifications')) || [];
                const newNotif = {
                    title: 'Pending Validate of Payment',
                    message: `Your payment for order ${orderItem.id} (${orderItem.product}) is currently pending validation by our admin team. Please wait for confirmation.`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString(),
                    unread: true
                };
                notifications.unshift(newNotif);
                localStorage.setItem('ifc_user_notifications', JSON.stringify(notifications));

                showCustomAlert('Order placed successfully! Pending validate of payment. Redirecting to your Orders page.', () => {
                    window.location.href = 'user/userOrder.html';
                });
            };
            reader.readAsDataURL(receiptInput.files[0]);
        });
    }
}

// ✅ CUSTOM FORM & PENDING ORDERS LOGIC
function setupCustomFormLogic() {
  const refInput = document.getElementById('customRefImage');
  if (refInput) {
      refInput.addEventListener('change', (e) => {
          if (e.target.files && e.target.files[0]) {
              const label = document.getElementById('refFileLabel');
              if (label) label.textContent = "Attached: " + e.target.files[0].name;
          }
      });
  }

  const customForm = document.getElementById('customForm');
  if (customForm) {
      customForm.addEventListener('submit', (e) => {
          e.preventDefault();
          
          const typeEl = document.querySelector('input[name="customType"]:checked');
          const fileInput = document.getElementById('customRefImage');

          const processSubmission = (imageUrl = '') => {
              const typeVal = typeEl ? typeEl.value : 'Custom Craft';
              pendingCustomData = {
                  id: 'CUST-' + Math.floor(1000 + Math.random() * 9000),
                  product: 'Custom ' + typeVal,
                  name: 'Custom ' + typeVal,
                  craft: typeVal,
                  designDesc: document.getElementById('customDesignDesc').value,
                  material: document.getElementById('customMaterial').value || 'Standard',
                  color: document.getElementById('customColor').value || 'Any',
                  sizeMeasure: document.getElementById('customSizeMeasure').value || 'Standard',
                  addNotes: document.getElementById('customAddNotes').value,
                  fullName: document.getElementById('customFullName').value,
                  contactNum: document.getElementById('customContactNum').value,
                  email: document.getElementById('customEmail').value,
                  image: imageUrl || 'pics/Logo.jpg',
                  price: '₱0.00',
                  qty: 1,
                  status: 'pending',
                  date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              };

              const customModalEl = document.getElementById('customModal');
              const customModal = bootstrap.Modal.getInstance(customModalEl);
              if (customModal) customModal.hide();

              setTimeout(() => {
                  const noticeModalEl = document.getElementById('importantNoticeModal');
                  if (noticeModalEl) {
                      const noticeModal = new bootstrap.Modal(noticeModalEl);
                      noticeModal.show();
                  }
              }, 300);
          };

          if (fileInput && fileInput.files && fileInput.files[0]) {
              const reader = new FileReader();
              reader.onload = function(evt) {
                  processSubmission(evt.target.result);
              };
              reader.readAsDataURL(fileInput.files[0]);
          } else {
              processSubmission('');
          }
      });
  }

  const agreeNoticeBtn = document.getElementById('agreeNoticeBtn');
  if (agreeNoticeBtn) {
      agreeNoticeBtn.addEventListener('click', () => {
          if (!pendingCustomData) return;

          let userOrders = JSON.parse(localStorage.getItem('ifc_user_orders')) || [];
          userOrders.unshift(pendingCustomData);
          localStorage.setItem('ifc_user_orders', JSON.stringify(userOrders));

          let notifications = JSON.parse(localStorage.getItem('ifc_user_notifications')) || [];
          const customNotif = {
              title: 'Pending for Approval',
              message: `Your custom request (${pendingCustomData.product}) with ID ${pendingCustomData.id} has been submitted and is now pending for approval by our team.`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString(),
              unread: true
          };
          notifications.unshift(customNotif);
          localStorage.setItem('ifc_user_notifications', JSON.stringify(notifications));

          const noticeModalEl = document.getElementById('importantNoticeModal');
          const noticeModal = bootstrap.Modal.getInstance(noticeModalEl);
          if (noticeModal) noticeModal.hide();

          showCustomAlert('Custom request submitted successfully! Pending for approval. Redirecting to your Pending Orders page.', () => {
              window.location.href = 'user/pendingOrders.html';
          });
      });
  }
}
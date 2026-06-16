const storageKey = "el-gordo-cart";
const shippingCost = 900;

const getSavedCart = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch (error) {
    localStorage.removeItem(storageKey);
    return [];
  }
};

const state = {
  cart: getSavedCart()
    .map((savedItem) => {
      const product = products.find((item) => item.id === Number(savedItem.id));
      return product ? { ...product, quantity: savedItem.quantity || 1 } : null;
    })
    .filter(Boolean),
  category: "all",
  search: "",
};

const $ = (selector) => document.querySelector(selector);
const formatter = new Intl.NumberFormat("es-AR");

const dom = {
  categories: $("#categories"),
  recommended: $("#recommended-products"),
  products: $("#products-grid"),
  result: $("#products-result"),
  search: $("#search-products"),
  clearFilters: $("#clear-filters"),
  cart: $("#cart"),
  cartItems: $("#cart-items"),
  cartCount: $("#cart-count"),
  openCart: $("#open-cart"),
  openCartBottom: $("#open-cart-bottom"),
  closeCart: $("#close-cart"),
  overlay: $("#overlay"),
  subtotal: $("#subtotal"),
  shipping: $("#shipping"),
  total: $("#total"),
  clearCart: $("#clear-cart"),
  checkoutForm: $("#checkout-form"),
  quickAdd: $("#quick-add"),
  toast: $("#toast"),
};

const money = (value) => `$ ${formatter.format(value)}`;

const saveCart = () => {
  localStorage.setItem(storageKey, JSON.stringify(state.cart));
};

const foodPhoto = (product, className = "product-card__image") => `
  <img class="${className}" src="${product.img}" alt="${product.name}" loading="lazy" />
`;

const getVisibleProducts = () => {
  const normalizedSearch = state.search.trim().toLowerCase();
  return products.filter((product) => {
    const matchesCategory = state.category === "all" || product.category === state.category || product.category === "all";
    const matchesSearch = !normalizedSearch || `${product.name} ${product.desc}`.toLowerCase().includes(normalizedSearch);
    return matchesCategory && matchesSearch;
  });
};

const renderCategories = () => {
  dom.categories.innerHTML = categories
    .map((category) => `
      <button class="category-card ${state.category === category.id ? "is-selected" : ""}" type="button" data-category="${category.id}">
        <img class="category-card__icon" src="${category.img}" alt="" loading="lazy" />
        <span>${category.name}</span>
      </button>
    `)
    .join("");
};

const productCard = (product, compact = false) => `
  <article class="${compact ? "product-card product-card--compact" : "product-card"}">
    ${foodPhoto(product)}
    <div class="product-card__body">
      <div>
        <h3>${product.name}</h3>
        <p>${product.desc}</p>
      </div>
      <div class="product-card__footer">
        <strong class="gradient-text">${money(product.price)}</strong>
        <button class="button button--add" type="button" data-add="${product.id}">Agregar</button>
      </div>
    </div>
  </article>
`;

const renderProducts = () => {
  const visibleProducts = getVisibleProducts();
  dom.result.textContent = visibleProducts.length
    ? `${visibleProducts.length} productos disponibles.`
    : "No encontramos productos con ese filtro.";

  dom.products.innerHTML = visibleProducts.length
    ? visibleProducts.map((product) => productCard(product)).join("")
    : `<div class="empty-state">No hay productos para mostrar.</div>`;
};

const renderRecommended = () => {
  dom.recommended.innerHTML = products
    .filter((product) => product.recommended)
    .map((product) => productCard(product, true))
    .join("");
};

const getCartUnits = () => state.cart.reduce((sum, item) => sum + item.quantity, 0);
const getSubtotal = () => state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
const getShipping = () => (state.cart.length ? shippingCost : 0);

const renderCart = () => {
  dom.cartCount.textContent = getCartUnits();
  const subtotal = getSubtotal();
  const shipping = getShipping();

  dom.subtotal.textContent = money(subtotal);
  dom.shipping.textContent = money(shipping);
  dom.total.textContent = money(subtotal + shipping);

  if (!state.cart.length) {
    dom.cartItems.innerHTML = `
      <div class="empty-cart">
        <span aria-hidden="true">🧾</span>
        <p>Todavia no agregaste productos.</p>
      </div>`;
    return;
  }

  dom.cartItems.innerHTML = state.cart
    .map((item) => `
      <article class="cart-item">
        ${foodPhoto(item, "cart-item__image")}
        <div class="cart-item__info">
          <h3>${item.name}</h3>
          <p>${money(item.price)}</p>
          <div class="quantity">
            <button type="button" data-minus="${item.id}" aria-label="Quitar una unidad de ${item.name}">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-plus="${item.id}" aria-label="Agregar una unidad de ${item.name}">+</button>
          </div>
        </div>
        <button class="icon-button icon-button--danger" type="button" data-remove="${item.id}" aria-label="Eliminar ${item.name}">×</button>
      </article>
    `)
    .join("");
};

const updateCart = () => {
  saveCart();
  renderCart();
};

const showToast = (message) => {
  dom.toast.textContent = message;
  dom.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => dom.toast.classList.remove("is-visible"), 1800);
};

const addToCart = (id) => {
  const product = products.find((item) => item.id === Number(id));
  if (!product) return;

  const cartItem = state.cart.find((item) => item.id === product.id);
  if (cartItem) {
    cartItem.quantity += 1;
  } else {
    state.cart.push({ ...product, quantity: 1 });
  }

  updateCart();
  showToast(`${product.name} agregado al carrito`);
};

const changeQuantity = (id, amount) => {
  state.cart = state.cart
    .map((item) => item.id === Number(id) ? { ...item, quantity: item.quantity + amount } : item)
    .filter((item) => item.quantity > 0);
  updateCart();
};

const removeFromCart = (id) => {
  state.cart = state.cart.filter((item) => item.id !== Number(id));
  updateCart();
};

const openCart = () => {
  dom.cart.classList.add("is-open");
  dom.cart.setAttribute("aria-hidden", "false");
  dom.overlay.classList.add("is-visible");
};

const closeCart = () => {
  dom.cart.classList.remove("is-open");
  dom.cart.setAttribute("aria-hidden", "true");
  dom.overlay.classList.remove("is-visible");
};

const handleDocumentClick = (event) => {
  const addButton = event.target.closest("[data-add]");
  const plusButton = event.target.closest("[data-plus]");
  const minusButton = event.target.closest("[data-minus]");
  const removeButton = event.target.closest("[data-remove]");
  const categoryButton = event.target.closest("[data-category]");

  if (addButton) addToCart(addButton.dataset.add);
  if (plusButton) changeQuantity(plusButton.dataset.plus, 1);
  if (minusButton) changeQuantity(minusButton.dataset.minus, -1);
  if (removeButton) removeFromCart(removeButton.dataset.remove);
  if (categoryButton) {
    state.category = categoryButton.dataset.category;
    renderCategories();
    renderProducts();
  }
};

const finishOrder = (event) => {
  event.preventDefault();
  if (!state.cart.length) {
    showToast("Primero agrega productos al carrito");
    return;
  }

  const data = new FormData(dom.checkoutForm);
  const name = data.get("name").trim();
  const address = data.get("address").trim();
  const payment = data.get("payment");
  if (!name || !address || !payment) {
    showToast("Completa tus datos de entrega");
    return;
  }

  const orderNumber = Math.floor(1000 + Math.random() * 9000);
  state.cart = [];
  updateCart();
  dom.checkoutForm.reset();
  closeCart();
  showToast(`Pedido #${orderNumber} confirmado para ${name}`);
};

const init = () => {
  renderCategories();
  renderRecommended();
  renderProducts();
  renderCart();

  document.addEventListener("click", handleDocumentClick);
  dom.openCart.addEventListener("click", openCart);
  dom.openCartBottom.addEventListener("click", openCart);
  dom.closeCart.addEventListener("click", closeCart);
  dom.overlay.addEventListener("click", closeCart);
  dom.clearCart.addEventListener("click", () => {
    state.cart = [];
    updateCart();
    showToast("Carrito vaciado");
  });
  dom.clearFilters.addEventListener("click", () => {
    state.category = "all";
    state.search = "";
    dom.search.value = "";
    renderCategories();
    renderProducts();
  });
  dom.search.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderProducts();
  });
  dom.checkoutForm.addEventListener("submit", finishOrder);
  dom.quickAdd.addEventListener("click", () => {
    addToCart(14);
    openCart();
  });
};

init();

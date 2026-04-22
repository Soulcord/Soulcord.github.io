// ==================== DATA ====================
const reviews = [
  { name: 'Mariska de Vries', rating: 5, text: 'Beste Surinaamse eten in Diemen! De loaded fries is een absolute aanrader. Snelle bezorging en het eten was nog heet.' },
  { name: 'Jason Pietersz', rating: 5, text: 'Eindelijk authentiek Surinaams eten! De masoes moksi alesi bracht herinneringen terug aan Paramaribo.' },
  { name: 'Sophie Bakker', rating: 4, text: 'Heerlijk gegeten! Goede porties en smaakvol. Zeker weer een keer bestellen.' },
  { name: 'Michael Hasselbaink', rating: 4, text: 'De pasta crispy chicken is geweldig. Service was vriendelijk en bezorging precies op tijd.' }
];

const deliveryZones = {
  '1112': { min: 10.00, fee: 4.00, freeAbove: 10 },
  '1111': { min: 16.50, fee: 4.00 }, '1113': { min: 16.50, fee: 4.00 },
  '1114': { min: 16.50, fee: 4.00 }, '1115': { min: 16.50, fee: 4.00 },
  '1101': { min: 16.50, fee: 4.00 },
  '1018': { min: 16.50, fee: 5.50 }, '1019': { min: 16.50, fee: 5.50 },
  '1021': { min: 16.50, fee: 5.50 }, '1022': { min: 16.50, fee: 5.50 },
  '1023': { min: 16.50, fee: 5.50 }, '1024': { min: 16.50, fee: 5.50 },
  '1025': { min: 16.50, fee: 5.50 }, '1051': { min: 16.50, fee: 5.50 },
  '1071': { min: 16.50, fee: 5.50 }, '1072': { min: 16.50, fee: 5.50 },
  '1073': { min: 16.50, fee: 5.50 }, '1074': { min: 16.50, fee: 5.50 },
  '1075': { min: 16.50, fee: 5.50 }, '1076': { min: 16.50, fee: 5.50 },
  '1077': { min: 16.50, fee: 5.50 }, '1078': { min: 16.50, fee: 5.50 },
  '1079': { min: 16.50, fee: 5.50 }, '1081': { min: 16.50, fee: 5.50 },
  '1082': { min: 16.50, fee: 5.50 }, '1083': { min: 16.50, fee: 5.50 },
  '1086': { min: 16.50, fee: 5.50 }, '1087': { min: 16.50, fee: 5.50 },
  '1091': { min: 16.50, fee: 5.50 }, '1092': { min: 16.50, fee: 5.50 },
  '1093': { min: 16.50, fee: 5.50 }, '1094': { min: 16.50, fee: 5.50 },
  '1095': { min: 16.50, fee: 5.50 }, '1096': { min: 16.50, fee: 5.50 },
  '1097': { min: 16.50, fee: 5.50 }, '1098': { min: 16.50, fee: 5.50 },
  '1102': { min: 16.50, fee: 5.50 }, '1103': { min: 16.50, fee: 5.50 },
  '1104': { min: 16.50, fee: 5.50 }, '1105': { min: 16.50, fee: 5.50 },
  '1106': { min: 16.50, fee: 5.50 }, '1107': { min: 16.50, fee: 5.50 },
  '1108': { min: 16.50, fee: 5.50 }
};

// FIX #1: Use 24 for midnight (00:00) so time math works correctly
const openingHours = {
  0: { open: 17, close: 24 },  // Sunday
  1: { open: 17, close: 24, deliveryClose: 23 }, // Monday (delivery until 23:00)
  2: { open: 17, close: 24 },  // Tuesday
  3: null,                      // Wednesday — closed
  4: { open: 17, close: 24 },  // Thursday
  5: { open: 17, close: 24 },  // Friday
  6: { open: 17, close: 24 }   // Saturday
};

const dayNamesNL = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];

// ==================== STATE ====================
let menuData = {};
let cart = [];
let currentCategory = 'gerechten';
let promoApplied = false;
let selectedTip = 0;
let deliveryZone = null;
let deliveryInfo = {};

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('menu.json');
    menuData = await res.json();
  } catch (e) {
    console.error('Failed to load menu data:', e);
  }
  initOpeningStatus();
  renderPopularDishes();
  renderMenu(currentCategory);
  renderReviews();
  initCart();
  initCheckout();
  initNavigation();
  populateDeliveryTimes();
  initScrollEffects();
  initLanguage();
});

// ==================== FIX #1: OPENING STATUS ====================
function isCurrentlyOpen() {
  const now = new Date();
  const day = now.getDay();
  const h = now.getHours(); // 0-23
  const todayHours = openingHours[day];
  if (!todayHours) return false;
  return h >= todayHours.open && h < todayHours.close;
}

function initOpeningStatus() {
  const badge = document.getElementById('statusBadge');
  const statusText = document.getElementById('statusText');
  const heroBtn = document.getElementById('heroOrderBtn');
  const closedMsg = document.getElementById('closedMessage');

  const now = new Date();
  const day = now.getDay();
  const h = now.getHours();
  const todayHours = openingHours[day];

  if (todayHours && h >= todayHours.open && h < todayHours.close) {
    badge.className = 'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white mb-6 badge-open';
    statusText.textContent = 'Nu open — bezorging beschikbaar';
    heroBtn.disabled = false;
  } else {
    badge.className = 'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white mb-6 badge-closed';
    statusText.textContent = 'Momenteel gesloten';
    heroBtn.disabled = true;

    if (!todayHours) {
      closedMsg.textContent = 'Woensdag gesloten — morgen weer open vanaf 17:00';
    } else if (h < todayHours.open) {
      closedMsg.textContent = `Vandaag open vanaf ${todayHours.open}:00`;
    } else {
      const nextDay = (day + 1) % 7;
      const nextHours = openingHours[nextDay];
      closedMsg.textContent = nextHours
        ? `Morgen weer open vanaf ${nextHours.open}:00`
        : 'Woensdag gesloten — donderdag open vanaf 17:00';
    }
    closedMsg.classList.remove('hidden');
  }
}

// ==================== FIX #2: DELIVERY TIMES ====================
function populateDeliveryTimes() {
  const select = document.getElementById('deliveryTimeSelect');
  const now = new Date();
  const day = now.getDay();
  const todayHours = openingHours[day];

  select.innerHTML = '<option value="">Zo snel mogelijk</option>';
  if (!todayHours || !isCurrentlyOpen()) return;

  // Delivery close hour: use deliveryClose if set, else close
  const deliveryCloseH = todayHours.deliveryClose || todayHours.close;

  let startH = now.getHours();
  let startM = now.getMinutes() + 20; // minimum 20 min from now
  if (startM >= 60) { startH++; startM -= 60; }
  // Round up to nearest 15 min
  startM = Math.ceil(startM / 15) * 15;
  if (startM >= 60) { startH++; startM = 0; }

  const options = [];
  for (let hh = startH; hh < deliveryCloseH; hh++) {
    const mStart = (hh === startH) ? startM : 0;
    for (let mm = mStart; mm < 60; mm += 15) {
      const time = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
      options.push(`<option value="${time}">${time}</option>`);
    }
  }

  if (options.length === 0) {
    select.innerHTML = '<option value="">Bezorging niet meer beschikbaar vandaag</option>';
  } else {
    select.innerHTML = '<option value="">Zo snel mogelijk</option>' + options.join('');
  }
}

// ==================== MENU ====================
function getAllItems() {
  return Object.values(menuData).flat();
}

function findItem(id) {
  return getAllItems().find(i => i.id === id);
}

function renderPopularDishes() {
  const container = document.getElementById('popularDishes');
  const popular = getAllItems().filter(i => i.popular);
  container.innerHTML = popular.map(item => createCard(item, true)).join('');
}

function renderMenu(category) {
  const container = document.getElementById('menuContainer');
  container.innerHTML = (menuData[category] || []).map(item => createCard(item)).join('');
}

function createCard(item, isPopular = false) {
  const badges = item.allergies.map(a => `<span class="allergy-badge">${a}</span>`).join('');
  const popularBadge = isPopular
    ? `<div class="absolute top-3 left-3 z-10"><span class="badge-gold text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">⭐ Populair</span></div>`
    : '';

  if (item.soldout) {
    return `
      <div class="menu-card bg-white rounded-xl p-4 relative opacity-60">
        ${popularBadge}
        <div class="absolute top-3 right-3 z-10"><span class="badge-soldout text-xs font-semibold px-3 py-1 rounded-full">Uitverkocht</span></div>
        <h3 class="font-display text-lg font-bold text-charcoal mb-1 ${isPopular ? 'pt-6' : ''}">${item.name}</h3>
        ${item.desc ? `<p class="text-sm text-gray-500 mb-2">${item.desc}</p>` : ''}
        ${badges ? `<div class="flex flex-wrap gap-1 mb-3">${badges}</div>` : ''}
        <span class="text-xl font-bold text-jungle">€${item.price.toFixed(2)}</span>
      </div>`;
  }

  return `
    <div class="menu-card bg-white rounded-xl p-4 relative">
      ${popularBadge}
      <h3 class="font-display text-lg font-bold text-charcoal mb-1 ${isPopular ? 'pt-6' : ''}">${item.name}</h3>
      ${item.desc ? `<p class="text-sm text-gray-500 mb-2">${item.desc}</p>` : ''}
      ${badges ? `<div class="flex flex-wrap gap-1 mb-3">${badges}</div>` : ''}
      <div class="flex items-center justify-between mt-2">
        <span class="text-xl font-bold text-jungle">€${item.price.toFixed(2)}</span>
        <button onclick="addToCart('${item.id}')" class="btn-primary px-4 py-2 rounded-lg text-sm font-medium">
          + Toevoegen
        </button>
      </div>
    </div>`;
}

function renderReviews() {
  document.getElementById('reviewsContainer').innerHTML = reviews.map(r => `
    <div class="bg-white rounded-xl p-6 shadow-sm">
      <div class="flex items-center gap-1 mb-2">
        ${Array(5).fill(0).map((_,i) =>
          `<svg class="w-4 h-4 ${i < r.rating ? 'text-gold' : 'text-gray-300'}" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>`
        ).join('')}
      </div>
      <p class="text-sm text-charcoal mb-3">"${r.text}"</p>
      <p class="text-sm font-medium text-gray-500">— ${r.name}</p>
    </div>`).join('');
}

// ==================== CART ====================
function initCart() {
  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('cartOverlay').addEventListener('click', closeCart);
  document.getElementById('closeCart').addEventListener('click', closeCart);
  document.getElementById('applyPromo').addEventListener('click', applyPromo);
  // FIX #3: checkout button enabled based only on cart having items
  document.getElementById('checkoutBtn').addEventListener('click', openCheckout);
  updateCartUI();
}

function openCart() {
  const overlay = document.getElementById('cartOverlay');
  const panel = document.getElementById('cartPanel');
  overlay.classList.remove('hidden');
  setTimeout(() => overlay.classList.remove('opacity-0'), 10);
  panel.classList.remove('translate-x-full');
}

function closeCart() {
  const overlay = document.getElementById('cartOverlay');
  const panel = document.getElementById('cartPanel');
  overlay.classList.add('opacity-0');
  panel.classList.add('translate-x-full');
  setTimeout(() => overlay.classList.add('hidden'), 300);
}

function addToCart(id) {
  const item = findItem(id);
  if (!item || item.soldout) return;
  const existing = cart.find(c => c.id === id);
  if (existing) { existing.quantity++; }
  else { cart.push({ ...item, quantity: 1 }); }
  updateCartUI();
  openCart();
  // Flash animation on badge
  const badge = document.getElementById('cartBadge');
  badge.classList.add('scale-125');
  setTimeout(() => badge.classList.remove('scale-125'), 200);
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  updateCartUI();
}

function updateQuantity(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) removeFromCart(id);
  else updateCartUI();
}

function updateCartUI() {
  const badge = document.getElementById('cartBadge');
  const itemsEl = document.getElementById('cartItems');
  const emptyEl = document.getElementById('cartEmpty');
  const total = cart.reduce((s,i) => s + i.quantity, 0);

  // Badge
  if (total > 0) { badge.textContent = total; badge.classList.remove('hidden'); badge.classList.add('flex'); }
  else { badge.classList.add('hidden'); badge.classList.remove('flex'); }

  // Items vs empty
  if (cart.length === 0) {
    itemsEl.classList.add('hidden');
    emptyEl.classList.remove('hidden');
  } else {
    emptyEl.classList.add('hidden');
    itemsEl.classList.remove('hidden');
    itemsEl.innerHTML = cart.map(item => `
      <div class="bg-white rounded-lg p-3 mb-3 shadow-sm">
        <div class="flex justify-between items-start mb-2">
          <h4 class="font-medium text-charcoal text-sm pr-2">${item.name}</h4>
          <button onclick="removeFromCart('${item.id}')" class="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <button onclick="updateQuantity('${item.id}',-1)" class="w-7 h-7 rounded bg-jungle/10 text-jungle hover:bg-jungle hover:text-white transition-colors flex items-center justify-center text-lg font-bold">−</button>
            <span class="w-6 text-center font-semibold">${item.quantity}</span>
            <button onclick="updateQuantity('${item.id}',1)" class="w-7 h-7 rounded bg-jungle/10 text-jungle hover:bg-jungle hover:text-white transition-colors flex items-center justify-center text-lg font-bold">+</button>
          </div>
          <span class="font-bold text-jungle">€${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      </div>`).join('');
  }

  updateCartTotals();
}

function updateCartTotals() {
  const subtotal = cart.reduce((s,i) => s + i.price * i.quantity, 0);
  const promoDiscount = promoApplied ? subtotal * 0.1 : 0;
  const serviceFee = 0.25;

  // Delivery fee shown at checkout, not in cart
  const displayTotal = subtotal + serviceFee - promoDiscount + selectedTip;

  document.getElementById('cartSubtotal').textContent = `€${subtotal.toFixed(2)}`;
  document.getElementById('cartDiscount').textContent = `-€${promoDiscount.toFixed(2)}`;
  document.getElementById('cartTip').textContent = `€${selectedTip.toFixed(2)}`;
  document.getElementById('cartTotal').textContent = `€${displayTotal.toFixed(2)}`;
  document.getElementById('discountRow').classList.toggle('hidden', !promoApplied);
  document.getElementById('tipRow').classList.toggle('hidden', selectedTip === 0);

  // FIX #3: Enable checkout button when cart has items (regardless of deliveryZone)
  document.getElementById('checkoutBtn').disabled = cart.length === 0;
}

function applyPromo() {
  const input = document.getElementById('promoInput');
  const msg = document.getElementById('promoMessage');
  if (input.value.toUpperCase().trim() === 'JAWELS10') {
    promoApplied = true;
    msg.textContent = '✓ Code toegepast! 10% korting';
    msg.className = 'text-xs mt-1 text-green-600';
    input.disabled = true;
  } else {
    promoApplied = false;
    msg.textContent = '✗ Ongeldige code. Probeer JAWELS10';
    msg.className = 'text-xs mt-1 text-red-600';
  }
  msg.classList.remove('hidden');
  updateCartTotals();
}

// ==================== CHECKOUT ====================
function initCheckout() {
  const form = document.getElementById('deliveryForm');
  const postcodeInput = form.querySelector('[name="postcode"]');

  // Particulier / Bedrijf toggle
  document.getElementById('particulierBtn').addEventListener('click', () => {
    document.getElementById('particulierBtn').className = 'flex-1 py-2 px-4 rounded-lg bg-gold text-charcoal font-medium transition-colors';
    document.getElementById('bedrijfBtn').className = 'flex-1 py-2 px-4 rounded-lg bg-white/10 text-cream font-medium hover:bg-white/20 transition-colors';
    document.getElementById('bedrijfsnaamField').classList.add('hidden');
  });
  document.getElementById('bedrijfBtn').addEventListener('click', () => {
    document.getElementById('bedrijfBtn').className = 'flex-1 py-2 px-4 rounded-lg bg-gold text-charcoal font-medium transition-colors';
    document.getElementById('particulierBtn').className = 'flex-1 py-2 px-4 rounded-lg bg-white/10 text-cream font-medium hover:bg-white/20 transition-colors';
    document.getElementById('bedrijfsnaamField').classList.remove('hidden');
  });

  // Postcode validation on blur
  postcodeInput.addEventListener('blur', () => {
    const digits = postcodeInput.value.replace(/\s/g,'').substring(0,4);
    deliveryZone = deliveryZones[digits] || null;
    const err = document.getElementById('postcodeError');
    if (digits.length === 4) {
      err.classList.toggle('hidden', !!deliveryZone);
      postcodeInput.classList.toggle('error', !deliveryZone);
    }
  });

  // Payment method toggle
  document.querySelectorAll('[name="payment"]').forEach(r => r.addEventListener('change', () => {
    document.getElementById('contantDetails').classList.toggle('hidden', r.value !== 'contant');
    document.getElementById('idealDetails').classList.toggle('hidden', r.value !== 'ideal');
    document.getElementById('creditcardDetails').classList.toggle('hidden', r.value !== 'creditcard');
  }));

  // Fix: ensure contant visible on load
  document.getElementById('contantDetails').classList.remove('hidden');
  document.getElementById('idealDetails').classList.add('hidden');
  document.getElementById('creditcardDetails').classList.add('hidden');

  // Tip buttons
  document.querySelectorAll('.tip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tip-btn').forEach(b => {
        b.classList.remove('border-jungle','bg-jungle/5','active-tip');
        b.classList.add('border-jungle/20');
      });
      btn.classList.add('border-jungle','bg-jungle/5','active-tip');
      btn.classList.remove('border-jungle/20');
      selectedTip = parseFloat(btn.dataset.tip);
      updateCartTotals();
      updateOrderSummary();
    });
  });

  // Form submit
  form.addEventListener('submit', e => {
    e.preventDefault();
    document.getElementById('zoneSubmitError').classList.add('hidden');

    if (!validateForm()) return;

    // FIX #4: Show explicit error if postcode not in zone
    const pcDigits = form.querySelector('[name="postcode"]').value.replace(/\s/g,'').substring(0,4);
    deliveryZone = deliveryZones[pcDigits] || null;
    if (!deliveryZone) {
      document.getElementById('postcodeError').classList.remove('hidden');
      document.getElementById('zoneSubmitError').classList.remove('hidden');
      form.querySelector('[name="postcode"]').classList.add('error');
      form.querySelector('[name="postcode"]').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Check minimum order
    const subtotal = cart.reduce((s,i) => s + i.price * i.quantity, 0);
    if (subtotal < deliveryZone.min) {
      document.getElementById('zoneSubmitError').innerHTML = `
        <p class="text-red-600 text-sm font-medium">⚠️ Minimum bestelbedrag niet bereikt</p>
        <p class="text-red-500 text-xs mt-1">Minimum voor uw postcode: €${deliveryZone.min.toFixed(2)}. Uw bestelling: €${subtotal.toFixed(2)}.</p>`;
      document.getElementById('zoneSubmitError').classList.remove('hidden');
      return;
    }

    deliveryInfo = {
      voornaam: form.querySelector('[name="voornaam"]').value,
      achternaam: form.querySelector('[name="achternaam"]').value,
      adres: form.querySelector('[name="adres"]').value,
      huisnummer: form.querySelector('[name="huisnummer"]').value,
      postcode: form.querySelector('[name="postcode"]').value,
      woonplaats: form.querySelector('[name="woonplaats"]').value,
      telefoon: form.querySelector('[name="telefoon"]').value,
      email: form.querySelector('[name="email"]').value,
      bezorgtijd: form.querySelector('[name="bezorgtijd"]').value,
      opmerking: form.querySelector('[name="opmerking"]').value
    };

    goToStep2();
  });

  document.getElementById('placeOrderBtn').addEventListener('click', placeOrder);
}

function validateForm() {
  const form = document.getElementById('deliveryForm');
  let valid = true;
  form.querySelectorAll('[required]').forEach(field => {
    const err = field.parentElement.querySelector('.field-error');
    if (!field.value.trim() || (field.type === 'checkbox' && !field.checked)) {
      field.classList.add('error');
      if (err) err.classList.remove('hidden');
      valid = false;
    } else {
      field.classList.remove('error');
      if (err) err.classList.add('hidden');
    }
  });
  return valid;
}

function openCheckout() {
  closeCart();
  populateDeliveryTimes(); // refresh times each open
  document.getElementById('checkoutModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  goToStep1();
}

function closeCheckout() {
  document.getElementById('checkoutModal').classList.add('hidden');
  document.body.style.overflow = '';
}

function goToStep1() {
  document.getElementById('checkoutStep1').classList.remove('hidden');
  document.getElementById('checkoutStep2').classList.add('hidden');
}

function goToStep2() {
  document.getElementById('checkoutStep1').classList.add('hidden');
  document.getElementById('checkoutStep2').classList.remove('hidden');
  updateOrderSummary();
}

function updateOrderSummary() {
  const subtotal = cart.reduce((s,i) => s + i.price * i.quantity, 0);
  const promoDiscount = promoApplied ? subtotal * 0.1 : 0;
  const serviceFee = 0.25;
  let fee = 0;
  if (deliveryZone) {
    fee = deliveryZone.fee;
    if (deliveryZone.freeAbove && subtotal >= deliveryZone.freeAbove) fee = 0;
  }
  const total = subtotal + fee + serviceFee - promoDiscount + selectedTip;

  document.getElementById('orderSummary').innerHTML = cart.map(i =>
    `<div class="flex justify-between text-gray-600"><span>${i.quantity}× ${i.name}</span><span>€${(i.price*i.quantity).toFixed(2)}</span></div>`
  ).join('');

  document.getElementById('summarySubtotal').textContent = `€${subtotal.toFixed(2)}`;
  document.getElementById('summaryDelivery').textContent = `€${fee.toFixed(2)}`;
  document.getElementById('summaryDiscount').textContent = `-€${promoDiscount.toFixed(2)}`;
  document.getElementById('summaryTip').textContent = `€${selectedTip.toFixed(2)}`;
  document.getElementById('summaryTotal').textContent = `€${total.toFixed(2)}`;
  document.getElementById('summaryDiscountRow').classList.toggle('hidden', !promoApplied);
}

function placeOrder() {
  const orderNum = Math.floor(10000 + Math.random() * 90000);
  const subtotal = cart.reduce((s,i) => s + i.price * i.quantity, 0);
  const promoDiscount = promoApplied ? subtotal * 0.1 : 0;
  const fee = deliveryZone ? (deliveryZone.freeAbove && subtotal >= deliveryZone.freeAbove ? 0 : deliveryZone.fee) : 0;
  const total = subtotal + fee + 0.25 - promoDiscount + selectedTip;

  document.getElementById('orderNumber').textContent = `#${orderNum}`;
  document.getElementById('confirmationAddress').textContent =
    `${deliveryInfo.adres} ${deliveryInfo.huisnummer}, ${deliveryInfo.postcode} ${deliveryInfo.woonplaats}`;

  // Estimated delivery
  const selectedTime = deliveryInfo.bezorgtijd;
  if (selectedTime) {
    const [hh, mm] = selectedTime.split(':').map(Number);
    let eh = hh, em = mm + 30;
    if (em >= 60) { eh++; em -= 60; }
    document.getElementById('confirmationTime').textContent =
      `${selectedTime} – ${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}`;
  } else {
    document.getElementById('confirmationTime').textContent = 'Zo snel mogelijk (ca. 30-45 min)';
  }

  document.getElementById('confirmationItems').innerHTML = cart.map(i =>
    `<div class="flex justify-between text-gray-500"><span>${i.quantity}× ${i.name}</span><span>€${(i.price*i.quantity).toFixed(2)}</span></div>`
  ).join('');
  document.getElementById('confirmationTotal').textContent = `€${total.toFixed(2)}`;

  closeCheckout();
  document.getElementById('confirmationModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Reset cart
  cart = [];
  promoApplied = false;
  selectedTip = 0;
  deliveryZone = null;
  deliveryInfo = {};
  updateCartUI();
}

function closeConfirmation() {
  document.getElementById('confirmationModal').classList.add('hidden');
  document.body.style.overflow = '';
}

// ==================== NAVIGATION ====================
function initNavigation() {
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  mobileBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
  document.querySelectorAll('.mobile-link').forEach(link =>
    link.addEventListener('click', () => mobileMenu.classList.add('hidden'))
  );
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      renderMenu(currentCategory);
      document.getElementById('menuContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('shadow-lg', window.pageYOffset > 80);
  });
}

function initScrollEffects() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('section h2, section h3, section p').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    obs.observe(el);
  });
}

function initLanguage() {
  ['langNL','langNLMobile'].forEach(id => document.getElementById(id).addEventListener('click', () => setLang('nl')));
  ['langEN','langENMobile'].forEach(id => document.getElementById(id).addEventListener('click', () => setLang('en')));
}

function setLang(lang) {
  ['langNL','langNLMobile'].forEach(id => {
    const el = document.getElementById(id);
    el.className = lang === 'nl'
      ? 'text-sm font-medium px-2 py-1 rounded-full bg-jungle text-cream'
      : 'text-sm font-medium px-2 py-1 rounded-full text-charcoal hover:bg-jungle/10 transition-colors';
  });
  ['langEN','langENMobile'].forEach(id => {
    const el = document.getElementById(id);
    el.className = lang === 'en'
      ? 'text-sm font-medium px-2 py-1 rounded-full bg-jungle text-cream'
      : 'text-sm font-medium px-2 py-1 rounded-full text-charcoal hover:bg-jungle/10 transition-colors';
  });
}

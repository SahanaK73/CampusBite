// addon.js - "Forgot something?" page (addon.html?id=CB1024)
// For 2 minutes after paying, the student can add extra items and pay for just those.

const addonBox = document.getElementById("addonContent");
const addonOrderId = new URLSearchParams(location.search).get("id");

let basket = {};        // { foodId: quantity } - the extra items chosen so far
let justPaid = null;    // { amount, count } after a successful add-on payment
let wasOpen = true;     // used to notice the moment the window closes
let paying = false;

function getOrder() {
  return getOrders().find(function (o) { return o.id === addonOrderId; });
}

function basketTotal() {
  return Object.keys(basket).reduce(function (sum, id) { return sum + getFood(id).price * basket[id]; }, 0);
}

function basketCount() {
  return Object.keys(basket).reduce(function (n, id) { return n + basket[id]; }, 0);
}

function render() {
  const order = getOrder();

  if (!order) {
    addonBox.innerHTML = `
      <div class="empty">
        <div class="empty-emoji">🤔</div>
        <h2>Order not found</h2>
        <p class="muted">We couldn't find that order.</p>
        <a class="btn" href="orders.html">View My Orders</a>
      </div>`;
    return;
  }

  const state = addonState(order);
  wasOpen = state.open;
  const paidBanner = justPaid
    ? `<div class="success-box">✓ Paid ${rupees(justPaid.amount)} for ${justPaid.count} extra item${justPaid.count > 1 ? "s" : ""}. They were added to order #${order.id}.</div>`
    : "";

  // Window closed
  if (!state.open) {
    addonBox.innerHTML = `
      ${paidBanner}
      <div class="empty">
        <div class="empty-emoji">⏰</div>
        <h2>Add-on window closed</h2>
        <p class="muted">${state.reason === "kitchen"
          ? "The canteen has already finished preparing this order."
          : "The 2 minutes are over. You can place a new order from the menu."}</p>
        <a class="btn" href="orders.html">View My Orders</a>
        <a class="btn btn-outline" href="menu.html">Browse Menu</a>
      </div>`;
    return;
  }

  // Suggestions first (they get a reason), then the rest of the canteen's menu
  const orderFoodIds = orderItemsFlat(order).map(function (i) { return itemFoodId(i, order); }).filter(Boolean);
  const ranked = getRecommendations({ canteen: order.canteen, basket: orderFoodIds, limit: 99 });
  const rows = ranked.map(function (entry, position) {
    const f = entry.food;
    const qty = basket[f.id] || 0;
    return `
      <div class="addon-row">
        <div class="cart-thumb tile-${f.canteen.toLowerCase()}" aria-hidden="true">${f.emoji}</div>
        <div>
          <h3>${f.name} ${vegDotHTML(f)}</h3>
          <p class="muted">${rupees(f.price)}</p>
          ${position < 3 ? '<p class="reason">✨ ' + entry.reason + "</p>" : ""}
        </div>
        <div class="stepper">
          <button type="button" data-act="minus" data-id="${f.id}" aria-label="Remove one ${f.name}" ${qty < 1 ? "disabled" : ""}>-</button>
          <span>${qty}</span>
          <button type="button" data-act="plus" data-id="${f.id}" aria-label="Add one ${f.name}" ${qty >= 10 ? "disabled" : ""}>+</button>
        </div>
      </div>`;
  }).join("");

  const basketLines = Object.keys(basket).map(function (id) {
    const f = getFood(id);
    return `<div class="summary-row"><span>${f.name} × ${basket[id]}</span><span>${rupees(f.price * basket[id])}</span></div>`;
  }).join("");

  const delivery = isDelivery(order);

  addonBox.innerHTML = `
    ${paidBanner}
    <div class="timer-card">
      <div>
        <h2>Forgot something?</h2>
        <p class="muted">Order #${order.id} from ${order.canteen}. Add extra items and pay for just those.</p>
      </div>
      <div class="timer-box">
        <span class="muted">Time left</span>
        <b class="clock big" id="clock">${formatClock(state.left)}</b>
      </div>
      <div class="timebar"><span id="timeFill" style="width:${state.left / ADDON_WINDOW_SECONDS * 100}%"></span></div>
    </div>

    <div class="two-col">
      <section>${rows}</section>
      <aside class="summary">
        <h2>Add-on basket</h2>
        ${basketCount() === 0 ? '<p class="muted">Use the + buttons to add extra items.</p>' : basketLines}
        <div class="summary-row summary-total"><span>To pay now</span><span>${rupees(basketTotal())}</span></div>
        <div class="options" style="margin-top:0.9rem">
          <label class="option"><input type="radio" name="addpay" value="cash" checked> ${delivery ? "Cash on delivery" : "Cash at pickup"}</label>
          <label class="option"><input type="radio" name="addpay" value="upi"> UPI (Demo only)</label>
        </div>
        <button class="btn btn-block" id="payBtn" ${basketCount() === 0 ? "disabled" : ""}>Pay ${rupees(basketTotal())}</button>
        <p class="muted note">Add-ons are billed separately from your original payment. Deals do not apply to add-ons.</p>
      </aside>
    </div>`;
}

// + / - buttons
addonBox.addEventListener("click", function (event) {
  const stepBtn = event.target.closest("[data-act]");
  if (stepBtn) {
    const id = stepBtn.dataset.id;
    const food = getFood(id);
    if (!isAvailable(food)) { toast(food.name + " is sold out right now"); return; }
    basket[id] = basket[id] || 0;
    if (stepBtn.dataset.act === "plus") basket[id] = Math.min(basket[id] + 1, 10);
    if (stepBtn.dataset.act === "minus") basket[id] = Math.max(basket[id] - 1, 0);
    if (basket[id] === 0) delete basket[id];
    justPaid = null;
    render();
    return;
  }

  // Pay for the add-ons
  const pay = event.target.closest("#payBtn");
  if (pay && !paying) payForAddOns(pay);
});

function payForAddOns(button) {
  paying = true;
  button.disabled = true;
  button.textContent = "Paying...";
  const method = document.querySelector('input[name="addpay"]:checked').value;

  // A short pause so it feels like a real payment (demo only)
  setTimeout(function () {
    paying = false;
    const orders = getOrders();
    const order = orders.find(function (o) { return o.id === addonOrderId; });

    // The window may have closed while the student was paying
    if (!order || !addonState(order).open) {
      toast("Sorry, the add-on window just closed. You were not charged.");
      render();
      return;
    }

    const extra = Object.keys(basket).map(function (id) {
      const f = getFood(id);
      return { id: f.id, name: f.name, price: f.price, qty: basket[id] };
    });
    const amount = basketTotal();
    const count = basketCount();

    order.addOns = order.addOns || [];
    order.addOns.push({
      at: Date.now(),
      items: extra,
      amount: amount,
      payment: method === "upi" ? "UPI (Demo)" : (isDelivery(order) ? "Cash on delivery" : "Cash at pickup")
    });
    saveOrders(orders);

    basket = {};
    justPaid = { amount: amount, count: count };
    render();
  }, 700);
}

// Keep the clock and the bar moving; when time runs out, show the closed message
setInterval(function () {
  const order = getOrder();
  if (!order) return;
  const state = addonState(order);
  const clock = document.getElementById("clock");
  const fill = document.getElementById("timeFill");
  if (clock) clock.textContent = formatClock(state.left);
  if (fill) fill.style.width = (state.left / ADDON_WINDOW_SECONDS * 100) + "%";
  if (wasOpen && !state.open && !paying) render();
}, 500);

render();

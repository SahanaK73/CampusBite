// cart.js - Cart page. Food from several canteens is grouped by canteen.

const cartBox = document.getElementById("cartContent");

// Is the student one or two foods away from a deal in this canteen? Suggest it.
function dealHintHTML(group) {
  const have = {};
  group.items.forEach(function (i) { have[i.food.id] = i.qty; });
  const applied = group.pricing.applied.map(function (a) { return a.deal.id; });

  let best = null;
  DEALS.filter(function (d) { return d.canteen === group.canteen && applied.indexOf(d.id) === -1; }).forEach(function (deal) {
    const missing = [];
    let owned = 0;
    deal.items.forEach(function (it) {
      const need = it.qty - (have[it.id] || 0);
      if (have[it.id]) owned++;
      if (need > 0) missing.push({ id: it.id, qty: need });
    });
    const missingCount = missing.reduce(function (n, m) { return n + m.qty; }, 0);
    if (owned > 0 && missingCount > 0 && missingCount <= 2 && !dealSoldOutFood(deal)) {
      if (!best || dealSaving(deal) > dealSaving(best.deal)) best = { deal: deal, missing: missing };
    }
  });
  if (!best) return "";

  const names = best.missing.map(function (m) { return (m.qty > 1 ? m.qty + " × " : "") + getFood(m.id).name; }).join(" + ");
  return `
    <div class="hint-box">
      <p><strong>Save ${rupees(dealSaving(best.deal))}</strong> with ${best.deal.name}: add ${names}.</p>
      <button class="btn btn-small" data-fill="${best.deal.id}">Add and save</button>
    </div>`;
}

function rowHTML(item) {
  const f = item.food;
  const soldOut = !isAvailable(f);
  return `
    <div class="cart-row">
      <div class="cart-thumb tile-${f.canteen.toLowerCase()}" aria-hidden="true">${f.emoji}</div>
      <div>
        <h3>${f.name}</h3>
        <p class="muted">${rupees(f.price)} each</p>
        ${soldOut ? '<p class="warn">Sold Out - remove it to continue</p>' : ""}
      </div>
      <div class="stepper">
        <button type="button" data-action="minus" data-id="${f.id}" aria-label="Decrease quantity of ${f.name}" ${item.qty <= 1 ? "disabled" : ""}>-</button>
        <span>${item.qty}</span>
        <button type="button" data-action="plus" data-id="${f.id}" aria-label="Increase quantity of ${f.name}" ${item.qty >= 10 ? "disabled" : ""}>+</button>
      </div>
      <div class="cart-sub">
        <strong>${rupees(f.price * item.qty)}</strong>
        <button type="button" class="link-btn" data-action="remove" data-id="${f.id}">Remove</button>
      </div>
    </div>`;
}

function renderCart() {
  try {
    drawCart();
  } catch (error) {
    cartBox.innerHTML = '<div class="empty"><div class="empty-emoji">⚠️</div><h2>The cart could not load</h2><p class="muted">' + error.message + '</p><p class="muted">Press Reset demo data on the Canteen Dashboard and try again.</p><a class="btn" href="dashboard.html">Open Dashboard</a></div>';
  }
}

function drawCart() {
  const groups = getCartGroups();

  // Empty cart
  if (groups.length === 0) {
    cartBox.innerHTML = `
      <div class="empty">
        <div class="empty-emoji">🛒</div>
        <h2>Your cart is empty</h2>
        <p class="muted">Add something tasty from the menu, or grab a deal.</p>
        <a class="btn" href="menu.html">Browse Menu</a>
        <a class="btn btn-outline" href="deals.html">See Deals</a>
        <details class="trouble">
          <summary>Added food but the cart is empty?</summary>
          <p class="muted">Status: ${storageReport()}. Tell this to whoever is helping you.</p>
        </details>
      </div>`;
    return;
  }

  const allItems = groups.reduce(function (list, g) { return list.concat(g.items); }, []);
  const overall = getCartPricing();
  const hasSoldOut = allItems.some(function (item) { return !isAvailable(item.food); });
  const many = groups.length > 1;

  const sections = groups.map(function (g) {
    const canteen = getCanteen(g.canteen);
    return `
      <section class="cart-group">
        <h2 class="group-head"><span aria-hidden="true">${canteen.emoji}</span> ${g.canteen}</h2>
        ${g.items.map(rowHTML).join("")}
        ${dealHintHTML(g)}
      </section>`;
  }).join("");

  const canteenLines = many
    ? groups.map(function (g) {
        return `<div class="summary-row"><span>${g.canteen}</span><span>${rupees(g.pricing.total)}</span></div>`;
      }).join("")
    : '<div class="summary-row"><span>Pickup from</span><strong>' + groups[0].canteen + "</strong></div>";

  const dealLines = overall.applied.map(function (a) {
    return `<div class="summary-row saving"><span>Deal: ${a.deal.name}${a.times > 1 ? " × " + a.times : ""}</span><span>-${rupees(a.saving)}</span></div>`;
  }).join("");

  const checkoutButton = hasSoldOut
    ? '<button class="btn btn-block" disabled>Proceed to Checkout</button><p class="warn note">Remove sold-out items to continue.</p>'
    : '<a class="btn btn-block" href="checkout.html">Proceed to Checkout</a>';

  // "Goes well with your order": suggestions that pair with anything in the cart
  const picks = getRecommendations({
    basket: allItems.map(function (i) { return i.food.id; }),
    exclude: allItems.map(function (i) { return i.food.id; }),
    limit: 3
  });

  cartBox.innerHTML = `
    <div class="two-col">
      <div>${sections}</div>
      <aside class="summary">
        <h2>Order Summary</h2>
        ${canteenLines}
        <div class="summary-row"><span>Items</span><strong>${allItems.reduce(function (n, i) { return n + i.qty; }, 0)}</strong></div>
        ${overall.discount > 0 ? '<div class="summary-row"><span>Subtotal</span><span>' + rupees(overall.subtotal) + "</span></div>" : ""}
        ${dealLines}
        <div class="summary-row summary-total"><span>Total</span><span>${rupees(overall.total)}</span></div>
        ${checkoutButton}
        ${many ? '<p class="note muted">Your food is from ' + groups.length + " canteens, so you will get " + groups.length + " separate orders, each with its own code.</p>" : ""}
        <p class="note muted">Delivery to your hostel is available at checkout.</p>
      </aside>
    </div>

    <section class="section">
      <h2>✨ Goes well with your order</h2>
      <div class="grid">${picks.map(function (p) { return foodCardHTML(p.food, p.reason); }).join("")}</div>
    </section>`;
}

// One listener handles all + / - / Remove / "Add and save" buttons
cartBox.addEventListener("click", function (event) {
  const fill = event.target.closest("[data-fill]");
  if (fill) {
    const deal = DEALS.find(function (d) { return d.id === fill.dataset.fill; });
    const have = {};
    getCart().forEach(function (i) { have[i.id] = i.qty; });
    const missing = [];
    deal.items.forEach(function (it) {
      const need = it.qty - (have[it.id] || 0);
      if (need > 0) missing.push({ id: it.id, qty: need });
    });
    addItemsToCart(missing, { message: deal.name + " unlocked. Deal price applied." });
    renderCart();
    return;
  }

  const button = event.target.closest("[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;
  let cart = getCart();
  const item = cart.find(function (i) { return i.id === id; });
  if (!item) return;

  if (action === "plus") item.qty = Math.min(item.qty + 1, 10);
  if (action === "minus") item.qty = Math.max(item.qty - 1, 1);
  if (action === "remove") cart = cart.filter(function (i) { return i.id !== id; });

  saveCart(cart);
  renderCart();
});

// Adding a suggested food (data-add buttons are handled in common.js) -> redraw the cart
document.addEventListener("click", function (event) {
  if (event.target.closest("[data-add]")) setTimeout(renderCart, 0);
});

renderCart();
window.addEventListener("storage", renderCart);

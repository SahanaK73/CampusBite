// dashboard.js - Canteen Dashboard (for canteen staff)

const select = document.getElementById("canteenSelect");
const dashOrders = document.getElementById("dashOrders");
const dashAvailability = document.getElementById("dashAvailability");
const ordersSummary = document.getElementById("ordersSummary");

// Fill the "Select Canteen" dropdown (remember the last choice)
select.innerHTML = canteens.map(function (c) {
  return '<option value="' + c.name + '">' + c.name + "</option>";
}).join("");
const savedCanteen = load(KEYS.dashboardCanteen, canteens[0].name);
select.value = canteens.some(function (c) { return c.name === savedCanteen; }) ? savedCanteen : canteens[0].name;

// The buttons staff can press. "label" is the text on the button.
const STATUS_BUTTONS = [
  { status: "Preparing",        label: "Preparing" },
  { status: "Ready for Pickup", label: "Ready" },
  { status: "Completed",        label: "Completed" }
];

function orderLineHTML(order) {
  return orderItemsFlat(order).map(function (i) {
    return "<li>" + i.name + " × " + i.qty + (i.later ? ' <span class="tag-new">NEW add-on</span>' : "") + "</li>";
  }).join("");
}

// ---------- Orders ----------
function renderOrders() {
  const orders = getOrders()
    .filter(function (o) { return o.canteen === select.value; })
    .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

  const active = orders.filter(function (o) { return o.status !== "Completed"; }).length;
  ordersSummary.textContent = orders.length === 0
    ? ""
    : active + " active, " + (orders.length - active) + " completed";

  if (orders.length === 0) {
    dashOrders.innerHTML = `
      <div class="empty">
        <div class="empty-emoji">🍽️</div>
        <h2>No orders yet for ${select.value}</h2>
        <p class="muted">Place an order from the student side (Menu, Cart, Checkout) and it will appear here.</p>
        <a class="btn" href="menu.html">Browse Menu</a>
      </div>`;
    return;
  }

  dashOrders.innerHTML = orders.map(function (o) {
    const index = statusIndex(o.status);
    const accepted = o.accepted || index > 0;
    const delivery = isDelivery(o);
    const rider = delivery ? riders.find(function (r) { return r.id === o.riderId; }) : null;

    // Delivery orders: the canteen stops at "Ready". After that the rider takes over.
    const handedOver = delivery && index >= 3;
    const buttons = (delivery ? STATUS_BUTTONS.slice(0, 2) : STATUS_BUTTONS).map(function (b) {
      const isCurrent = o.status === b.status;
      return `<button class="btn btn-small ${isCurrent ? "is-current" : "btn-outline"}" data-order="${o.id}" data-action="${b.status}" ${isCurrent ? "disabled" : ""}>${b.label}</button>`;
    }).join("");

    const info = delivery
      ? `<p class="muted">🛵 Deliver to <strong>${o.deliverTo}</strong>${o.deliveryNote ? " (" + o.deliveryNote + ")" : ""}. Rider: ${rider.name}</p>`
      : `<span>Pickup code <span class="code-tag">${o.pickupCode}</span></span>`;

    const controls = handedOver
      ? '<p class="muted">' + (index === 3 ? "🛵 Out for delivery with " + rider.name + "." : "✓ Delivered. OTP verified by the rider.") + "</p>"
      : `<div class="btn-row">
           <button class="btn btn-small ${accepted ? "is-disabled" : ""}" data-order="${o.id}" data-action="accept" ${accepted ? "disabled" : ""}>${accepted ? "Accepted ✓" : "Accept Order"}</button>
           ${buttons}
         </div>
         ${delivery ? '<p class="muted note">Mark <strong>Ready</strong> and the rider will collect it.</p>' : ""}`;

    return `
      <article class="order-card ${index === 4 ? "is-done" : ""}">
        <div class="order-head">
          <h3>Order #${o.id}</h3>
          ${statusChipHTML(o)}
        </div>
        <div class="order-meta">
          <span>${formatDate(o.date)}</span>
          <span>${delivery ? "Delivery" : o.pickupOption}</span>
          <span>${o.payment}</span>
        </div>
        <ul class="order-items">${orderLineHTML(o)}</ul>
        <div class="order-foot">
          <strong>${rupees(grandTotal(o))}</strong>
          ${info}
        </div>
        ${controls}
      </article>`;
  }).join("");
}

// A click on any order button
dashOrders.addEventListener("click", function (event) {
  const button = event.target.closest("button[data-order]");
  if (!button) return;

  const orders = getOrders();
  const order = orders.find(function (o) { return o.id === button.dataset.order; });
  if (!order) return;

  const action = button.dataset.action;
  if (action === "accept") {
    order.accepted = true;            // status stays "Order Placed"
  } else {
    order.status = action;            // Preparing / Ready for Pickup / Completed
    order.accepted = true;
  }

  saveOrders(orders);                 // saved in localStorage
  renderOrders();
});

// ---------- Food availability ----------
function renderAvailability() {
  dashAvailability.innerHTML = foods
    .filter(function (f) { return f.canteen === select.value; })
    .map(function (f) {
      const on = isAvailable(f);
      return `
        <div class="avail-row">
          <div><strong>${f.name}</strong> <span class="muted">${rupees(f.price)}</span></div>
          <button class="toggle-btn ${on ? "on" : "off"}" data-food="${f.id}" aria-label="${f.name}: ${on ? "Available" : "Sold Out"}. Click to change.">${on ? "🟢 Available" : "🔴 Sold Out"}</button>
        </div>`;
    }).join("");
}

dashAvailability.addEventListener("click", function (event) {
  const button = event.target.closest("[data-food]");
  if (!button) return;
  toggleAvailability(button.dataset.food);   // saved in localStorage
  renderAvailability();
});

// ---------- Page-level controls ----------
function renderAll() {
  renderOrders();
  renderAvailability();
}

select.addEventListener("change", function () {
  save(KEYS.dashboardCanteen, select.value);
  renderAll();
});

document.getElementById("resetBtn").addEventListener("click", function () {
  if (confirm("This deletes all orders, the cart and availability changes. Continue?")) {
    Object.keys(KEYS).forEach(function (name) { removeSaved(KEYS[name]); });
    location.reload();
  }
});

renderAll();

// New orders and add-ons placed in another tab appear here automatically
window.addEventListener("storage", renderAll);

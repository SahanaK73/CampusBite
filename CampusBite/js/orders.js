// orders.js - My Orders: history, stats, reorder, add-on window, delivery tracking link

const ordersBox = document.getElementById("ordersList");
let filter = "all";   // all | active | past

// The progress bar under each order (delivery orders have one more step)
function trackerHTML(order) {
  const flow = statusFlow(order);
  const current = statusIndex(order.status);
  return '<ol class="tracker" aria-label="Order progress">' + flow.map(function (index) {
    const cls = index < current ? "done" : index === current ? "current" : "";
    return '<li class="' + cls + '">' + statusLabel(order, ORDER_STATUSES[index].name) + "</li>";
  }).join("") + "</ol>";
}

function itemsHTML(order) {
  return orderItemsFlat(order).map(function (i) {
    return "<li>" + i.name + " × " + i.qty + (i.later ? ' <span class="tag-new">Added later</span>' : "") + "</li>";
  }).join("");
}

function priceLinesHTML(order) {
  const addOnTotal = (order.addOns || []).reduce(function (sum, a) { return sum + a.amount; }, 0);
  let html = "";
  if (order.discount > 0) html += '<div class="price-line saving"><span>Deal savings (' + order.deals.join(", ") + ")</span><span>-" + rupees(order.discount) + "</span></div>";
  if (order.deliveryFee > 0) html += '<div class="price-line"><span>Delivery fee</span><span>' + rupees(order.deliveryFee) + "</span></div>";
  if (addOnTotal > 0) html += '<div class="price-line"><span>Add-ons paid separately</span><span>' + rupees(addOnTotal) + "</span></div>";
  return html ? '<div class="price-lines">' + html + "</div>" : "";
}

function renderStats(orders) {
  const stats = historyStats();
  const favourite = stats.favouriteFood ? stats.favouriteFood.name : "-";
  return `
    <div class="stats">
      <div class="stat-card"><strong>${orders.length}</strong><span>Orders</span></div>
      <div class="stat-card"><strong>${rupees(stats.spent)}</strong><span>Spent so far</span></div>
      <div class="stat-card"><strong>${favourite}</strong><span>Most ordered</span></div>
    </div>`;
}

function renderOrders() {
  // Newest order first
  const all = getOrders().slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

  if (all.length === 0) {
    ordersBox.innerHTML = `
      <div class="empty">
        <div class="empty-emoji">🧾</div>
        <h2>No orders yet</h2>
        <p class="muted">When you place an order, it will show up here.</p>
        <a class="btn" href="menu.html">Browse Menu</a>
      </div>`;
    return;
  }

  const active = all.filter(function (o) { return o.status !== "Completed"; });
  const past = all.filter(function (o) { return o.status === "Completed"; });
  const shown = filter === "active" ? active : filter === "past" ? past : all;

  const tabs = [["all", "All (" + all.length + ")"], ["active", "Active (" + active.length + ")"], ["past", "Past (" + past.length + ")"]]
    .map(function (t) {
      return '<button type="button" class="pill ' + (filter === t[0] ? "active" : "") + '" data-filter="' + t[0] + '" aria-pressed="' + (filter === t[0]) + '">' + t[1] + "</button>";
    }).join("");

  const cards = shown.length === 0
    ? '<div class="empty"><div class="empty-emoji">🍽️</div><h2>Nothing here</h2><p class="muted">No ' + filter + " orders right now.</p></div>"
    : shown.map(function (o) {
        const done = o.status === "Completed";
        const delivery = isDelivery(o);
        const addon = addonState(o);
        const accepted = o.accepted && o.status === "Order Placed";

        let codeText = "";
        if (delivery) {
          codeText = done ? "✓ Delivered, OTP verified" : 'Delivery OTP <span class="code-tag">' + o.deliveryOtp + "</span>";
        } else {
          codeText = 'Pickup code <span class="code-tag">' + o.pickupCode + "</span>";
        }

        const actions = [
          '<button class="btn btn-small" data-reorder="' + o.id + '">Reorder</button>',
          addon.open ? '<a class="btn btn-small btn-outline" href="addon.html?id=' + o.id + '">Add items (<b data-until="' + o.addonUntil + '">' + formatClock(addon.left) + "</b>)</a>" : "",
          delivery ? '<a class="btn btn-small btn-outline" href="track.html?id=' + o.id + '">' + (done ? "Delivery details" : "Track delivery") + "</a>" : ""
        ].join("");

        return `
          <article class="order-card ${done ? "is-done" : ""}">
            <div class="order-head">
              <h2 style="font-size:1.3rem">#${o.id}</h2>
              ${statusChipHTML(o)}
            </div>
            <div class="order-meta">
              <span>${o.canteen}</span>
              <span>${formatDate(o.date)}</span>
              <span>${o.pickupOption}</span>
              <span>${o.payment}</span>
            </div>
            <ul class="order-items">${itemsHTML(o)}</ul>
            ${priceLinesHTML(o)}
            <div class="order-foot">
              <strong>${rupees(grandTotal(o))}</strong>
              <span>${codeText}</span>
            </div>
            ${accepted ? '<p class="accepted-note">✓ Accepted by the canteen</p>' : ""}
            ${trackerHTML(o)}
            <div class="btn-row">${actions}</div>
          </article>`;
      }).join("");

  ordersBox.innerHTML = renderStats(all) + '<div class="pill-row tabs">' + tabs + "</div>" + cards;
}

// Filter tabs
ordersBox.addEventListener("click", function (event) {
  const tab = event.target.closest("[data-filter]");
  if (!tab) return;
  filter = tab.dataset.filter;
  renderOrders();
});

renderOrders();

// "Add items" countdowns tick here; when one hits 0:00 the button disappears
startCountdowns(renderOrders);

// Status changes made in the Canteen Dashboard / Delivery app (another tab) show up here
window.addEventListener("storage", renderOrders);

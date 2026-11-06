// track.js - Live delivery tracking (track.html?id=CB1024)
// The rider moves on a simulated campus map (see map.js). No real GPS.

const trackBox = document.getElementById("trackContent");
const trackId = new URLSearchParams(location.search).get("id");
let lastSignature = "";

function findOrder() {
  return getOrders().find(function (o) { return o.id === trackId; });
}

// If this changes (new status, add-on paid, rider arrived) we redraw the whole page
function signature(order) {
  return [order.status, (order.addOns || []).length, hasArrived(order)].join("|");
}

function riderOf(order) {
  return riders.find(function (r) { return r.id === order.riderId; }) || riders[0];
}

function headline(order) {
  const rider = riderOf(order);
  if (order.status === "Order Placed") return order.accepted ? order.canteen + " accepted your order" : "Waiting for " + order.canteen + " to accept";
  if (order.status === "Preparing") return order.canteen + " is preparing your food";
  if (order.status === "Ready for Pickup") return "Your food is ready. " + rider.name + " is picking it up";
  if (order.status === "Out for Delivery") return hasArrived(order) ? rider.name + " has arrived" : rider.name + " is on the way";
  return "Delivered. Enjoy your meal!";
}

function etaText(order) {
  if (order.status === "Completed") return "Delivered " + formatDate(new Date(order.deliveredAt || Date.now()).toISOString());
  if (order.status === "Out for Delivery") return hasArrived(order) ? "At your door" : "Arriving in about " + deliveryEtaMinutes(order) + " min";
  return "Ride starts once the food is ready (about " + getSpot(order.deliverTo).minutes + " min to reach you)";
}

function render() {
  const order = findOrder();

  if (!order) {
    trackBox.innerHTML = `
      <div class="empty">
        <div class="empty-emoji">🤔</div>
        <h2>Order not found</h2>
        <p class="muted">We couldn't find that order.</p>
        <a class="btn" href="orders.html">View My Orders</a>
      </div>`;
    return;
  }

  if (!isDelivery(order)) {
    trackBox.innerHTML = `
      <div class="empty">
        <div class="empty-emoji">🛍️</div>
        <h2>This order is for pickup</h2>
        <p class="muted">There is no rider to track. Show pickup code ${order.pickupCode} at ${order.canteen}.</p>
        <a class="btn" href="orders.html">View My Orders</a>
      </div>`;
    return;
  }

  lastSignature = signature(order);
  const rider = riderOf(order);
  const done = order.status === "Completed";
  const arrived = hasArrived(order);
  const addon = addonState(order);

  const flow = statusFlow(order);
  const current = statusIndex(order.status);
  const steps = flow.map(function (index) {
    const cls = index < current ? "done" : index === current ? "current" : "";
    return '<li class="' + cls + '">' + statusLabel(order, ORDER_STATUSES[index].name) + "</li>";
  }).join("");

  const otpCard = done
    ? '<div class="otp-box verified"><strong>✓ Delivered</strong><p class="muted">Your OTP was verified by the rider.</p></div>'
    : `<div class="otp-box ${arrived ? "ready" : ""}">
         <p class="muted">${arrived ? "Rider is at your door. Tell them your OTP." : "Your delivery OTP"}</p>
         <div class="otp-digits" aria-label="Delivery OTP ${order.deliveryOtp.split("").join(" ")}">${order.deliveryOtp.split("").map(function (d) { return "<span>" + d + "</span>"; }).join("")}</div>
         <p class="muted note">Share it only when you have your food. The rider cannot complete the delivery without it.</p>
       </div>`;

  trackBox.innerHTML = `
    <a class="back-link" href="orders.html">&larr; Back to My Orders</a>
    <div class="track-grid">
      <section class="map-card" id="mapHolder">${campusMapSVG(order)}</section>

      <aside class="track-side">
        <div class="form-card">
          <div class="order-head">
            <h2 style="font-size:1.2rem">#${order.id}</h2>
            ${statusChipHTML(order)}
          </div>
          <h1 class="track-headline">${headline(order)}</h1>
          <p class="eta" id="etaText">${etaText(order)}</p>
          <ol class="tracker" aria-label="Delivery progress">${steps}</ol>
        </div>

        <div class="form-card rider-card">
          <div class="avatar" aria-hidden="true">${rider.initials}</div>
          <div>
            <strong>${rider.name}</strong>
            <p class="muted">${rider.vehicle} &middot; ★ ${rider.rating}</p>
          </div>
        </div>

        ${otpCard}

        <div class="form-card">
          <h3>Delivering to</h3>
          <p>${order.deliverTo}${order.deliveryNote ? " (" + order.deliveryNote + ")" : ""}</p>
          <ul class="order-items" style="margin-top:0.5rem">
            ${orderItemsFlat(order).map(function (i) { return "<li>" + i.name + " × " + i.qty + (i.later ? ' <span class="tag-new">Added later</span>' : "") + "</li>"; }).join("")}
          </ul>
          <p style="margin-top:0.6rem"><strong>${rupees(grandTotal(order))}</strong> <span class="muted">${order.payment}</span></p>
          ${addon.open ? '<a class="btn btn-small btn-outline" style="margin-top:0.7rem" href="addon.html?id=' + order.id + '">Add items (<b data-until="' + order.addonUntil + '">' + formatClock(addon.left) + "</b>)</a>" : ""}
        </div>
      </aside>
    </div>`;
}

// Every half second: move the rider, update the ETA, redraw if something important changed
function tick() {
  const order = findOrder();
  if (!order || !isDelivery(order)) return;
  if (signature(order) !== lastSignature) { render(); return; }
  const holder = document.getElementById("mapHolder");
  if (holder) updateMap(holder, order);
  const eta = document.getElementById("etaText");
  if (eta) eta.textContent = etaText(order);
}

render();
setInterval(tick, 500);
startCountdowns(render);
window.addEventListener("storage", render);

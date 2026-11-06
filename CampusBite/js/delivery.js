// delivery.js - Delivery Partner app (demo)
// The rider picks up food, rides (simulated) and must type the customer's OTP to finish.

const riderSelect = document.getElementById("riderSelect");
const jobsBox = document.getElementById("riderJobs");
const earningsBox = document.getElementById("earnings");

riderSelect.innerHTML = riders.map(function (r) {
  return '<option value="' + r.id + '">' + r.name + "</option>";
}).join("");
const savedRider = load(KEYS.rider, riders[0].id);
riderSelect.value = riders.some(function (r) { return r.id === savedRider; }) ? savedRider : riders[0].id;

function myOrders() {
  return getOrders()
    .filter(function (o) { return isDelivery(o) && o.riderId === riderSelect.value; })
    .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
}

function jobHTML(order) {
  const index = statusIndex(order.status);
  const arrived = hasArrived(order);
  const cashDue = order.payment.indexOf("Cash") === 0;
  const summary = orderItemsFlat(order).map(function (i) { return i.name + " × " + i.qty; }).join(", ");

  let body = "";
  if (index <= 1) {
    body = `<p class="muted">${order.canteen} is still preparing. You can pick it up once it is ready.</p>
            <button class="btn btn-block" disabled>Waiting for canteen</button>`;
  } else if (index === 2) {
    body = `<p><strong>Ready!</strong> Collect the order from ${order.canteen}.</p>
            <button class="btn btn-block" data-pick="${order.id}">Picked up from ${order.canteen}</button>`;
  } else if (!arrived) {
    body = `<div class="mini-map">${campusMapSVG(order)}</div>
            <p class="eta" data-eta="${order.id}">On the way: about ${deliveryEtaMinutes(order)} min</p>
            <button class="link-btn" data-skip="${order.id}">Demo: skip to arrival</button>`;
  } else {
    body = `<div class="mini-map">${campusMapSVG(order)}</div>
            <p><strong>You have arrived.</strong> Ask the customer for their 4-digit OTP.</p>
            <div class="otp-form">
              <input type="text" id="otp-${order.id}" class="text-input otp-input" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="OTP" aria-label="Customer OTP for order ${order.id}">
              <button class="btn" data-confirm="${order.id}">Confirm delivery</button>
            </div>
            <p class="warn" id="err-${order.id}" role="alert"></p>`;
  }

  return `
    <article class="order-card rider-job" data-order="${order.id}" data-arrived="${arrived}" data-out="${order.outAt || ""}">
      <div class="order-head">
        <h3>#${order.id}: ${order.canteen} &rarr; ${order.deliverTo}</h3>
        ${statusChipHTML(order)}
      </div>
      <div class="order-meta">
        <span>${summary}</span>
        ${order.deliveryNote ? "<span>Note: " + order.deliveryNote + "</span>" : ""}
      </div>
      <p>${cashDue ? "💵 Collect <strong>" + rupees(grandTotal(order)) + "</strong> in cash" : "✓ Already paid via UPI (demo)"}</p>
      <div class="job-body">${body}</div>
    </article>`;
}

function render() {
  const orders = myOrders();
  const active = orders.filter(function (o) { return o.status !== "Completed"; });
  const done = orders.filter(function (o) { return o.status === "Completed"; });

  earningsBox.textContent = done.length + " deliveries done, " + rupees(done.length * DELIVERY_FEE) + " earned in delivery fees";

  let html = "";
  if (active.length === 0) {
    html += `
      <div class="empty">
        <div class="empty-emoji">🛵</div>
        <h2>No deliveries right now</h2>
        <p class="muted">When a student chooses delivery at checkout, the order shows up here for ${riders.find(function (r) { return r.id === riderSelect.value; }).name}.
        Orders are assigned to riders in turns, so try another rider too.</p>
        <a class="btn" href="menu.html">Place a delivery order</a>
      </div>`;
  } else {
    html += active.map(jobHTML).join("");
  }

  if (done.length > 0) {
    html += "<h2 class='sub-head'>Delivered</h2>" + done.slice(0, 5).map(function (o) {
      return `<div class="done-row"><span>✓ #${o.id} to ${o.deliverTo}</span><span class="muted">${formatDate(o.date)}</span></div>`;
    }).join("");
  }
  jobsBox.innerHTML = html;
}

// ---------- Buttons ----------
jobsBox.addEventListener("click", function (event) {
  const pick = event.target.closest("[data-pick]");
  const skip = event.target.closest("[data-skip]");
  const confirmBtn = event.target.closest("[data-confirm]");
  if (!pick && !skip && !confirmBtn) return;

  const orders = getOrders();
  const clicked = pick || skip || confirmBtn;
  const id = clicked.dataset.pick || clicked.dataset.skip || clicked.dataset.confirm;
  const order = orders.find(function (o) { return o.id === id; });
  if (!order) return;

  if (pick) {
    order.status = "Out for Delivery";
    order.outAt = Date.now();                 // the ride starts now
    toast("Ride started. Drive safe!");
  }

  if (skip) {
    order.outAt = Date.now() - DEMO_DELIVERY_SECONDS * 1000;   // pretend the ride is finished
  }

  if (confirmBtn) {
    const typed = document.getElementById("otp-" + id).value.trim();
    if (typed !== order.deliveryOtp) {
      document.getElementById("err-" + id).textContent = typed.length < 4
        ? "Enter the 4-digit OTP from the customer."
        : "Wrong OTP. Ask the customer to check their order page.";
      return;
    }
    order.status = "Completed";
    order.deliveredAt = Date.now();
    toast("Delivered ✓ OTP verified");
  }

  saveOrders(orders);
  render();
});

riderSelect.addEventListener("change", function () {
  save(KEYS.rider, riderSelect.value);
  render();
});

// Every half second: move the riders on the mini maps; when one arrives, show the OTP box
setInterval(function () {
  const orders = getOrders();
  document.querySelectorAll(".rider-job").forEach(function (card) {
    const order = orders.find(function (o) { return o.id === card.dataset.order; });
    if (!order || order.status !== "Out for Delivery") return;
    updateMap(card, order);
    const eta = card.querySelector("[data-eta]");
    if (eta) eta.textContent = "On the way: about " + deliveryEtaMinutes(order) + " min";
    if (hasArrived(order) && card.dataset.arrived === "false") render();
  });
}, 500);

render();
window.addEventListener("storage", render);

// confirmation.js - "Order Placed!" page (confirmation.html?id=CB1024)

const confirmBox = document.getElementById("confirmContent");
// confirmation.html?id=CB1024 or ?id=CB1024,CB1025 (several canteens)
const orderIds = (new URLSearchParams(location.search).get("id") || "").split(",");

function findOrders() {
  return orderIds.map(function (id) { return getOrders().find(function (o) { return o.id === id; }); }).filter(Boolean);
}

// The "Forgot something?" banner with the 2-minute countdown
function bannerHTML(order) {
  const state = addonState(order);
  if (state.open) {
    return `
      <div class="addon-banner">
        <div>
          <strong>Forgot something?</strong>
          <p>Add extra items and pay for just those. Window closes in <b class="clock" data-until="${order.addonUntil}">${formatClock(state.left)}</b></p>
        </div>
        <a class="btn btn-small" href="addon.html?id=${order.id}">Add items</a>
      </div>`;
  }
  return '<div class="addon-banner closed"><p class="muted">The add-on window has closed for this order.</p></div>';
}

// One ticket card for one order
function confirmCardHTML(order, heading) {
  const delivery = isDelivery(order);

  const codeBlock = delivery
    ? `<p class="muted">Delivery OTP</p>
       <div class="pickup-code" aria-label="Delivery OTP ${order.deliveryOtp.split("").join(" ")}">${order.deliveryOtp}</div>
       <p><strong>Share this OTP with the rider only when your food arrives.</strong></p>`
    : `<p class="muted">Pickup Code</p>
       <div class="pickup-code" aria-label="Pickup code ${order.pickupCode.split("").join(" ")}">${order.pickupCode}</div>
       <p><strong>Show your pickup code at the canteen.</strong></p>`;

  const rider = delivery ? riders.find(function (r) { return r.id === order.riderId; }) : null;

  return `
    <section class="confirm">
      ${heading}
      <dl class="facts">
        <dt>Order ID</dt><dd>${order.id}</dd>
        <dt>${delivery ? "Order from" : "Pickup from"}</dt><dd>${order.canteen}</dd>
        <dt>${delivery ? "Deliver to" : "Pickup"}</dt><dd>${delivery ? order.deliverTo : order.pickupOption}</dd>
        ${delivery ? "<dt>Rider</dt><dd>" + rider.name + "</dd>" : ""}
        <dt>Total paid</dt><dd>${rupees(grandTotal(order))}</dd>
        <dt>Estimated preparation time</dt><dd>10–15 minutes</dd>
      </dl>
      ${codeBlock}
      ${bannerHTML(order)}
      <div class="btn-row center">
        ${delivery ? '<a class="btn" href="track.html?id=' + order.id + '">Track Delivery</a>' : ""}
        <a class="btn ${delivery ? "btn-outline" : ""}" href="orders.html">View My Orders</a>
      </div>
    </section>`;
}

function renderConfirmation() {
  const orders = findOrders();

  if (orders.length === 0) {
    confirmBox.innerHTML = `
      <div class="empty">
        <div class="empty-emoji">🤔</div>
        <h2>Order not found</h2>
        <p class="muted">We couldn't find that order. Check My Orders to see all your orders.</p>
        <a class="btn" href="orders.html">View My Orders</a>
      </div>`;
    return;
  }

  if (orders.length === 1) {
    confirmBox.innerHTML = confirmCardHTML(orders[0], "<h1>🎉 Order Placed!</h1>");
    return;
  }

  // Food from several canteens: one card per canteen
  confirmBox.innerHTML =
    '<h1 class="center-text">🎉 ' + orders.length + ' Orders Placed!</h1>' +
    '<p class="muted center-text">One order from each canteen. Each has its own code.</p>' +
    '<div class="confirm-stack">' +
    orders.map(function (o) { return confirmCardHTML(o, "<h2>" + getCanteen(o.canteen).emoji + " " + o.canteen + "</h2>"); }).join("") +
    "</div>";
}

renderConfirmation();

// When a countdown reaches 0:00, redraw so the banner says "window closed"
startCountdowns(renderConfirmation);

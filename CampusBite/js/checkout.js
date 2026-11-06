// checkout.js - Checkout: pickup or delivery, payment, place order

const checkoutBox = document.getElementById("checkoutContent");
const groups = getCartGroups();        // the cart split by canteen (one order per canteen)
const pricing = getCartPricing();

// Next order number: 1024, 1025, ... (the counter is saved in localStorage)
function nextOrderNumber() {
  const number = load(KEYS.lastNumber, 1023) + 1;
  save(KEYS.lastNumber, number);
  return number;
}

// Random 4-digit code, e.g. 4821 (used as pickup code and as delivery OTP)
function randomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// Which radio button is selected? e.g. selectedValue("payment")
function selectedValue(name) {
  return document.querySelector('input[name="' + name + '"]:checked').value;
}

function renderCheckout() {
  if (groups.length === 0) {
    checkoutBox.innerHTML = `
      <div class="empty">
        <div class="empty-emoji">🛒</div>
        <h2>Nothing to check out</h2>
        <p class="muted">Your cart is empty. Add some food first.</p>
        <a class="btn" href="menu.html">Browse Menu</a>
      </div>`;
    return;
  }

  const many = groups.length > 1;
  const canteenNames = groups.map(function (g) { return g.canteen; }).join(" + ");

  // Order summary: one block per canteen
  const lines = groups.map(function (g) {
    return (many ? '<p class="summary-canteen">' + g.canteen + "</p>" : "") +
      g.items.map(function (item) {
        return `<div class="summary-row"><span>${item.food.name} × ${item.qty}</span><span>${rupees(item.food.price * item.qty)}</span></div>`;
      }).join("");
  }).join("");

  const dealLines = pricing.applied.map(function (a) {
    return `<div class="summary-row saving"><span>Deal: ${a.deal.name}${a.times > 1 ? " × " + a.times : ""}</span><span>-${rupees(a.saving)}</span></div>`;
  }).join("");

  checkoutBox.innerHTML = `
    <form id="checkoutForm" class="two-col">
      <div>
        <section class="form-card">
          <h2>How do you want your food?</h2>
          <div class="options">
            <label class="option"><input type="radio" name="mode" value="pickup" checked> Pick up from ${canteenNames}</label>
            <label class="option"><input type="radio" name="mode" value="delivery"> Deliver to me on campus (+${rupees(DELIVERY_FEE)}${many ? " per canteen" : ""})</label>
          </div>

          <div class="sub-field" id="pickupFields">
            <div class="options">
              <label class="option"><input type="radio" name="pickup" value="now" checked> Pick up now</label>
              <label class="option"><input type="radio" name="pickup" value="later"> Pick up later</label>
            </div>
            <div class="sub-field" id="laterField" hidden>
              <label for="laterTime">Pick up in</label>
              <select id="laterTime" class="select-input">
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>2 hours</option>
              </select>
            </div>
          </div>

          <div class="sub-field" id="deliveryFields" hidden>
            <label for="spot">Deliver to</label>
            <select id="spot" class="select-input">
              ${campusSpots.map(function (s) { return "<option>" + s.name + "</option>"; }).join("")}
            </select>
            <div class="sub-field">
              <label for="note">Room / block / landmark (optional)</label>
              <input type="text" id="note" class="text-input" maxlength="60" placeholder="e.g. Room 214, near the front gate">
            </div>
            <p class="muted" style="margin-top:0.7rem">You'll get a 4-digit delivery OTP. Share it with the rider only when you receive your food.</p>
          </div>
        </section>

        <section class="form-card">
          <h2>Payment</h2>
          <div class="options">
            <label class="option"><input type="radio" name="payment" value="cash" checked> <span id="cashLabel">Cash at pickup</span></label>
            <label class="option"><input type="radio" name="payment" value="upi"> UPI (Demo only)</label>
          </div>
          <p class="muted" id="upiNote" style="margin-top:0.7rem" hidden>Demo only: no real payment is made.</p>
        </section>
      </div>

      <aside class="summary">
        <h2>Order Summary</h2>
        ${lines}
        ${many ? '<p class="muted note">You will get ' + groups.length + " separate orders, one per canteen.</p>" : '<div class="summary-row"><span>Canteen</span><strong>' + canteenNames + "</strong></div>"}
        ${pricing.discount > 0 ? '<div class="summary-row"><span>Subtotal</span><span>' + rupees(pricing.subtotal) + "</span></div>" : ""}
        ${dealLines}
        <div class="summary-row" id="feeRow" hidden><span>Delivery fee${many ? " (" + groups.length + " × " + rupees(DELIVERY_FEE) + ")" : ""}</span><span>${rupees(DELIVERY_FEE * groups.length)}</span></div>
        <div class="summary-row summary-total"><span>Total</span><span id="totalValue">${rupees(pricing.total)}</span></div>
        <button type="submit" class="btn btn-block">Place Order</button>
        <p class="muted note">After you pay you get 2 minutes to add extra items.</p>
        <p class="note"><a class="link-btn" href="cart.html">Back to cart</a></p>
      </aside>
    </form>`;

  const form = document.getElementById("checkoutForm");

  // Show/hide fields and update the total when something changes
  form.addEventListener("change", function () {
    const delivery = selectedValue("mode") === "delivery";
    document.getElementById("pickupFields").hidden = delivery;
    document.getElementById("deliveryFields").hidden = !delivery;
    document.getElementById("feeRow").hidden = !delivery;
    document.getElementById("cashLabel").textContent = delivery ? "Cash on delivery" : "Cash at pickup";
    document.getElementById("laterField").hidden = selectedValue("pickup") !== "later";
    document.getElementById("upiNote").hidden = selectedValue("payment") !== "upi";
    document.getElementById("totalValue").textContent = rupees(pricing.total + (delivery ? DELIVERY_FEE * groups.length : 0));
  });

  form.addEventListener("submit", placeOrder);
}

function placeOrder(event) {
  event.preventDefault();

  // Safety check: a canteen may have marked something Sold Out in the meantime
  const soldOut = getCartItems().filter(function (item) { return !isAvailable(item.food); });
  if (soldOut.length > 0) {
    alert(soldOut[0].food.name + " just sold out. Please remove it from your cart.");
    location.href = "cart.html";
    return;
  }

  const delivery = selectedValue("mode") === "delivery";
  const spot = delivery ? document.getElementById("spot").value : null;
  const note = delivery ? document.getElementById("note").value.trim() : "";
  const fee = delivery ? DELIVERY_FEE : 0;
  const now = Date.now();

  const pickupText = selectedValue("pickup") === "later"
    ? "Pick up later (in " + document.getElementById("laterTime").value + ")"
    : "Pick up now";

  const paymentText = selectedValue("payment") === "upi"
    ? "UPI (Demo)"
    : (delivery ? "Cash on delivery" : "Cash at pickup");

  const orders = getOrders();
  const newIds = [];

  // One order for each canteen in the cart
  groups.forEach(function (group) {
    const number = nextOrderNumber();
    const order = {
      id: "CB" + number,
      canteen: group.canteen,
      mode: delivery ? "delivery" : "pickup",
      items: group.items.map(function (item) {
        return { id: item.food.id, name: item.food.name, price: item.food.price, qty: item.qty };
      }),
      subtotal: group.pricing.subtotal,
      discount: group.pricing.discount,
      deals: group.pricing.applied.map(function (a) { return a.deal.name + (a.times > 1 ? " × " + a.times : ""); }),
      deliveryFee: fee,
      total: group.pricing.total + fee,
      date: new Date(now).toISOString(),
      placedAt: now,
      addonUntil: now + ADDON_WINDOW_SECONDS * 1000,   // the 2-minute add-on window
      status: "Order Placed",
      accepted: false,
      pickupOption: delivery ? "Delivery to " + spot : pickupText,
      payment: paymentText,
      pickupCode: delivery ? null : randomCode(),
      deliveryOtp: delivery ? randomCode() : null,
      deliverTo: spot,
      deliveryNote: note,
      riderId: delivery ? riders[number % riders.length].id : null,
      outAt: null,
      deliveredAt: null,
      addOns: []
    };
    orders.push(order);
    newIds.push(order.id);
  });

  saveOrders(orders);   // save the orders
  saveCart([]);         // empty the cart

  location.href = "confirmation.html?id=" + newIds.join(",");
}

renderCheckout();

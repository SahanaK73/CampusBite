// =====================================================
// common.js  -  code shared by every page
// (navbar, footer, cart + deals, reorder, food card, toast, countdowns)
// =====================================================

// ---------- Small helpers ----------
function rupees(amount) {
  return "₹" + amount;
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit"
  });
}

// 107 seconds -> "1:47"
function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes + ":" + String(seconds).padStart(2, "0");
}

// ---------- Cart (saved in localStorage) ----------
function getCart() {
  return load(KEYS.cart, []);
}

function saveCart(cart) {
  save(KEYS.cart, cart);
  updateCartBadge();
}

// Cart items together with the full food details: [{ food, qty }]
function getCartItems() {
  return getCart()
    .map(function (item) { return { food: getFood(item.id), qty: item.qty }; })
    .filter(function (item) { return item.food; });
}

// Works out subtotal, deal discount and total for a list of cart items from ONE canteen.
// A deal applies when the list holds ALL its items (as many times as the quantities allow).
function pricingFor(items) {
  const subtotal = items.reduce(function (sum, i) { return sum + i.food.price * i.qty; }, 0);

  const left = {};   // how many of each food are still "unused" by a deal
  items.forEach(function (i) { left[i.food.id] = i.qty; });

  const canteen = items.length ? items[0].food.canteen : null;
  let discount = 0;
  const applied = [];

  DEALS
    .filter(function (d) { return d.canteen === canteen; })
    .sort(function (a, b) { return dealSaving(b) - dealSaving(a); })   // biggest saving first
    .forEach(function (deal) {
      let times = Infinity;
      deal.items.forEach(function (it) {
        times = Math.min(times, Math.floor((left[it.id] || 0) / it.qty));
      });
      if (times > 0 && times !== Infinity) {
        deal.items.forEach(function (it) { left[it.id] -= it.qty * times; });
        discount += dealSaving(deal) * times;
        applied.push({ deal: deal, times: times, saving: dealSaving(deal) * times });
      }
    });

  return { subtotal: subtotal, discount: discount, applied: applied, total: subtotal - discount };
}

// The cart split by canteen: [{ canteen, items, pricing }]
// Food from different canteens becomes separate orders at checkout.
function getCartGroups() {
  const groups = [];
  getCartItems().forEach(function (item) {
    let group = groups.find(function (g) { return g.canteen === item.food.canteen; });
    if (!group) {
      group = { canteen: item.food.canteen, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  });
  groups.forEach(function (g) { g.pricing = pricingFor(g.items); });
  return groups;
}

// Whole-cart totals (all canteens together)
function getCartPricing() {
  const total = { subtotal: 0, discount: 0, applied: [], total: 0 };
  getCartGroups().forEach(function (g) {
    total.subtotal += g.pricing.subtotal;
    total.discount += g.pricing.discount;
    total.total += g.pricing.total;
    total.applied = total.applied.concat(g.pricing.applied);
  });
  return total;
}

function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (!badge) return;
  const count = getCart().reduce(function (sum, item) { return sum + item.qty; }, 0);
  badge.textContent = count;
  badge.style.display = count > 0 ? "inline-block" : "none";
}

// Add one or more foods to the cart. list = [{ id, qty }]. Returns true if something was added.
// options.skipSoldOut: skip sold-out items instead of refusing (used by Reorder)
function addItemsToCart(list, options) {
  options = options || {};
  let wanted = list
    .map(function (i) { return { food: getFood(i.id), qty: i.qty }; })
    .filter(function (i) { return i.food; });
  if (wanted.length === 0) return false;

  const soldOut = wanted.filter(function (i) { return !isAvailable(i.food); });
  let skippedNote = "";
  if (soldOut.length > 0) {
    if (!options.skipSoldOut) {
      toast(soldOut[0].food.name + " is sold out right now");
      return false;
    }
    wanted = wanted.filter(function (i) { return isAvailable(i.food); });
    if (wanted.length === 0) {
      toast("Everything in that order is sold out right now");
      return false;
    }
    skippedNote = " (" + soldOut.map(function (i) { return i.food.name; }).join(", ") + " sold out, skipped)";
  }

  const cart = getCart();   // food from several canteens can sit in one cart

  wanted.forEach(function (w) {
    const existing = cart.find(function (item) { return item.id === w.food.id; });
    if (existing) {
      existing.qty = Math.min(existing.qty + w.qty, 10);   // max 10 of one item
    } else {
      cart.push({ id: w.food.id, qty: Math.min(w.qty, 10) });
    }
  });
  saveCart(cart);

  if (options.message) {
    toast(options.message + skippedNote);
  } else if (wanted.length === 1) {
    toast((wanted[0].qty > 1 ? wanted[0].qty + " × " : "") + wanted[0].food.name + " added to cart");
  } else {
    toast(wanted.length + " items added to cart" + skippedNote);
  }
  return true;
}

function addToCart(foodId, qty) {
  return addItemsToCart([{ id: foodId, qty: qty || 1 }]);
}

function addDealToCart(dealId) {
  const deal = DEALS.find(function (d) { return d.id === dealId; });
  if (!deal) return false;
  const soldOut = dealSoldOutFood(deal);
  if (soldOut) {
    toast(deal.name + " is unavailable: " + soldOut.name + " is sold out");
    return false;
  }
  return addItemsToCart(deal.items, { message: deal.name + " added. The deal price applies in your cart." });
}

// ---------- Orders (saved in localStorage) ----------
function getOrders() {
  return load(KEYS.orders, []);
}

function saveOrders(orders) {
  save(KEYS.orders, orders);
}

// Every item of an order: the original items first, then add-on items (marked later: true)
function orderItemsFlat(order) {
  const list = order.items.map(function (i) { return Object.assign({}, i, { later: false }); });
  (order.addOns || []).forEach(function (addOn) {
    addOn.items.forEach(function (i) { list.push(Object.assign({}, i, { later: true })); });
  });
  return list;
}

// Orders saved by an older version have no food id, so fall back to matching by name
function itemFoodId(item, order) {
  if (item.id) return item.id;
  const food = foods.find(function (f) { return f.name === item.name && f.canteen === order.canteen; });
  return food ? food.id : null;
}

// Reorder: put the same items back in the cart
function reorderOrder(orderId) {
  const order = getOrders().find(function (o) { return o.id === orderId; });
  if (!order) return false;
  const list = orderItemsFlat(order)
    .map(function (i) { return { id: itemFoodId(i, order), qty: i.qty }; })
    .filter(function (i) { return i.id; });
  return addItemsToCart(list, { skipSoldOut: true, message: "Order " + order.id + " added to cart" });
}

// ---------- Small pieces of HTML used on several pages ----------
function statusChipHTML(order) {
  const index = statusIndex(order.status);
  return '<span class="chip status-' + index + '">' + ORDER_STATUSES[index].icon + " " + statusLabel(order, order.status) + "</span>";
}

function vegDotHTML(food) {
  const label = food.veg ? "Vegetarian" : "Non-vegetarian";
  return '<span class="veg-dot ' + (food.veg ? "veg" : "nonveg") + '" title="' + label + '" role="img" aria-label="' + label + '"></span>';
}

// One food card (Home, Menu, Cart). "reason" is optional: the small "why we picked it" tag.
function foodCardHTML(food, reason) {
  const soldOut = !isAvailable(food);
  const button = soldOut
    ? '<button class="btn btn-small" disabled>Sold Out</button>'
    : '<button class="btn btn-small" data-add="' + food.id + '">Add to Cart</button>';

  return `
    <article class="food-card ${soldOut ? "is-sold-out" : ""}">
      <a class="food-img tile-${food.canteen.toLowerCase()}" href="food.html?id=${food.id}" aria-label="View ${food.name}">
        <span>${food.emoji}</span>
        ${soldOut ? '<em class="sold-badge">Sold Out</em>' : ""}
      </a>
      <div class="food-body">
        <div class="food-top">
          <h3><a href="food.html?id=${food.id}">${food.name}</a></h3>
          ${vegDotHTML(food)}
        </div>
        <p class="muted">${food.canteen}</p>
        ${reason ? '<p class="reason">✨ ' + reason + "</p>" : ""}
        <div class="food-bottom">
          <strong class="price">${rupees(food.price)}</strong>
          ${button}
        </div>
      </div>
    </article>`;
}

// ---------- Toast (small pop-up message) ----------
let toastTimer;
function toast(message) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2600);
}

// ---------- Countdown clocks ----------
// Any element like <b data-until="1767225600000"></b> becomes a live m:ss clock.
// onExpire(element) is called once when a clock reaches 0:00.
function startCountdowns(onExpire) {
  function tick() {
    document.querySelectorAll("[data-until]").forEach(function (el) {
      const left = Math.max(0, Math.ceil((Number(el.dataset.until) - Date.now()) / 1000));
      el.textContent = formatClock(left);
      if (left === 0 && !el.dataset.done) {
        el.dataset.done = "1";
        if (onExpire) onExpire(el);
      }
    });
  }
  tick();
  return setInterval(tick, 1000);
}

// ---------- Navbar + Footer (written once, shown on every page) ----------
function renderNavbar() {
  const holder = document.getElementById("navbar");
  if (!holder) return;

  const page = location.pathname.split("/").pop() || "index.html";
  // Sub-pages highlight their parent link
  const parent = {
    "food.html": "menu.html", "checkout.html": "cart.html",
    "confirmation.html": "orders.html", "addon.html": "orders.html", "track.html": "orders.html"
  };
  const current = parent[page] || page;

  const links = [
    ["index.html", "Home"],
    ["menu.html", "Menu"],
    ["deals.html", "Deals"],
    ["orders.html", "My Orders"],
    ["cart.html", "Cart"],
    ["dashboard.html", "Canteen Dashboard"]
  ];

  const linksHTML = links.map(function (link) {
    const badge = link[0] === "cart.html" ? '<span class="cart-badge" id="cartBadge">0</span>' : "";
    const active = link[0] === current ? 'class="active" aria-current="page"' : "";
    return '<a href="' + link[0] + '" ' + active + ">" + link[1] + badge + "</a>";
  }).join("");

  holder.innerHTML = `
    <header class="navbar">
      <div class="container nav-inner">
        <a class="brand" href="index.html"><span>🍔</span> CampusBite</a>
        <button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false">☰</button>
        <nav class="nav-links" id="navLinks">${linksHTML}</nav>
      </div>
    </header>`;

  // Hamburger button on mobile
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("navLinks");
  toggle.addEventListener("click", function () {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
}

function renderFooter() {
  const holder = document.getElementById("footer");
  if (!holder) return;
  holder.innerHTML = `
    <footer class="footer">
      <div class="container footer-inner">
        <span>🍔 CampusBite &ndash; Hungry? Skip the queue.${storageWorks ? "" : " (Your browser blocks saving, so data resets when this tab closes.)"}</span>
        <span class="footer-links"><a href="about.html">About</a><a href="delivery.html">Delivery Partner app</a></span>
      </div>
    </footer>`;
}

// Firefox keeps a separate storage for every file opened directly from disk, so the cart can look
// empty on the next page. Point those users to the single-file edition.
function renderFirefoxNotice() {
  const direct = location.protocol === "file:" && window.parent === window;
  if (!direct || navigator.userAgent.indexOf("Firefox") === -1) return;
  const bar = document.createElement("div");
  bar.className = "notice-bar";
  bar.innerHTML = 'Firefox does not share saved data between files opened directly, so your cart may look empty. ' +
    '<a href="CampusBite-single-file.html">Open the single-file version</a> or run a local server (see README).';
  document.body.insertBefore(bar, document.body.firstChild);
}

// ---------- Run on every page ----------
renderFirefoxNotice();
renderNavbar();
renderFooter();
updateCartBadge();

// Buttons with data-add="foodId", data-deal="dealId" or data-reorder="orderId" work on every page
document.addEventListener("click", function (event) {
  const addButton = event.target.closest("[data-add]");
  if (addButton) addToCart(Number(addButton.dataset.add), 1);

  const dealButton = event.target.closest("[data-deal]");
  if (dealButton) addDealToCart(dealButton.dataset.deal);

  const reorderButton = event.target.closest("[data-reorder]");
  if (reorderButton && reorderOrder(reorderButton.dataset.reorder)) {
    location.href = "cart.html";
  }
});

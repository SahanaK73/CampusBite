// =====================================================
// data.js  -  all the sample data + localStorage helpers
// =====================================================

// ---------- 1. CANTEENS ----------
const canteens = [
  { name: "Udupi", emoji: "🍛", about: "South Indian food, chats, lemon tea, snacks and juices.", tag: "Budget Friendly", x: 100, y: 75 },
  { name: "Tango", emoji: "🍕", about: "Chinese, pizza, cakes, donuts, North Indian, South Indian and biryani.", tag: "Wide Variety", x: 300, y: 75 },
  { name: "Munch", emoji: "🍜", about: "Fried rice, noodles and Manchurian.", tag: "Chinese Specials", x: 500, y: 75 }
];

// ---------- 2. FOODS ----------
// To add a new food, copy one line, give it a NEW unique id and change the details.
// category must be one of: South Indian, Chinese, Pizza, Biryani, North Indian, Snacks, Drinks, Desserts
// (If you add a new category, also add it to categoryNames in js/menu.js)
const foods = [
  // ----- UDUPI -----
  { id: 1,  name: "Idli",        canteen: "Udupi", category: "South Indian", price: 30,  veg: true,  emoji: "🍚", available: true, popular: false, description: "Soft steamed rice cakes served with sambar and coconut chutney." },
  { id: 2,  name: "Vada",        canteen: "Udupi", category: "South Indian", price: 20,  veg: true,  emoji: "🥯", available: true, popular: false, description: "Crispy fried lentil doughnut, best with hot sambar." },
  { id: 3,  name: "Masala Dosa", canteen: "Udupi", category: "South Indian", price: 50,  veg: true,  emoji: "🌯", available: true, popular: true,  description: "Golden crispy dosa filled with spiced potato masala." },
  { id: 4,  name: "Set Dosa",    canteen: "Udupi", category: "South Indian", price: 45,  veg: true,  emoji: "🥞", available: true, popular: false, description: "Three soft, spongy dosas served with sagu and chutney." },
  { id: 5,  name: "Upma",        canteen: "Udupi", category: "South Indian", price: 30,  veg: true,  emoji: "🥣", available: true, popular: false, description: "Warm semolina breakfast cooked with vegetables and cashews." },
  { id: 6,  name: "Lemon Tea",   canteen: "Udupi", category: "Drinks",       price: 15,  veg: true,  emoji: "🍵", available: true, popular: false, description: "Hot, refreshing tea with a squeeze of lemon." },
  { id: 7,  name: "Samosa",      canteen: "Udupi", category: "Snacks",       price: 20,  veg: true,  emoji: "🥟", available: true, popular: true,  description: "Crunchy pastry stuffed with spicy potato and peas." },
  { id: 8,  name: "Masala Puri", canteen: "Udupi", category: "Snacks",       price: 40,  veg: true,  emoji: "🧆", available: true, popular: false, description: "Crushed puris topped with spicy gravy, onion and sev." },
  { id: 9,  name: "Fresh Juice", canteen: "Udupi", category: "Drinks",       price: 35,  veg: true,  emoji: "🧃", available: true, popular: false, description: "Seasonal fruit juice, freshly squeezed." },

  // ----- TANGO -----
  { id: 10, name: "Veg Biryani",     canteen: "Tango", category: "Biryani",      price: 120, veg: true,  emoji: "🍛", available: true, popular: false, description: "Fragrant basmati rice cooked with vegetables and spices, served with raita." },
  { id: 11, name: "Chicken Biryani", canteen: "Tango", category: "Biryani",      price: 150, veg: false, emoji: "🍗", available: true, popular: true,  description: "Dum-style biryani with tender chicken pieces and boiled egg." },
  { id: 12, name: "Pizza",           canteen: "Tango", category: "Pizza",        price: 130, veg: true,  emoji: "🍕", available: true, popular: true,  description: "Cheesy vegetable pizza on a freshly baked base." },
  { id: 13, name: "Fried Rice",      canteen: "Tango", category: "Chinese",      price: 110, veg: true,  emoji: "🍚", available: true, popular: false, description: "Wok-tossed rice with vegetables and soy sauce." },
  { id: 14, name: "Noodles",         canteen: "Tango", category: "Chinese",      price: 100, veg: true,  emoji: "🍜", available: true, popular: false, description: "Stir-fried noodles with crunchy vegetables." },
  { id: 15, name: "Paneer Meal",     canteen: "Tango", category: "North Indian", price: 120, veg: true,  emoji: "🍱", available: true, popular: false, description: "Paneer curry with rice, roti, dal and salad." },
  { id: 16, name: "Donut",           canteen: "Tango", category: "Desserts",     price: 60,  veg: true,  emoji: "🍩", available: true, popular: false, description: "Soft glazed donut with a chocolate topping." },
  { id: 17, name: "Cake",            canteen: "Tango", category: "Desserts",     price: 80,  veg: true,  emoji: "🍰", available: true, popular: false, description: "A soft slice of chocolate cake." },

  // ----- MUNCH -----
  { id: 18, name: "Veg Fried Rice",       canteen: "Munch", category: "Chinese", price: 90,  veg: true,  emoji: "🍚", available: true, popular: false, description: "Classic fried rice with carrots, beans and cabbage." },
  { id: 19, name: "Chicken Fried Rice",   canteen: "Munch", category: "Chinese", price: 120, veg: false, emoji: "🍗", available: true, popular: false, description: "Fried rice tossed with juicy chicken pieces and egg." },
  { id: 20, name: "Schezwan Fried Rice",  canteen: "Munch", category: "Chinese", price: 110, veg: true,  emoji: "🌶️", available: true, popular: false, description: "Spicy fried rice cooked in fiery Schezwan sauce." },
  { id: 21, name: "Veg Noodles",          canteen: "Munch", category: "Chinese", price: 90,  veg: true,  emoji: "🍜", available: true, popular: false, description: "Hakka-style noodles with fresh vegetables." },
  { id: 22, name: "Schezwan Noodles",     canteen: "Munch", category: "Chinese", price: 100, veg: true,  emoji: "🥡", available: true, popular: true,  description: "Hot and spicy noodles in tangy Schezwan sauce." },
  { id: 23, name: "Gobi Manchurian",      canteen: "Munch", category: "Chinese", price: 90,  veg: true,  emoji: "🥦", available: true, popular: true,  description: "Crispy cauliflower tossed in a sweet-spicy Manchurian sauce." },
  { id: 24, name: "Paneer Manchurian",    canteen: "Munch", category: "Chinese", price: 110, veg: true,  emoji: "🥘", available: true, popular: false, description: "Paneer cubes in a rich, garlicky Manchurian gravy." }
];

// ---------- 3. ORDER STATUSES (in order) ----------
const ORDER_STATUSES = [
  { name: "Order Placed",     icon: "🟡" },
  { name: "Preparing",        icon: "🟠" },
  { name: "Ready for Pickup", icon: "🟢" },
  { name: "Out for Delivery", icon: "🛵" },   // delivery orders only
  { name: "Completed",        icon: "🔵" }
];

// ---------- 4. LOCALSTORAGE KEYS ----------
const KEYS = {
  cart: "campusbite_cart",                 // [{ id, qty }]
  orders: "campusbite_orders",             // [ order, order, ... ]
  availability: "campusbite_availability", // { foodId: true/false }
  lastNumber: "campusbite_last_order_no",  // 1024, 1025, ...
  dashboardCanteen: "campusbite_dashboard_canteen",
  rider: "campusbite_rider"                // rider chosen in the Delivery Partner app
};

// ---------- 5. SMALL HELPERS ----------
// ---- Saving data ----
// Everything is saved in localStorage so it survives a refresh. But some browsers do not
// share localStorage between pages (Safari/Firefox opening files directly) or block it
// completely (private mode, embedded pages). Then the cart would look empty on the next page.
// So every save is ALSO copied into window.name, which travels with the browser tab from
// page to page. When loading, whichever copy is newer wins.
let storageWorks = true;
try {
  localStorage.setItem("campusbite_test", "1");
  localStorage.removeItem("campusbite_test");
} catch (error) {
  storageWorks = false;
}

// { key: { t: time saved, v: text or null } }
// In the single-file edition (CampusBite-single-file.html) the pages live inside one parent page,
// so they all share one copy kept in the parent. Otherwise the copy comes from window.name.
let backup = null;
try {
  if (window.parent !== window && window.parent.__campusbiteMemory) backup = window.parent.__campusbiteMemory;
} catch (error) {
  backup = null;
}
if (!backup) {
  backup = {};
  try {
    if (window.name.indexOf('{"campusbite_') === 0) backup = JSON.parse(window.name);
  } catch (error) {
    backup = {};
  }
}

// What does localStorage hold for this key (and when was it saved)?
function fromLocalStorage(key) {
  if (!storageWorks) return { t: 0, v: null };
  try {
    return { t: Number(localStorage.getItem(key + "__t")) || 0, v: localStorage.getItem(key) };
  } catch (error) {
    return { t: 0, v: null };
  }
}

// Write text (or null = delete) to both places
function writeSaved(key, text) {
  const time = Date.now();
  if (storageWorks) {
    try {
      if (text === null) localStorage.removeItem(key); else localStorage.setItem(key, text);
      localStorage.setItem(key + "__t", time);
    } catch (error) { /* ignore: the tab copy below still works */ }
  }
  backup[key] = { t: time, v: text };
  try { window.name = JSON.stringify(backup); } catch (error) { /* ignore */ }
}

// Read something (returns fallback if nothing is saved yet)
function load(key, fallback) {
  try {
    const local = fromLocalStorage(key);
    const copy = backup[key];
    let raw = local.v;
    if (copy && copy.t > local.t) {          // the tab's copy is newer
      raw = copy.v;
      if (storageWorks) {                     // bring this page's localStorage up to date
        try {
          if (copy.v === null) localStorage.removeItem(key); else localStorage.setItem(key, copy.v);
          localStorage.setItem(key + "__t", copy.t);
        } catch (error) { /* ignore */ }
      }
    }
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

// Save something (objects/arrays are turned into text first)
function save(key, value) {
  writeSaved(key, JSON.stringify(value));
}

// Delete one saved item
function removeSaved(key) {
  writeSaved(key, null);
}

// Find a canteen by its name
function getCanteen(name) {
  return canteens.find(function (c) { return c.name === name; });
}

// Find a food by its id
function getFood(id) {
  return foods.find(function (f) { return f.id === Number(id); });
}

// Is this food available? A saved choice from the dashboard wins over the default.
function isAvailable(food) {
  const saved = load(KEYS.availability, {});
  return saved[food.id] !== undefined ? saved[food.id] : food.available;
}

// Used by the canteen dashboard: switch Available <-> Sold Out
function toggleAvailability(foodId) {
  const food = getFood(foodId);
  const saved = load(KEYS.availability, {});
  saved[food.id] = !isAvailable(food);
  save(KEYS.availability, saved);
}

// Position of a status in the list (0 = Order Placed ... 3 = Completed)
function statusIndex(statusName) {
  return ORDER_STATUSES.findIndex(function (s) { return s.name === statusName; });
}


// ---------- 6. SETTINGS (change these to tune the demo) ----------
const ADDON_WINDOW_SECONDS = 120;   // time to add extra items after paying (2 minutes)
const DELIVERY_FEE = 15;            // rupees
const DEMO_DELIVERY_SECONDS = 60;   // how long the simulated ride takes on screen
                                    // (for a "real" feel use: spot.minutes * 60)

// ---------- 7. CAMPUS MAP: delivery points + delivery partners ----------
const campusSpots = [
  { name: "Hostel A",       x: 70,  y: 310, minutes: 7 },
  { name: "Hostel B",       x: 180, y: 330, minutes: 6 },
  { name: "Library",        x: 295, y: 300, minutes: 4 },
  { name: "Main Block",     x: 410, y: 330, minutes: 3 },
  { name: "Sports Complex", x: 525, y: 300, minutes: 6 }
];

const riders = [
  { id: "r1", name: "Ravi Kumar",  initials: "RK", rating: 4.8, vehicle: "Bike" },
  { id: "r2", name: "Suresh M",    initials: "SM", rating: 4.6, vehicle: "Scooter" },
  { id: "r3", name: "Anita S",     initials: "AS", rating: 4.9, vehicle: "Bike" }
];

// ---------- 8. DEALS (combos) ----------
// A deal is a set of foods from ONE canteen sold together for a lower price.
// The discount is applied automatically when the cart contains all the items of a deal.
const DEALS = [
  { id: "d1", name: "Breakfast Combo",      canteen: "Udupi", price: 80,  items: [{ id: 1, qty: 2 }, { id: 2, qty: 1 }, { id: 6, qty: 1 }] },
  { id: "d2", name: "Dosa & Chai",          canteen: "Udupi", price: 55,  items: [{ id: 3, qty: 1 }, { id: 6, qty: 1 }] },
  { id: "d3", name: "Snack Break",          canteen: "Udupi", price: 60,  items: [{ id: 7, qty: 2 }, { id: 9, qty: 1 }] },
  { id: "d4", name: "Biryani + Donut",      canteen: "Tango", price: 175, items: [{ id: 11, qty: 1 }, { id: 16, qty: 1 }] },
  { id: "d5", name: "Veg Feast",            canteen: "Tango", price: 170, items: [{ id: 10, qty: 1 }, { id: 17, qty: 1 }] },
  { id: "d6", name: "Pizza Duo",            canteen: "Tango", price: 230, items: [{ id: 12, qty: 2 }] },
  { id: "d7", name: "Noodles & Manchurian", canteen: "Munch", price: 150, items: [{ id: 21, qty: 1 }, { id: 23, qty: 1 }] },
  { id: "d8", name: "Schezwan Special",     canteen: "Munch", price: 175, items: [{ id: 20, qty: 1 }, { id: 22, qty: 1 }] },
  { id: "d9", name: "Rice Bowl Combo",      canteen: "Munch", price: 165, items: [{ id: 18, qty: 1 }, { id: 24, qty: 1 }] }
];

// Same kind of food sold in two canteens (for the price check on the Deals page)
const COMPARE_FOODS = [
  { label: "Veg fried rice", ids: [13, 18] },
  { label: "Veg noodles",    ids: [14, 21] }
];

function dealRegularPrice(deal) {
  return deal.items.reduce(function (sum, i) { return sum + getFood(i.id).price * i.qty; }, 0);
}
function dealSaving(deal) { return dealRegularPrice(deal) - deal.price; }
function dealItemCount(deal) { return deal.items.reduce(function (n, i) { return n + i.qty; }, 0); }
// Returns the first sold-out food in the deal, or null if everything is available
function dealSoldOutFood(deal) {
  for (let i = 0; i < deal.items.length; i++) {
    const food = getFood(deal.items[i].id);
    if (!isAvailable(food)) return food;
  }
  return null;
}

// ---------- 9. ORDER HELPERS ----------
function isDelivery(order) { return order.mode === "delivery"; }

// Which statuses does this order go through? (indexes into ORDER_STATUSES)
function statusFlow(order) { return isDelivery(order) ? [0, 1, 2, 3, 4] : [0, 1, 2, 4]; }

// Delivery orders use slightly different words for two statuses
function statusLabel(order, statusName) {
  if (isDelivery(order)) {
    if (statusName === "Ready for Pickup") return "Ready for Rider";
    if (statusName === "Completed") return "Delivered";
  }
  return statusName;
}

// Total paid for an order = first payment + every add-on payment
function grandTotal(order) {
  return order.total + (order.addOns || []).reduce(function (sum, a) { return sum + a.amount; }, 0);
}

// Can the student still add items? Only for 2 minutes, and only before the kitchen finishes.
function addonState(order) {
  const left = Math.max(0, Math.ceil(((order.addonUntil || 0) - Date.now()) / 1000));
  const kitchenOpen = statusIndex(order.status) <= 1;   // Order Placed or Preparing
  return { open: left > 0 && kitchenOpen, left: left, reason: left <= 0 ? "time" : (kitchenOpen ? "" : "kitchen") };
}

// A short description of how saving works (shown in the "Having trouble?" box on the Cart page)
function storageReport() {
  return (storageWorks ? "browser storage is working" : "browser storage is blocked, using the tab copy") +
    "; " + load(KEYS.cart, []).length + " item(s) saved in the cart";
}

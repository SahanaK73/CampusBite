// =====================================================
// recommend.js  -  "Picked for you" smart suggestions
//
// This is a simple rule-based recommender (no external AI service).
// Every food gets a score from a few easy rules:
//   + goes well with what is in your cart / order   (pairings)
//   + you ordered it before                          (history)
//   + popular on campus
//   + fits the time of day (breakfast, lunch, ...)
//   + comes from the canteen you use most
//   - non-veg, if almost everything you order is veg
// The rule that gave the most points becomes the "reason" shown on the card.
// =====================================================

// ---------- What did this student order before? ----------
function historyStats() {
  const orders = getOrders();
  const stats = { orderCount: orders.length, count: {}, canteenCount: {}, units: 0, vegUnits: 0, spent: 0 };

  orders.forEach(function (order) {
    stats.canteenCount[order.canteen] = (stats.canteenCount[order.canteen] || 0) + 1;
    stats.spent += grandTotal(order);
    orderItemsFlat(order).forEach(function (item) {
      const food = getFood(itemFoodId(item, order));
      if (!food) return;
      stats.count[food.id] = (stats.count[food.id] || 0) + item.qty;
      stats.units += item.qty;
      if (food.veg) stats.vegUnits += item.qty;
    });
  });

  stats.favouriteFood = topKey(stats.count, function (id) { return getFood(id); });
  stats.favouriteCanteen = topKey(stats.canteenCount);
  return stats;
}

// The key with the biggest value, e.g. topKey({ a: 2, b: 5 }) -> "b"
function topKey(counts, convert) {
  let best = null;
  Object.keys(counts).forEach(function (key) {
    if (best === null || counts[key] > counts[best]) best = key;
  });
  if (best === null) return null;
  return convert ? convert(best) : best;
}

// ---------- Time of day ----------
function mealTime(hour) {
  if (hour >= 6 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 15 && hour < 18) return "snack time";
  if (hour >= 18 && hour < 22) return "dinner";
  return "a late snack";
}

const MEAL_CATEGORIES = {
  "breakfast":    ["South Indian", "Drinks"],
  "lunch":        ["Biryani", "North Indian", "Chinese"],
  "snack time":   ["Snacks", "Drinks", "Desserts"],
  "dinner":       ["Chinese", "Pizza", "Biryani"],
  "a late snack": ["Snacks", "Drinks", "Pizza"]
};

// ---------- Foods that go well together ----------
function pairsWith(a, b) {
  if (a.id === b.id || a.canteen !== b.canteen) return false;
  const isManchurian = function (f) { return f.name.indexOf("Manchurian") !== -1; };

  if (a.category === "South Indian" && (b.category === "Drinks" || b.category === "Snacks")) return true;
  if (a.category === "Snacks" && b.category === "Drinks") return true;
  if (a.category === "Drinks" && (b.category === "Snacks" || b.category === "South Indian")) return true;
  if (a.category === "Biryani" && (b.category === "Desserts" || b.category === "Drinks")) return true;
  if (a.category === "Pizza" && b.category === "Desserts") return true;
  if (a.category === "North Indian" && b.category === "Desserts") return true;
  if (a.category === "Chinese" && !isManchurian(a) && isManchurian(b)) return true;
  if (isManchurian(a) && b.category === "Chinese" && !isManchurian(b)) return true;
  return false;
}

// ---------- The recommender ----------
// options.basket   : food ids to pair with (cart items, or items already in an order)
// options.canteen  : only suggest from this canteen
// options.exclude  : food ids to leave out
// options.limit    : how many to return
// Returns [{ food, reason, score }] best first
function getRecommendations(options) {
  options = options || {};
  const limit = options.limit || 4;
  const stats = historyStats();
  const meal = mealTime(new Date().getHours());
  const mealCategories = MEAL_CATEGORIES[meal];
  const mostlyVeg = stats.units >= 3 && stats.vegUnits / stats.units >= 0.8;
  const basket = (options.basket || []).map(getFood).filter(Boolean);
  const exclude = options.exclude || [];

  const scored = foods
    .filter(function (f) {
      return isAvailable(f) && exclude.indexOf(f.id) === -1 && (!options.canteen || f.canteen === options.canteen);
    })
    .map(function (food) {
      let score = 0;
      const reasons = [];
      function add(points, text) { score += points; reasons.push({ points: points, text: text }); }

      const partner = basket.find(function (b) { return pairsWith(b, food); });
      if (partner) add(6, "Goes well with " + partner.name);

      const times = stats.count[food.id] || 0;
      if (times > 0) add(Math.min(times, 4) * 1.5, times === 1 ? "You ordered this before" : "You've ordered this " + times + " times");

      if (food.popular) add(2, "Popular on campus");
      if (mealCategories.indexOf(food.category) !== -1) add(2, "Good for " + meal);
      if (stats.orderCount >= 2 && food.canteen === stats.favouriteCanteen) add(1, "From " + food.canteen + ", your favourite canteen");
      if (mostlyVeg && !food.veg) score -= 4;

      reasons.sort(function (x, y) { return y.points - x.points; });
      return { food: food, score: score, reason: reasons.length ? reasons[0].text : "Worth a try" };
    });

  scored.sort(function (x, y) { return y.score - x.score || x.food.id - y.food.id; });
  return scored.slice(0, limit);
}

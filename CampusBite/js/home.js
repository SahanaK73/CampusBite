// home.js - Home page: canteens, order again, picked for you, popular foods, hero search

// 1. Canteen cards
document.getElementById("canteenList").innerHTML = canteens.map(function (c) {
  return `
    <article class="canteen-card">
      <span class="emoji" aria-hidden="true">${c.emoji}</span>
      <h3>${c.name}</h3>
      <p>${c.about}</p>
      <span class="chip">${c.tag}</span>
      <a class="btn btn-small" href="menu.html?canteen=${c.name}">View Menu</a>
    </article>`;
}).join("");

// 2. Order again: the last 3 different orders, one tap to reorder
function renderAgain() {
  const section = document.getElementById("againSection");
  const seen = [];
  const recent = getOrders()
    .slice()
    .sort(function (a, b) { return new Date(b.date) - new Date(a.date); })
    .filter(function (o) {
      // skip orders that have exactly the same items as one we already listed
      const key = o.canteen + "|" + orderItemsFlat(o).map(function (i) { return i.name + i.qty; }).join(",");
      if (seen.indexOf(key) !== -1) return false;
      seen.push(key);
      return true;
    })
    .slice(0, 3);

  section.hidden = recent.length === 0;
  document.getElementById("againList").innerHTML = recent.map(function (o) {
    const summary = orderItemsFlat(o).map(function (i) { return i.name + " × " + i.qty; }).join(", ");
    return `
      <article class="again-card">
        <div>
          <h3>${o.canteen}</h3>
          <p class="muted">${summary}</p>
        </div>
        <div class="again-foot">
          <strong>${rupees(grandTotal(o))}</strong>
          <button class="btn btn-small" data-reorder="${o.id}">Reorder</button>
        </div>
      </article>`;
  }).join("");
}

// 3. Picked for you (rule-based suggestions, see recommend.js)
function renderReco() {
  const stats = historyStats();
  const basket = getCart().map(function (i) { return i.id; });
  const picks = getRecommendations({ limit: 4, basket: basket });

  document.getElementById("recoNote").textContent = stats.orderCount > 0
    ? "Based on your past orders, the time of day and what is popular."
    : "Based on the time of day and what is popular. Order a few times and these get personal.";
  document.getElementById("recoList").innerHTML = picks.map(function (p) { return foodCardHTML(p.food, p.reason); }).join("");
}

// 4. Popular foods (foods with popular: true in data.js)
function renderPopular() {
  const popular = foods.filter(function (f) { return f.popular; });
  document.getElementById("popularList").innerHTML = popular.map(function (f) { return foodCardHTML(f); }).join("");
}

function renderAll() {
  renderAgain();
  renderReco();
  renderPopular();
}
renderAll();

// 5. Search bar -> opens the Menu page with the search text
document.getElementById("heroSearch").addEventListener("submit", function (event) {
  event.preventDefault();
  const text = document.getElementById("heroInput").value.trim();
  location.href = text ? "menu.html?search=" + encodeURIComponent(text) : "menu.html";
});

// Keep everything fresh if something changes in another tab
window.addEventListener("storage", renderAll);

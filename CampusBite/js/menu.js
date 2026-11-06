// menu.js - Menu page: filters + search + food cards

const canteenNames = ["All"].concat(canteens.map(function (c) { return c.name; }));
const categoryNames = ["All", "South Indian", "Chinese", "Pizza", "Biryani", "North Indian", "Snacks", "Drinks", "Desserts"];

// The current filter choices. They can come from the URL, e.g. menu.html?canteen=Udupi
const params = new URLSearchParams(location.search);
const state = {
  canteen: canteenNames.includes(params.get("canteen")) ? params.get("canteen") : "All",
  category: "All",
  search: params.get("search") || ""
};

const canteenBox = document.getElementById("canteenFilters");
const categoryBox = document.getElementById("categoryFilters");
const searchBox = document.getElementById("searchBox");
const foodGrid = document.getElementById("foodGrid");
const resultInfo = document.getElementById("resultInfo");

// Draw a row of filter buttons. "key" is either "canteen" or "category".
function renderPills(box, names, key) {
  box.innerHTML = names.map(function (name) {
    const active = state[key] === name;
    return `<button type="button" class="pill ${active ? "active" : ""}" data-value="${name}" aria-pressed="${active}">${name}</button>`;
  }).join("");
}

// Draw the food cards that match the current filters
function renderFoods() {
  const text = state.search.toLowerCase().trim();

  const results = foods.filter(function (f) {
    const canteenOk = state.canteen === "All" || f.canteen === state.canteen;
    const categoryOk = state.category === "All" || f.category === state.category;
    const searchOk = f.name.toLowerCase().includes(text);
    return canteenOk && categoryOk && searchOk;
  });

  resultInfo.textContent = results.length + (results.length === 1 ? " item found" : " items found");

  if (results.length === 0) {
    foodGrid.innerHTML = `
      <div class="empty">
        <div class="empty-emoji">🔍</div>
        <h2>No food found</h2>
        <p class="muted">Try a different search or clear the filters.</p>
        <button class="btn" data-clear>Clear Filters</button>
      </div>`;
  } else {
    foodGrid.innerHTML = results.map(foodCardHTML).join("");
  }
}

// Clicking a filter button
canteenBox.addEventListener("click", function (event) {
  const pill = event.target.closest(".pill");
  if (!pill) return;
  state.canteen = pill.dataset.value;
  renderPills(canteenBox, canteenNames, "canteen");
  renderFoods();
});

categoryBox.addEventListener("click", function (event) {
  const pill = event.target.closest(".pill");
  if (!pill) return;
  state.category = pill.dataset.value;
  renderPills(categoryBox, categoryNames, "category");
  renderFoods();
});

// Typing in the search box
searchBox.addEventListener("input", function () {
  state.search = searchBox.value;
  renderFoods();
});

// "Clear Filters" button inside the empty message
foodGrid.addEventListener("click", function (event) {
  if (!event.target.closest("[data-clear]")) return;
  state.canteen = "All";
  state.category = "All";
  state.search = "";
  searchBox.value = "";
  renderPills(canteenBox, canteenNames, "canteen");
  renderPills(categoryBox, categoryNames, "category");
  renderFoods();
});

// First draw
searchBox.value = state.search;
renderPills(canteenBox, canteenNames, "canteen");
renderPills(categoryBox, categoryNames, "category");
renderFoods();

// If the dashboard marks something Sold Out in another tab, update here too
window.addEventListener("storage", renderFoods);

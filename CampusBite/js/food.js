// food.js - Food details page (food.html?id=3)

const box = document.getElementById("foodDetail");
const food = getFood(new URLSearchParams(location.search).get("id"));

function renderFood() {
  if (!food) {
    box.innerHTML = `
      <div class="empty">
        <div class="empty-emoji">🤔</div>
        <h2>Food not found</h2>
        <p class="muted">This item doesn't exist. Head back to the menu to pick something.</p>
        <a class="btn" href="menu.html">Browse Menu</a>
      </div>`;
    return;
  }

  document.title = food.name + " - CampusBite";
  const soldOut = !isAvailable(food);

  const actions = soldOut
    ? '<button class="btn" disabled>Sold Out</button>'
    : `<div class="stepper" aria-label="Quantity">
         <button type="button" id="minusBtn" aria-label="Decrease quantity">-</button>
         <span id="qtyValue">1</span>
         <button type="button" id="plusBtn" aria-label="Increase quantity">+</button>
       </div>
       <button class="btn" id="addBtn">Add to Cart</button>
       <a class="btn btn-outline" href="cart.html">View Cart</a>`;

  box.innerHTML = `
    <article class="detail">
      <div class="detail-img tile-${food.canteen.toLowerCase()}" aria-hidden="true">${food.emoji}</div>
      <div class="detail-info">
        <div class="detail-title">
          <h1>${food.name}</h1>
          ${vegDotHTML(food)}
        </div>
        <p>${food.description}</p>
        <dl class="facts">
          <dt>Canteen</dt><dd>${food.canteen}</dd>
          <dt>Category</dt><dd>${food.category}</dd>
          <dt>Type</dt><dd>${food.veg ? "Vegetarian" : "Non-vegetarian"}</dd>
          <dt>Availability</dt><dd>${soldOut ? "🔴 Sold Out" : "🟢 Available"}</dd>
        </dl>
        <div class="detail-price">${rupees(food.price)}</div>
        <div class="detail-actions">${actions}</div>
      </div>
    </article>`;

  if (soldOut) return;

  // Quantity selector
  let qty = 1;
  const qtyValue = document.getElementById("qtyValue");
  const minusBtn = document.getElementById("minusBtn");
  const plusBtn = document.getElementById("plusBtn");

  function showQty() {
    qtyValue.textContent = qty;
    minusBtn.disabled = qty <= 1;
    plusBtn.disabled = qty >= 10;
  }

  minusBtn.addEventListener("click", function () { qty--; showQty(); });
  plusBtn.addEventListener("click", function () { qty++; showQty(); });

  document.getElementById("addBtn").addEventListener("click", function () {
    if (addToCart(food.id, qty)) {
      qty = 1;
      showQty();
    }
  });

  showQty();
}

renderFood();

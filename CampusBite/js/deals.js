// deals.js - Deals page: browse combos, compare up to 3 side by side, price check across canteens

const dealsBox = document.getElementById("dealList");
const compareBox = document.getElementById("compareBox");
const canteenFilterBox = document.getElementById("dealCanteenFilters");
const priceCheckBox = document.getElementById("priceCheck");

const dealState = { canteen: "All", compare: [] };   // compare = ids of deals ticked for comparison
const canteenNames = ["All"].concat(canteens.map(function (c) { return c.name; }));

function dealItemsText(deal) {
  return deal.items.map(function (i) {
    const f = getFood(i.id);
    return f.emoji + " " + f.name + (i.qty > 1 ? " × " + i.qty : "");
  });
}

function dealIsVeg(deal) {
  return deal.items.every(function (i) { return getFood(i.id).veg; });
}

function percentSaved(deal) {
  return Math.round(dealSaving(deal) / dealRegularPrice(deal) * 100);
}

// ---------- Filter pills ----------
function renderFilters() {
  canteenFilterBox.innerHTML = canteenNames.map(function (name) {
    const active = dealState.canteen === name;
    return '<button type="button" class="pill ' + (active ? "active" : "") + '" data-value="' + name + '" aria-pressed="' + active + '">' + name + "</button>";
  }).join("");
}

// ---------- Deal cards ----------
function renderDeals() {
  const list = DEALS.filter(function (d) { return dealState.canteen === "All" || d.canteen === dealState.canteen; });

  dealsBox.innerHTML = list.map(function (deal) {
    const soldOut = dealSoldOutFood(deal);
    const picked = dealState.compare.indexOf(deal.id) !== -1;
    return `
      <article class="deal-card ${soldOut ? "is-sold-out" : ""}">
        <div class="deal-head">
          <h3>${deal.name}</h3>
          <span class="chip">${deal.canteen}</span>
        </div>
        <ul class="deal-items">${dealItemsText(deal).map(function (t) { return "<li>" + t + "</li>"; }).join("")}</ul>
        <div class="deal-price">
          <strong>${rupees(deal.price)}</strong>
          <s class="price-old">${rupees(dealRegularPrice(deal))}</s>
          <span class="save-badge">Save ${rupees(dealSaving(deal))}</span>
        </div>
        ${soldOut ? '<p class="warn">Unavailable: ' + soldOut.name + " is sold out</p>" : ""}
        <div class="btn-row">
          <button class="btn btn-small" data-deal="${deal.id}" ${soldOut ? "disabled" : ""}>Add deal to cart</button>
          <button class="btn btn-small btn-outline ${picked ? "is-picked" : ""}" data-compare="${deal.id}" aria-pressed="${picked}">${picked ? "✓ Comparing" : "Compare"}</button>
        </div>
      </article>`;
  }).join("");
}

// ---------- Compare table ----------
function renderCompare() {
  const picked = dealState.compare.map(function (id) { return DEALS.find(function (d) { return d.id === id; }); });

  if (picked.length < 2) {
    compareBox.innerHTML = `
      <div class="compare-empty">
        <strong>Compare deals</strong>
        <p class="muted">${picked.length === 0 ? "Tap Compare on two or three deals to see them side by side." : "Pick one more deal to start comparing."}</p>
      </div>`;
    return;
  }

  // Who wins each category?
  const bestPercent = Math.max.apply(null, picked.map(percentSaved));
  const bestPerItem = Math.min.apply(null, picked.map(function (d) { return d.price / dealItemCount(d); }));
  const lowest = Math.min.apply(null, picked.map(function (d) { return d.price; }));
  const bestSaving = Math.max.apply(null, picked.map(dealSaving));
  const winner = picked.find(function (d) { return percentSaved(d) === bestPercent; });

  function cell(deal, text, isBest) {
    return '<td class="' + (isBest ? "best" : "") + '">' + text + (isBest ? " ★" : "") + "</td>";
  }
  function row(label, build) {
    return "<tr><th scope=\"row\">" + label + "</th>" + picked.map(build).join("") + "</tr>";
  }

  compareBox.innerHTML = `
    <div class="compare-card">
      <h2>Side by side</h2>
      <p class="verdict">🏆 Best value: <strong>${winner.name}</strong> (${winner.canteen}). You save ${percentSaved(winner)}% (${rupees(dealSaving(winner))}).</p>
      <div class="table-wrap">
        <table class="compare-table">
          <thead><tr><th></th>${picked.map(function (d) {
            return "<th scope=\"col\">" + d.name + '<button class="link-btn" data-compare="' + d.id + '">Remove</button></th>';
          }).join("")}</tr></thead>
          <tbody>
            ${row("Canteen", function (d) { return cell(d, d.canteen, false); })}
            ${row("You get", function (d) { return cell(d, dealItemsText(d).join("<br>"), false); })}
            ${row("Type", function (d) { return cell(d, dealIsVeg(d) ? "Vegetarian" : "Has non-veg", false); })}
            ${row("Regular price", function (d) { return cell(d, rupees(dealRegularPrice(d)), false); })}
            ${row("Deal price", function (d) { return cell(d, rupees(d.price), d.price === lowest); })}
            ${row("You save", function (d) { return cell(d, rupees(dealSaving(d)), dealSaving(d) === bestSaving); })}
            ${row("Saving %", function (d) { return cell(d, percentSaved(d) + "%", percentSaved(d) === bestPercent); })}
            ${row("Price per item", function (d) { return cell(d, rupees(Math.round(d.price / dealItemCount(d))), d.price / dealItemCount(d) === bestPerItem); })}
            ${row("", function (d) {
              const soldOut = dealSoldOutFood(d);
              return '<td><button class="btn btn-small" data-deal="' + d.id + '" ' + (soldOut ? "disabled" : "") + ">Add deal</button></td>";
            })}
          </tbody>
        </table>
      </div>
      <p class="muted note">★ marks the best in each row. Compare deals from different canteens to find the cheapest meal.</p>
    </div>`;
}

// ---------- Same food, different canteen ----------
function renderPriceCheck() {
  priceCheckBox.innerHTML = COMPARE_FOODS.map(function (group) {
    const options = group.ids.map(getFood);
    const cheapest = options.reduce(function (a, b) { return b.price < a.price ? b : a; });
    const dearest = options.reduce(function (a, b) { return b.price > a.price ? b : a; });
    const diff = dearest.price - cheapest.price;

    const cols = options.map(function (f) {
      const best = f.id === cheapest.id && diff > 0;
      return `
        <div class="price-option ${best ? "cheapest" : ""}">
          <span class="muted">${f.canteen}</span>
          <strong>${f.name}</strong>
          <span class="price">${rupees(f.price)}</span>
          ${best ? '<span class="save-badge">Cheaper</span>' : ""}
          ${isAvailable(f) ? '<button class="btn btn-small btn-outline" data-add="' + f.id + '">Add to cart</button>' : '<button class="btn btn-small" disabled>Sold Out</button>'}
        </div>`;
    }).join("");

    return `
      <article class="price-check-card">
        <h3>${group.label}</h3>
        <div class="price-options">${cols}</div>
        <p class="muted note">${diff > 0 ? cheapest.canteen + " is " + rupees(diff) + " cheaper." : "Same price at both canteens."}</p>
      </article>`;
  }).join("");
}

// ---------- Clicks ----------
canteenFilterBox.addEventListener("click", function (event) {
  const pill = event.target.closest(".pill");
  if (!pill) return;
  dealState.canteen = pill.dataset.value;
  renderFilters();
  renderDeals();
});

// Compare buttons exist both on cards and inside the table ("Remove")
document.addEventListener("click", function (event) {
  const button = event.target.closest("[data-compare]");
  if (!button) return;
  const id = button.dataset.compare;
  const position = dealState.compare.indexOf(id);

  if (position !== -1) {
    dealState.compare.splice(position, 1);
  } else if (dealState.compare.length >= 3) {
    toast("You can compare up to 3 deals. Remove one first.");
    return;
  } else {
    dealState.compare.push(id);
  }
  renderDeals();
  renderCompare();
});

function renderAll() {
  renderFilters();
  renderDeals();
  renderCompare();
  renderPriceCheck();
}
renderAll();
window.addEventListener("storage", renderAll);

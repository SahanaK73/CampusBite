// =====================================================
// map.js  -  the simulated campus map + rider position
//
// There is NO real GPS here. The rider's position is worked out from the
// time since the rider tapped "Picked up", so it works after a refresh too.
// =====================================================

const MAP_W = 600, MAP_H = 380, ROAD_Y = 190;
const TILE_COLORS = { Udupi: "#FFE3A3", Tango: "#FFC9A6", Munch: "#F2D9BA" };

function getSpot(name) {
  return campusSpots.find(function (s) { return s.name === name; }) || campusSpots[0];
}

// The route: canteen -> main road -> along the road -> delivery point
function routePoints(canteenName, spotName) {
  const c = getCanteen(canteenName);
  const s = getSpot(spotName);
  return [
    { x: c.x, y: c.y + 30 },
    { x: c.x, y: ROAD_Y },
    { x: s.x, y: ROAD_Y },
    { x: s.x, y: s.y - 16 }
  ];
}

function routeLength(points) {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += Math.abs(points[i].x - points[i - 1].x) + Math.abs(points[i].y - points[i - 1].y);
  }
  return length;
}

// The point that is t (0 to 1) of the way along the route
function pointOnRoute(points, t) {
  let remaining = routeLength(points) * t;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const segment = Math.abs(dx) + Math.abs(dy);
    if (remaining <= segment || i === points.length - 1) {
      const fraction = segment === 0 ? 0 : Math.min(1, remaining / segment);
      return { x: points[i - 1].x + dx * fraction, y: points[i - 1].y + dy * fraction };
    }
    remaining -= segment;
  }
  return points[points.length - 1];
}

// 0 = still at the canteen, 1 = at the customer
function deliveryProgress(order) {
  if (order.status === "Completed") return 1;
  if (!order.outAt) return 0;
  return Math.min(1, (Date.now() - order.outAt) / (DEMO_DELIVERY_SECONDS * 1000));
}

function hasArrived(order) {
  return order.status === "Out for Delivery" && deliveryProgress(order) >= 1;
}

function deliveryEtaMinutes(order) {
  const spot = getSpot(order.deliverTo);
  return Math.max(1, Math.ceil((1 - deliveryProgress(order)) * spot.minutes));
}

// Draw the whole map as an SVG string
function campusMapSVG(order) {
  const points = routePoints(order.canteen, order.deliverTo);
  const pathData = "M " + points.map(function (p) { return p.x + " " + p.y; }).join(" L ");
  const progress = deliveryProgress(order);
  const rider = pointOnRoute(points, progress);

  // roads
  let roads = '<rect x="24" y="' + (ROAD_Y - 15) + '" width="552" height="30" rx="15" fill="#fff" stroke="#EAD3B3" stroke-width="2"/>';
  canteens.forEach(function (c) {
    roads += '<rect x="' + (c.x - 8) + '" y="' + (c.y + 20) + '" width="16" height="' + (ROAD_Y - c.y - 20) + '" fill="#fff"/>';
  });
  campusSpots.forEach(function (s) {
    roads += '<rect x="' + (s.x - 8) + '" y="' + ROAD_Y + '" width="16" height="' + (s.y - 14 - ROAD_Y) + '" fill="#fff"/>';
  });

  // canteen buildings
  const buildings = canteens.map(function (c) {
    const mine = c.name === order.canteen;
    return '<rect x="' + (c.x - 52) + '" y="' + (c.y - 30) + '" width="104" height="60" rx="16" fill="' + TILE_COLORS[c.name] + '" stroke="#2E1B12" stroke-width="' + (mine ? 3 : 0) + '"/>' +
      '<text x="' + c.x + '" y="' + (c.y - 4) + '" text-anchor="middle" dominant-baseline="central" font-size="26">' + c.emoji + '</text>' +
      '<text x="' + c.x + '" y="' + (c.y + 19) + '" text-anchor="middle" font-size="13" font-weight="700" fill="#2E1B12">' + c.name + '</text>';
  }).join("");

  // delivery points
  const spots = campusSpots.map(function (s) {
    const mine = s.name === order.deliverTo;
    return '<circle cx="' + s.x + '" cy="' + s.y + '" r="14" fill="' + (mine ? "#FF8A2A" : "#fff") + '" stroke="' + (mine ? "#2E1B12" : "#B99B7A") + '" stroke-width="2.5"/>' +
      (mine ? '<text x="' + s.x + '" y="' + s.y + '" text-anchor="middle" dominant-baseline="central" font-size="15">📍</text>' : "") +
      '<text x="' + s.x + '" y="' + (s.y + 31) + '" text-anchor="middle" font-size="12" font-weight="' + (mine ? 800 : 500) + '" fill="#2E1B12">' + s.name + '</text>';
  }).join("");

  return '<svg class="map-svg" viewBox="0 0 ' + MAP_W + " " + MAP_H + '" role="img" aria-label="Campus map: route from ' + order.canteen + " to " + order.deliverTo + '">' +
    '<rect width="' + MAP_W + '" height="' + MAP_H + '" rx="26" fill="#FFF0DA"/>' +
    '<ellipse cx="555" cy="150" rx="30" ry="14" fill="#DCEBC6"/><ellipse cx="45" cy="240" rx="26" ry="18" fill="#DCEBC6"/>' +
    roads + buildings + spots +
    '<path d="' + pathData + '" fill="none" stroke="#C9A37A" stroke-width="4" stroke-dasharray="2 9" stroke-linecap="round"/>' +
    '<path class="route-progress" d="' + pathData + '" fill="none" stroke="#FF8A2A" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="' + (1 - progress) + '"/>' +
    '<g class="rider-marker" style="transform: translate(' + rider.x + "px, " + rider.y + 'px)"><circle r="18" fill="#2E1B12"/>' +
    '<text text-anchor="middle" dominant-baseline="central" font-size="19">🛵</text></g>' +
    "</svg>";
}

// Move the rider marker + orange line (called every half second)
function updateMap(root, order) {
  const progress = deliveryProgress(order);
  const rider = pointOnRoute(routePoints(order.canteen, order.deliverTo), progress);
  const marker = root.querySelector(".rider-marker");
  const line = root.querySelector(".route-progress");
  if (marker) marker.style.transform = "translate(" + rider.x + "px, " + rider.y + "px)";
  if (line) line.setAttribute("stroke-dashoffset", 1 - progress);
}

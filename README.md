CampusBite - Hungry? Skip the queue. 🍔
Campus food-ordering prototype (HTML + CSS + JavaScript, no backend). Everything is simulated in the browser.

Run
Chrome / Edge: open index.html. No install, no server needed.
Firefox (or any browser where the cart looks empty): open CampusBite-single-file.html. Firefox keeps separate storage for every file opened directly, so the multi-file version can lose the cart between pages. The single-file version holds all pages in one document, so it works.
Or run a local server inside this folder and open http://localhost:8000 python -m http.server 8000 (Python) npx serve (Node) VS Code: install "Live Server" and click "Go Live"
Pages
index, menu, food, deals, cart, checkout, confirmation, orders, addon, track, dashboard (canteen staff), delivery (rider app), about

Files
css/style.css - all styling
js/data.js - canteens, foods, deals, riders, campus spots, statuses, settings, localStorage helpers
js/common.js - navbar, cart + deal pricing, reorder, food card, toast, countdown clocks
js/recommend.js - rule-based "Picked for you" suggestions
js/map.js - simulated campus map + rider position
js/.js - one script per page
Settings (js/data.js)
ADDON_WINDOW_SECONDS = 120 (add-on window after paying) DELIVERY_FEE = 15 DEMO_DELIVERY_SECONDS = 60 (how long the simulated ride takes)

Demo script
Menu -> add Masala Dosa + Lemon Tea -> Cart (deal applies) -> Checkout -> Delivery -> Place Order
Confirmation: note the OTP and the 2-minute "Add items" clock -> add a Samosa and pay
Canteen Dashboard (Udupi): Accept -> Preparing -> Ready
Delivery Partner app (footer link): "Picked up" -> watch the map on My Orders > Track delivery
Rider taps "skip to arrival" -> types the student's OTP -> order completes Use "Reset demo data" at the bottom of the dashboard to start fresh.
Notes
The cart can hold food from several canteens. At checkout it is split into one order per canteen (own order ID, pickup code or delivery OTP, add-on window).
If the browser does not share saved data between pages (or blocks it), the site keeps a copy in the tab so the cart still works.

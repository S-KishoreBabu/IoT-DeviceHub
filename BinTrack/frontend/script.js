/* ------------------------------------------
   BINTRACK – CLEAN OPTIMIZED SCRIPT
-------------------------------------------*/

/* ---------- Firebase Configuration ---------- */
const greenBin = "https://ik.imagekit.io/khfpxrcgz/dustbin-green.png?updatedAt=1748065493153";
const redBin   = "https://ik.imagekit.io/khfpxrcgz/dustbin-red.png?updatedAt=1748065569563";

// Truck fixed location
const truckLocation = { lat: 10.88964, lng: 76.99225 };

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCzi2IsDsZE5WIA7KpDgS-0RFs6vxSDqDY",
    authDomain: "brave-design-417105.firebaseapp.com",
    databaseURL: "https://brave-design-417105-default-rtdb.firebaseio.com",
    projectId: "brave-design-417105",
    storageBucket: "brave-design-417105.appspot.com",
    messagingSenderId: "218139478751",
    appId: "1:218139478751:web:a8a36aeab810976906b76a"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* ---------- Global Variables ---------- */
let map;
let markers = {};
let dustbinLocations = {};

let directionsService;
let directionsRenderer;

/* ------------------------------------------
   UI TAB SWITCHING
-------------------------------------------*/
function showTab(tabId) {
    document.querySelectorAll('.tab-view').forEach(tab =>
        tab.classList.remove('active')
    );

    document.getElementById(tabId).classList.add('active');

    if (tabId === "map-view") {
        setTimeout(() => initMap(), 200);
    }
}

/* ------------------------------------------
   UPDATE BASED ON REALTIME FIREBASE DATA
-------------------------------------------*/
db.ref("dustbins").on("value", (snapshot) => {
    dustbinLocations = snapshot.val();
    updateUI();
    updateMapMarkers();
    findRouteForAllFilled();
});

/* ---------- Update Grid + Table View ---------- */
function updateUI() {
    Object.keys(dustbinLocations).forEach(id => {
        const d = dustbinLocations[id];

        // Grid view
        const imgEl = document.getElementById(`dustbin-img-${id}`);
        const statusEl = document.getElementById(`dustbin-status-${id}`);

        if (imgEl) imgEl.src = d.filled ? redBin : greenBin;
        if (statusEl) statusEl.textContent = d.filled ? "Filled" : "Not Filled";

        // Table
        const tableStatus = document.getElementById(`table-status-${id}`);
        if (tableStatus) {
            tableStatus.textContent = d.filled ? "Filled" : "Not Filled";
            tableStatus.style.color = d.filled ? "red" : "green";
        }
    });
}

/* ------------------------------------------
   MARKERS LOGIC
-------------------------------------------*/
function updateMapMarkers() {
    if (!map) return;

    Object.keys(dustbinLocations).forEach(id => {
        const d = dustbinLocations[id];

        // remove previous marker
        if (markers[id]) markers[id].setMap(null);

        markers[id] = new google.maps.Marker({
            position: { lat: d.lat, lng: d.lng },
            map,
            title: `Dustbin ${id}`,
            icon: d.filled
                ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                : "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
        });
    });
}

/* ------------------------------------------
   FIND ROUTE TO ALL FILLED BINS (OPTIMIZED)
-------------------------------------------*/

// Order bins using Nearest-Neighbour optimization
/* =========================
   Exact TSP (permutations) routing helpers
   ========================= */

/**
 * Compute distance (meters) between two lat/lng objects using Google Maps geometry.
 */
function gmDist(a, b) {
  return google.maps.geometry.spherical.computeDistanceBetween(
    new google.maps.LatLng(a.lat, a.lng),
    new google.maps.LatLng(b.lat, b.lng)
  );
}

/**
 * Compute total distance (meters) for path:
 * truckLocation -> bin1 -> bin2 -> ... -> binN -> truckLocation
 */
function totalRouteDistance(order) {
  if (!order || order.length === 0) return 0;
  let total = 0;
  // truck -> first
  total += gmDist(truckLocation, order[0]);
  // between bins
  for (let i = 0; i < order.length - 1; i++) {
    total += gmDist(order[i], order[i + 1]);
  }
  // last -> truck
  total += gmDist(order[order.length - 1], truckLocation);
  return total;
}

/**
 * Generate all permutations of an array (returns array of arrays).
 * Warning: factorial complexity. Use only for small N (<=8).
 */
function permutations(arr) {
  const results = [];

  function permute(a, l) {
    if (l === a.length - 1) {
      results.push(a.slice());
      return;
    }
    for (let i = l; i < a.length; i++) {
      [a[l], a[i]] = [a[i], a[l]];
      permute(a, l + 1);
      [a[l], a[i]] = [a[i], a[l]];
    }
  }

  permute(arr.slice(), 0);
  return results;
}

/**
 * Exact route finder. If filledBins.length > 8, fallback to nearest-neighbour.
 * filledBins is array of objects: { id, lat, lng, filled }
 */
function findBestRouteExact(filledBins) {
  if (filledBins.length === 0) return [];

  // For larger numbers, fallback to heuristic to avoid explosion
  if (filledBins.length > 8) {
    console.warn("Too many bins for exact TSP. Using nearest-neighbour fallback.");
    return getOptimizedRouteNearestNeighbour(filledBins);
  }

  // Generate permutations and measure
  const perms = permutations(filledBins);
  let best = null;
  let bestDist = Infinity;

  perms.forEach(p => {
    const d = totalRouteDistance(p);
    if (d < bestDist) {
      bestDist = d;
      best = p.slice();
    }
  });

  return best || [];
}

/* -------------------------
   Nearest-neighbour fallback (keeps previous behavior)
   ------------------------- */
function getOptimizedRouteNearestNeighbour(filledBins) {
  const unvisited = [...filledBins];
  const ordered = [];
  let current = truckLocation;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDist = Infinity;

    unvisited.forEach((bin, index) => {
      const dist = gmDist(current, bin);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIndex = index;
      }
    });

    const next = unvisited.splice(nearestIndex, 1)[0];
    ordered.push(next);
    current = { lat: next.lat, lng: next.lng };
  }

  return ordered;
}

/* =========================
   Replace: findRouteForAllFilled
   - uses exact solver, then draws route and shows stops list
   ========================= */
function findRouteForAllFilled() {
  if (!map || !google || !google.maps || !google.maps.geometry) {
    // map/geometry not ready
    console.warn("Map or geometry library not ready yet.");
    return;
  }

  const filledBins = Object.keys(dustbinLocations)
    .map(id => ({ id, ...dustbinLocations[id] }))
    .filter(b => b.filled);

  if (filledBins.length === 0) {
    // clear any existing route & list
    if (directionsRenderer) directionsRenderer.set('directions', null);
    document.getElementById("stopsList") && (document.getElementById("stopsList").innerHTML = "");
    return;
  }

  const bestOrder = findBestRouteExact(filledBins);
  drawFullRoute(bestOrder);
}

/* =========================
   Replace: drawFullRoute
   - draws truck -> orderedBins -> truck
   - shows stops list with per-leg distances & total
   ========================= */
function drawFullRoute(orderedBins) {
  if (!orderedBins || orderedBins.length === 0) return;

  if (!directionsService) directionsService = new google.maps.DirectionsService();
  if (!directionsRenderer) {
    directionsRenderer = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: false
    });
    directionsRenderer.setMap(map);
  } else {
    // clear previous directions
    directionsRenderer.set('directions', null);
  }

  // Build waypoints exactly in the order found
  const waypoints = orderedBins.map(bin => ({
    location: { lat: bin.lat, lng: bin.lng },
    stopover: true
  }));

  const request = {
    origin: truckLocation,
    destination: truckLocation, // return to start
    waypoints: waypoints,
    travelMode: google.maps.TravelMode.DRIVING,
    optimizeWaypoints: false
  };

  directionsService.route(request, (result, status) => {
    console.log("Directions status:", status);
    if (status === "OK") {
      directionsRenderer.setDirections(result);
      // compute distances for display (per-leg)
      buildStopsListWithDistances(orderedBins);
    } else {
      console.error("Routing failed:", status);
      // fallback: still show list
      buildStopsListWithDistances(orderedBins);
    }
  });
}

/* =========================
   Display function building a nice table with per-leg distances
   Replaces previous displayOrder(alert)
   ========================= */
function buildStopsListWithDistances(orderedBins) {
  const stopsList = document.getElementById("stopsList");
  if (!stopsList) return;

  // compute per-leg distances (truck -> first, between, last -> truck)
  const legs = [];
  let total = 0;

  // leg 0: truck -> first
  legs.push({
    from: "Truck",
    to: orderedBins[0].id,
    dist: gmDist(truckLocation, orderedBins[0])
  });

  // intermediate legs
  for (let i = 0; i < orderedBins.length - 1; i++) {
    const d = gmDist(orderedBins[i], orderedBins[i + 1]);
    legs.push({
      from: orderedBins[i].id,
      to: orderedBins[i + 1].id,
      dist: d
    });
  }

  // final leg: last -> truck
  legs.push({
    from: orderedBins[orderedBins.length - 1].id,
    to: "Truck",
    dist: gmDist(orderedBins[orderedBins.length - 1], truckLocation)
  });

  legs.forEach(l => { total += l.dist; });

  // Build HTML
  let html = `
    <div class="stops-card">
      <h3>🚛 Collection Order</h3>
      <div class="route-summary">Total distance: ${(total / 1000).toFixed(2)} km</div>
      <table class="order-table">
        <thead>
          <tr><th>#</th><th>From</th><th>To</th><th>Distance (km)</th></tr>
        </thead>
        <tbody>
  `;

  legs.forEach((l, idx) => {
    html += `
      <tr>
        <td>${idx + 1}</td>
        <td>${l.from}</td>
        <td>${l.to}</td>
        <td>${(l.dist / 1000).toFixed(2)}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  stopsList.innerHTML = html;
}



/* ------------------------------------------
   INIT MAP
-------------------------------------------*/
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 11.016, lng: 76.955 },
        zoom: 16,
    });

    // Truck marker
    new google.maps.Marker({
        position: truckLocation,
        map,
        icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        title: "Truck"
    });

    directionsRenderer = new google.maps.DirectionsRenderer({ map });
    updateMapMarkers();
    findRouteForAllFilled();
}

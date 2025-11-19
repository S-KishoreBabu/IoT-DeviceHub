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
function getOptimizedRoute(filled) {
    const unvisited = [...filled];
    const route = [];
    let current = truckLocation;

    while (unvisited.length > 0) {
        let nearestIndex = 0;
        let nearestDist = Infinity;

        unvisited.forEach((b, index) => {
            const dist = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(current.lat, current.lng),
                new google.maps.LatLng(b.lat, b.lng)
            );
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestIndex = index;
            }
        });

        const next = unvisited.splice(nearestIndex, 1)[0];
        route.push(next);
        current = { lat: next.lat, lng: next.lng };
    }

    return route;
}

function findRouteForAllFilled() {
    if (!map) return;

    const filledBins = Object.keys(dustbinLocations)
        .map(id => ({ id, ...dustbinLocations[id] }))
        .filter(b => b.filled);

    if (filledBins.length === 0) return;

    const ordered = getOptimizedRoute(filledBins);
    drawFullRoute(ordered);
}

/* ------------------------------------------
   DRAW ROUTE ON MAP
-------------------------------------------*/
function drawFullRoute(orderedBins) {
    if (!directionsService) {
        directionsService = new google.maps.DirectionsService();
    }

    if (!directionsRenderer) {
        directionsRenderer = new google.maps.DirectionsRenderer({
            map,
            suppressMarkers: false
        });
    }

    const waypoints = orderedBins.map(bin => ({
        location: { lat: bin.lat, lng: bin.lng },
        stopover: true
    }));

    const request = {
        origin: truckLocation,
        destination: truckLocation,
        waypoints,
        optimizeWaypoints: false,
        travelMode: "DRIVING"
    };

    directionsService.route(request, (res, status) => {
        if (status === "OK") {
            directionsRenderer.setDirections(res);
            displayOrder(orderedBins);
        }
    });
}

/* ---------- Show Pickup Order ---------- */
function displayOrder(ordered) {
    const stopsList = document.getElementById("stopsList");

    let html = `
        <h3>🚛 Dustbin Collection Order</h3>
        <table class="order-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Dustbin ID</th>
                    <th>Distance (km)</th>
                </tr>
            </thead>
            <tbody>
    `;

    ordered.forEach((b, i) => {
        html += `
            <tr>
                <td>${i + 1}</td>
                <td>${b.id}</td>
                <td>${(b.distance / 1000).toFixed(2)}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
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

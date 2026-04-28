const regions = {
  gop: {
    name: "Ankara GOP / Cankaya",
    center: [39.893604, 32.879194],
    zoom: 16,
    bounds: [
      [39.8878, 32.8689],
      [39.9008, 32.8902],
    ],
  },
  kizilay: {
    name: "Ankara Kizilay",
    center: [39.9208, 32.8541],
    zoom: 16,
    bounds: [
      [39.9147, 32.8451],
      [39.9273, 32.8641],
    ],
  },
  kadikoy: {
    name: "Istanbul Kadikoy",
    center: [40.9905, 29.0276],
    zoom: 16,
    bounds: [
      [40.9839, 29.0173],
      [40.9981, 29.039],
    ],
  },
  besiktas: {
    name: "Istanbul Besiktas",
    center: [41.0436, 29.0088],
    zoom: 16,
    bounds: [
      [41.0367, 28.9983],
      [41.0514, 29.0193],
    ],
  },
  alsancak: {
    name: "Izmir Alsancak",
    center: [38.4387, 27.1457],
    zoom: 16,
    bounds: [
      [38.4322, 27.1358],
      [38.4452, 27.1565],
    ],
  },
};

const state = {
  running: false,
  paused: false,
  region: regions.gop,
  depot: null,
  couriers: [],
  orders: [],
  prepQueue: [],
  markers: new Map(),
  routes: new Map(),
  regionLayer: null,
  selectedOrderId: null,
  editorMessage: "",
  editorRenderKey: "",
  selectedCategory: null,
  selectedSubcategory: null,
  selectedCourierId: null,
  money: 0,
  rating: 100,
  delivered: 0,
  missed: 0,
  orderSeq: 1,
  lastOrderAt: 0,
  prepSlots: 2,
  addressCache: new Map(),
};

const routing = {
  relaxedOsrm: "https://router.project-osrm.org/route/v1/walking",
  fallbackOsrm: "https://router.project-osrm.org/route/v1/driving",
  nominatim: "https://nominatim.openstreetmap.org/reverse",
};

const routePalette = ["#0f7bff", "#ef476f", "#00a896", "#f77f00", "#7c5cc4", "#118ab2", "#2d6a4f", "#d00000", "#5f0f40", "#3a86ff", "#6a994e", "#9d4edd"];

const els = {
  regionSelect: document.querySelector("#regionSelect"),
  startGame: document.querySelector("#startGame"),
  pauseGame: document.querySelector("#pauseGame"),
  courierCount: document.querySelector("#courierCount"),
  orders: document.querySelector("#orders"),
  prepList: document.querySelector("#prepList"),
  money: document.querySelector("#money"),
  rating: document.querySelector("#rating"),
  delivered: document.querySelector("#delivered"),
  missed: document.querySelector("#missed"),
  orderCount: document.querySelector("#orderCount"),
  prepSlots: document.querySelector("#prepSlots"),
  courierState: document.querySelector("#courierState"),
  courierDetails: document.querySelector("#courierDetails"),
  orderEditor: document.querySelector("#orderEditor"),
  orderOverlay: document.querySelector("#orderOverlay"),
  orderPageTitle: document.querySelector("#orderPageTitle"),
  orderPageMeta: document.querySelector("#orderPageMeta"),
  closeOrderPage: document.querySelector("#closeOrderPage"),
  ticketProgress: document.querySelector("#ticketProgress"),
  ticketList: document.querySelector("#ticketList"),
  basketValue: document.querySelector("#basketValue"),
  basketList: document.querySelector("#basketList"),
  orderPageMessage: document.querySelector("#orderPageMessage"),
  prepareOrder: document.querySelector("#prepareOrder"),
  categoryTabs: document.querySelector("#categoryTabs"),
  subcategoryTabs: document.querySelector("#subcategoryTabs"),
  productGrid: document.querySelector("#productGrid"),
  productSearch: document.querySelector("#productSearch"),
  searchResults: document.querySelector("#searchResults"),
};

function productImage(label, color = "5d3ebc") {
  return `https://placehold.co/140x140/${color}/ffffff.webp?text=${encodeURIComponent(label)}`;
}

let catalog = window.GETIR_PRODUCTS || [
  { id: "su-19l", name: "Kuzeyden Damacana", unit: "19 L", category: "Su & İçecek", price: 115, image: productImage("Kuzeyden", "4b72ff") },
  { id: "su-6x1-5", name: "Kuzeyden Su", unit: "6 x 1,5 L", category: "Su & İçecek", price: 72, image: productImage("Su", "4b72ff") },
  { id: "kola-1l", name: "Coca-Cola", unit: "1 L", category: "Su & İçecek", price: 48, image: productImage("Cola", "333333") },
  { id: "ayran", name: "Sütaş Ayran", unit: "1 L", category: "Su & İçecek", price: 44, image: productImage("Ayran", "4b72ff") },
  { id: "meyve-suyu", name: "Cappy Karışık", unit: "1 L", category: "Su & İçecek", price: 55, image: productImage("Cappy", "f77f00") },
  { id: "soda", name: "Beypazarı Soda", unit: "6 x 200 ml", category: "Su & İçecek", price: 42, image: productImage("Soda", "2a9d8f") },

  { id: "cips", name: "Lay's Klasik", unit: "107 g", category: "Atıştırmalık", price: 52, image: productImage("Lay's", "f4a261") },
  { id: "gofret", name: "Ülker Çikolatalı Gofret", unit: "36 g", category: "Atıştırmalık", price: 16, image: productImage("Gofret", "6f4e37") },
  { id: "browni", name: "Eti Browni Intense", unit: "50 g", category: "Atıştırmalık", price: 28, image: productImage("Browni", "6f4e37") },
  { id: "cikolata", name: "Milka Sütlü Çikolata", unit: "80 g", category: "Atıştırmalık", price: 64, image: productImage("Milka", "7c5cc4") },
  { id: "kuruyemis", name: "Tadım Karışık Kuruyemiş", unit: "180 g", category: "Atıştırmalık", price: 145, image: productImage("Tadım", "a0522d") },
  { id: "kraker", name: "Çubuk Kraker", unit: "40 g", category: "Atıştırmalık", price: 12, image: productImage("Kraker", "d6a24a") },

  { id: "sut", name: "Pınar Süt", unit: "1 L", category: "Süt Ürünleri", price: 39, image: productImage("Süt", "7bb7ff") },
  { id: "yogurt", name: "Sütaş Yoğurt", unit: "1 kg", category: "Süt Ürünleri", price: 78, image: productImage("Yoğurt", "7bb7ff") },
  { id: "peynir", name: "İçim Beyaz Peynir", unit: "500 g", category: "Süt Ürünleri", price: 155, image: productImage("Peynir", "7bb7ff") },
  { id: "tereyagi", name: "Sek Tereyağı", unit: "250 g", category: "Süt Ürünleri", price: 139, image: productImage("Tereyağı", "f5d76e") },
  { id: "yumurta", name: "CP Yumurta", unit: "10'lu", category: "Süt Ürünleri", price: 92, image: productImage("Yumurta", "f5d76e") },
  { id: "kefir", name: "Altınkılıç Kefir", unit: "1 L", category: "Süt Ürünleri", price: 68, image: productImage("Kefir", "7bb7ff") },

  { id: "domates", name: "Domates", unit: "500 g", category: "Meyve & Sebze", price: 48, image: productImage("Domates", "d62828") },
  { id: "salatalik", name: "Salatalık", unit: "500 g", category: "Meyve & Sebze", price: 42, image: productImage("Salatalık", "2d6a4f") },
  { id: "muz", name: "Muz", unit: "500 g", category: "Meyve & Sebze", price: 58, image: productImage("Muz", "f4d35e") },
  { id: "elma", name: "Elma", unit: "1 kg", category: "Meyve & Sebze", price: 62, image: productImage("Elma", "bc4749") },
  { id: "limon", name: "Limon", unit: "500 g", category: "Meyve & Sebze", price: 38, image: productImage("Limon", "f4d35e") },
  { id: "patates", name: "Patates", unit: "1 kg", category: "Meyve & Sebze", price: 45, image: productImage("Patates", "b08968") },

  { id: "makarna", name: "Barilla Spaghetti", unit: "500 g", category: "Temel Gıda", price: 49, image: productImage("Makarna", "f77f00") },
  { id: "pirinc", name: "Baldo Pirinç", unit: "1 kg", category: "Temel Gıda", price: 86, image: productImage("Pirinç", "e9c46a") },
  { id: "zeytinyagi", name: "Komili Zeytinyağı", unit: "1 L", category: "Temel Gıda", price: 355, image: productImage("Yağ", "8ab17d") },
  { id: "un", name: "Söke Un", unit: "1 kg", category: "Temel Gıda", price: 36, image: productImage("Un", "e9c46a") },
  { id: "tonbaligi", name: "Dardanel Ton", unit: "2 x 75 g", category: "Temel Gıda", price: 118, image: productImage("Ton", "457b9d") },
  { id: "corba", name: "Knorr Çorba", unit: "65 g", category: "Temel Gıda", price: 24, image: productImage("Çorba", "e76f51") },

  { id: "ekmek", name: "UNO Tost Ekmeği", unit: "470 g", category: "Fırından", price: 64, image: productImage("UNO", "c08552") },
  { id: "simit", name: "Simit", unit: "2 adet", category: "Fırından", price: 30, image: productImage("Simit", "c08552") },
  { id: "kruvasan", name: "7 Days Kruvasan", unit: "60 g", category: "Fırından", price: 22, image: productImage("Kruvasan", "c08552") },

  { id: "deterjan", name: "Ariel Sıvı Deterjan", unit: "1,5 L", category: "Ev Bakım", price: 198, image: productImage("Ariel", "2775d1") },
  { id: "bulasik", name: "Fairy Tablet", unit: "22'li", category: "Ev Bakım", price: 210, image: productImage("Fairy", "0f9d58") },
  { id: "havlu", name: "Selpak Havlu", unit: "6'lı", category: "Ev Bakım", price: 95, image: productImage("Havlu", "8d99ae") },
  { id: "cop-poseti", name: "Koroplast Çöp Poşeti", unit: "Orta boy", category: "Ev Bakım", price: 58, image: productImage("Poşet", "546a7b") },

  { id: "sampuan", name: "Elidor Şampuan", unit: "500 ml", category: "Kişisel Bakım", price: 135, image: productImage("Elidor", "9d4edd") },
  { id: "dis-macunu", name: "Colgate Diş Macunu", unit: "75 ml", category: "Kişisel Bakım", price: 72, image: productImage("Colgate", "d00000") },
  { id: "sabun", name: "Dove Sabun", unit: "4 x 90 g", category: "Kişisel Bakım", price: 96, image: productImage("Dove", "9d4edd") },
  { id: "deodorant", name: "Nivea Deodorant", unit: "150 ml", category: "Kişisel Bakım", price: 112, image: productImage("Nivea", "2775d1") },

  { id: "bebek-bezi", name: "Prima Bebek Bezi", unit: "20'li", category: "Bebek", price: 265, image: productImage("Prima", "f4a261") },
  { id: "islak-mendil", name: "Uni Baby Islak Mendil", unit: "3 x 56", category: "Bebek", price: 122, image: productImage("Uni Baby", "f4a261") },
  { id: "mama", name: "Hero Baby Kavanoz", unit: "125 g", category: "Bebek", price: 48, image: productImage("Mama", "f4a261") },

  { id: "kedi-mama", name: "Whiskas Kedi Maması", unit: "1,4 kg", category: "Evcil Hayvan", price: 249, image: productImage("Whiskas", "6a994e") },
  { id: "kopek-mama", name: "Pedigree Köpek Maması", unit: "500 g", category: "Evcil Hayvan", price: 98, image: productImage("Pedigree", "6a994e") },
  { id: "kum", name: "Kedi Kumu", unit: "5 L", category: "Evcil Hayvan", price: 125, image: productImage("Kum", "6a994e") },
];

let categories = window.GETIR_CATEGORIES || [...new Set(catalog.map((product) => product.category))];

const map = L.map("map", { zoomControl: false }).setView(state.region.center, state.region.zoom);
L.control.zoom({ position: "bottomright" }).addTo(map);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

const depotIcon = L.divIcon({
  html: '<div class="depot-icon">D</div>',
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function courierIcon(courier) {
  return L.divIcon({
    html: `<div class="courier-icon" style="background:${courier.color}">${courier.id.replace("K", "")}</div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function orderIcon(order) {
  const labels = {
    queued: order.id.replace("S", ""),
    preparing: "H",
    ready: "K",
    delivering: "Y",
  };
  return L.divIcon({
    html: `<div class="order-icon ${order.status} ${order.colorClass}">${labels[order.status] || "S"}</div>`,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomPoint(bounds, pad = 0) {
  const [[south, west], [north, east]] = bounds;
  return [
    randomBetween(south + pad, north - pad),
    randomBetween(west + pad, east - pad),
  ];
}

function distanceMeters(a, b) {
  return map.distance(L.latLng(a), L.latLng(b));
}

function createRandomTicket() {
  const count = Math.floor(randomBetween(2, 5.99));
  const pool = [...catalog].sort(() => Math.random() - 0.5);
  return pool.slice(0, count).map((product) => ({
    productId: product.id,
    qty: Math.floor(randomBetween(1, 2.99)),
  }));
}

function ticketTotal(items) {
  return items.reduce((total, item) => {
    const product = catalog.find((candidate) => candidate.id === item.productId);
    return total + (product ? product.price * item.qty : 0);
  }, 0);
}

function basketCounts(order) {
  return order.products.reduce((counts, product) => {
    counts[product.id] = (counts[product.id] || 0) + 1;
    return counts;
  }, {});
}

function ticketMatchesBasket(order) {
  const counts = basketCounts(order);
  return order.requestedItems.every((item) => counts[item.productId] === item.qty) && order.products.length === order.requestedItems.reduce((total, item) => total + item.qty, 0);
}

function subcategoriesFor(category) {
  return [...new Set(catalog.filter((product) => product.category === category).map((product) => product.subcategory || product.category))];
}

function normalizeSearchText(value) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
}

function clearLayerCollections() {
  for (const marker of state.markers.values()) marker.remove();
  for (const route of state.routes.values()) route.remove();
  if (state.regionLayer) state.regionLayer.remove();
  state.markers.clear();
  state.routes.clear();
  state.regionLayer = null;
}

function startGame() {
  clearLayerCollections();
  const region = regions[els.regionSelect.value];
  state.running = true;
  state.paused = false;
  state.region = region;
  state.depot = randomPoint(region.bounds, 0.0015);
  state.couriers = [];
  state.orders = [];
  state.prepQueue = [];
  state.selectedCourierId = null;
  state.selectedOrderId = null;
  state.selectedCategory = categories[0];
  state.selectedSubcategory = subcategoriesFor(state.selectedCategory)[0];
  state.editorMessage = "";
  state.editorRenderKey = "";
  state.money = 0;
  state.rating = 100;
  state.delivered = 0;
  state.missed = 0;
  state.orderSeq = 1;
  state.lastOrderAt = performance.now() - 5000;
  state.prevTime = null;
  els.pauseGame.textContent = "Duraklat";

  map.setView(region.center, region.zoom);
  map.fitBounds(region.bounds, { padding: [30, 30] });
  refreshMapSize();
  state.regionLayer = L.rectangle(region.bounds, {
    color: "#2775d1",
    weight: 1,
    dashArray: "6 6",
    fillOpacity: 0.015,
  })
    .addTo(map)
    .bindTooltip("Operasyon bölgesi: siparişler bu sınır içinde oluşur.");

  state.markers.set(
    "depot",
    L.marker(state.depot, { icon: depotIcon })
      .addTo(map)
      .bindTooltip("Merkez depo: kuryeler buradan çıkar ve dönüşte buraya gelir.")
      .bindPopup("<strong>Merkez depo</strong><br>Yeşil D noktası hazırlık ve kurye başlangıç merkezidir."),
  );

  const courierCount = Math.max(1, Math.min(12, Number.parseInt(els.courierCount.value, 10) || 3));
  els.courierCount.value = courierCount;
  for (let i = 0; i < courierCount; i += 1) {
    const courier = {
      id: `K${i + 1}`,
      name: `Kurye ${i + 1}`,
      status: "idle",
      pos: [...state.depot],
      speed: randomBetween(7.5, 11.5),
      target: null,
      routePath: null,
      routeDistance: 0,
      routeProgress: 0,
      routeNames: [],
      routeMode: "",
      orderId: null,
      progress: 0,
      eta: 0,
      completed: 0,
      earnings: 0,
      color: routePalette[i % routePalette.length],
    };
    state.couriers.push(courier);
    const marker = L.marker(courier.pos, { icon: courierIcon(courier) })
      .addTo(map)
      .bindTooltip(courier.name)
      .on("click", () => selectCourier(courier.id));
    state.markers.set(courier.id, marker);
  }

  for (let i = 0; i < 3; i += 1) spawnOrder();
  render();
}

function spawnOrder() {
  if (!state.running) return;
  const destination = randomPoint(state.region.bounds, 0.0007);
  if (distanceMeters(destination, state.depot) < 160) return spawnOrder();
  const requestedItems = createRandomTicket();

  const order = {
    id: `S${state.orderSeq++}`,
    customer: "OSM adresi alınıyor",
    street: "OSM adresi alınıyor",
    district: "",
    destination,
    createdAt: performance.now(),
    deadline: randomBetween(140, 210),
    prepDuration: randomBetween(12, 26),
    prepElapsed: 0,
    status: "queued",
    requestedItems,
    products: [],
    courierId: null,
    value: ticketTotal(requestedItems),
    colorClass: `c${state.orderSeq % 6}`,
  };
  state.orders.push(order);
  const marker = L.marker(destination, { icon: orderIcon(order) })
    .addTo(map)
    .bindTooltip(`${order.id} · Fiş hazırlanacak`)
    .on("click", () => selectOrder(order.id));
  state.markers.set(order.id, marker);
  hydrateOrderAddress(order);
}

async function hydrateOrderAddress(order) {
  const address = await reverseGeocode(order.destination);
  const current = state.orders.find((item) => item.id === order.id);
  if (!current) return;
  current.street = address.street;
  current.district = address.district;
  current.customer = address.label;
  state.markers.get(order.id)?.bindTooltip(`${order.id} · ${address.label}`);
  state.editorRenderKey = "";
  render();
}

function updatePrep(dt) {
  const active = state.prepQueue
    .map((id) => state.orders.find((order) => order.id === id))
    .filter(Boolean)
    .filter((order) => order.status === "preparing")
    .slice(0, state.prepSlots);

  for (const order of active) {
    order.status = "preparing";
    order.prepElapsed += dt;
    if (order.prepElapsed >= order.prepDuration) {
      order.status = "ready";
      state.prepQueue = state.prepQueue.filter((id) => id !== order.id);
      state.markers.get(order.id)?.bindTooltip(`${order.id} · Kurye bekliyor`);
      refreshOrderMarker(order);
      dispatchOrder(order.id);
    }
  }
}

function updateCouriers(dt) {
  for (const courier of state.couriers) {
    if (!courier.target) continue;
    if (!courier.routePath || courier.routePath.length < 2) continue;
    courier.routeProgress += courier.speed * dt;
    courier.pos = positionOnRoute(courier.routePath, courier.routeProgress);
    courier.eta = Math.max(0, Math.ceil((courier.routeDistance - courier.routeProgress) / courier.speed));
    if (courier.routeProgress >= courier.routeDistance) {
      courier.pos = [...courier.target];
      handleCourierArrived(courier);
    }
    state.markers.get(courier.id)?.setLatLng(courier.pos);
  }
}

function handleCourierArrived(courier) {
  if (courier.status === "delivering") {
    const order = state.orders.find((item) => item.id === courier.orderId);
    if (order) {
      const age = (performance.now() - order.createdAt) / 1000;
      const late = age > order.deadline;
      state.money += late ? Math.round(order.value * 0.55) : order.value;
      state.rating = Math.max(0, Math.min(100, state.rating + (late ? -4 : 1)));
      state.delivered += 1;
      courier.completed += 1;
      courier.earnings += late ? Math.round(order.value * 0.55) : order.value;
      removeOrder(order.id);
    }
    startCourierRoute(courier, state.depot, "returning");
    courier.orderId = null;
  } else if (courier.status === "returning") {
    courier.status = "idle";
    courier.target = null;
    courier.routePath = null;
    courier.routeDistance = 0;
    courier.routeProgress = 0;
    courier.routeNames = [];
    courier.routeMode = "";
    courier.eta = 0;
    removeRoute(courier.id);
    dispatchNextReadyOrder();
  }
}

function updateCourierRoute(courier) {
  if (!courier.target || !courier.routePath) return;
  const route = state.routes.get(courier.id);
  const color = courier.color;
  const opacity = courier.status === "returning" ? 0.45 : 0.85;
  if (route) {
    route.setLatLngs(courier.routePath);
    route.setStyle({ color, opacity });
    return;
  }
  const line = L.polyline(courier.routePath, {
    color,
    weight: 4,
    opacity,
    className: "route-line",
  })
    .addTo(map)
    .bindTooltip(`${courier.name} rotası`)
    .on("click", () => {
      selectCourier(courier.id);
      line.bindPopup(routePopup(courier)).openPopup();
    });
  state.routes.set(courier.id, line);
}

function routePopup(courier) {
  const streetList = courier.routeNames.length ? courier.routeNames.join(" → ") : "Sokak bilgisi yok";
  const mode = courier.routeMode === "relaxed" ? "Moto esnek rota" : "Standart araç rotası";
  return `<strong>${courier.name}</strong><br>${mode}<br>${Math.round(courier.routeDistance)} m · ETA ${courier.eta || "-"}s<br>${streetList}`;
}

function removeRoute(id) {
  const route = state.routes.get(id);
  if (route) route.remove();
  state.routes.delete(id);
}

function removeOrder(id) {
  const marker = state.markers.get(id);
  if (marker) marker.remove();
  state.markers.delete(id);
  state.orders = state.orders.filter((order) => order.id !== id);
  state.prepQueue = state.prepQueue.filter((orderId) => orderId !== id);
  if (state.selectedOrderId === id) state.selectedOrderId = null;
}

function updateDeadlines() {
  const now = performance.now();
  for (const order of [...state.orders]) {
    const age = (now - order.createdAt) / 1000;
    if (age > order.deadline + 45 && order.status !== "delivering") {
      state.missed += 1;
      state.rating = Math.max(0, state.rating - 7);
      removeOrder(order.id);
    }
  }
}

async function assignOrder(orderId, courierId) {
  const order = state.orders.find((item) => item.id === orderId);
  const courier = state.couriers.find((item) => item.id === courierId);
  if (!order || !courier || order.status !== "ready" || courier.status !== "idle") return;
  order.status = "delivering";
  order.courierId = courier.id;
  refreshOrderMarker(order);
  courier.orderId = order.id;
  state.markers.get(order.id)?.bindTooltip(`${order.id} · Yolda`);
  await startCourierRoute(courier, order.destination, "delivering");
  selectCourier(courier.id);
  render();
}

async function startCourierRoute(courier, target, status) {
  courier.status = "routing";
  courier.target = [...target];
  courier.routePath = null;
  courier.routeDistance = 0;
  courier.routeProgress = 0;
  courier.routeNames = [];
  courier.eta = 0;
  removeRoute(courier.id);
  renderCourierDetails();

  const route = await fetchRoute(courier.pos, target);
  if (!courier.target || distanceMeters(courier.target, target) > 2) return;
  courier.status = status;
  courier.routePath = route.path;
  courier.routeDistance = route.distance;
  courier.routeNames = route.names;
  courier.routeMode = route.mode;
  courier.routeProgress = 0;
  courier.eta = Math.ceil(route.distance / courier.speed);
  updateCourierRoute(courier);
  renderCourierDetails();
}

async function fetchRoute(from, to) {
  const coords = `${from[1]},${from[0]};${to[1]},${to[0]}`;
  const params = `${coords}?overview=full&geometries=geojson&steps=true`;
  const attempts = [
    { url: `${routing.relaxedOsrm}/${params}`, mode: "relaxed" },
    { url: `${routing.fallbackOsrm}/${params}`, mode: "driving" },
  ];

  for (const attempt of attempts) {
    try {
      return await requestRoute(attempt.url, attempt.mode);
    } catch (error) {
      console.warn("OSRM rota denemesi başarısız.", attempt.mode, error);
    }
  }

  return {
    path: [from, to],
    distance: distanceMeters(from, to),
    names: [],
    mode: "direct",
  };
}

async function requestRoute(url, mode) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`OSRM ${response.status}`);
  const data = await response.json();
  const route = data.routes?.[0];
  const geometry = route?.geometry?.coordinates;
  if (!geometry?.length) throw new Error("OSRM rota döndürmedi");
  const path = geometry.map(([lon, lat]) => [lat, lon]);
  const names = [
    ...new Set(
      route.legs
        ?.flatMap((leg) => leg.steps || [])
        .map((step) => step.name)
        .filter(Boolean) || [],
    ),
  ].slice(0, 4);
  return {
    path,
    distance: route.distance || routeDistance(path),
    names,
    mode,
  };
}

function routeDistance(path) {
  return path.slice(1).reduce((total, point, index) => total + distanceMeters(path[index], point), 0);
}

function positionOnRoute(path, progress) {
  let walked = 0;
  for (let i = 1; i < path.length; i += 1) {
    const start = path[i - 1];
    const end = path[i];
    const segment = distanceMeters(start, end);
    if (walked + segment >= progress) {
      const ratio = segment ? (progress - walked) / segment : 1;
      return [
        start[0] + (end[0] - start[0]) * ratio,
        start[1] + (end[1] - start[1]) * ratio,
      ];
    }
    walked += segment;
  }
  return [...path[path.length - 1]];
}

async function reverseGeocode(point) {
  const key = `${point[0].toFixed(5)},${point[1].toFixed(5)}`;
  if (state.addressCache.has(key)) return state.addressCache.get(key);
  const fallback = {
    street: `Adres ${point[0].toFixed(4)}, ${point[1].toFixed(4)}`,
    district: state.region.name,
    label: `Adres ${point[0].toFixed(4)}, ${point[1].toFixed(4)}`,
  };
  try {
    const params = new URLSearchParams({
      format: "jsonv2",
      lat: point[0],
      lon: point[1],
      zoom: "18",
      addressdetails: "1",
      "accept-language": "tr",
    });
    const response = await fetch(`${routing.nominatim}?${params.toString()}`);
    if (!response.ok) throw new Error(`Nominatim ${response.status}`);
    const data = await response.json();
    const address = data.address || {};
    const street =
      address.house_number && address.road
        ? `${address.road} No:${address.house_number}`
        : address.road ||
          address.pedestrian ||
          address.footway ||
          address.path ||
          address.cycleway ||
          address.residential ||
          address.neighbourhood ||
          address.suburb ||
          data.name ||
          fallback.street;
    const district =
      address.neighbourhood ||
      address.quarter ||
      address.suburb ||
      address.town ||
      address.city_district ||
      address.city ||
      "";
    const result = {
      street,
      district,
      label: district ? `${street} · ${district}` : street,
    };
    state.addressCache.set(key, result);
    return result;
  } catch (error) {
    console.warn("Nominatim adres alınamadı.", error);
    state.addressCache.set(key, fallback);
    return fallback;
  }
}

function selectOrder(id) {
  state.selectedOrderId = id;
  const order = state.orders.find((item) => item.id === id);
  const firstProduct = catalog.find((product) => product.id === order?.requestedItems?.[0]?.productId);
  if (firstProduct) {
    state.selectedCategory = firstProduct.category;
    state.selectedSubcategory = firstProduct.subcategory || firstProduct.category;
  }
  state.editorMessage = "";
  state.editorRenderKey = "";
  if (order?.status === "queued") openOrderPage(id);
  render();
}

function closeOrderPage() {
  els.orderOverlay.hidden = true;
  document.body.classList.remove("modal-open");
  els.productSearch.value = "";
  els.searchResults.hidden = true;
  els.searchResults.innerHTML = "";
}

function openOrderPage(id) {
  state.selectedOrderId = id;
  els.orderOverlay.hidden = false;
  document.body.classList.add("modal-open");
  els.productSearch.value = "";
  els.searchResults.hidden = true;
  els.searchResults.innerHTML = "";
  state.editorRenderKey = "";
  renderOrderEditor();
}

function renderSearchResults() {
  const order = state.orders.find((item) => item.id === state.selectedOrderId);
  const query = normalizeSearchText(els.productSearch.value.trim());
  if (!order || order.status !== "queued" || query.length < 2) {
    els.searchResults.hidden = true;
    els.searchResults.innerHTML = "";
    return;
  }

  const results = catalog
    .filter((product) => {
      const haystack = normalizeSearchText(`${product.name} ${product.shortName || ""} ${product.unit || ""} ${product.category} ${product.subcategory || ""} ${product.brand || ""}`);
      return haystack.includes(query);
    })
    .slice(0, 24);

  if (!results.length) {
    els.searchResults.hidden = false;
    els.searchResults.innerHTML = '<div class="search-empty">Sonuç yok</div>';
    return;
  }

  els.searchResults.hidden = false;
  els.searchResults.innerHTML = "";
  for (const product of results) {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `
      <img src="${product.image}" alt="" />
      <span><strong>${product.name}</strong><small>${product.unit} · ${product.category} / ${product.subcategory || product.category}</small></span>
      <b>${product.priceText || `₺${product.price}`}</b>
    `;
    button.addEventListener("click", () => {
      addProduct(order.id, product.id);
      els.productSearch.value = "";
      els.searchResults.hidden = true;
      els.searchResults.innerHTML = "";
      els.productSearch.focus();
    });
    els.searchResults.appendChild(button);
  }
}

function addProduct(orderId, productId) {
  const order = state.orders.find((item) => item.id === orderId);
  const product = catalog.find((item) => item.id === productId);
  if (!order || !product || order.status !== "queued") return;
  order.products.push(product);
  state.editorMessage = "";
  state.editorRenderKey = "";
  state.markers.get(order.id)?.bindTooltip(`${order.id} · Sepette ${order.products.length} ürün`);
  if (ticketMatchesBasket(order)) state.editorMessage = "Fiş tamam. Hazırlamaya gönderebilirsin.";
  render();
}

function removeProduct(orderId, productId) {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order || order.status !== "queued") return;
  const index = order.products.findIndex((product) => product.id === productId);
  if (index === -1) return;
  order.products.splice(index, 1);
  state.editorMessage = "";
  state.editorRenderKey = "";
  render();
}

function startPreparing(orderId) {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order || order.status !== "queued") return;
  if (!ticketMatchesBasket(order)) {
    state.editorMessage = "Sepet fişle aynı değil. Eksik/fazla ürünü düzelt.";
    state.editorRenderKey = "";
    renderOrderEditor();
    return;
  }
  state.editorMessage = "";
  state.editorRenderKey = "";
  order.status = "preparing";
  state.prepQueue.push(order.id);
  state.markers.get(order.id)?.bindTooltip(`${order.id} · Hazırlanıyor`);
  refreshOrderMarker(order);
  closeOrderPage();
  render();
}

function dispatchOrder(orderId) {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order || order.status !== "ready") return;
  const courier = nearestIdleCourier(order.destination);
  if (!courier) return;
  assignOrder(order.id, courier.id);
}

function refreshOrderMarker(order) {
  const marker = state.markers.get(order.id);
  if (!marker) return;
  marker.setIcon(orderIcon(order));
}

function dispatchNextReadyOrder() {
  const readyOrder = state.orders
    .filter((order) => order.status === "ready")
    .sort((a, b) => a.createdAt - b.createdAt)[0];
  if (readyOrder) dispatchOrder(readyOrder.id);
}

function nearestIdleCourier(destination) {
  return state.couriers
    .filter((courier) => courier.status === "idle")
    .sort((a, b) => distanceMeters(a.pos, destination) - distanceMeters(b.pos, destination))[0];
}

function selectCourier(id) {
  state.selectedCourierId = id;
  renderCourierDetails();
}

function tick(now) {
  requestAnimationFrame(tick);
  if (!state.running || state.paused) return;
  if (!state.prevTime) state.prevTime = now;
  const dt = Math.min(0.08, (now - state.prevTime) / 1000);
  state.prevTime = now;

  if (now - state.lastOrderAt > randomBetween(9000, 15000) && state.orders.length < 9) {
    spawnOrder();
    state.lastOrderAt = now;
  }

  updatePrep(dt);
  updateCouriers(dt);
  updateDeadlines();
  render();
}

function render() {
  els.money.textContent = `₺${state.money}`;
  els.rating.textContent = Math.round(state.rating);
  els.delivered.textContent = state.delivered;
  els.missed.textContent = state.missed;
  els.orderCount.textContent = state.orders.length;
  renderOrders();
  renderPrep();
  renderCourierDetails();
  renderOrderEditor();
}

function renderOrders() {
  if (!state.orders.length) {
    els.orders.className = "list empty-state";
    els.orders.textContent = "Aktif sipariş yok.";
    return;
  }
  els.orders.className = "list";
  els.orders.innerHTML = "";
  const now = performance.now();
  for (const order of [...state.orders].sort((a, b) => a.deadline - b.deadline)) {
    const age = (now - order.createdAt) / 1000;
    const remaining = Math.max(0, Math.ceil(order.deadline - age));
    const prepPercent = Math.min(100, Math.round((order.prepElapsed / order.prepDuration) * 100));
    const card = document.createElement("article");
    card.className = `order-card ${order.id === state.selectedOrderId ? "selected" : ""}`;
    const statusClass = remaining < 35 ? "late" : order.status === "ready" ? "" : "waiting";
    card.innerHTML = `
      <div class="order-top">
        <strong>${order.id} · ${order.street}</strong>
        <span class="status ${statusClass}">${statusText(order)}</span>
      </div>
      <span class="item-meta">${order.district || state.region.name} · Kalan: ${remaining}s · Ürün: ${order.products.length} · Gelir: ₺${order.value}</span>
      <div class="bar"><span style="width: ${prepPercent}%"></span></div>
    `;
    card.addEventListener("click", () => selectOrder(order.id));
    if (order.status === "ready") {
      const actions = document.createElement("div");
      actions.className = "actions";
      const idleCouriers = state.couriers.filter((courier) => courier.status === "idle");
      if (idleCouriers.length) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Yola çıkar";
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          dispatchOrder(order.id);
        });
        actions.append(button);
      } else {
        actions.innerHTML = '<span class="item-meta">Boş kurye bekleniyor.</span>';
      }
      card.appendChild(actions);
    }
    els.orders.appendChild(card);
  }
}

function statusText(order) {
  if (order.status === "queued") return order.products.length ? "Ürün seçildi" : "Ürün bekliyor";
  if (order.status === "preparing") return "Hazırlanıyor";
  if (order.status === "ready") return "Hazır";
  if (order.status === "delivering") return "Yolda";
  return order.status;
}

function statusText(order) {
  if (order.status === "queued") return ticketMatchesBasket(order) ? "Fiş tamam" : "Sepet toplanıyor";
  if (order.status === "preparing") return "Hazırlanıyor";
  if (order.status === "ready") return "Hazır";
  if (order.status === "delivering") return "Yolda";
  return order.status;
}

function renderPrep() {
  const active = state.orders.filter((order) => order.status === "preparing");
  const preparing = active.filter((order) => order.status === "preparing").length;
  els.prepSlots.textContent = `${preparing}/${state.prepSlots}`;
  if (!active.length) {
    els.prepList.className = "list small empty-state";
    els.prepList.textContent = "Hazırlanan sipariş yok.";
    return;
  }
  els.prepList.className = "list small";
  els.prepList.innerHTML = "";
  for (const order of active) {
    const prepPercent = Math.min(100, Math.round((order.prepElapsed / order.prepDuration) * 100));
    const card = document.createElement("article");
    card.className = "prep-card";
    card.innerHTML = `
      <strong>${order.id}</strong>
      <span class="item-meta">${statusText(order)} · ${prepPercent}%</span>
      <div class="bar"><span style="width: ${prepPercent}%"></span></div>
    `;
    els.prepList.appendChild(card);
  }
}

function renderOrderEditor() {
  const order = state.orders.find((item) => item.id === state.selectedOrderId);
  if (!order) {
    if (state.editorRenderKey === "empty") return;
    state.editorRenderKey = "empty";
    els.orderEditor.className = "order-editor empty-state";
    els.orderEditor.textContent = "Haritadaki sipariş noktasına tıkla.";
    return;
  }
  const renderKey = [
    order.id,
    order.status,
    order.products.length,
    order.value,
    state.editorMessage,
  ].join("|");
  if (renderKey === state.editorRenderKey) return;
  state.editorRenderKey = renderKey;
  els.orderEditor.className = "order-editor";
  const basket = order.products.length
    ? order.products.map((product) => `<span>${product.name}</span>`).join("")
    : '<span class="item-meta">Henüz ürün yok.</span>';
  const actionText =
    order.status === "ready"
      ? "Yola çıkar"
      : order.status === "preparing"
        ? "Hazırlanıyor"
        : order.status === "delivering"
          ? "Kurye yolda"
        : order.products.length
          ? "Hazırla"
          : "Önce ürün ekle";
  els.orderEditor.innerHTML = `
    <div class="editor-card">
      <div class="order-top">
        <strong>${order.id} · ${order.street}</strong>
        <span class="status ${order.status === "ready" ? "" : "waiting"}">${statusText(order)}</span>
      </div>
      <span class="item-meta">${order.district || state.region.name}</span>
      <div class="basket">${basket}</div>
      <div class="product-grid"></div>
      <div class="editor-message">${state.editorMessage}</div>
      <button type="button" id="prepareOrder">${actionText}</button>
    </div>
  `;
  const grid = els.orderEditor.querySelector(".product-grid");
  for (const product of catalog) {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<strong>${product.name}</strong><span>${product.category} · ₺${product.price}</span>`;
    button.disabled = order.status !== "queued";
    button.addEventListener("click", () => addProduct(order.id, product.id));
    grid.appendChild(button);
  }
  const prepare = els.orderEditor.querySelector("#prepareOrder");
  prepare.disabled = order.status === "preparing" || order.status === "delivering";
  prepare.addEventListener("click", () => {
    if (order.status === "ready") dispatchOrder(order.id);
    else startPreparing(order.id);
  });
}

function renderOrderEditor() {
  const order = state.orders.find((item) => item.id === state.selectedOrderId);
  if (!order) {
    if (state.editorRenderKey === "empty") return;
    state.editorRenderKey = "empty";
    els.orderEditor.className = "order-editor empty-state";
    els.orderEditor.textContent = "Sipariş kartına tıklayıp ayrı toplama ekranını aç.";
    if (!els.orderOverlay.hidden) closeOrderPage();
    return;
  }
  if (els.orderOverlay.hidden || order.status !== "queued") {
    els.orderEditor.className = "order-editor";
    els.orderEditor.innerHTML = `
      <button class="open-order-page" type="button">Sipariş toplama ekranını aç</button>
      <span class="item-meta">${order.id} · ${order.street}</span>
    `;
    els.orderEditor.querySelector(".open-order-page")?.addEventListener("click", () => openOrderPage(order.id));
    return;
  }

  const counts = basketCounts(order);
  const renderKey = [
    order.id,
    order.status,
    order.products.length,
    order.value,
    state.selectedCategory,
    state.selectedSubcategory,
    state.editorMessage,
    JSON.stringify(counts),
  ].join("|");
  if (renderKey === state.editorRenderKey) return;
  state.editorRenderKey = renderKey;

  const ticket = order.requestedItems
    .map((item) => {
      const product = catalog.find((candidate) => candidate.id === item.productId);
      const picked = counts[item.productId] || 0;
      const done = picked === item.qty ? "done" : picked > item.qty ? "over" : "";
      return `
        <li class="${done}">
          <img src="${product.image}" alt="" />
          <span><strong>${product.name}</strong><small>${product.unit} · ${product.category} / ${product.subcategory || product.category}</small></span>
          <b>${picked}/${item.qty}</b>
        </li>
      `;
    })
    .join("");
  const basket = order.products.length
    ? Object.entries(counts)
        .map(([productId, qty]) => {
          const product = catalog.find((item) => item.id === productId);
          return `<button class="basket-chip" type="button" data-remove-product="${product.id}">${qty}x ${product.name}</button>`;
        })
        .join("")
    : '<span class="item-meta">Sepet boş. Fişteki ürünleri raflardan seç.</span>';
  const actionText =
    order.status === "ready"
      ? "Yola çıkar"
      : order.status === "preparing"
        ? "Hazırlanıyor"
        : order.status === "delivering"
          ? "Kurye yolda"
          : ticketMatchesBasket(order)
            ? "Fişi hazırla"
            : "Fişi tamamla";

  els.orderPageTitle.textContent = `${order.id} · ${order.street}`;
  els.orderPageMeta.textContent = `${order.district || state.region.name} · Tahsilat: ₺${order.value}`;
  els.ticketList.innerHTML = ticket;
  const pickedCount = order.requestedItems.filter((item) => counts[item.productId] === item.qty).length;
  els.ticketProgress.textContent = `${pickedCount}/${order.requestedItems.length}`;
  els.basketValue.textContent = `₺${order.value}`;
  els.basketList.innerHTML = basket;
  els.orderPageMessage.textContent = state.editorMessage;
  els.prepareOrder.textContent = actionText;

  for (const chip of els.basketList.querySelectorAll("[data-remove-product]")) {
    chip.addEventListener("click", () => removeProduct(order.id, chip.dataset.removeProduct));
  }

  els.categoryTabs.innerHTML = "";
  const tabs = els.categoryTabs;
  for (const category of categories) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category;
    button.className = category === state.selectedCategory ? "active" : "";
    button.addEventListener("click", () => {
      state.selectedCategory = category;
      state.selectedSubcategory = subcategoriesFor(category)[0];
      state.editorRenderKey = "";
      renderOrderEditor();
    });
    tabs.appendChild(button);
  }

  els.subcategoryTabs.innerHTML = "";
  const subtabs = els.subcategoryTabs;
  for (const subcategory of subcategoriesFor(state.selectedCategory)) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = subcategory;
    button.className = subcategory === state.selectedSubcategory ? "active" : "";
    button.addEventListener("click", () => {
      state.selectedSubcategory = subcategory;
      state.editorRenderKey = "";
      renderOrderEditor();
    });
    subtabs.appendChild(button);
  }

  els.productGrid.innerHTML = "";
  const grid = els.productGrid;
  for (const product of catalog.filter((item) => item.category === state.selectedCategory && (item.subcategory || item.category) === state.selectedSubcategory)) {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<img src="${product.image}" alt="" /><strong>${product.name}</strong><span>${product.unit} · ₺${product.price}</span>`;
    button.disabled = order.status !== "queued";
    button.addEventListener("click", () => addProduct(order.id, product.id));
    grid.appendChild(button);
  }
  renderSearchResults();

  els.prepareOrder.disabled = order.status === "preparing" || order.status === "delivering";
  els.prepareOrder.onclick = () => {
    if (order.status === "ready") dispatchOrder(order.id);
    else startPreparing(order.id);
  };
}

function renderCourierDetails() {
  const courier = state.couriers.find((item) => item.id === state.selectedCourierId);
  if (!courier) {
    els.courierState.textContent = "Seçilmedi";
    els.courierDetails.className = "details empty-state";
    els.courierDetails.textContent = "Haritadaki kuryeye tıkla.";
    return;
  }
  els.courierState.textContent = courierStatus(courier);
  els.courierDetails.className = "details";
  const order = state.orders.find((item) => item.id === courier.orderId);
  const routeName = courier.routeNames.length ? courier.routeNames.join(" → ") : "-";
  const routeMode = courier.routeMode === "relaxed" ? "Moto esnek rota" : courier.routeMode === "driving" ? "Araç rotası" : "-";
  els.courierDetails.innerHTML = `
    <div class="details-card">
      <div class="courier-swatch" style="--courier-color:${courier.color}"><span></span>${courier.name} rota rengi</div>
      <div class="detail-row"><span class="label">Ad</span><strong>${courier.name}</strong></div>
      <div class="detail-row"><span class="label">Durum</span><strong>${courierStatus(courier)}</strong></div>
      <div class="detail-row"><span class="label">Hız</span><strong>${Math.round(courier.speed * 3.6)} km/sa</strong></div>
      <div class="detail-row"><span class="label">Aktif sipariş</span><strong>${order ? `${order.id} · ${order.street}` : "-"}</strong></div>
      <div class="detail-row"><span class="label">Rota tipi</span><strong>${routeMode}</strong></div>
      <div class="detail-row"><span class="label">Rota</span><strong>${routeName}</strong></div>
      <div class="detail-row"><span class="label">ETA</span><strong>${courier.eta ? `${courier.eta}s` : "-"}</strong></div>
      <div class="detail-row"><span class="label">Teslimat</span><strong>${courier.completed}</strong></div>
      <div class="detail-row"><span class="label">Kazanç</span><strong>₺${courier.earnings}</strong></div>
    </div>
  `;
}

function courierStatus(courier) {
  if (courier.status === "idle") return "Boşta";
  if (courier.status === "routing") return "Rota alınıyor";
  if (courier.status === "delivering") return "Teslimatta";
  if (courier.status === "returning") return "Depoya dönüyor";
  return courier.status;
}

els.startGame.addEventListener("click", startGame);
els.pauseGame.addEventListener("click", () => {
  if (!state.running) return;
  state.paused = !state.paused;
  state.prevTime = null;
  els.pauseGame.textContent = state.paused ? "Devam" : "Duraklat";
});
els.closeOrderPage.addEventListener("click", closeOrderPage);
els.orderOverlay.addEventListener("click", (event) => {
  if (event.target === els.orderOverlay) closeOrderPage();
});
els.productSearch.addEventListener("input", renderSearchResults);
els.productSearch.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.stopPropagation();
    els.productSearch.value = "";
    els.searchResults.hidden = true;
    els.searchResults.innerHTML = "";
  }
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !els.orderOverlay.hidden) closeOrderPage();
});

requestAnimationFrame(tick);
startGame();

function refreshMapSize() {
  requestAnimationFrame(() => {
    map.invalidateSize();
    setTimeout(() => map.invalidateSize(), 120);
    setTimeout(() => map.invalidateSize(), 450);
  });
}

window.addEventListener("resize", refreshMapSize);

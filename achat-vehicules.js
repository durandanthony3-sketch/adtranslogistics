const contactPhone = "2290197500555";

const vehicles = [
  {
    id: "hyundai-santafe-2015",
    ref: "ADTL-SF-2015",
    title: "Hyundai Santa Fe",
    category: "SUV",
    image: "assets/whatsapp/hyundai-santafe-2015-gallery-1.jpg",
    gallery: [
      "assets/whatsapp/hyundai-santafe-2015-gallery-1.jpg",
      "assets/whatsapp/hyundai-santafe-2015-gallery-2.jpg",
      "assets/whatsapp/hyundai-santafe-2015-gallery-3.jpg",
      "assets/whatsapp/hyundai-santafe-2015-gallery-4.jpg",
      "assets/whatsapp/hyundai-santafe-2015-gallery-5.jpg",
    ],
    price: 4800000,
    year: 2015,
    yearLabel: "2015-2016",
    mileage: null,
    fuel: "A confirmer",
    transmission: "A confirmer",
    seats: "A confirmer",
    origin: "Stock fournisseur",
    status: "Disponible",
    delivery: "Livraison et disponibilite a confirmer dans le devis final.",
    tags: ["SUV", "Prix recu", "Photos disponibles"],
    highlights: [
      "Annonce recue avec photos exterieures et interieures",
      "Prix communique : 4.800.000 FCFA",
      "Reference boutique prete pour demande de devis",
    ],
  },
  {
    id: "mercedes-gle-350-2016",
    ref: "ADTL-GLE-2016",
    title: "Mercedes GLE 350 4MATIC",
    category: "SUV",
    image: "assets/whatsapp/mercedes-gle-350-2016-gallery-1.jpg",
    gallery: [
      "assets/whatsapp/mercedes-gle-350-2016-gallery-1.jpg",
      "assets/whatsapp/mercedes-gle-350-2016-gallery-2.jpg",
      "assets/whatsapp/mercedes-gle-350-2016-gallery-3.jpg",
      "assets/whatsapp/mercedes-gle-350-2016-gallery-4.jpg",
      "assets/whatsapp/mercedes-gle-350-2016-gallery-5.jpg",
    ],
    price: 9500000,
    year: 2016,
    mileage: null,
    fuel: "A confirmer",
    transmission: "A confirmer",
    seats: "A confirmer",
    origin: "Stock fournisseur",
    status: "Disponible",
    delivery: "Livraison et disponibilite a confirmer dans le devis final.",
    tags: ["4MATIC", "Radar", "LED"],
    highlights: [
      "5 cameras, radar et feux LED indiques dans l'annonce",
      "Configuration 4MATIC, version Amerique",
      "Prix communique : 9.500.000 FCFA",
    ],
  },
  {
    id: "mercedes-glb-250-2024",
    ref: "ADTL-GLB-2024",
    title: "Mercedes GLB 250",
    category: "SUV",
    image: "assets/whatsapp/mercedes-glb-250-2024-gallery-1.jpg",
    gallery: [
      "assets/whatsapp/mercedes-glb-250-2024-gallery-1.jpg",
      "assets/whatsapp/mercedes-glb-250-2024-gallery-2.jpg",
      "assets/whatsapp/mercedes-glb-250-2024-gallery-3.jpg",
      "assets/whatsapp/mercedes-glb-250-2024-gallery-4.jpg",
      "assets/whatsapp/mercedes-glb-250-2024-gallery-5.jpg",
    ],
    price: 16500000,
    year: 2024,
    mileage: null,
    fuel: "A confirmer",
    transmission: "A confirmer",
    seats: "A confirmer",
    origin: "Stock fournisseur",
    status: "Disponible",
    delivery: "Livraison et disponibilite a confirmer dans le devis final.",
    tags: ["Full options", "2024", "Premium"],
    highlights: [
      "Modele 2024 indique full options",
      "Photos interieures disponibles pour verification",
      "Prix communique : 16.500.000 FCFA",
    ],
  },
  {
    id: "kia-sportage-2017",
    ref: "ADTL-KIA-2017",
    title: "Kia Sportage",
    category: "SUV",
    image: "assets/whatsapp/kia-sportage-2017-gallery-1.jpg",
    gallery: [
      "assets/whatsapp/kia-sportage-2017-gallery-1.jpg",
      "assets/whatsapp/kia-sportage-2017-gallery-2.jpg",
      "assets/whatsapp/kia-sportage-2017-gallery-3.jpg",
      "assets/whatsapp/kia-sportage-2017-gallery-4.jpg",
      "assets/whatsapp/kia-sportage-2017-gallery-5.jpg",
    ],
    price: 5500000,
    year: 2017,
    mileage: null,
    fuel: "A confirmer",
    transmission: "A confirmer",
    seats: "A confirmer",
    origin: "Stock fournisseur",
    status: "Disponible",
    delivery: "Livraison et disponibilite a confirmer dans le devis final.",
    tags: ["SUV", "Cle", "2017"],
    highlights: [
      "Annonce recue avec mention de la cle",
      "Photo moteur et plaque technique disponibles",
      "Prix communique : 5.500.000 FCFA",
    ],
  },
  {
    id: "toyota-landcruiser-2024",
    ref: "ADTL-LC-2024",
    title: "Toyota Landcruiser",
    category: "4x4",
    image: "assets/whatsapp/toyota-landcruiser-2024-gallery-1.jpg",
    gallery: [
      "assets/whatsapp/toyota-landcruiser-2024-gallery-1.jpg",
      "assets/whatsapp/toyota-landcruiser-2024-gallery-2.jpg",
      "assets/whatsapp/toyota-landcruiser-2024-gallery-3.jpg",
      "assets/whatsapp/toyota-landcruiser-2024-gallery-4.jpg",
      "assets/whatsapp/toyota-landcruiser-2024-gallery-5.jpg",
    ],
    price: 92000000,
    year: 2024,
    yearLabel: "2024-2025",
    mileage: null,
    fuel: "A confirmer",
    transmission: "A confirmer",
    seats: "A confirmer",
    origin: "Stock fournisseur",
    status: "Disponible",
    delivery: "Livraison et disponibilite a confirmer dans le devis final.",
    tags: ["4x4", "2024-2025", "Premium"],
    highlights: [
      "Modele annonce 2024-2025",
      "Photos interieures et exterieures disponibles",
      "Prix communique : 92.000.000 FCFA",
    ],
  },
  {
    id: "mercedes-gwagon-2022",
    ref: "ADTL-GW-2022",
    title: "Mercedes G-WAGON",
    category: "Premium",
    image: "assets/whatsapp/mercedes-gwagon-2022-gallery-1.jpg",
    gallery: [
      "assets/whatsapp/mercedes-gwagon-2022-gallery-1.jpg",
      "assets/whatsapp/mercedes-gwagon-2022-gallery-2.jpg",
      "assets/whatsapp/mercedes-gwagon-2022-gallery-3.jpg",
      "assets/whatsapp/mercedes-gwagon-2022-gallery-4.jpg",
      "assets/whatsapp/mercedes-gwagon-2022-gallery-5.jpg",
    ],
    price: 85000000,
    year: 2022,
    mileage: null,
    fuel: "A confirmer",
    transmission: "A confirmer",
    seats: "A confirmer",
    origin: "Stock fournisseur",
    status: "Disponible",
    delivery: "Livraison et disponibilite a confirmer dans le devis final.",
    tags: ["Premium", "4x4", "2022"],
    highlights: [
      "Modele prestige annonce annee 2022",
      "Photos exterieures disponibles pour presentation",
      "Prix communique : 85.000.000 FCFA",
    ],
  },
  {
    id: "hyundai-santafe-2022",
    ref: "ADTL-SF-2022",
    title: "Hyundai Santa Fe",
    category: "SUV",
    image: "assets/whatsapp/hyundai-santafe-2022-gallery-1.jpg",
    gallery: [
      "assets/whatsapp/hyundai-santafe-2022-gallery-1.jpg",
      "assets/whatsapp/hyundai-santafe-2022-gallery-2.jpg",
      "assets/whatsapp/hyundai-santafe-2022-gallery-3.jpg",
      "assets/whatsapp/hyundai-santafe-2022-gallery-4.jpg",
      "assets/whatsapp/hyundai-santafe-2022-gallery-5.jpg",
    ],
    price: 11700000,
    year: 2022,
    fuel: "A confirmer",
    transmission: "A confirmer",
    seats: "A confirmer",
    origin: "Stock fournisseur",
    status: "Disponible",
    delivery: "Livraison et disponibilite a confirmer dans le devis final.",
    tags: ["Full options", "Elegance", "2022"],
    highlights: [
      "Annonce recue le 30/04/2026 avec album photos",
      "Version indiquee full options Elegance",
      "Prix communique : 11.700.000 FCFA",
    ],
  },
  {
    id: "mercedes-c300-2011",
    ref: "ADTL-C300-2011",
    title: "Mercedes C-300",
    category: "Berline",
    image: "assets/whatsapp/mercedes-c300-2011-gallery-1.jpg",
    gallery: [
      "assets/whatsapp/mercedes-c300-2011-gallery-1.jpg",
      "assets/whatsapp/mercedes-c300-2011-gallery-2.jpg",
      "assets/whatsapp/mercedes-c300-2011-gallery-3.jpg",
      "assets/whatsapp/mercedes-c300-2011-gallery-4.jpg",
      "assets/whatsapp/mercedes-c300-2011-gallery-5.jpg",
    ],
    price: 3800000,
    year: 2011,
    fuel: "A confirmer",
    transmission: "A confirmer",
    seats: "A confirmer",
    origin: "Stock fournisseur",
    status: "Disponible",
    delivery: "Livraison et disponibilite a confirmer dans le devis final.",
    tags: ["Toit ouvrant", "Berline", "Prix recu"],
    highlights: [
      "Mercedes C-300 annoncee avec toit ouvrant",
      "Photo issue de l'album WhatsApp du 30/04/2026",
      "Prix communique : 3.800.000 FCFA",
    ],
  },
  {
    id: "mercedes-e400-2017",
    ref: "ADTL-E400-2017",
    title: "Mercedes Benz E400",
    category: "Berline",
    image: "assets/whatsapp/mercedes-e400-2017-gallery-1.jpg",
    gallery: [
      "assets/whatsapp/mercedes-e400-2017-gallery-1.jpg",
      "assets/whatsapp/mercedes-e400-2017-gallery-2.jpg",
      "assets/whatsapp/mercedes-e400-2017-gallery-3.jpg",
      "assets/whatsapp/mercedes-e400-2017-gallery-4.jpg",
      "assets/whatsapp/mercedes-e400-2017-gallery-5.jpg",
    ],
    price: null,
    year: 2017,
    fuel: "A confirmer",
    transmission: "A confirmer",
    seats: "A confirmer",
    origin: "Reference fournisseur",
    status: "Prix a confirmer",
    delivery: "Prix, disponibilite et livraison a confirmer avant reservation.",
    tags: ["2017", "Prix a confirmer", "Photos recues"],
    highlights: [
      "Reference Mercedes Benz E400 2017 recue du fournisseur",
      "Photos visibles dans le bloc transfere du 30/04/2026",
      "Prix fournisseur non visible dans les messages consultables",
    ],
  },
  {
    id: "mercedes-ml350-2014",
    ref: "ADTL-ML350-2014",
    title: "Mercedes Benz ML350",
    category: "SUV",
    image: "assets/whatsapp/mercedes-ml350-2014-gallery-1.jpg",
    gallery: [
      "assets/whatsapp/mercedes-ml350-2014-gallery-1.jpg",
      "assets/whatsapp/mercedes-ml350-2014-gallery-2.jpg",
      "assets/whatsapp/mercedes-ml350-2014-gallery-3.jpg",
      "assets/whatsapp/mercedes-ml350-2014-gallery-4.jpg",
      "assets/whatsapp/mercedes-ml350-2014-gallery-5.jpg",
    ],
    price: 7500000,
    year: 2014,
    fuel: "A confirmer",
    transmission: "A confirmer",
    seats: "A confirmer",
    origin: "Stock fournisseur",
    status: "Disponible",
    delivery: "Livraison et disponibilite a confirmer dans le devis final.",
    tags: ["Keyless", "SUV", "Photos recues"],
    highlights: [
      "Annonce recue le 19/04/2026 avec album photos",
      "Option keyless indiquee dans le message",
      "Prix communique : 7.500.000 FCFA",
    ],
  },
  {
    id: "hyundai-kona-2024",
    ref: "ADTL-KONA-2024",
    title: "Hyundai Kona",
    category: "SUV",
    image: "assets/whatsapp/hyundai-kona-2024-gallery-1.jpg",
    gallery: [
      "assets/whatsapp/hyundai-kona-2024-gallery-1.jpg",
      "assets/whatsapp/hyundai-kona-2024-gallery-2.jpg",
      "assets/whatsapp/hyundai-kona-2024-gallery-3.jpg",
      "assets/whatsapp/hyundai-kona-2024-gallery-4.jpg",
      "assets/whatsapp/hyundai-kona-2024-gallery-5.jpg",
    ],
    price: 14000000,
    year: 2024,
    fuel: "A confirmer",
    transmission: "A confirmer",
    seats: "A confirmer",
    origin: "Stock fournisseur",
    status: "Disponible",
    delivery: "Livraison et disponibilite a confirmer dans le devis final.",
    tags: ["Full options", "2024", "SUV"],
    highlights: [
      "Hyundai Kona 2024 indique full options",
      "Photo exterieure issue de l'album WhatsApp",
      "Prix communique : 14.000.000 FCFA",
    ],
  },
  {
    id: "howo-sinotruck-10r",
    ref: "ADTL-HOWO-10R",
    title: "Howo Sinotruck 10 roues",
    category: "Camion",
    image: "assets/whatsapp/howo-sinotruck-10r-gallery-1.jpg",
    gallery: [
      "assets/whatsapp/howo-sinotruck-10r-gallery-1.jpg",
      "assets/whatsapp/howo-sinotruck-10r-gallery-2.jpg",
      "assets/whatsapp/howo-sinotruck-10r-gallery-3.jpg",
      "assets/whatsapp/howo-sinotruck-10r-gallery-4.jpg",
      "assets/whatsapp/howo-sinotruck-10r-gallery-5.jpg",
    ],
    price: 23000000,
    year: 0,
    yearLabel: "A confirmer",
    fuel: "A confirmer",
    transmission: "A confirmer",
    seats: "A confirmer",
    origin: "Stock fournisseur",
    status: "Disponible",
    delivery: "Livraison et disponibilite a confirmer dans le devis final.",
    tags: ["Camion", "10 roues", "Howo"],
    highlights: [
      "Camion Howo Sinotruck 10 roues",
      "Photos exterieures fournies avec l'annonce",
      "Prix communique : 23.000.000 FCFA",
    ],
  },
  {
    id: "bmw-x3-2012",
    ref: "ADTL-BMW-X3-2012",
    title: "BMW X3",
    category: "SUV",
    image: "assets/whatsapp/bmw-x3-2012-gallery-1.jpg",
    gallery: [
      "assets/whatsapp/bmw-x3-2012-gallery-1.jpg",
      "assets/whatsapp/bmw-x3-2012-gallery-2.jpg",
      "assets/whatsapp/bmw-x3-2012-gallery-3.jpg",
      "assets/whatsapp/bmw-x3-2012-gallery-4.jpg",
      "assets/whatsapp/bmw-x3-2012-gallery-5.jpg",
    ],
    price: 4200000,
    year: 2012,
    fuel: "Essence",
    transmission: "Boite automatique",
    seats: "A confirmer",
    origin: "Stock fournisseur",
    status: "Disponible",
    delivery: "Livraison et disponibilite a confirmer dans le devis final.",
    tags: ["Essence", "Automatique", "Cuir"],
    highlights: [
      "Papier a jour indique dans le message",
      "Climatisation au top et interieur cuir",
      "Prix communique : 4.200.000 FCFA",
    ],
  },
];

const youxinpaiDataset = "/assets/data/youxinpai-selection-20260924.json?v=galeries18";
const adtlVehicles = vehicles.slice();
let youxinpaiLoading = false;

function readSelection() {
  try {
    const saved = JSON.parse(localStorage.getItem("adtl-auto-boutique-selection") || "[]");
    return new Set(Array.isArray(saved) ? saved.filter((id) => typeof id === "string" && /^[a-z0-9-]{1,80}$/.test(id)).slice(0, 200) : []);
  } catch (_) { return new Set(); }
}

const state = { category: "all", search: "", budget: "all", fuel: "all", source: "all", sort: "recommended", selection: readSelection() };
const vehicleGrid = document.querySelector("#vehicleGrid");
const resultCount = document.querySelector("#resultCount");
const searchInput = document.querySelector("#searchInput");
const budgetSelect = document.querySelector("#budgetSelect");
const fuelSelect = document.querySelector("#fuelSelect");
const sourceSelect = document.querySelector("#sourceSelect");
const sortSelect = document.querySelector("#sortSelect");
const segments = [...document.querySelectorAll(".segment")];
const selectionList = document.querySelector("#selectionList");
const selectionTotal = document.querySelector("#selectionTotal");
const selectionBadge = document.querySelector("#selectionBadge");
const clearSelection = document.querySelector("#clearSelection");
const selectionRequest = document.querySelector("#selectionRequest");
const vehicleDialog = document.querySelector("#vehicleDialog");
const dialogContent = document.querySelector("#dialogContent");
const closeDialog = document.querySelector("#closeDialog");
const leadForm = document.querySelector("#leadForm");
const openSelectionTop = document.querySelector("#openSelectionTop");
const quickLinks = [...document.querySelectorAll("[data-quick]")];
const heroSearch = document.querySelector(".hero-search");
const inventoryTable = document.querySelector("#inventoryTable");
const inventoryCount = document.querySelector("#inventoryCount");
const inventoryRefs = document.querySelector("#inventoryRefs");
const inventoryValue = document.querySelector("#inventoryValue");
const youxinpaiLoadStatus = document.querySelector("#youxinpaiLoadStatus");
const retryYouxinpai = document.querySelector("#retryYouxinpai");

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}
function cleanText(value, max = 160) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";
}
function searchable(value) { return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function isYouxinpai(vehicle) { return vehicle.source === "youxinpai"; }
function formatPrice(value) {
  return Number.isFinite(value) ? `${new Intl.NumberFormat("fr-FR").format(value)} FCFA` : "Sur devis";
}
function formatMileage(value) {
  return Number.isFinite(value) ? `${new Intl.NumberFormat("fr-FR").format(value)} km` : "À confirmer";
}
function displayYear(vehicle) { return vehicle.yearLabel || vehicle.year || "À confirmer"; }
function yearCaption(vehicle) { return isYouxinpai(vehicle) ? "Date annoncée" : "Année"; }
function conditionMarkup(vehicle) {
  return vehicle.conditionNote ? `<p class="vehicle-condition-note"><strong>État signalé par Youxinpai</strong>${escapeHTML(vehicle.conditionNote)}</p>` : "";
}
function galleryFor(vehicle) { return vehicle.gallery?.length ? vehicle.gallery : [vehicle.image]; }
const galleryPositions = new Map();
function galleryMarkup(vehicle, context) {
  const gallery = galleryFor(vehicle), dialog = context === "dialog";
  const key = `${context}-${vehicle.id}`, trackId = `photos-${key}`;
  const title = escapeHTML(vehicle.title);
  return `<div class="photo-gallery photo-gallery--${context}" data-gallery-key="${escapeHTML(key)}">
    <div class="photo-gallery-viewport">
      <div class="${dialog ? "dialog" : "vehicle"}-photo-track" id="${escapeHTML(trackId)}" data-gallery-track tabindex="0" role="region" aria-label="Photos de ${title}. Utilisez les flèches gauche et droite pour changer de photo.">
        ${gallery.map((image, index) => `<img src="${escapeHTML(image)}" alt="${title} — photo ${index + 1} sur ${gallery.length}" loading="lazy" draggable="false" />`).join("")}
      </div>
      ${gallery.length > 1 ? `<button class="gallery-arrow gallery-arrow--previous" type="button" data-gallery-step="-1" aria-controls="${escapeHTML(trackId)}" aria-label="Photo précédente de ${title}" disabled><span aria-hidden="true">‹</span></button><button class="gallery-arrow gallery-arrow--next" type="button" data-gallery-step="1" aria-controls="${escapeHTML(trackId)}" aria-label="Photo suivante de ${title}"><span aria-hidden="true">›</span></button>` : ""}
      <span class="${dialog ? "gallery-photo-count" : "vehicle-photo-count"}" data-gallery-count aria-live="polite" aria-atomic="true">1 / ${gallery.length}</span>
    </div>
    ${dialog && gallery.length > 1 ? `<div class="dialog-gallery" aria-label="Choisir une photo de ${title}">${gallery.map((image, index) => `<button class="gallery-thumbnail" type="button" data-gallery-index="${index}" aria-controls="${escapeHTML(trackId)}" aria-label="Afficher la photo ${index + 1} de ${title}" aria-current="${index === 0 ? "true" : "false"}"><img src="${escapeHTML(image)}" alt="" loading="lazy" draggable="false" /></button>`).join("")}</div>` : ""}
  </div>`;
}
function bindGalleries(root) {
  root.querySelectorAll(".photo-gallery").forEach((gallery) => {
    const track = gallery.querySelector("[data-gallery-track]");
    const count = track.children.length, key = gallery.dataset.galleryKey;
    const previous = gallery.querySelector('[data-gallery-step="-1"]');
    const next = gallery.querySelector('[data-gallery-step="1"]');
    const counter = gallery.querySelector("[data-gallery-count]");
    const thumbnails = [...gallery.querySelectorAll("[data-gallery-index]")];
    const bounded = (index) => Math.max(0, Math.min(count - 1, index));
    const sync = (index) => {
      const current = bounded(index);
      galleryPositions.set(key, current);
      if (previous) previous.disabled = current === 0;
      if (next) next.disabled = current === count - 1;
      counter.textContent = `${current + 1} / ${count}`;
      counter.setAttribute("aria-label", `Photo ${current + 1} sur ${count}`);
      thumbnails.forEach((button, number) => button.setAttribute("aria-current", number === current ? "true" : "false"));
    };
    const go = (index) => {
      const current = bounded(index);
      track.scrollTo({ left: current * track.clientWidth, behavior: "auto" });
      sync(current);
    };
    gallery.addEventListener("click", (event) => {
      const button = event.target.closest("[data-gallery-step], [data-gallery-index]");
      if (!button || !gallery.contains(button)) return;
      if (button.hasAttribute("data-gallery-index")) go(Number(button.dataset.galleryIndex));
      else go((galleryPositions.get(key) || 0) + Number(button.dataset.galleryStep));
    });
    track.addEventListener("keydown", (event) => {
      const current = galleryPositions.get(key) || 0;
      const targets = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: count - 1 };
      if (!(event.key in targets)) return;
      event.preventDefault();
      go(targets[event.key]);
    });
    track.addEventListener("scroll", () => {
      if (track.clientWidth) sync(Math.round(track.scrollLeft / track.clientWidth));
    }, { passive: true });
    go(galleryPositions.get(key) || 0);
  });
}
function requestLink(message) {
  return `https://wa.me/${contactPhone}?text=${encodeURIComponent(message)}`;
}
function vehicleQuoteLink(vehicle) {
  return isYouxinpai(vehicle) ? `/demande?service=vehicule-chine&vehicle=${encodeURIComponent(vehicle.sourceId)}` : requestLink(vehicleRequestText(vehicle));
}
function selectedVehicles() { return vehicles.filter((vehicle) => state.selection.has(vehicle.id)); }
function pendingSelectionIds() {
  const loaded = new Set(vehicles.map((vehicle) => vehicle.id));
  return [...state.selection].filter((id) => !loaded.has(id));
}
function saveSelection() {
  try { localStorage.setItem("adtl-auto-boutique-selection", JSON.stringify([...state.selection])); } catch (_) { /* Selection remains available for this visit. */ }
}
function quoteSummary(list, pending = 0) {
  if (!list.length && !pending) return "Aucune sélection";
  const known = list.filter((vehicle) => Number.isFinite(vehicle.price));
  const quotes = list.length - known.length;
  const parts = [];
  if (known.length) parts.push(formatPrice(known.reduce((sum, vehicle) => sum + vehicle.price, 0)));
  if (quotes) parts.push(known.length ? `${quotes} sur devis` : "Sur devis");
  if (pending) parts.push(`${pending} référence${pending > 1 ? "s" : ""} à confirmer`);
  return parts.join(" + ");
}
function matchesBudget(vehicle) {
  if (state.budget === "quote") return !Number.isFinite(vehicle.price);
  if (!Number.isFinite(vehicle.price)) return state.budget === "all";
  if (state.budget === "under-10") return vehicle.price < 10000000;
  if (state.budget === "10-18") return vehicle.price >= 10000000 && vehicle.price <= 18000000;
  if (state.budget === "18-30") return vehicle.price > 18000000 && vehicle.price <= 30000000;
  if (state.budget === "premium") return vehicle.price > 30000000;
  return true;
}
function filteredVehicles() {
  const query = searchable(state.search);
  return vehicles.filter((vehicle) => {
    const text = searchable([vehicle.ref, vehicle.title, vehicle.category, vehicle.status, vehicle.fuel, vehicle.origin, displayYear(vehicle), vehicle.transmission, ...vehicle.tags, ...vehicle.highlights].join(" "));
    return (state.category === "all" || vehicle.category === state.category) &&
      (state.fuel === "all" || searchable(vehicle.fuel) === searchable(state.fuel)) &&
      (state.source === "all" || (isYouxinpai(vehicle) ? "youxinpai" : "adtl") === state.source) && matchesBudget(vehicle) && text.includes(query);
  }).sort((a, b) => {
    if (state.sort === "price-asc" || state.sort === "price-desc") {
      const knownA = Number.isFinite(a.price), knownB = Number.isFinite(b.price);
      if (knownA !== knownB) return knownA ? -1 : 1;
      if (knownA) return state.sort === "price-asc" ? a.price - b.price : b.price - a.price;
    }
    if (state.sort === "mileage-asc") return (Number.isFinite(a.mileage) ? a.mileage : Infinity) - (Number.isFinite(b.mileage) ? b.mileage : Infinity) || 0;
    if (state.sort === "year-desc") return (b.sortYear || b.year || 0) - (a.sortYear || a.year || 0);
    return vehicles.indexOf(a) - vehicles.indexOf(b);
  });
}
function normalizeYouxinpaiRecord(raw, verifiedAt) {
  if (!raw || typeof raw !== "object") return null;
  const id = typeof raw.id === "string" ? raw.id : "";
  const brand = cleanText(raw.brand, 60), title = cleanText(raw.title, 140);
  if (!/^\d{1,20}$/.test(id) || !brand || !title) return null;
  const imagePattern = new RegExp(`^/assets/youxinpai/${id}(?:-1)?\\.(?:webp|jpe?g)$`);
  if (typeof raw.image !== "string" || !imagePattern.test(raw.image)) return null;
  const galleryPattern = new RegExp(`^/assets/youxinpai/${id}-([1-4])\\.(?:webp|jpe?g)$`);
  const galleryNumbers = Array.isArray(raw.gallery) ? raw.gallery.map((path) => typeof path === "string" ? galleryPattern.exec(path)?.[1] : null) : [];
  const gallery = galleryNumbers.length === 4 && galleryNumbers.every(Boolean) && new Set(galleryNumbers).size === 4 ? raw.gallery.slice() : [raw.image];
  let source;
  try {
    source = new URL(raw.sourceUrl);
    if (source.protocol !== "https:" || !["youxinpai.cn", "www.youxinpai.cn"].includes(source.hostname) || source.username || source.password || source.port) return null;
  } catch (_) { return null; }
  const date = typeof raw.registrationDate === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(raw.registrationDate) ? raw.registrationDate : "";
  const category = ["SUV", "4x4", "Berline", "Camion", "Premium"].includes(raw.category) ? raw.category : "Autre";
  const fuel = ["Essence", "Diesel", "Hybride", "Électrique"].includes(raw.fuel) ? raw.fuel : "À confirmer";
  return {
    id: `youxinpai-${id}`, sourceId: id, source: "youxinpai", sourceUrl: source.href,
    ref: `Youxinpai ${id}`, title: `${brand} ${title}`, category, image: raw.image, gallery, conditionNote: cleanText(raw.conditionNote, 450),
    price: null, year: null, sortYear: date ? Number(date.slice(0, 4)) : 0, yearLabel: date ? `${date.slice(5)}/${date.slice(0, 4)}` : "À confirmer",
    mileage: Number.isSafeInteger(raw.mileageKm) && raw.mileageKm >= 0 && raw.mileageKm <= 2000000 ? raw.mileageKm : null,
    fuel, transmission: cleanText(raw.transmission, 60) || "À confirmer", seats: "À confirmer", origin: "Chine · Youxinpai", status: "En Chine · À confirmer",
    delivery: "Disponibilité à confirmer auprès de Youxinpai. Prix livré au Bénin sur devis ADTL : achat, transport et dédouanement à préciser avant engagement.",
    tags: ["Youxinpai", "Chine", "Sur devis"],
    highlights: ["Annonce Youxinpai : véhicule situé en Chine, disponibilité à confirmer.", "Date et kilométrage annoncés par la plateforme, à vérifier avec le dossier du véhicule.", `Sélection consultée le ${verifiedAt}. Prix livré au Bénin établi sur devis.`],
  };
}
async function loadYouxinpai() {
  if (youxinpaiLoading) return;
  youxinpaiLoading = true;
  if (youxinpaiLoadStatus) youxinpaiLoadStatus.textContent = "Chargement de la sélection Youxinpai…";
  if (retryYouxinpai) { retryYouxinpai.hidden = true; retryYouxinpai.disabled = true; }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(youxinpaiDataset, { credentials: "same-origin", signal: controller.signal });
    if (!response.ok) throw new Error("Catalogue indisponible");
    const data = await response.json();
    if (!data || !Array.isArray(data.vehicles) || !data.vehicles.length || data.vehicles.length > 200) throw new Error("Catalogue invalide");
    const verified = /^\d{4}-\d{2}-\d{2}$/.test(data.verifiedAt || "") ? data.verifiedAt.split("-").reverse().join("/") : "la date indiquée sur la plateforme";
    const ids = new Set();
    const loaded = data.vehicles.map((raw) => normalizeYouxinpaiRecord(raw, verified)).filter((vehicle) => {
      if (!vehicle || ids.has(vehicle.id)) return false;
      ids.add(vehicle.id); return true;
    });
    if (!loaded.length) throw new Error("Catalogue invalide");
    vehicles.splice(0, vehicles.length, ...loaded, ...adtlVehicles);
    if (youxinpaiLoadStatus) youxinpaiLoadStatus.textContent = `${loaded.length} annonces Youxinpai · Sélection du ${verified} · Disponibilité et prix livré au Bénin à confirmer sur devis.${loaded.length !== data.vehicles.length ? " Certaines annonces n’ont pas pu être chargées." : ""}`;
    if (retryYouxinpai) retryYouxinpai.hidden = loaded.length === data.vehicles.length;
  } catch (_) {
    if (youxinpaiLoadStatus) youxinpaiLoadStatus.textContent = "La sélection Youxinpai n’a pas pu être chargée. Les autres véhicules restent consultables. Réessayez pour afficher les annonces de Chine.";
    if (retryYouxinpai) retryYouxinpai.hidden = false;
  } finally {
    window.clearTimeout(timeout);
    youxinpaiLoading = false;
    if (retryYouxinpai) retryYouxinpai.disabled = false;
    renderAll();
  }
}
function vehicleRequestText(vehicle) {
  return ["Bonjour, je souhaite recevoir un devis pour ce véhicule :", `${vehicle.ref} - ${vehicle.title}`, `Prix indicatif : ${formatPrice(vehicle.price)}`, `${yearCaption(vehicle)} : ${displayYear(vehicle)}`, `Kilométrage${isYouxinpai(vehicle) ? " annoncé" : ""} : ${formatMileage(vehicle.mileage)}`, `Énergie : ${vehicle.fuel}`, "", "Merci de confirmer la disponibilité, les photos finales et les conditions de livraison."].join("\n");
}
function renderVehicles() {
  const list = filteredVehicles();
  resultCount.textContent = `${list.length} véhicule${list.length > 1 ? "s" : ""}`;
  if (!list.length) {
    vehicleGrid.innerHTML = '<div class="empty-state"><div><strong>Aucun véhicule trouvé</strong><p>Ajustez les filtres ou envoyez une demande de recherche personnalisée.</p></div></div>';
    return;
  }
  vehicleGrid.innerHTML = list.map((vehicle) => {
    const selected = state.selection.has(vehicle.id), china = isYouxinpai(vehicle);
    return `<article class="vehicle-card${china ? " youxinpai-card" : ""}">
      <div class="vehicle-media">${galleryMarkup(vehicle, "card")}
      <span class="vehicle-status">${escapeHTML(vehicle.status)}</span><span class="vehicle-ref">${escapeHTML(vehicle.ref)}</span></div>
      <div class="vehicle-body"><div><h3>${escapeHTML(vehicle.title)}</h3><div class="vehicle-meta">
        <span><i data-lucide="calendar" aria-hidden="true"></i>${china ? "Date annoncée : " : ""}${escapeHTML(displayYear(vehicle))}</span>
        <span><i data-lucide="gauge" aria-hidden="true"></i>${escapeHTML(formatMileage(vehicle.mileage))}${china ? " annoncés" : ""}</span>
        <span><i data-lucide="fuel" aria-hidden="true"></i>${escapeHTML(vehicle.fuel)}</span></div></div>
      <div class="vehicle-price"><strong>${escapeHTML(formatPrice(vehicle.price))}</strong><span>${china ? "livré au Bénin" : Number.isFinite(vehicle.price) ? "indicatif" : "prix à confirmer"}</span></div>
      <div class="tag-row">${vehicle.tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join("")}</div>
      ${conditionMarkup(vehicle)}
      <div class="card-actions"><button class="secondary-card" type="button" data-action="details" data-id="${escapeHTML(vehicle.id)}"><i data-lucide="eye" aria-hidden="true"></i>Détails</button>
        <button class="primary-card${selected ? " selected" : ""}" type="button" data-action="select" data-id="${escapeHTML(vehicle.id)}"><i data-lucide="${selected ? "check" : "plus"}" aria-hidden="true"></i>${selected ? "Retenu" : "Ajouter"}</button>
        ${china ? `<a class="quote-card-link secondary-card" href="${escapeHTML(vehicleQuoteLink(vehicle))}">Devis livré au Bénin <i data-lucide="arrow-up-right" aria-hidden="true"></i></a>` : ""}</div>
      </div></article>`;
  }).join("");
  bindGalleries(vehicleGrid);
}
function selectionMessage() {
  const list = selectedVehicles(), pending = pendingSelectionIds();
  if (!list.length && !pending.length) return "Bonjour, je souhaite recevoir une proposition pour un véhicule.";
  return ["Bonjour, je souhaite recevoir un devis pour ma sélection :", "", ...list.map((vehicle) => `- ${vehicle.ref} - ${vehicle.title} - ${formatPrice(vehicle.price)}${isYouxinpai(vehicle) ? " livré au Bénin, depuis la Chine" : ""}`), ...pending.map((id) => `- Référence à confirmer : ${id}`), "", `Montants indicatifs : ${quoteSummary(list, pending.length)}`, "Les véhicules sur devis et les références à confirmer ne sont pas inclus dans les montants chiffrés.", "Merci de confirmer les disponibilités, les photos finales et le coût livré au Bénin."].join("\n");
}
function renderSelection() {
  const list = selectedVehicles(), pending = pendingSelectionIds();
  selectionBadge.textContent = list.length + pending.length;
  selectionTotal.textContent = quoteSummary(list, pending.length);
  selectionRequest.href = requestLink(selectionMessage());
  selectionList.innerHTML = list.map((vehicle) => `<article class="selection-item"><img src="${escapeHTML(vehicle.image)}" alt="${escapeHTML(vehicle.title)}" /><div><strong>${escapeHTML(vehicle.title)}</strong><span>${escapeHTML(vehicle.ref)} - ${escapeHTML(formatPrice(vehicle.price))}</span></div><button class="mini-remove" type="button" data-remove="${escapeHTML(vehicle.id)}" title="Retirer ${escapeHTML(vehicle.title)}"><i data-lucide="x" aria-hidden="true"></i></button></article>`).join("") + pending.map((id) => `<article class="selection-item pending-selection"><div><strong>Référence à confirmer</strong><span>${escapeHTML(id)}</span><span>Chargement de l’annonce requis pour afficher ses détails.</span></div><button class="mini-remove" type="button" data-remove="${escapeHTML(id)}" title="Retirer la référence"><i data-lucide="x" aria-hidden="true"></i></button></article>`).join("");
  if (!list.length && !pending.length) selectionList.innerHTML = '<p class="section-note">Aucun véhicule retenu.</p>';
}
function renderInventory() {
  if (inventoryCount) inventoryCount.textContent = vehicles.length;
  if (inventoryRefs) inventoryRefs.textContent = vehicles.length;
  if (inventoryValue) inventoryValue.textContent = quoteSummary(vehicles);
  if (!inventoryTable) return;
  inventoryTable.innerHTML = vehicles.map((vehicle) => `<tr><td><div class="inventory-vehicle"><img src="${escapeHTML(vehicle.image)}" alt="${escapeHTML(vehicle.title)}" loading="lazy" /><span>${escapeHTML(vehicle.title)}</span></div></td><td>${escapeHTML(vehicle.ref)}</td><td>${isYouxinpai(vehicle) ? "Date annoncée : " : ""}${escapeHTML(displayYear(vehicle))}</td><td>${escapeHTML(vehicle.category)}</td><td><strong>${escapeHTML(formatPrice(vehicle.price))}</strong></td><td><span class="inventory-status">${escapeHTML(vehicle.status)}</span></td></tr>`).join("");
}
function renderAll() { renderVehicles(); renderSelection(); renderInventory(); if (window.lucide) window.lucide.createIcons(); }
function toggleSelection(id) {
  if (!vehicles.some((vehicle) => vehicle.id === id)) return;
  if (state.selection.has(id)) state.selection.delete(id); else state.selection.add(id);
  saveSelection(); renderAll();
}
function openDetails(id) {
  const vehicle = vehicles.find((item) => item.id === id);
  if (!vehicle) return;
  const china = isYouxinpai(vehicle), selected = state.selection.has(vehicle.id);
  dialogContent.innerHTML = `<div class="dialog-layout${china ? " youxinpai-dialog" : ""}"><div class="dialog-media">${galleryMarkup(vehicle, "dialog")}</div>
    <div class="dialog-body"><div><p class="eyebrow">${escapeHTML(vehicle.ref)}</p><h2 id="dialogTitle">${escapeHTML(vehicle.title)}</h2><div class="dialog-price">${escapeHTML(formatPrice(vehicle.price))}${china ? '<small class="quote-delivery-label">livré au Bénin</small>' : ""}</div></div>
      <div class="spec-grid"><article><span>${yearCaption(vehicle)}</span><strong>${escapeHTML(displayYear(vehicle))}</strong></article><article><span>Kilométrage${china ? " annoncé" : ""}</span><strong>${escapeHTML(formatMileage(vehicle.mileage))}</strong></article><article><span>Énergie</span><strong>${escapeHTML(vehicle.fuel)}</strong></article><article><span>Boîte</span><strong>${escapeHTML(vehicle.transmission)}</strong></article><article><span>Places</span><strong>${escapeHTML(vehicle.seats)}</strong></article><article><span>Origine</span><strong>${escapeHTML(vehicle.origin)}</strong></article></div>
      ${conditionMarkup(vehicle)}
      <ul class="highlight-list">${vehicle.highlights.map((highlight) => `<li>${escapeHTML(highlight)}</li>`).join("")}</ul><p class="section-note">${escapeHTML(vehicle.delivery)}</p>
      ${china ? `<p class="section-note"><a href="${escapeHTML(vehicle.sourceUrl)}" target="_blank" rel="noopener noreferrer">Source Youxinpai · référence ${escapeHTML(vehicle.sourceId)}</a></p>` : ""}
      <div class="card-actions"><button class="primary-card${selected ? " selected" : ""}" type="button" data-action="select" data-id="${escapeHTML(vehicle.id)}"><i data-lucide="${selected ? "check" : "plus"}" aria-hidden="true"></i>${selected ? "Déjà retenu" : "Ajouter"}</button><a class="secondary-card" href="${escapeHTML(vehicleQuoteLink(vehicle))}"><i data-lucide="file-text" aria-hidden="true"></i>${china ? "Devis livré au Bénin" : "Demander devis"}</a></div></div></div>`;
  if (!vehicleDialog.open) vehicleDialog.showModal();
  bindGalleries(dialogContent);
  document.body.classList.add("dialog-open");
  if (window.lucide) window.lucide.createIcons();
}
function closeDetails() { vehicleDialog.close(); document.body.classList.remove("dialog-open"); }
function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) { toast = document.createElement("div"); toast.className = "toast"; document.body.append(toast); }
  toast.textContent = message; toast.classList.add("visible"); window.setTimeout(() => toast.classList.remove("visible"), 1800);
}
segments.forEach((button) => button.addEventListener("click", () => { state.category = button.dataset.category; segments.forEach((segment) => segment.classList.toggle("active", segment === button)); renderAll(); }));
searchInput.addEventListener("input", (event) => { state.search = event.target.value.trim(); renderAll(); });
quickLinks.forEach((link) => link.addEventListener("click", () => { state.search = link.dataset.quick; searchInput.value = link.dataset.quick; renderAll(); }));
heroSearch.addEventListener("submit", (event) => { event.preventDefault(); state.search = searchInput.value.trim(); renderAll(); document.querySelector("#catalogue").scrollIntoView({ behavior: "smooth", block: "start" }); });
budgetSelect.addEventListener("change", (event) => { state.budget = event.target.value; renderAll(); });
fuelSelect.addEventListener("change", (event) => { state.fuel = event.target.value; renderAll(); });
if (sourceSelect) sourceSelect.addEventListener("change", (event) => { state.source = event.target.value; renderAll(); });
document.querySelectorAll("[data-source-quick]").forEach((link) => link.addEventListener("click", () => {
  state.source = link.dataset.sourceQuick;
  if (sourceSelect) sourceSelect.value = state.source;
  state.category = "all"; state.fuel = "all"; state.budget = "all"; state.search = "";
  searchInput.value = ""; budgetSelect.value = "all"; fuelSelect.value = "all";
  segments.forEach((segment) => segment.classList.toggle("active", segment.dataset.category === "all"));
  renderAll();
}));
sortSelect.addEventListener("change", (event) => { state.sort = event.target.value; renderAll(); });
if (retryYouxinpai) retryYouxinpai.addEventListener("click", loadYouxinpai);
vehicleGrid.addEventListener("click", (event) => { const button = event.target.closest("[data-action]"); if (!button) return; const { action, id } = button.dataset; if (action === "select") toggleSelection(id); if (action === "details") openDetails(id); });
dialogContent.addEventListener("click", (event) => { const button = event.target.closest("[data-action='select']"); if (!button) return; toggleSelection(button.dataset.id); openDetails(button.dataset.id); });
selectionList.addEventListener("click", (event) => { const button = event.target.closest("[data-remove]"); if (!button) return; state.selection.delete(button.dataset.remove); saveSelection(); renderAll(); });
clearSelection.addEventListener("click", () => { state.selection.clear(); saveSelection(); renderAll(); showToast("Sélection vidée"); });
closeDialog.addEventListener("click", closeDetails);
vehicleDialog.addEventListener("click", (event) => { if (event.target === vehicleDialog) closeDetails(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && vehicleDialog.open) closeDetails(); });
openSelectionTop.addEventListener("click", () => document.querySelector("#selection").scrollIntoView({ behavior: "smooth", block: "start" }));
leadForm.addEventListener("submit", (event) => {
  event.preventDefault(); const formData = new FormData(leadForm), selected = selectedVehicles(), pending = pendingSelectionIds();
  const message = ["Bonjour, je cherche un véhicule.", `Client : ${formData.get("clientName") || "Non précisé"}`, `Type : ${formData.get("vehicleType")}`, `Budget : ${formData.get("budget") || "Non précisé"}`, `Délai : ${formData.get("deadline") || "Non précisé"}`, `Détails : ${formData.get("details") || "Aucun détail"}`, selected.length || pending.length ? "Sélection :" : null, ...selected.map((vehicle) => `- ${vehicle.ref} - ${vehicle.title} - ${formatPrice(vehicle.price)}${isYouxinpai(vehicle) ? " livré au Bénin, depuis la Chine" : ""}`), ...pending.map((id) => `- Référence à confirmer : ${id}`)].filter(Boolean).join("\n");
  window.location.href = requestLink(message);
});
function initializeCatalogue() { renderAll(); loadYouxinpai(); }
if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", initializeCatalogue, { once: true }); else initializeCatalogue();

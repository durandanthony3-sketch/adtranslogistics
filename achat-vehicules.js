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

const state = {
  category: "all",
  search: "",
  budget: "all",
  fuel: "all",
  sort: "recommended",
  selection: new Set(JSON.parse(localStorage.getItem("adtl-auto-boutique-selection") || "[]")),
};

const vehicleGrid = document.querySelector("#vehicleGrid");
const resultCount = document.querySelector("#resultCount");
const searchInput = document.querySelector("#searchInput");
const budgetSelect = document.querySelector("#budgetSelect");
const fuelSelect = document.querySelector("#fuelSelect");
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

function formatPrice(value) {
  if (!Number.isFinite(value)) return "Prix a confirmer";
  return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
}

function formatMileage(value) {
  if (!Number.isFinite(value)) return "A confirmer";
  return `${new Intl.NumberFormat("fr-FR").format(value)} km`;
}

function displayYear(vehicle) {
  return vehicle.yearLabel || vehicle.year;
}

function galleryFor(vehicle) {
  return vehicle.gallery?.length ? vehicle.gallery : [vehicle.image];
}

function requestLink(message) {
  const encoded = encodeURIComponent(message);
  return contactPhone ? `https://wa.me/${contactPhone}?text=${encoded}` : `mailto:contact@example.com?subject=Demande%20de%20devis%20vehicule&body=${encoded}`;
}

function selectedVehicles() {
  return vehicles.filter((vehicle) => state.selection.has(vehicle.id));
}

function saveSelection() {
  localStorage.setItem("adtl-auto-boutique-selection", JSON.stringify([...state.selection]));
}

function matchesBudget(vehicle) {
  if (!Number.isFinite(vehicle.price)) return state.budget === "all";
  if (state.budget === "under-10") return vehicle.price < 10000000;
  if (state.budget === "10-18") return vehicle.price >= 10000000 && vehicle.price <= 18000000;
  if (state.budget === "18-30") return vehicle.price > 18000000 && vehicle.price <= 30000000;
  if (state.budget === "premium") return vehicle.price > 30000000;
  return true;
}

function filteredVehicles() {
  const query = state.search.toLowerCase();

  const filtered = vehicles.filter((vehicle) => {
    const text = [
      vehicle.ref,
      vehicle.title,
      vehicle.category,
      vehicle.status,
      vehicle.fuel,
      vehicle.origin,
      vehicle.yearLabel || vehicle.year,
      vehicle.transmission,
      ...vehicle.tags,
      ...vehicle.highlights,
    ]
      .join(" ")
      .toLowerCase();

    return (
      (state.category === "all" || vehicle.category === state.category) &&
      (state.fuel === "all" || vehicle.fuel === state.fuel) &&
      matchesBudget(vehicle) &&
      text.includes(query)
    );
  });

  return filtered.sort((a, b) => {
    const priceA = Number.isFinite(a.price) ? a.price : Number.MAX_SAFE_INTEGER;
    const priceB = Number.isFinite(b.price) ? b.price : Number.MAX_SAFE_INTEGER;
    const priceDescA = Number.isFinite(a.price) ? a.price : -1;
    const priceDescB = Number.isFinite(b.price) ? b.price : -1;
    if (state.sort === "price-asc") return priceA - priceB;
    if (state.sort === "price-desc") return priceDescB - priceDescA;
    if (state.sort === "mileage-asc") {
      const mileageA = Number.isFinite(a.mileage) ? a.mileage : Number.MAX_SAFE_INTEGER;
      const mileageB = Number.isFinite(b.mileage) ? b.mileage : Number.MAX_SAFE_INTEGER;
      return mileageA - mileageB;
    }
    if (state.sort === "year-desc") return (Number.isFinite(b.year) ? b.year : 0) - (Number.isFinite(a.year) ? a.year : 0);
    return vehicles.indexOf(a) - vehicles.indexOf(b);
  });
}

function vehicleRequestText(vehicle) {
  return [
    "Bonjour, je souhaite recevoir un devis pour ce vehicule :",
    `${vehicle.ref} - ${vehicle.title}`,
    `Prix indicatif : ${formatPrice(vehicle.price)}`,
    `Annee : ${displayYear(vehicle)}`,
    `Kilometrage : ${formatMileage(vehicle.mileage)}`,
    `Energie : ${vehicle.fuel}`,
    "",
    "Merci de confirmer la disponibilite, les photos finales et les conditions de livraison.",
  ].join("\n");
}

function renderVehicles() {
  const list = filteredVehicles();
  resultCount.textContent = `${list.length} vehicule${list.length > 1 ? "s" : ""}`;

  if (!list.length) {
    vehicleGrid.innerHTML = `
      <div class="empty-state">
        <div>
          <strong>Aucun vehicule trouve</strong>
          <p>Ajustez les filtres ou envoyez une demande de recherche personnalisee.</p>
        </div>
      </div>
    `;
    return;
  }

  vehicleGrid.innerHTML = list
    .map((vehicle) => {
      const isSelected = state.selection.has(vehicle.id);
      const gallery = galleryFor(vehicle);
      return `
        <article class="vehicle-card">
          <div class="vehicle-media">
            <div class="vehicle-photo-track" aria-label="Photos ${vehicle.title}">
              ${gallery
                .map((image, index) => `<img src="${image}" alt="${vehicle.title} photo ${index + 1}" loading="lazy" />`)
                .join("")}
            </div>
            <span class="vehicle-status">${vehicle.status}</span>
            <span class="vehicle-ref">${vehicle.ref}</span>
            <span class="vehicle-photo-count">
              <i data-lucide="images" aria-hidden="true"></i>
              ${gallery.length}
            </span>
          </div>
          <div class="vehicle-body">
            <div>
              <h3>${vehicle.title}</h3>
              <div class="vehicle-meta">
                <span><i data-lucide="calendar" aria-hidden="true"></i>${displayYear(vehicle)}</span>
                <span><i data-lucide="gauge" aria-hidden="true"></i>${formatMileage(vehicle.mileage)}</span>
                <span><i data-lucide="fuel" aria-hidden="true"></i>${vehicle.fuel}</span>
              </div>
            </div>
            <div class="vehicle-price">
              <strong>${formatPrice(vehicle.price)}</strong>
              <span>indicatif</span>
            </div>
            <div class="tag-row">
              ${vehicle.tags.map((tag) => `<span>${tag}</span>`).join("")}
            </div>
            <div class="card-actions">
              <button class="secondary-card" type="button" data-action="details" data-id="${vehicle.id}">
                <i data-lucide="eye" aria-hidden="true"></i>
                Details
              </button>
              <button class="primary-card ${isSelected ? "selected" : ""}" type="button" data-action="select" data-id="${vehicle.id}">
                <i data-lucide="${isSelected ? "check" : "plus"}" aria-hidden="true"></i>
                ${isSelected ? "Retenu" : "Ajouter"}
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function selectionMessage() {
  const list = selectedVehicles();
  if (!list.length) {
    return "Bonjour, je souhaite recevoir une proposition pour un vehicule disponible.";
  }

  return [
    "Bonjour, je souhaite recevoir un devis pour ma selection :",
    "",
    ...list.map((vehicle) => `- ${vehicle.ref} - ${vehicle.title} - ${formatPrice(vehicle.price)}`),
    "",
    `Total indicatif : ${selectionTotal.textContent}`,
    "Merci de confirmer les disponibilites, les photos finales et les conditions de livraison.",
  ].join("\n");
}

function renderSelection() {
  const list = selectedVehicles();
  selectionBadge.textContent = list.length;
  selectionTotal.textContent = formatPrice(
    list.reduce((total, vehicle) => total + (Number.isFinite(vehicle.price) ? vehicle.price : 0), 0),
  );
  selectionRequest.href = requestLink(selectionMessage());

  if (!list.length) {
    selectionList.innerHTML = `<p class="section-note">Aucun vehicule retenu.</p>`;
    return;
  }

  selectionList.innerHTML = list
    .map(
      (vehicle) => `
        <article class="selection-item">
          <img src="${vehicle.image}" alt="${vehicle.title}" />
          <div>
            <strong>${vehicle.title}</strong>
            <span>${vehicle.ref} - ${formatPrice(vehicle.price)}</span>
          </div>
          <button class="mini-remove" type="button" data-remove="${vehicle.id}" title="Retirer">
            <i data-lucide="x" aria-hidden="true"></i>
          </button>
        </article>
      `,
    )
    .join("");
}

function renderInventory() {
  if (!inventoryTable) return;

  const totalValue = vehicles.reduce((total, vehicle) => total + (Number.isFinite(vehicle.price) ? vehicle.price : 0), 0);
  inventoryCount.textContent = `${vehicles.length} reference${vehicles.length > 1 ? "s" : ""}`;
  inventoryRefs.textContent = vehicles.length;
  inventoryValue.textContent = formatPrice(totalValue);
  inventoryTable.innerHTML = vehicles
    .map(
      (vehicle) => `
        <tr>
          <td>
            <div class="inventory-vehicle">
              <img src="${vehicle.image}" alt="${vehicle.title}" loading="lazy" />
              <span>${vehicle.title}</span>
            </div>
          </td>
          <td>${vehicle.ref}</td>
          <td>${displayYear(vehicle)}</td>
          <td>${vehicle.category}</td>
          <td><strong>${formatPrice(vehicle.price)}</strong></td>
          <td><span class="inventory-status">${vehicle.status}</span></td>
        </tr>
      `,
    )
    .join("");
}

function renderAll() {
  renderVehicles();
  renderSelection();
  renderInventory();
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function toggleSelection(id) {
  if (state.selection.has(id)) {
    state.selection.delete(id);
  } else {
    state.selection.add(id);
  }
  saveSelection();
  renderAll();
}

function openDetails(id) {
  const vehicle = vehicles.find((item) => item.id === id);
  if (!vehicle) return;
  const gallery = galleryFor(vehicle);

  dialogContent.innerHTML = `
    <div class="dialog-layout">
      <div class="dialog-media">
        <div class="dialog-photo-track" aria-label="Photos ${vehicle.title}">
          ${gallery.map((image, index) => `<img src="${image}" alt="${vehicle.title} photo ${index + 1}" />`).join("")}
        </div>
        ${
          gallery.length > 1
            ? `<div class="dialog-gallery">${gallery
                .map((image, index) => `<img src="${image}" alt="${vehicle.title} photo ${index + 1}" />`)
                .join("")}</div>`
            : ""
        }
      </div>
      <div class="dialog-body">
        <div>
          <p class="eyebrow">${vehicle.ref}</p>
          <h2 id="dialogTitle">${vehicle.title}</h2>
          <div class="dialog-price">${formatPrice(vehicle.price)}</div>
        </div>
        <div class="spec-grid">
          <article><span>Annee</span><strong>${displayYear(vehicle)}</strong></article>
          <article><span>Kilometrage</span><strong>${formatMileage(vehicle.mileage)}</strong></article>
          <article><span>Energie</span><strong>${vehicle.fuel}</strong></article>
          <article><span>Boite</span><strong>${vehicle.transmission}</strong></article>
          <article><span>Places</span><strong>${vehicle.seats}</strong></article>
          <article><span>Origine</span><strong>${vehicle.origin}</strong></article>
        </div>
        <ul class="highlight-list">
          ${vehicle.highlights.map((highlight) => `<li>${highlight}</li>`).join("")}
        </ul>
        <p class="section-note">${vehicle.delivery}</p>
        <div class="card-actions">
          <button class="primary-card ${state.selection.has(vehicle.id) ? "selected" : ""}" type="button" data-action="select" data-id="${vehicle.id}">
            <i data-lucide="${state.selection.has(vehicle.id) ? "check" : "plus"}" aria-hidden="true"></i>
            ${state.selection.has(vehicle.id) ? "Deja retenu" : "Ajouter"}
          </button>
          <a class="secondary-card" href="${requestLink(vehicleRequestText(vehicle))}">
            <i data-lucide="file-text" aria-hidden="true"></i>
            Demander devis
          </a>
        </div>
      </div>
    </div>
  `;

  if (!vehicleDialog.open) {
    vehicleDialog.showModal();
  }
  document.body.classList.add("dialog-open");
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function closeDetails() {
  vehicleDialog.close();
  document.body.classList.remove("dialog-open");
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.classList.add("visible");
  window.setTimeout(() => toast.classList.remove("visible"), 1800);
}

segments.forEach((button) => {
  button.addEventListener("click", () => {
    state.category = button.dataset.category;
    segments.forEach((segment) => segment.classList.toggle("active", segment === button));
    renderAll();
  });
});

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value.trim();
  renderAll();
});

quickLinks.forEach((link) => {
  link.addEventListener("click", () => {
    state.search = link.dataset.quick;
    searchInput.value = link.dataset.quick;
    renderAll();
  });
});

heroSearch.addEventListener("submit", (event) => {
  event.preventDefault();
  state.search = searchInput.value.trim();
  renderAll();
  document.querySelector("#catalogue").scrollIntoView({ behavior: "smooth", block: "start" });
});

budgetSelect.addEventListener("change", (event) => {
  state.budget = event.target.value;
  renderAll();
});

fuelSelect.addEventListener("change", (event) => {
  state.fuel = event.target.value;
  renderAll();
});

sortSelect.addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderAll();
});

vehicleGrid.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const { action, id } = actionButton.dataset;
  if (action === "select") toggleSelection(id);
  if (action === "details") openDetails(id);
});

dialogContent.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action='select']");
  if (!actionButton) return;
  toggleSelection(actionButton.dataset.id);
  openDetails(actionButton.dataset.id);
});

selectionList.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove]");
  if (!removeButton) return;
  state.selection.delete(removeButton.dataset.remove);
  saveSelection();
  renderAll();
});

clearSelection.addEventListener("click", () => {
  state.selection.clear();
  saveSelection();
  renderAll();
  showToast("Selection videe");
});

closeDialog.addEventListener("click", closeDetails);

vehicleDialog.addEventListener("click", (event) => {
  if (event.target === vehicleDialog) closeDetails();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && vehicleDialog.open) closeDetails();
});

openSelectionTop.addEventListener("click", () => {
  document.querySelector("#selection").scrollIntoView({ behavior: "smooth", block: "start" });
});

leadForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(leadForm);
  const selected = selectedVehicles();
  const message = [
    "Bonjour, je cherche un vehicule.",
    `Client : ${formData.get("clientName") || "Non precise"}`,
    `Type : ${formData.get("vehicleType")}`,
    `Budget : ${formData.get("budget") || "Non precise"}`,
    `Delai : ${formData.get("deadline") || "Non precise"}`,
    `Details : ${formData.get("details") || "Aucun detail"}`,
    selected.length ? "" : null,
    selected.length ? "Selection :" : null,
    ...selected.map((vehicle) => `- ${vehicle.ref} - ${vehicle.title} - ${formatPrice(vehicle.price)}`),
  ]
    .filter(Boolean)
    .join("\n");

  window.location.href = requestLink(message);
});

window.addEventListener("DOMContentLoaded", renderAll);

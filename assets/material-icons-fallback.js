(function () {
  const NS = 'http://www.w3.org/2000/svg';

  const base = {
    arrow_forward: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    north_east: '<path d="M7 17 17 7"/><path d="M9 7h8v8"/>',
    south_east: '<path d="m7 7 10 10"/><path d="M17 9v8H9"/>',
    expand_more: '<path d="m6 9 6 6 6-6"/>',
    open_in_new: '<path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
    check: '<path d="m20 6-11 11-5-5"/>',
    check_circle: '<path d="m9 12 2 2 4-5"/><circle cx="12" cy="12" r="9"/>',
    task_alt: '<path d="m9 12 2 2 5-6"/><circle cx="12" cy="12" r="9"/>',
    verified: '<path d="m9 12 2 2 4-5"/><path d="M12 2 9.5 4.2 6.2 4 5.4 7.2 2.8 9 4 12l-1.2 3 2.6 1.8.8 3.2 3.3-.2L12 22l2.5-2.2 3.3.2.8-3.2L21.2 15 20 12l1.2-3-2.6-1.8-.8-3.2-3.3.2L12 2Z"/>',
    radio_button_unchecked: '<circle cx="12" cy="12" r="9"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    calculate: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8"/><path d="M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M16 15h0"/>',
    refresh: '<path d="M20 6v6h-6"/><path d="M4 18v-6h6"/><path d="M19 12a7 7 0 0 0-12-5M5 12a7 7 0 0 0 12 5"/>',
    visibility: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    monitoring: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 4-4 3 3 5-7"/>',
    trending_up: '<path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
    trending_down: '<path d="m3 7 6 6 4-4 8 8"/><path d="M14 17h7v-7"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
    lock_open: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
    send: '<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>',
    play_arrow: '<path d="M8 5v14l11-7-11-7Z" fill="currentColor" stroke="none"/>',
    facebook: '<path d="M14 8h3V4h-3a5 5 0 0 0-5 5v3H6v4h3v6h4v-6h3l1-4h-4V9a1 1 0 0 1 1-1Z"/>',
    call: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    message: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/>',
    chat: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/><path d="M8 9h8M8 13h5"/>',
    support_agent: '<circle cx="12" cy="12" r="9"/><path d="M7 13v-2a5 5 0 0 1 10 0v2"/><path d="M7 13h2v4H7zM15 13h2v4h-2zM12 18h3"/>',
    schedule: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    location_on: '<path d="M12 22s7-5.7 7-12A7 7 0 0 0 5 10c0 6.3 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/>',
    groups: '<path d="M16 11a4 4 0 1 0-8 0"/><path d="M4 20a8 8 0 0 1 16 0"/><path d="M17 8a3 3 0 0 1 3 3M7 8a3 3 0 0 0-3 3"/>',
    school: '<path d="m2 9 10-5 10 5-10 5-10-5Z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/><path d="M22 9v6"/>',
    public: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    assignment: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 12h6M9 17h4"/>',
    fact_check: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m8 10 2 2 4-5M8 16h8"/>',
    edit_note: '<path d="M4 6h10M4 11h8M4 16h7"/><path d="m14 19 5-5 2 2-5 5h-2v-2Z"/>',
    folder_open: '<path d="M3 7h7l2 2h9v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 1-2Z"/><path d="M3 18 6 10h16l-3 8"/>',
    receipt_long: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
    payments: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h7"/><circle cx="17" cy="14" r="1"/>',
    account_balance: '<path d="m3 10 9-6 9 6H3Z"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8M3 18h18"/>',
    account_balance_wallet: '<path d="M4 6h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/><path d="M18 11h4v5h-4a2.5 2.5 0 0 1 0-5Z"/>',
    storefront: '<path d="M4 10h16l-1-6H5l-1 6Z"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    shopping_cart: '<circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M2 3h3l3 12h10l3-8H6"/>',
    inventory_2: '<path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
    package_2: '<path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
    warehouse: '<path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 13h10M9 17h6"/>',
    local_shipping: '<path d="M3 6h11v10H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    directions_car: '<path d="M6 16h12M5 16l1.5-5h11L19 16v3H5v-3Z"/><path d="M8 19v2M16 19v2"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/>',
    vintage_car: '<path d="M4 15h16l-2-5H6l-2 5Z"/><path d="M6 15v4M18 15v4"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/><path d="M8 10V6h8v4"/>',
    airport_shuttle: '<path d="M3 7h15a3 3 0 0 1 3 3v6H3V7Z"/><path d="M7 7v9M13 7v9"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    construction: '<path d="M3 21h18"/><path d="M7 21V9l5-5 5 5v12"/><path d="M9 13h6M9 17h6"/>',
    two_wheeler: '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M9 17h3l3-6h-4l-2-3M15 11l3 6"/>',
    fire_truck: '<path d="M3 7h10v10H3z"/><path d="M13 11h4l4 3v3h-8z"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/><path d="M7 7V4h4v3"/>',
    sailing: '<path d="M4 19c3 2 13 2 16 0"/><path d="M12 4v12"/><path d="M12 5 5 16h7"/><path d="M12 7l6 9h-6"/>',
    anchor: '<circle cx="12" cy="5" r="2"/><path d="M12 7v13"/><path d="M5 12H2v3a10 10 0 0 0 20 0v-3h-3"/><path d="M9 20h6"/>',
    gavel: '<path d="m14 4 6 6-3 3-6-6 3-3Z"/><path d="m4 20 7-7"/><path d="m8 8 8 8"/><path d="M3 21h8"/>',
    deployed_code: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="M12 12 4 7.5M12 12l8-4.5M12 12v9"/>',
    new_releases: '<path d="M12 2 9.8 6 5.2 5.2 6 9.8 2 12l4 2.2-.8 4.6 4.6-.8L12 22l2.2-4 4.6.8-.8-4.6 4-2.2-4-2.2.8-4.6-4.6.8L12 2Z"/><path d="M12 8v5M12 16h.01"/>',
    speed: '<path d="M4 14a8 8 0 1 1 16 0"/><path d="M12 14l4-4"/><path d="M5 19h14"/>',
    nutrition: '<path d="M12 21c-5-3-7-7-7-11a5 5 0 0 1 9-3 5 5 0 0 1 7 4c0 4-4 7-9 10Z"/><path d="M13 6c0-2 2-4 5-4"/>',
    spa: '<path d="M12 21c-4-4-7-7-7-11 4 0 7 3 7 7 0-4 3-7 7-7 0 4-3 7-7 11Z"/><path d="M12 17V4"/>',
    coffee: '<path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z"/><path d="M16 10h2a3 3 0 0 1 0 6h-2"/><path d="M6 3v2M10 3v2M14 3v2"/>',
    cloud: '<path d="M17 18H7a5 5 0 1 1 1-9 6 6 0 0 1 11 3 3 3 0 0 1-2 6Z"/>',
    grain: '<path d="M12 22V2"/><path d="M12 6c-4 0-6-2-7-4 4 0 6 2 7 4ZM12 12c-4 0-6-2-7-4 4 0 6 2 7 4ZM12 18c-4 0-6-2-7-4 4 0 6 2 7 4ZM12 6c4 0 6-2 7-4-4 0-6 2-7 4ZM12 12c4 0 6-2 7-4-4 0-6 2-7 4ZM12 18c4 0 6-2 7-4-4 0-6 2-7 4Z"/>',
    grass: '<path d="M4 21c2-7 3-10 8-16 5 6 6 9 8 16"/><path d="M2 21h20"/><path d="M8 21c0-5-1-8-5-12M16 21c0-5 1-8 5-12"/>',
    diamond: '<path d="M6 3h12l4 6-10 12L2 9l4-6Z"/><path d="M2 9h20M9 3 7 9l5 12 5-12-2-6"/>',
    oil_barrel: '<ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v14c0 1.7 3.1 3 7 3s7-1.3 7-3V5"/><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>',
    handshake: '<path d="M8 12 4 8l4-4 4 4"/><path d="m16 12 4-4-4-4-4 4"/><path d="M8 12l3 3a3 3 0 0 0 4 0l1-1"/><path d="M5 9l6 6M19 9l-6 6"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    balance: '<path d="M12 3v18"/><path d="M8 21h8"/><path d="M4 7h16"/><path d="m6 7-3 6a3 3 0 0 0 6 0L6 7Z"/><path d="m18 7-3 6a3 3 0 0 0 6 0l-3-6Z"/>',
    science: '<path d="M10 3v6L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9V3"/><path d="M8 3h8"/>',
    verified_user: '<path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z"/><path d="m9 12 2 2 4-4"/>',
    description: '<path d="M6 3h9l4 4v14H6V3Z"/><path d="M15 3v4h4"/><path d="M9 12h6M9 16h6"/>',
    compare_arrows: '<path d="M9 7H3"/><path d="m6 4-3 3 3 3"/><path d="M15 17h6"/><path d="m18 14 3 3-3 3"/>',
    warning: '<path d="m12 3 10 18H2L12 3Z"/><path d="M12 10v4M12 17h.01"/>',
    gps_fixed: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
    local_police: '<path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z"/><path d="m12 8 1 2.2 2.4.2-1.8 1.6.5 2.4L12 13.2 9.9 14.4l.5-2.4-1.8-1.6 2.4-.2L12 8Z"/>',
  };

  const aliases = {
    account_balance: 'account_balance',
    inventory_2: 'inventory_2',
    store: 'storefront',
  };

  function iconSvg(name) {
    const key = aliases[name] || name;
    return base[key] || '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>';
  }

  function render(el) {
    if (!el || el.dataset.iconFallback === 'ready') return;
    const name = (el.textContent || '').trim();
    if (!name) return;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = iconSvg(name);
    el.textContent = '';
    el.appendChild(svg);
    el.dataset.iconFallback = 'ready';
    el.dataset.iconName = name;
  }

  function scan(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('.material-symbols-outlined').forEach(render);
    if (scope.classList && scope.classList.contains('material-symbols-outlined')) render(scope);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { scan(document); });
  } else {
    scan(document);
  }

  new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        if (node.nodeType === 1) scan(node);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();

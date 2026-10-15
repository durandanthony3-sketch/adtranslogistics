# -*- coding: utf-8 -*-
"""Passe SEO + ergonomie du 15/10/2026 — idempotente. Usage : python tools/seo_ux_pass.py (racine du site)."""
import os, re, io, glob, html, json, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
PRIVATE = {'admin.html', 'equipe.html', 'espace-client.html', 'connexion.html', 'rapport-envoi-confirme.html', '404.html'}
changed = set()

def read(p):
    return io.open(p, encoding='utf-8', newline='').read().replace('\r\n', '\n')
def write(p, s):
    io.open(p, 'w', encoding='utf-8', newline='\n').write(s); changed.add(p)
def pages():
    return [f for f in glob.glob('**/*.html', recursive=True) if not f.startswith(('public/', 'node_modules/', 'tools/'))]

# ───────── 1. Accent « Dépotage » dans les menus + lien vers la page service ─────────
for f in pages():
    s = read(f); o = s
    s = s.replace('>Depotage <svg', '>Dépotage <svg').replace('>Depotage</a>', '>Dépotage</a>')
    # Menu desktop (pages standard) : lien vers la page service au-dessus de « Soumettre une demande »
    s = s.replace('<a href="/demande?service=depotage" class="block text-center py-2.5 bg-black text-white text-sm font-semibold rounded-lg hover:opacity-85">Soumettre une demande &rarr;</a>',
                  '<a class="block px-1 py-2 text-sm font-semibold text-black hover:underline" href="/depotage-conteneur-cotonou">Dépotage de conteneur à Cotonou →</a>\n            <a class="block px-1 py-2 text-sm font-semibold text-black hover:underline" href="/suivi">Suivre un conteneur →</a>\n            <a href="/demande?service=depotage" class="block text-center py-2.5 bg-black text-white text-sm font-semibold rounded-lg hover:opacity-85">Soumettre une demande &rarr;</a>')
    if s != o: write(f, s)

# index.html : menu (structure « nav-drop ») — ajouter les liens dans le bloc Dépotage
s = read('index.html')
if '/depotage-conteneur-cotonou' not in s:
    i = s.index('<!-- Depotage -->'); j = s.index('</li>', i)
    block = s[i:j]
    block2 = block.replace('<ul class="drop-checklist">', '<a href="/depotage-conteneur-cotonou" class="navl" style="display:block;font-weight:700;padding:6px 0;">Dépotage de conteneur à Cotonou →</a>\n                <a href="/suivi" class="navl" style="display:block;font-weight:700;padding:6px 0 10px;">Suivre un conteneur →</a>\n                <ul class="drop-checklist">', 1)
    s = s[:i] + block2 + s[j:]
    write('index.html', s)

# ───────── 2. Pied de page : liens « Dépotage de conteneurs » et « À propos » ─────────
for f in pages():
    s = read(f); o = s
    if 'href="/depotage-conteneur-cotonou"' not in s[s.find('<footer'):] and '<footer' in s:
        # pages standard : lien « Suivi en temps réel »
        m = re.search(r'(<li>\s*<a[^>]*href="/suivi"[^>]*>Suivi en temps réel</a>\s*</li>)', s[s.find('<footer'):])
        if m:
            li = m.group(1); cls = re.search(r'<a ([^>]*)href', li).group(1)
            new = li + '\n<li><a %shref="/depotage-conteneur-cotonou">Dépotage de conteneurs</a></li>\n<li><a %shref="/a-propos">À propos</a></li>' % (cls, cls)
            s = s[:s.find('<footer')] + s[s.find('<footer'):].replace(li, new, 1)
    if s != o: write(f, s)

# index.html footer (structure différente) : ajouter près de « Mentions légales »
s = read('index.html')
if 'href="/a-propos"' not in s:
    foot = s[s.find('<footer'):]
    m = re.search(r'<a([^>]*)href="/mentions-legales"[^>]*>', foot)
    if m:
        attrs = m.group(1)
        new = '<a%shref="/a-propos">À propos</a>\n<a%shref="/depotage-conteneur-cotonou">Dépotage de conteneurs</a>\n' % (attrs, attrs) + m.group(0)
        s = s[:s.find('<footer')] + foot.replace(m.group(0), new, 1)
        write('index.html', s)

# ───────── 3. Accueil : positionnement « transitaire à Cotonou » ─────────
s = read('index.html'); o = s
s = re.sub(r'<title>.*?</title>', '<title>Transitaire à Cotonou (Bénin) : dédouanement, dépotage, transit Niger, Burkina, Mali | AD TRANS LOGISTICS</title>', s, count=1, flags=re.S)
s = re.sub(r'<meta content="[^"]*" name="description"/>', '<meta content="AD TRANS LOGISTICS, transitaire au port de Cotonou : dédouanement de véhicules et marchandises, dépotage de conteneurs suivi en temps réel, transit Niger, Burkina Faso, Mali et Nigeria. Devis WhatsApp en 24 h." name="description"/>', s, count=1)
s = re.sub(r'<meta property="og:title" content="[^"]*"/>', '<meta property="og:title" content="Transitaire à Cotonou — AD TRANS LOGISTICS"/>', s, count=1)
s = re.sub(r'<meta property="og:description" content="[^"]*"/>', '<meta property="og:description" content="Dédouanement de véhicules et marchandises, dépotage de conteneurs suivi en temps réel, transit Niger, Burkina Faso, Mali, Nigeria. Devis WhatsApp en 24 h."/>', s, count=1)
old_h1 = '''        Transit douanier<br/><span style="color:var(--gray400);font-weight:500;font-style:italic;">marchandises &amp; corridors</span>
    </h1>
    <p class="hero-service-summary">
        Importation de marchandises au Bénin et au Nigeria, avec prise en charge douanière et logistique. Transit régional vers le Niger et le Burkina Faso.
    </p>
    <div class="hero-actions">
        <a href="/simulateur" class="btn btn-dark">Simuler dédouanement véhicule <span class="material-symbols-outlined" aria-hidden="true" style="font-size:17px;">calculate</span></a>
        <a href="/calculateur" class="btn btn-outline">Simuler marchandise <span class="material-symbols-outlined" aria-hidden="true" style="font-size:17px;">calculate</span></a>
    </div>'''
new_h1 = '''        Votre transitaire<br/><span style="color:var(--gray400);font-weight:500;font-style:italic;">au port de Cotonou</span>
    </h1>
    <p class="hero-service-summary">
        Dédouanement de véhicules et de marchandises, dépotage de conteneurs suivi en temps réel, transit vers le Niger, le Burkina Faso, le Mali et le Nigeria. Chaque montant justifié, chaque étape visible.
    </p>
    <div class="hero-actions">
        <a href="https://wa.me/2290197500555?text=Bonjour%20AD%20TRANS%20LOGISTICS%2C%20je%20souhaite%20un%20devis." target="_blank" rel="noopener" class="btn btn-dark">Devis WhatsApp en 24 h <span class="material-symbols-outlined" aria-hidden="true" style="font-size:17px;">chat</span></a>
        <a href="/simulateur" class="btn btn-outline">Simuler mon dédouanement <span class="material-symbols-outlined" aria-hidden="true" style="font-size:17px;">calculate</span></a>
    </div>
    <p style="font-size:12.5px;color:var(--gray500);margin:14px 0 0;line-height:1.6;">Transitaire enregistré au Port Autonome de Cotonou · IFU 3202465578499 · RCCM RB/COT/24 B 38537 · <a href="/a-propos" style="color:var(--black);font-weight:600;text-decoration:underline;">À propos</a></p>'''
if old_h1 in s: s = s.replace(old_h1, new_h1)
s = s.replace('<div class="tag" style="margin-bottom:24px;"><div class="dot"></div>Transit douanier &amp; logistique régionale</div>', '<div class="tag" style="margin-bottom:24px;"><div class="dot"></div>Transitaire · Port Autonome de Cotonou</div>')
# Sélecteurs sans libellé (accessibilité)
s = s.replace('<select id="homeMarque" onchange="homeUpdateBtn()"', '<select id="homeMarque" aria-label="Marque du véhicule" onchange="homeUpdateBtn()"')
s = s.replace('<select id="homeOrigine" onchange="homeUpdateBtn()"', '<select id="homeOrigine" aria-label="Pays d’origine du véhicule" onchange="homeUpdateBtn()"')
s = s.replace('<select name="Prestation" class="fi" required>', '<select name="Prestation" class="fi" aria-label="Prestation souhaitée" required>')
if s != o: write('index.html', s)

# ───────── 4. Contraste : gris 400 → #767676 (AA sur fond blanc) ─────────
for f in pages() + glob.glob('*.css') + glob.glob('assets/*.css'):
    s = read(f); o = s
    s = s.replace('--gray400: #A3A3A3', '--gray400: #767676').replace('--gray400:#A3A3A3', '--gray400:#767676')
    s = s.replace('.text-g400{--tw-text-opacity:1;color:rgb(163 163 163/var(--tw-text-opacity,1))}', '.text-g400{--tw-text-opacity:1;color:rgb(118 118 118/var(--tw-text-opacity,1))}')
    if s != o: write(f, s)

# ───────── 5. Logo : WebP léger, dimensions réelles ─────────
for f in pages():
    s = read(f); o = s
    s = s.replace('<img class="adtl-site-logo__image" src="/assets/logo-adtl-20260919.jpeg" width="1080" height="817" alt="" decoding="async">',
                  '<img class="adtl-site-logo__image" src="/assets/logo-adtl-160.webp" srcset="/assets/logo-adtl-160.webp 1x, /assets/logo-adtl-320.webp 2x" width="160" height="121" alt="" decoding="async" fetchpriority="high">')
    s = re.sub(r'<img([^>]*)src="/assets/logo-adtl-20260919\.jpeg"([^>]*)>', lambda m: '<img' + m.group(1) + 'src="/assets/logo-adtl-320.webp"' + m.group(2) + '>' if 'adtl-site-logo__image' not in m.group(0) else m.group(0), s)
    if s != o: write(f, s)

# ───────── 6. Métadonnées : titres/descriptions trop longs, noindex pages privées, canonical manquant ─────────
TITLES = {
    'en/index.html': 'Freight Forwarder in Cotonou, Benin — Customs Clearing & Transit | AD TRANS LOGISTICS',
    'en/niger.html': 'Cotonou to Niamey Transit — Benin-Niger Corridor | AD TRANS LOGISTICS',
    'en/nigeria.html': 'Benin to Nigeria Transit: Cotonou Clearing, Lagos Delivery | AD TRANS LOGISTICS',
    'transit-niger.html': 'Transit Cotonou → Niger (Niamey) : transitaire corridor Bénin-Niger | AD TRANS LOGISTICS',
    'transit-nigeria.html': 'Transit Bénin ⇄ Nigeria : dédouanement Cotonou, livraison Lagos | AD TRANS LOGISTICS',
    'transport-conteneur-vehicules.html': 'Transport de véhicules en conteneur vers Cotonou (USA, Europe, Chine) | AD TRANS LOGISTICS',
    'vehicules.html': 'Acheter & importer un véhicule au Bénin (USA, Europe, Dubaï) | AD TRANS LOGISTICS',
    'calculateur.html': 'Calculateur de droits de douane marchandises au Bénin | AD TRANS LOGISTICS',
    'suivi.html': 'Suivi de conteneur au port de Cotonou en temps réel | AD TRANS LOGISTICS',
}
DESCS = {
    'transit-nigeria.html': 'Transit Bénin ⇄ Nigeria : dédouanement au port de Cotonou et livraison à Lagos (magasin Alasia, Ojo). Véhicules, marchandises, groupage. Devis WhatsApp en 24 h.',
    'calculateur.html': 'Estimez les droits de douane import/export de vos marchandises au Bénin : modèle de déclaration, code SH, valeur CAF, taux de change. Simulation claire et rapport détaillé.',
    'transport-conteneur-vehicules.html': 'Transport de véhicules en conteneur depuis les USA (Copart, IAAI), l’Europe et la Chine vers Cotonou : fret, assurance, dédouanement et dépotage au port.',
    'en/nigeria.html': 'Benin to Nigeria transit with AD TRANS LOGISTICS: customs clearing at the Port of Cotonou, delivery to Lagos (Alasia, Ojo warehouse). Vehicles, goods, groupage. WhatsApp quote within 24 hours.',
    'index.html': None,  # déjà fait
}
for f, t in TITLES.items():
    s = read(f); s2 = re.sub(r'<title>.*?</title>', '<title>' + html.escape(t, quote=False) + '</title>', s, count=1, flags=re.S)
    if s2 != s: write(f, s2)
for f, d in DESCS.items():
    if not d: continue
    s = read(f); s2 = re.sub(r'<meta content="[^"]*" name="description"/>', '<meta content="' + html.escape(d) + '" name="description"/>', s, count=1)
    s2 = re.sub(r'<meta name="description" content="[^"]*"', '<meta name="description" content="' + html.escape(d) + '"', s2, count=1)
    if s2 != s: write(f, s2)
for f in ['connexion.html', 'equipe.html', 'espace-client.html', 'admin.html', 'rapport-envoi-confirme.html']:
    s = read(f)
    if 'name="robots"' not in s:
        s = s.replace('<meta content="width=device-width, initial-scale=1.0" name="viewport"/>', '<meta content="width=device-width, initial-scale=1.0" name="viewport"/>\n    <meta name="robots" content="noindex,nofollow"/>', 1)
        write(f, s)
s = read('vehicules.html')
if 'rel="canonical"' not in s:
    s = s.replace('</head>', '<link rel="canonical" href="https://www.adtranslogistics.com/vehicules"/>\n</head>', 1); write('vehicules.html', s)

# ───────── 7. Suggestion de langue : nom accessible ─────────
s = read('assets/lang-suggest.js')
if "aria-label" not in s:
    s = s.replace("b.setAttribute('role','dialog');", "b.setAttribute('role','dialog'); b.setAttribute('aria-label', t);")
    write('assets/lang-suggest.js', s)

# ───────── 8. Sitemap & robots ─────────
today = datetime.date.today().isoformat()
sm = read('sitemap.xml')
for slug, prio in (('depotage-conteneur-cotonou', '0.9'), ('a-propos', '0.6')):
    if slug not in sm:
        sm = sm.replace('</urlset>', '  <url>\n    <loc>https://www.adtranslogistics.com/%s</loc>\n    <lastmod>%s</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>%s</priority>\n  </url>\n</urlset>' % (slug, today, prio))
# lastmod des pages modifiées aujourd'hui
for slug in ('', 'suivi', 'mentions-legales', 'confidentialite'):
    sm = re.sub(r'(<loc>https://www.adtranslogistics.com/%s</loc>\s*<lastmod>)[^<]*' % re.escape(slug), lambda m: m.group(1) + today, sm)
write('sitemap.xml', sm)
rb = read('robots.txt')
if 'Disallow: /api/' not in rb:
    rb = rb.replace('User-agent: *\nAllow: /', 'User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /equipe\nDisallow: /admin')
    write('robots.txt', rb)

print('fichiers modifiés :', len(changed))
for c in sorted(changed): print(' -', c)

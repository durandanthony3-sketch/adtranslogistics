# -*- coding: utf-8 -*-
"""Passe SEO du 10/11/2026 — maillage interne, titres/descriptions, aperçus de partage, données structurées.
Idempotente. Usage : python tools/seo_pass_2026_11.py (depuis la racine du site).

Constat de départ : les pages qui visent les recherches les plus rentables (guides, corridors Burkina/Mali,
diaspora) ne recevaient presque aucun lien interne ; titres et descriptions dépassaient la longueur affichée
par Google ; l'image de partage était déclarée en 512 px alors qu'elle fait 1200 x 630.
"""
import os, re, io, glob, html, json, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
SITE = 'https://www.adtranslogistics.com'
COVER = SITE + '/icons/og-cover.png'
PRIVATE = {'admin.html', 'equipe.html', 'espace-client.html', 'connexion.html', 'rapport-envoi-confirme.html'}
changed, significant = set(), set()


def read(p):
    return io.open(p, encoding='utf-8', newline='').read()


def write(p, s, major=False):
    io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
    changed.add(p)
    if major:
        significant.add(p)


def pages():
    return sorted(f for f in glob.glob('*.html') + glob.glob('guides/*.html') + glob.glob('en/*.html'))


def is_en(s):
    return bool(re.search(r'<html[^>]*\blang="en"', s))


def esc(t):
    return html.escape(t, quote=True)


def meta_re(attr, key):
    return re.compile(r'<meta\b(?=[^>]*\b%s="%s")[^>]*>' % (attr, re.escape(key)))


def get_meta(s, attr, key):
    m = meta_re(attr, key).search(s)
    if not m:
        return None
    c = re.search(r'\bcontent="([^"]*)"', m.group(0))
    return html.unescape(c.group(1)) if c else None


def set_meta(s, attr, key, value, after=None):
    """Remplace la balise si elle existe, sinon l'insère après la balise `after` (attr, key)."""
    tag = '<meta %s="%s" content="%s"/>' % (attr, key, esc(value))
    rx = meta_re(attr, key)
    if rx.search(s):
        return rx.sub(lambda m: tag, s, count=1)
    if after:
        m = meta_re(*after).search(s)
        if m:
            return s[:m.end()] + '\n' + tag + s[m.end():]
    m = re.search(r'<link\b(?=[^>]*\brel="canonical")[^>]*>', s)
    if m:
        return s[:m.end()] + '\n' + tag + s[m.end():]
    return s.replace('</head>', tag + '\n</head>', 1)


# ═════════ 1. Titres et descriptions (longueur affichable, mot-clé en tête) ═════════
META = {
    'index.html': (
        'Transitaire à Cotonou (Bénin) : dédouanement, dépotage, transit | ADTL',
        'Transitaire au port de Cotonou : dédouanement de véhicules et marchandises, dépotage de conteneurs, transit Niger, Burkina, Mali, Nigeria. Devis WhatsApp 24 h.'),
    'a-propos.html': (
        'À propos d’AD TRANS LOGISTICS, transitaire à Cotonou (Bénin)',
        'AD TRANS LOGISTICS SARL, transitaire enregistré au Port Autonome de Cotonou : dédouanement, dépotage, transit. IFU 3202465578499, RCCM RB/COT/24 B 38537.'),
    'calculateur.html': (
        'Calculateur de droits de douane marchandises au Bénin | ADTL',
        'Estimez les droits de douane de vos marchandises au Bénin : modèle de déclaration, code SH, valeur CAF, taux de change. Simulation claire et rapport détaillé.'),
    'couverture-mondiale.html': (
        'Fret vers le Bénin et l’Afrique de l’Ouest via Cotonou | ADTL',
        'Depuis l’Amérique du Nord, l’Europe, le Golfe et l’Asie vers Cotonou, puis le Bénin, le Niger, le Burkina Faso, le Mali et le Nigeria. Devis sous 24 h.'),
    'demande.html': (
        'Demande de devis : importation, transit, dépotage à Cotonou | ADTL',
        'Soumettez votre demande d’importation, d’exportation, de transit ou de dépotage au port de Cotonou. AD TRANS LOGISTICS vous répond sous 24 h ouvrées.'),
    'depotage-conteneur-cotonou.html': (
        'Dépotage de conteneur à Cotonou : suivi en temps réel | ADTL',
        'Dépotage de conteneur au port de Cotonou : 13 étapes tracées, validations Port, Manutention, Terminal et BESC, notification WhatsApp à chaque étape. Devis 24 h.'),
    'estimation-marchandises.html': (
        'Droits de douane marchandises au Bénin : estimation immédiate',
        'Estimez les droits et taxes à l’import au Bénin : droit de douane par catégorie UEMOA, TVA 18 %, prélèvements communautaires, AIB. Code SH vérifié sous 24 h.'),
    'produits-digitaux.html': (
        'Guides, formations et référentiel douane Bénin 2026 | ADTL',
        'Guides pratiques, formations et référentiel 2026 des valeurs en douane du Bénin. Paiement MTN MoMo, Moov ou carte, téléchargement immédiat.'),
    'simulateur.html': (
        None,
        'Estimez le dédouanement de votre véhicule d’occasion au Bénin : références Argus et déclarations historiques. Résultat indicatif, à confirmer par l’AVD.'),
    'simulateur-depotage.html': (
        'Simulateur de dépotage de conteneur à Cotonou : prix immédiat',
        'Estimez en 30 secondes le coût du dépotage de votre conteneur au port de Cotonou : dépotage, transport, scanner, déclaration. Devis confirmé sous 24 h.'),
    'simulateurs.html': (
        'Simulateurs douane, dépotage, transit et transport | ADTL',
        'Simulateurs AD TRANS LOGISTICS : droits de douane véhicule et marchandises, dépotage de conteneur, transit Niger, Burkina, Mali, Nigeria, transport de véhicule.'),
    'suivi.html': (
        'Suivi de conteneur au port de Cotonou en temps réel | ADTL', None),
    'transit-niger.html': (
        'Transit Cotonou → Niger (Niamey) : transitaire Bénin-Niger | ADTL',
        'Transit douanier de Cotonou vers le Niger : déclaration T1, garantie, escorte jusqu’à Malanville-Gaya, livraison à Niamey. Véhicules et conteneurs. Devis 24 h.'),
    'transit-nigeria.html': (
        'Transit Bénin ⇄ Nigeria : dédouanement Cotonou, livraison Lagos', None),
    'transport-conteneur-vehicules.html': (
        'Transport de véhicules en conteneur vers Cotonou (USA, Europe, Chine)', None),
    'vehicules.html': (
        'Acheter et importer un véhicule au Bénin (USA, Europe, Dubaï)',
        'Commandez et importez votre véhicule depuis les USA (Copart, IAA), l’Europe, l’Asie ou Dubaï : fret maritime, dédouanement à Cotonou et livraison.'),
    'vehicules-chine.html': (
        None,
        'Véhicules depuis la Chine avec AD TRANS LOGISTICS, représentant Youxinpai au Bénin : sélection, vérification, transport et dédouanement sur devis.'),
    'boutique.html': (
        None,
        'Véhicules de la boutique ADTL et sélection Youxinpai depuis la Chine : photos, références et demande de devis pour l’achat et l’importation au Bénin.'),
    'en/index.html': (
        'Freight Forwarder in Cotonou, Benin: Customs Clearing & Transit',
        'Freight forwarder at the Port of Cotonou, Benin: customs clearing, vehicle imports, transit to Niger, delivery to Nigeria. WhatsApp quote within 24 hours.'),
    'en/container-destuffing-cotonou.html': (
        'Container Destuffing at the Port of Cotonou, Tracked Live | ADTL',
        'Container destuffing (unstuffing) at the Port of Cotonou: 13 tracked steps, Port, Terminal and BESC approvals, WhatsApp updates in English. Quote in 24 hours.'),
    'en/global-coverage.html': (
        'Freight to Benin & West Africa via the Port of Cotonou | ADTL',
        'Ship from North America, Europe, the Gulf and Asia to Cotonou, then on to Benin, Niger, Burkina Faso, Mali and Nigeria. Quotes in English within 24 hours.'),
    'en/importer-of-record-benin.html': (
        'Importer of Record (IOR) in Benin, Port of Cotonou | ADTL',
        'Importer of Record at the Port of Cotonou: consignee on the B/L, Benin tax ID, BESC/ECTN, customs declaration, duties paid, delivery or onward transit.'),
    'en/niger.html': (
        'Cotonou to Niamey Transit: Benin-Niger Corridor Forwarder | ADTL',
        'Customs transit from the Port of Cotonou to Niger: T1 declaration, guarantee, escort to Malanville-Gaya, delivery in Niamey. Vehicles and containers.'),
    'en/nigeria.html': (
        'Benin to Nigeria Transit: Cotonou Clearing, Lagos Delivery | ADTL',
        'Benin to Nigeria transit: customs clearing at the Port of Cotonou, delivery to Lagos (Alasia, Ojo warehouse). Vehicles, goods, groupage. Quote in 24 hours.'),
    'en/track.html': (
        'Track Your Container at the Port of Cotonou, Live | ADTL', None),
    'en-products.html': (
        'Benin Customs Guides in English: Import via Cotonou | ADTL',
        'Import a car or container through Cotonou, Benin: English guides and customs value reference. Pay by card or mobile money, instant download.'),
    'en-simulator.html': (
        'Benin Car Import Duty Calculator (Cotonou) | AD TRANS LOGISTICS',
        'Estimate used-vehicle import duties in Benin from an automatically selected reference value. Simulation and PDF: 500 F CFA, excluding payment fees.'),
}
for f, (t, d) in META.items():
    assert t is None or len(t) <= 70, (f, len(t), t)
    assert d is None or len(d) <= 160, (f, len(d), d)
for f, (t, d) in META.items():
    s = read(f); o = s
    if t:
        old_t = html.unescape(re.search(r'<title>(.*?)</title>', s, re.S).group(1).strip())
        s = re.sub(r'<title>.*?</title>', lambda m: '<title>' + html.escape(t, quote=False) + '</title>', s, count=1, flags=re.S)
        for attr, key in (('property', 'og:title'), ('name', 'twitter:title')):
            cur = get_meta(s, attr, key)
            if cur is not None and cur == old_t:
                s = set_meta(s, attr, key, t)
    if d:
        old_d = get_meta(s, 'name', 'description')
        s = set_meta(s, 'name', 'description', d)
        for attr, key in (('property', 'og:description'), ('name', 'twitter:description')):
            cur = get_meta(s, attr, key)
            if cur is not None and cur == old_d:
                s = set_meta(s, attr, key, d)
    if s != o:
        write(f, s, major=True)

# Accents oubliés dans un titre de partage
s = read('negoce.html')
s2 = s.replace('content="Negoce de Matieres Premieres | AD TRANS LOGISTICS - Cotonou"', 'content="Négoce de matières premières — Afrique de l’Ouest | AD TRANS LOGISTICS"')
if s2 != s:
    write('negoce.html', s2)

# ═════════ 2. Aperçus de partage (WhatsApp, Facebook, X) : grande image 1200 x 630 ═════════
for f in pages():
    if f in PRIVATE:
        continue
    s = read(f); o = s
    img = get_meta(s, 'property', 'og:image')
    if img is None:
        img = COVER
        s = set_meta(s, 'property', 'og:image', img, after=('property', 'og:url'))
    if img == COVER:
        s = set_meta(s, 'property', 'og:image:width', '1200', after=('property', 'og:image'))
        s = set_meta(s, 'property', 'og:image:height', '630', after=('property', 'og:image:width'))
        s = set_meta(s, 'property', 'og:image:alt',
                     'AD TRANS LOGISTICS — freight forwarder at the Port of Cotonou, Benin' if is_en(s)
                     else 'AD TRANS LOGISTICS — transitaire au port de Cotonou, Bénin',
                     after=('property', 'og:image:height'))
    anchor = ('property', 'og:image:alt') if img == COVER else ('property', 'og:image')
    s = set_meta(s, 'name', 'twitter:card', 'summary_large_image', after=anchor)
    s = set_meta(s, 'name', 'twitter:image', img, after=('name', 'twitter:card'))
    if s != o:
        write(f, s)

# ═════════ 3. Balises en double, logo sans texte alternatif, libellés sans accent ═════════
for f in pages():
    s = read(f); o = s
    # hreflang recopiés par erreur depuis la page de suivi (la page se déclarait traduction de /suivi)
    if f not in ('suivi.html', 'en/track.html'):
        s = re.sub(r'[ \t]*<link\b(?=[^>]*\brel="alternate")(?=[^>]*\bhreflang=)(?=[^>]*\bhref="%s/(?:suivi|en/track)")[^>]*>\n?' % re.escape(SITE), '', s)
    if f == 'en-simulator.html' and 'hreflang="x-default"' not in s:
        s = re.sub(r'(<link\b(?=[^>]*\brel="alternate")(?=[^>]*\bhreflang="en")[^>]*>)',
                   lambda m: m.group(1) + '\n<link rel="alternate" hreflang="x-default" href="%s/simulateur"/>' % SITE, s, count=1)
    # hreflang identiques répétés
    seen = set()
    def dedupe(m):
        if m.group(0).strip() in seen:
            return ''
        seen.add(m.group(0).strip())
        return m.group(0)
    s = re.sub(r'[ \t]*<link\b(?=[^>]*\brel="alternate")(?=[^>]*\bhreflang=)[^>]*>\n?', dedupe, s)
    s = s.replace('class="adtl-site-logo__image" src="/assets/logo-adtl-160.webp" srcset="/assets/logo-adtl-160.webp 1x, /assets/logo-adtl-320.webp 2x" width="160" height="121" alt=""',
                  'class="adtl-site-logo__image" src="/assets/logo-adtl-160.webp" srcset="/assets/logo-adtl-160.webp 1x, /assets/logo-adtl-320.webp 2x" width="160" height="121" alt="AD TRANS LOGISTICS"')
    if not is_en(s):
        s = s.replace('>Vehicules</a>', '>Véhicules</a>')
        s = s.replace('<li>Declaration de transit (T1)</li>', '<li>Déclaration de transit (T1)</li>')
        s = s.replace('<li>Declaration en douane</li>', '<li>Déclaration en douane</li>')
        s = s.replace('<li>Bon a enlever</li>', '<li>Bon à enlever</li>')
    if s != o:
        write(f, s)

s = read('boutique.html')
s2 = s.replace('Vehicules selectionnes', 'Véhicules sélectionnés')
if s2 != s:
    write('boutique.html', s2)

# produits-digitaux : la page n'avait aucun titre H1
s = read('produits-digitaux.html')
if '<h1' not in s:
    s = s.replace('<h2 class="title-h2">Formations &amp; Guides pratiques</h2>', '<h1 class="title-h2">Formations &amp; Guides pratiques</h1>', 1)
    assert '<h1' in s
    write('produits-digitaux.html', s, major=True)

# produits-digitaux : la page ne chargeait pas les polices de la charte (affichage en police système)
s = read('produits-digitaux.html')
if 'fonts.googleapis.com' not in s:
    fonts = ('<link href="https://fonts.googleapis.com" rel="preconnect"/>\n'
             '<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>\n'
             '<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&amp;family=Space+Grotesk:wght@500;600;700&amp;display=swap" rel="stylesheet"/>\n')
    marker = '<link rel="icon" href="/icons/favicon-48.png"/>\n'
    assert marker in s
    s = s.replace(marker, marker + fonts, 1)
    write('produits-digitaux.html', s)

# ═════════ 4. Pied de page : mêmes liens partout vers les pages qui doivent se positionner ═════════
SERVICES = [
    ('/#services', 'Transit douanier à Cotonou'),
    ('/depotage-conteneur-cotonou', 'Dépotage de conteneur à Cotonou'),
    ('/transit-niger', 'Transit Niger (Niamey)'),
    ('/transit-burkina', 'Transit Burkina Faso (Ouagadougou)'),
    ('/transit-mali', 'Transit Mali (Bamako)'),
    ('/transit-nigeria', 'Transit Nigeria (Lagos)'),
    ('/vehicules', 'Achat &amp; import de véhicules'),
    ('/transport-conteneur-vehicules', 'Transport de véhicules en conteneur'),
    ('/importer-voiture-diaspora', 'Importer une voiture depuis l’étranger'),
    ('/vehicules-chine', 'Véhicules de Chine (Youxinpai)'),
    ('/negoce', 'Négoce de matières premières'),
]
RESSOURCES = [
    ('/simulateurs', 'Simulateurs de droits de douane'),
    ('/guides', 'Guides import-export 2026'),
    ('/guides/dedouanement-vehicule-benin-2026', 'Guide : dédouaner une voiture au Bénin'),
    ('/guides/documents-importation-benin', 'Guide : documents pour importer'),
    ('/guides/delais-port-cotonou', 'Guide : délais au port de Cotonou'),
    ('/guides/calcul-valeur-caf-douane', 'Guide : valeur CAF et droits de douane'),
    ('/suivi', 'Suivi de conteneur en temps réel'),
    ('/couverture-mondiale', 'Couverture mondiale'),
    ('/produits-digitaux', 'Formations &amp; mémos PDF'),
    ('/a-propos', 'À propos'),
    ('/#faq', 'Questions fréquentes'),
    ('https://www.youtube.com/@ADTRANSLOGISTICS-r3x', 'Chaîne YouTube'),
    ('/en', 'English version'),
]
FOOTER_TEXT = [
    ('SARL specialisee en transit douanier, negoce de matieres premieres et logistique portuaire au port de Cotonou, Benin.',
     'SARL spécialisée en transit douanier, importation de véhicules et logistique portuaire au port de Cotonou, Bénin.'),
    ('SARL specialisee en transit douanier, importation de vehicules et logistique portuaire au port de Cotonou, Benin.',
     'SARL spécialisée en transit douanier, importation de véhicules et logistique portuaire au port de Cotonou, Bénin.'),
    ('SARL specialisée en transit douanier', 'SARL spécialisée en transit douanier'),
    ('Tous droits reserves.', 'Tous droits réservés.'),
]


def footer_list(s, f, heading, items):
    fi = s.rfind('<footer'); fj = s.find('</footer>', fi)
    if fi < 0:
        return s
    foot = s[fi:fj]
    m = re.search(r'(<h3[^>]*>\s*' + heading + r'\s*</h3>\s*)(<ul[^>]*>)(.*?)(</ul>)', foot, re.S)
    if not m:
        return s
    a = re.search(r'<a\b[^>]*>', m.group(3))
    attrs = re.sub(r'\s*\b(href|target|rel)="[^"]*"', '', a.group(0)[2:-1]).strip().rstrip('/').strip()
    attrs = attrs.replace(' font-medium text-brand', '').replace(' font-semibold', '')
    lis = []
    for href, label in items:
        if f == 'index.html' and href.startswith('/#'):
            href = href[1:]
        ext = ' target="_blank" rel="noopener"' if href.startswith('http') else ''
        lis.append('<li><a href="%s"%s %s>%s</a></li>' % (href, ext, attrs, label))
    new = m.group(1) + m.group(2) + '\n' + '\n'.join(lis) + '\n' + m.group(4)
    return s[:fi] + foot[:m.start()] + new + foot[m.end():] + s[fj:]


for f in pages():
    s = read(f); o = s
    if is_en(s) or '<footer' not in s:
        continue
    s = footer_list(s, f, 'Services', SERVICES)
    s = footer_list(s, f, 'Ressources', RESSOURCES)
    fi = s.rfind('<footer')
    foot = s[fi:]
    for a, b in FOOTER_TEXT:
        foot = foot.replace(a, b)
    if f != 'negoce.html':
        foot = foot.replace("| Negoce de matieres premieres en Afrique de l'Ouest.", '| Transit douanier au Bénin avec expertise et pédagogie.')
        foot = foot.replace("| Négoce de matières premières en Afrique de l'Ouest.", '| Transit douanier au Bénin avec expertise et pédagogie.')
    else:
        foot = foot.replace("Negoce de matieres premieres en Afrique de l'Ouest.", "Négoce de matières premières en Afrique de l'Ouest.")
    s = s[:fi] + foot
    if s != o:
        write(f, s)

# Pieds de page anglais : les deux corridors n'y figuraient pas
for f in pages():
    s = read(f); o = s
    if not is_en(s) or '<footer' not in s:
        continue
    fi = s.rfind('<footer'); foot = s[fi:]
    if 'href="/en/niger"' not in foot:
        foot = foot.replace('<li><a href="/en/global-coverage" class="text-g500 hover:text-brand transition-colors">Global coverage</a></li>',
                            '<li><a href="/en/global-coverage" class="text-g500 hover:text-brand transition-colors">Global coverage</a></li>\n'
                            '<li><a href="/en/niger" class="text-g500 hover:text-brand transition-colors">Cotonou to Niamey transit</a></li>\n'
                            '<li><a href="/en/nigeria" class="text-g500 hover:text-brand transition-colors">Benin to Nigeria transit</a></li>')
    s = s[:fi] + foot
    if s != o:
        write(f, s)

# Pieds de page sombres des simulateurs : liens gris illisibles au survol + liens guides
for f in ('calculateur.html', 'simulateur.html'):
    s = read(f); o = s
    fi = s.rfind('<footer'); foot = s[fi:]
    foot = foot.replace('class="text-g500 hover:text-brand transition-colors"', 'class="hover:text-white transition-colors"')
    if 'href="/guides"' not in foot:
        foot = foot.replace('<li><a href="/produits-digitaux" class="hover:text-white transition-colors">Guides &amp; mémos PDF</a></li>',
                            '<li><a href="/guides" class="hover:text-white transition-colors">Guides import-export 2026</a></li>\n'
                            '<li><a href="/simulateurs" class="hover:text-white transition-colors">Tous les simulateurs</a></li>\n'
                            '<li><a href="/produits-digitaux" class="hover:text-white transition-colors">Guides &amp; mémos PDF</a></li>')
    s = s[:fi] + foot
    if s != o:
        write(f, s)

# ═════════ 5. Menu principal : corridors dans « Transit », guides dans « Importation » ═════════
TW = 'class="block px-1 py-2 text-sm font-semibold text-black hover:underline"'
TW_TRANSIT_CTA = '<a href="/demande?service=transit" class="block text-center py-2.5 bg-black text-white text-sm font-semibold rounded-lg hover:opacity-85">Soumettre une demande &rarr;</a>'
TW_IMPORT_CTA = '<a href="/demande?service=importation" class="block text-center py-2.5 bg-black text-white text-sm font-semibold rounded-lg hover:opacity-85">Soumettre une demande &rarr;</a>'
CORRIDORS = [('/transit-niger', 'Transit Niger (Niamey) →'), ('/transit-burkina', 'Transit Burkina Faso →'),
             ('/transit-mali', 'Transit Mali (Bamako) →'), ('/transit-nigeria', 'Transit Nigeria (Lagos) →')]
IMPORT_LINKS = [('/guides', 'Guides import-export 2026 →'), ('/importer-voiture-diaspora', 'Importer une voiture depuis l’étranger →')]
NAVL = 'class="navl" style="display:block;font-weight:700;padding:6px 0;"'


def before(s, marker, links, attrs, sentinel):
    i = s.find(marker)
    if i < 0:
        return s
    # déjà présent dans ce bloc de menu ?
    block_start = s.rfind('<li', 0, i)
    if sentinel in s[block_start:i]:
        return s
    indent = re.search(r'[ \t]*$', s[:i]).group(0)
    ins = ''.join('<a %s href="%s">%s</a>\n%s' % (attrs, h, l, indent) for h, l in links)
    return s[:i] + ins + s[i:]


for f in pages():
    s = read(f); o = s
    if is_en(s):
        continue
    s = before(s, TW_TRANSIT_CTA, CORRIDORS, TW, 'href="/transit-burkina"')
    s = before(s, TW_IMPORT_CTA, IMPORT_LINKS, TW, 'href="/guides"')
    s = before(s, '<a href="/demande?service=transit" class="drop-cta">', CORRIDORS, NAVL, 'href="/transit-burkina"')
    s = before(s, '<a href="/demande?service=importation" class="drop-cta">', IMPORT_LINKS, NAVL, 'href="/guides"')
    if s != o:
        write(f, s)

# ═════════ 6. Accueil : corridors, guides gratuits, liens dans la FAQ, fiche entreprise ═════════
s = read('index.html'); o = s
LINK = 'style="font-size:13px;font-weight:600;color:var(--black);text-decoration:underline;"'

# 6a. Carte « Transit » : quatre corridors, chacun vers sa page (le Burkina pointait vers le formulaire)
s = s.replace('<h3 style="font-size:17px;font-weight:600;color:var(--black);margin-bottom:10px;">Transit Niger &amp; Burkina Faso</h3>',
              '<h3 style="font-size:17px;font-weight:600;color:var(--black);margin-bottom:10px;">Transit Niger, Burkina Faso, Mali &amp; Nigeria</h3>')
s = s.replace("Organisation des formalités et de l'acheminement régional depuis Cotonou vers le Niger et le Burkina Faso.",
              "Organisation des formalités et de l'acheminement régional depuis Cotonou vers le Niger, le Burkina Faso, le Mali et le Nigeria.")
s = s.replace('<a href="/transit-niger" %s>Corridor Niger →</a><a href="/demande?service=transit" %s>Transit Burkina Faso →</a>' % (LINK, LINK),
              '<a href="/transit-niger" %s>Transit Niger →</a><a href="/transit-burkina" %s>Transit Burkina Faso →</a>'
              '<a href="/transit-mali" %s>Transit Mali →</a><a href="/transit-nigeria" %s>Transit Nigeria →</a>' % (LINK, LINK, LINK, LINK))

# 6b. Cartes de services sans lien : chacune mène à la page qui détaille le sujet
CARD_LINKS = [
    ('Manutention, entreposage temporaire et livraison sécurisée au Port Autonome de Cotonou (PAC).</p>',
     '/depotage-conteneur-cotonou', 'Dépotage de conteneur à Cotonou →'),
    ('Procédures GUCE, attestations de valeur, vérification documentaire et conseils en conformité douanière.</p>',
     '/guides/documents-importation-benin', 'Documents pour importer au Bénin →'),
    ('Accompagnement pédagogique pour les importateurs et transitaires débutants. Maîtriser les rouages du PAC.</p>',
     '/produits-digitaux', 'Guides et formations →'),
]
for text, href, label in CARD_LINKS:
    add = '\n            <div style="margin-top:12px;"><a href="%s" %s>%s</a></div>' % (href, LINK, label)
    if text in s and text + add not in s:
        s = s.replace(text, text + add, 1)

# 6c. Section « Guides gratuits » avant la FAQ
GUIDES = [
    ('/guides/dedouanement-vehicule-benin-2026', 'Dédouaner une voiture au Bénin en 2026',
     'Catégories de véhicules, taxes applicables, frais annexes au port de Cotonou et pièges à éviter avant d’acheter.'),
    ('/guides/documents-importation-benin', 'Documents pour importer au Bénin',
     'Facture commerciale, connaissement, certificat d’origine, liste de colisage : la liste complète et comment les obtenir.'),
    ('/guides/delais-port-cotonou', 'Délais au port de Cotonou',
     'Les délais par étape entre l’accostage et la sortie du port, et nos conseils pour éviter surestaries et pénalités.'),
    ('/guides/calcul-valeur-caf-douane', 'Valeur CAF et droits de douane',
     'Coût, assurance, fret : la base sur laquelle la douane calcule vos droits et taxes, avec des exemples chiffrés.'),
]
if 'id="guides"' not in s:
    cards = ''.join('''
        <a class="card" href="%s" style="display:block;padding:28px;text-decoration:none;">
            <h3 style="font-size:17px;font-weight:600;color:var(--black);margin:0 0 10px;">%s</h3>
            <p style="font-size:14px;color:var(--gray500);line-height:1.65;margin:0 0 14px;">%s</p>
            <span style="font-size:13px;font-weight:600;color:var(--black);text-decoration:underline;">Lire le guide →</span>
        </a>''' % g for g in GUIDES)
    section = '''<!-- ═══════ GUIDES GRATUITS ═══════ -->
<section id="guides" aria-labelledby="guides-title" style="padding:96px 0;background:var(--white);border-top:1px solid var(--gray200);">
<div style="max-width:1440px;margin:0 auto;padding:0 24px;">
    <div style="text-align:center;margin-bottom:56px;">
        <div class="tag" style="margin-bottom:16px;"><div class="dot"></div>Guides gratuits</div>
        <h2 class="title-h2" id="guides-title">Comprendre avant d’importer</h2>
        <p class="subtitle" style="margin:0 auto;">Quatre guides pratiques 2026 rédigés par un transitaire du port de Cotonou : dédouanement d’un véhicule, documents, délais et valeur en douane.</p>
    </div>
    <div class="adtl-guides-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;">%s
    </div>
    <div style="text-align:center;margin-top:36px;"><a href="/guides" class="btn btn-outline">Tous les guides import-export</a></div>
</div>
</section>
<style>@media(max-width:1100px){.adtl-guides-grid{grid-template-columns:1fr 1fr !important;}}@media(max-width:600px){.adtl-guides-grid{grid-template-columns:1fr !important;}}</style>

''' % cards
    i = s.index('<section id="faq"')
    # remonter avant le commentaire décoratif qui précède la FAQ
    j = s.rfind('<!--', 0, i)
    if j > 0 and i - j < 400:
        i = j
    s = s[:i] + section + s[i:]

# 6d. FAQ : chaque réponse renvoie vers la page qui approfondit
FAQL = 'style="color:var(--black);font-weight:600;"'
FAQ_ADD = [
    ("Nous vous recommandons d'utiliser notre simulateur pour une estimation plus précise.",
     ' Lancez le <a href="/simulateur" %s>simulateur de droits de douane</a> ou lisez le guide <a href="/guides/dedouanement-vehicule-benin-2026" %s>dédouaner une voiture au Bénin en 2026</a>.' % (FAQL, FAQL)),
    ('Nous vous guidons dans la constitution de votre dossier pour éviter tout blocage.',
     ' Voir la <a href="/guides/documents-importation-benin" %s>liste complète des documents pour importer au Bénin</a>.' % FAQL),
    ("à condition que le dossier documentaire soit complet dès l'arrivée au port.",
     ' Le détail par étape est dans notre guide des <a href="/guides/delais-port-cotonou" %s>délais au port de Cotonou</a>.' % FAQL),
]
faq_i = s.index('<section id="faq"')
head, faq = s[:faq_i], s[faq_i:]
for text, add in FAQ_ADD:
    if text in faq and text + add not in faq:
        faq = faq.replace(text, text + add, 1)
s = head + faq

# 6e. Fiche entreprise (données structurées) : raison sociale, création, services, zones desservies
def enrich(m):
    try:
        data = json.loads(m.group(1))
    except ValueError:
        return m.group(0)
    if not isinstance(data, dict) or data.get('@type') != 'LocalBusiness':
        return m.group(0)
    data['legalName'] = 'AD TRANS LOGISTICS SARL'
    data['alternateName'] = 'ADTL'
    data['foundingDate'] = '2024-08-30'
    data['taxID'] = '3202465578499'
    data['image'] = COVER
    data['areaServed'] = ['Bénin', 'Niger', 'Nigeria', 'Burkina Faso', 'Mali']
    data['knowsLanguage'] = ['fr', 'en']
    data['contactPoint'] = [{'@type': 'ContactPoint', 'telephone': '+2290197500555', 'contactType': 'customer service',
                             'availableLanguage': ['French', 'English'], 'areaServed': ['BJ', 'NE', 'BF', 'ML', 'NG']}]
    offers = [
        ('Achat et importation de véhicules au Bénin', '/vehicules'),
        ('Dépotage de conteneur à Cotonou', '/depotage-conteneur-cotonou'),
        ('Transit Cotonou → Niger', '/transit-niger'),
        ('Transit Cotonou → Burkina Faso', '/transit-burkina'),
        ('Transit Cotonou → Mali', '/transit-mali'),
        ('Transit Bénin ⇄ Nigeria', '/transit-nigeria'),
        ('Transport de véhicules en conteneur vers Cotonou', '/transport-conteneur-vehicules'),
    ]
    data['hasOfferCatalog'] = {'@type': 'OfferCatalog', 'name': 'Services de transit et de logistique',
                               'itemListElement': [{'@type': 'Offer', 'itemOffered': {'@type': 'Service', 'name': n, 'url': SITE + u}} for n, u in offers]}
    out = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    return '<script type="application/ld+json">' + out + '</script>'

s = re.sub(r'<script type="application/ld\+json">(.*?)</script>', enrich, s, flags=re.S)
if s != o:
    write('index.html', s, major=True)

# ═════════ 7. Bloc « À lire aussi » en bas des pages de service et des guides ═════════
REL = {
    'guide-vehicule': ('/guides/dedouanement-vehicule-benin-2026', 'Dédouaner une voiture au Bénin en 2026', 'Taux, exemples chiffrés, étapes au port de Cotonou et erreurs à éviter.'),
    'guide-docs': ('/guides/documents-importation-benin', 'Documents pour importer au Bénin', 'BL, facture, liste de colisage, certificat d’origine : la liste complète et le circuit GUCE.'),
    'guide-delais': ('/guides/delais-port-cotonou', 'Délais au port de Cotonou', 'Délais par étape, causes de retard et conseils pour éviter le magasinage.'),
    'guide-caf': ('/guides/calcul-valeur-caf-douane', 'Valeur CAF et droits de douane', 'La base de calcul des droits et taxes, avec un exemple chiffré simple.'),
    'sim-vehicule': ('/simulateur', 'Simulateur de droits de douane véhicules', 'Estimez le dédouanement de votre véhicule d’occasion au Bénin.'),
    'sim-marchandises': ('/calculateur', 'Calculateur de droits de douane marchandises', 'Estimez les droits et taxes de vos marchandises à l’import.'),
    'sim-depotage': ('/simulateur-depotage', 'Simulateur de dépotage de conteneur', 'Estimez le coût du dépotage de votre conteneur au port de Cotonou.'),
    'depotage': ('/depotage-conteneur-cotonou', 'Dépotage de conteneur à Cotonou', '13 étapes tracées et notification WhatsApp à chaque étape.'),
    'niger': ('/transit-niger', 'Transit Cotonou → Niger', 'Déclaration T1, garantie, escorte et livraison à Niamey.'),
    'burkina': ('/transit-burkina', 'Transit Cotonou → Burkina Faso', 'Déclaration T1, escorte et livraison à Ouagadougou et Bobo-Dioulasso.'),
    'mali': ('/transit-mali', 'Transit Cotonou → Mali', 'Déclaration T1, garantie, suivi du convoi et livraison à Bamako.'),
    'nigeria': ('/transit-nigeria', 'Transit Bénin ⇄ Nigeria', 'Dédouanement au port de Cotonou et livraison à Lagos.'),
    'vehicules': ('/vehicules', 'Acheter et importer un véhicule', 'USA, Europe, Dubaï : fret maritime, dédouanement à Cotonou et livraison.'),
    'conteneur-veh': ('/transport-conteneur-vehicules', 'Transport de véhicules en conteneur', 'Depuis les USA, l’Europe et la Chine vers Cotonou.'),
    'diaspora': ('/importer-voiture-diaspora', 'Importer une voiture depuis l’étranger', 'France, Belgique, USA, Canada : fret, dédouanement et livraison.'),
    'suivi': ('/suivi', 'Suivi de conteneur en temps réel', 'Suivez le dépotage de votre conteneur au port de Cotonou.'),
    'estimation': ('/estimation-marchandises', 'Estimation rapide des droits à l’import', 'Droit de douane par catégorie UEMOA, TVA 18 %, prélèvements communautaires, AIB.'),
}
PAGE_REL = {
    'simulateur.html': ['guide-vehicule', 'guide-caf', 'conteneur-veh', 'diaspora'],
    'calculateur.html': ['guide-caf', 'guide-docs', 'estimation', 'depotage'],
    'estimation-marchandises.html': ['guide-caf', 'guide-docs', 'sim-marchandises', 'depotage'],
    'simulateur-depotage.html': ['depotage', 'guide-delais', 'guide-docs', 'suivi'],
    'simulateurs.html': ['guide-vehicule', 'guide-caf', 'guide-docs', 'guide-delais'],
    'depotage-conteneur-cotonou.html': ['sim-depotage', 'guide-delais', 'guide-docs', 'guide-caf'],
    'suivi.html': ['depotage', 'sim-depotage', 'guide-delais', 'guide-docs'],
    'vehicules.html': ['guide-vehicule', 'sim-vehicule', 'conteneur-veh', 'diaspora'],
    'importer-voiture-diaspora.html': ['guide-vehicule', 'sim-vehicule', 'guide-docs', 'vehicules'],
    'transport-conteneur-vehicules.html': ['guide-vehicule', 'sim-vehicule', 'depotage', 'guide-delais'],
    'vehicules-chine.html': ['guide-vehicule', 'sim-vehicule', 'conteneur-veh', 'guide-docs'],
    'transit-niger.html': ['burkina', 'mali', 'nigeria', 'guide-delais'],
    'transit-burkina.html': ['niger', 'mali', 'nigeria', 'guide-delais'],
    'transit-mali.html': ['niger', 'burkina', 'nigeria', 'guide-delais'],
    'transit-nigeria.html': ['niger', 'burkina', 'mali', 'guide-docs'],
    'couverture-mondiale.html': ['guide-docs', 'guide-delais', 'guide-caf', 'guide-vehicule'],
    'guides/dedouanement-vehicule-benin-2026.html': ['sim-vehicule', 'guide-caf', 'guide-docs', 'diaspora'],
    'guides/documents-importation-benin.html': ['guide-vehicule', 'guide-delais', 'estimation', 'depotage'],
    'guides/delais-port-cotonou.html': ['depotage', 'suivi', 'guide-docs', 'sim-depotage'],
    'guides/calcul-valeur-caf-douane.html': ['sim-marchandises', 'estimation', 'sim-vehicule', 'guide-vehicule'],
}
for f, keys in PAGE_REL.items():
    s = read(f)
    if 'id="a-lire-aussi"' in s:
        continue
    cards = ''.join('''
<a href="%s" style="display:block;padding:18px 20px;background:#fff;border:1px solid #E5E5E5;border-radius:14px;text-decoration:none;">
<span style="display:block;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:15px;line-height:1.35;color:#0A0A0A;margin-bottom:6px;">%s</span>
<span style="display:block;font-size:13px;line-height:1.55;color:#525252;">%s</span>
</a>''' % REL[k] for k in keys)
    block = '''<!-- À lire aussi : maillage interne -->
<section id="a-lire-aussi" aria-labelledby="a-lire-aussi-title" style="padding:56px 0;background:#F7F7F7;border-top:1px solid #E5E5E5;">
<div style="max-width:1440px;margin:0 auto;padding:0 24px;">
<h2 id="a-lire-aussi-title" style="font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;line-height:1.2;color:#0A0A0A;margin:0 0 20px;">À lire aussi</h2>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;">%s
</div>
</div>
</section>
''' % cards
    i = s.rfind('<footer')
    assert i > 0, f
    s = s[:i] + block + s[i:]
    write(f, s, major=True)

# ═════════ 8. Sitemap : date réelle des pages retravaillées ═════════
today = datetime.date.today().isoformat()
sm = read('sitemap.xml'); o = sm
for f in sorted(significant):
    slug = f[:-5]
    if slug == 'index':
        slug = ''
    elif slug.endswith('/index'):
        slug = slug[:-6]
    loc = SITE + '/' + slug
    block = re.search(r'<url>\s*<loc>%s</loc>.*?</url>' % re.escape(loc), sm, re.S)
    if not block:
        print('  (absent du sitemap : %s)' % loc)
        continue
    new = re.sub(r'<lastmod>[^<]*</lastmod>', '<lastmod>%s</lastmod>' % today, block.group(0), count=1)
    sm = sm[:block.start()] + new + sm[block.end():]
if sm != o:
    write('sitemap.xml', sm)

print('fichiers modifiés : %d (dont %d retravaillés sur le fond)' % (len(changed), len(significant)))
for c in sorted(changed):
    print(' -', c, '*' if c in significant else '')

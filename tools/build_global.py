# -*- coding: utf-8 -*-
"""Couverture mondiale / Global coverage — génère :
  - /couverture-mondiale (FR, gabarit suivi.html via build_pages.build)
  - /en/global-coverage, /en/importer-of-record-benin, /en/container-destuffing-cotonou, /en/track (EN, gabarit en/index.html)
  - met à jour les menus / pieds de page EN, les sections « couverture mondiale » des deux accueils,
    les alternates hreflang (suivi ↔ en/track), lang-suggest.js, le sitemap.
Idempotent. Ordre conseillé : build_pages → build_simulators → seo_ux_pass → build_global.
Usage : python tools/build_global.py  (depuis la racine du site)"""
import re, io, os, json, html, datetime, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_pages  # noqa: E402  (ré-exécute build_pages : idempotent)
from build_pages import build as build_fr, CSS as SP_CSS  # noqa: E402

BASE = 'https://www.adtranslogistics.com'
WA_EN = 'https://wa.me/2290197500555?text=' + 'Hello%20AD%20TRANS%20LOGISTICS%2C%20I%20would%20like%20a%20quote%20for%20a%20shipment%20to%20Cotonou.'
WA_FR = 'https://wa.me/2290197500555?text=' + 'Bonjour%20AD%20TRANS%20LOGISTICS%2C%20je%20souhaite%20un%20devis%20pour%20une%20exp%C3%A9dition%20vers%20Cotonou.'
MAIL_EN = 'mailto:adtranslogistics@hotmail.com?subject=Shipment%20to%20Cotonou%20%E2%80%94%20quote%20request'
today = datetime.date.today().isoformat()

def read(p):
    return io.open(os.path.join(ROOT, p), encoding='utf-8').read().replace('\r\n', '\n')

def write(p, s):
    io.open(os.path.join(ROOT, p), 'w', encoding='utf-8', newline='\n').write(s)

# ───────────────────────── CSS commun (coverage) ─────────────────────────
GC_CSS = '''
<style>
.gc-panel{background:#0A0A0A;border-radius:28px;padding:22px 22px 16px;overflow:hidden}
.gc-panel img{width:100%;height:auto;display:block}
.gc-legend{display:flex;flex-wrap:wrap;gap:8px 22px;margin-top:12px;font-size:12.5px;color:rgba(255,255,255,.72)}
.gc-legend span{display:inline-flex;align-items:center;gap:8px}
.gc-legend i{display:inline-block;width:22px;height:0;border-top:2px dashed rgba(255,255,255,.7)}
.gc-legend i.road{border-top-color:#F59E0B}
.gc-legend i.hub{width:10px;height:10px;border:0;border-radius:50%;background:#F59E0B}
.gc-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:22px}
.gc-stat{background:#fff;border:1px solid #E5E5E5;border-radius:18px;padding:18px 20px}
.gc-stat b{display:block;font-family:'Space Grotesk',sans-serif;font-size:28px;letter-spacing:-.02em;line-height:1}
.gc-stat small{display:block;color:#737373;font-size:12.5px;margin-top:6px;line-height:1.4}
.gc-region{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px}
.gc-k{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#737373}
.gc-ports{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.gc-ports span{font-size:12.5px;font-weight:600;background:#F5F5F5;border-radius:999px;padding:5px 11px}
.gc-lines{display:flex;flex-wrap:wrap;gap:8px}
.gc-lines span{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:14px;border:1px solid #E5E5E5;border-radius:12px;padding:10px 16px;background:#fff}
.gc-pay{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.gc-pay div{background:#fff;border:1px solid #E5E5E5;border-radius:16px;padding:18px}
.gc-pay b{display:block;margin-bottom:4px}
.gc-pay p{font-size:13.5px;color:#525252;line-height:1.55;margin:0}
.gc-dest{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.gc-dest div{background:#fff;border:1px solid #E5E5E5;border-radius:16px;padding:18px}
.gc-dest b{display:block;font-family:'Space Grotesk',sans-serif;font-size:17px;margin-bottom:4px}
.gc-dest p{font-size:13.5px;color:#525252;line-height:1.55;margin:0}
.gc-dest a{color:#0A0A0A;font-weight:700;text-decoration:underline}
.gc-steps{counter-reset:st;display:grid;gap:10px}
.gc-steps li{list-style:none;counter-increment:st;display:grid;grid-template-columns:34px 1fr;gap:12px;align-items:start;background:#fff;border:1px solid #E5E5E5;border-radius:16px;padding:16px 18px}
.gc-steps li::before{content:counter(st);width:30px;height:30px;border-radius:10px;background:#0A0A0A;color:#fff;display:flex;align-items:center;justify-content:center;font:700 13px 'Space Grotesk',sans-serif}
.gc-steps li::before{grid-row:1 / span 2}
.gc-steps li b,.gc-steps li p{grid-column:2}
.gc-steps b{display:block;margin-bottom:2px}
.gc-steps p{font-size:13.5px;color:#525252;line-height:1.55;margin:0}
.sp-lead a{color:#0A0A0A;font-weight:600;text-decoration:underline}
.sp-dark ul{list-style:disc;padding-left:20px}
.sp-dark li{margin:4px 0}
@media(max-width:640px){.gc-panel{padding:12px 12px 10px;border-radius:18px}.gc-legend{font-size:11.5px;gap:6px 14px}}
</style>'''

# ───────────────────────── Gabarit EN (en/index.html) ─────────────────────────
def build_en(slug, title, description, content, breadcrumb_name, extra_ld, fr_alt=None, body_scripts='', og_title=None):
    s = read('en/index.html')
    url = BASE + '/' + slug
    s = re.sub(r'<title>.*?</title>', '<title>' + html.escape(title, quote=False) + '</title>', s, count=1, flags=re.S)
    s = re.sub(r'<meta content="[^"]*" name="description"/>', '<meta content="' + html.escape(description) + '" name="description"/>', s, count=1)
    hl = '<link rel="canonical" href="' + url + '"/>\n<link rel="alternate" hreflang="en" href="' + url + '"/>'
    if fr_alt:
        hl += '\n<link rel="alternate" hreflang="fr" href="' + BASE + '/' + fr_alt + '"/>\n<link rel="alternate" hreflang="x-default" href="' + BASE + '/' + fr_alt + '"/>'
    else:
        hl += '\n<link rel="alternate" hreflang="x-default" href="' + url + '"/>'
    s = re.sub(r'<link rel="canonical" href="[^"]*"/>\n<link rel="alternate" hreflang="en" href="[^"]*"/>\n<link rel="alternate" hreflang="fr" href="[^"]*"/>\n<link rel="alternate" hreflang="x-default" href="[^"]*"/>', hl, s, count=1)
    s = re.sub(r'<meta property="og:title" content="[^"]*"/>', '<meta property="og:title" content="' + html.escape(og_title or title) + '"/>', s, count=1)
    s = re.sub(r'<meta property="og:description" content="[^"]*"/>', '<meta property="og:description" content="' + html.escape(description) + '"/>', s, count=1)
    s = re.sub(r'<meta property="og:url" content="[^"]*"/>', '<meta property="og:url" content="' + url + '"/>', s, count=1)
    bc = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": BASE + "/en"},
        {"@type": "ListItem", "position": 2, "name": breadcrumb_name, "item": url}]}
    ld = '<script type="application/ld+json">' + json.dumps(bc, ensure_ascii=False) + '</script>\n' + \
         '\n'.join('<script type="application/ld+json">' + json.dumps(x, ensure_ascii=False) + '</script>' for x in extra_ld)
    s = re.sub(r'<script type="application/ld\+json">.*?</script>', lambda m: ld, s, count=1, flags=re.S)
    # retire les autres blocs ld+json du gabarit (FAQ de l'accueil, etc.) après le premier remplacement
    first = s.index('<script type="application/ld+json">')
    head_end = s.index('</head>')
    rest = re.sub(r'\n?<script type="application/ld\+json">.*?</script>', '', s[first + len(ld):head_end], flags=re.S)
    s = s[:first + len(ld)] + rest + s[head_end:]
    a = s.index('<!-- ===================== SECTION 1: HERO ===================== -->')
    b = s.index('<footer')
    s = s[:a] + content + '\n' + s[b:]
    if body_scripts:
        s = s.replace('<script src="/cookie-consent.js', body_scripts + '\n<script src="/cookie-consent.js', 1)
    path = slug + '.html'
    os.makedirs(os.path.join(ROOT, os.path.dirname(path)), exist_ok=True)
    write(path, s)
    print('écrit', path, len(s))

def faq_ld(items):
    return {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in items]}

def faq_html(items):
    return '<div class="sp-faq">' + ''.join('<details><summary>%s</summary><div class="a">%s</div></details>' % (html.escape(q, quote=False), a) for q, a in items) + '</div>'

# ───────────────────────── 1. EN — Global coverage ─────────────────────────
cov_faq_en = [
    ("Which ports do you receive cargo from?",
     "Any port with a service to Cotonou. Our regular corridors are Houston, Baltimore, New York and Savannah in North America; Antwerp, Le Havre, Hamburg and Gdańsk in Europe; Jebel Ali in the Gulf; Shanghai and Shenzhen in China. Containers (FCL/LCL), RoRo vehicles and project cargo are all handled."),
    ("Can you act as our Importer of Record in Benin?",
     "Yes. When you have no legal entity in Benin, AD TRANS LOGISTICS can be named as consignee on the bill of lading, provide the Benin tax ID and importer credentials, lodge the customs declaration through its licensed customs-broker partners, settle duties and taxes against your pro-forma and deliver to the final recipient. See our Importer of Record page."),
    ("Do you deliver beyond Benin?",
     "Yes — Cotonou is the natural gateway to the Sahel. We run bonded transit (T1) to Niamey (Niger), Ouagadougou (Burkina Faso) and Bamako (Mali), and road delivery to Lagos and Abuja (Nigeria) through the Sèmè-Kraké border."),
    ("How do we pay from abroad?",
     "By SWIFT bank transfer in USD or EUR against a pro-forma invoice, by card through a secure payment link, or by Mobile Money for West African customers. Nothing is paid before you receive a written, itemised quote."),
    ("How do we follow a shipment?",
     "Every container destuffing is tracked in 13 steps on our tracking page, with an 8-character code sent by WhatsApp. Your customer in Benin can follow it too. Vehicle clearances and transit files are updated by your coordinator on WhatsApp and e-mail, in English."),
    ("What do you need from us to quote?",
     "The commercial invoice, the packing list, the draft bill of lading (or the booking details) and the final destination. We answer within 24 business hours with a full landed-cost estimate: ocean freight if required, duties and taxes, port and terminal charges, our fees and delivery."),
]

cov_content_en = SP_CSS + GC_CSS + '''
<section class="sp-hero bg-white">
<div class="container mx-auto px-6 max-w-[1440px]">
<div style="max-width:860px;">
<div class="tag mb-6"><div class="w-1.5 h-1.5 rounded-full bg-brand"></div>Global coverage · Port of Cotonou</div>
<h1 class="font-heading text-5xl lg:text-[72px] font-bold leading-[1.05] tracking-tight text-brand mb-6">Global coverage.<br/><span class="text-g400 font-medium italic">One gateway: Cotonou.</span></h1>
<p class="sp-lead" style="font-size:18px;max-width:720px;">Wherever your cargo starts — Houston, Baltimore, Antwerp, Le Havre, Hamburg, Jebel Ali or Shanghai — AD TRANS LOGISTICS receives it at the Port of Cotonou, clears it and delivers it across Benin and the Sahel corridors to Niger, Burkina Faso, Mali and Nigeria. One contract, one coordinator, one tracking link.</p>
<div class="flex flex-col sm:flex-row gap-3">
<a class="sp-btn sp-btn-wa" href="''' + WA_EN + '''" target="_blank" rel="noopener">Get a quote on WhatsApp</a>
<a class="sp-btn sp-btn-ghost" href="''' + MAIL_EN + '''">E-mail us your B/L or invoice</a>
</div>
<div class="sp-trust"><span>Reply within 24 business hours</span><span>Quotes in English or French</span><span>IFU 3202465578499 · RCCM RB/COT/24 B 38537</span></div>
</div>
</div>
</section>

<section class="py-10 bg-white">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="gc-panel">
<img src="/assets/world-coverage-en.svg" width="1200" height="500" alt="World map of AD TRANS LOGISTICS corridors: sea routes from Houston, Baltimore, New York, Savannah, Le Havre, Antwerp, Hamburg, Gdańsk, Jebel Ali, Shanghai and Shenzhen to Cotonou, then road corridors to Bamako, Ouagadougou, Niamey, Lagos and Abuja" decoding="async" fetchpriority="high"/>
<div class="gc-legend"><span><i class="hub"></i>Cotonou hub</span><span><i></i>Sea corridors to Cotonou</span><span><i class="road"></i>Road &amp; bonded transit from Cotonou</span></div>
</div>
<div class="gc-stats">
<div class="gc-stat"><b>4 regions</b><small>North America, Europe, the Gulf and Asia — containers, RoRo and project cargo</small></div>
<div class="gc-stat"><b>5 countries</b><small>Delivered from Cotonou: Benin, Niger, Burkina Faso, Mali, Nigeria</small></div>
<div class="gc-stat"><b>13 steps</b><small>Every container destuffing tracked live, step by step</small></div>
<div class="gc-stat"><b>24 h</b><small>Written, itemised quote in English within one business day</small></div>
</div>
</div>
</section>

<section class="py-16 bg-g50">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="gc-k mb-3">Where we receive from</div>
<h2 class="sp-h2">Origin ports we work with every week</h2>
<p class="sp-lead">Shipping lines calling Cotonou connect it to every major port. These are the corridors we know best — ask for any other origin.</p>
<div class="gc-region">
<div class="sp-card"><div class="gc-k">North America</div><h3>USA · East &amp; Gulf Coast</h3><p>Vehicles from Copart and IAAI auctions, RoRo and containerised, plus machinery and general cargo. Grimaldi, ACL and container lines.</p><div class="gc-ports"><span>Houston</span><span>Baltimore</span><span>New York / Newark</span><span>Savannah</span></div></div>
<div class="sp-card"><div class="gc-k">Europe</div><h3>North Sea &amp; Baltic</h3><p>Containers FCL/LCL, RoRo vehicles, industrial equipment and project cargo from the main European hubs.</p><div class="gc-ports"><span>Antwerp</span><span>Le Havre</span><span>Hamburg</span><span>Gdańsk</span></div></div>
<div class="sp-card"><div class="gc-k">Middle East</div><h3>Gulf</h3><p>RoRo vehicles from Dubai and consolidated cargo from Jebel Ali, with pre-shipment document checks to avoid delays on arrival.</p><div class="gc-ports"><span>Jebel Ali / Dubai</span></div></div>
<div class="sp-card"><div class="gc-k">Asia</div><h3>China</h3><p>FCL and LCL from Shanghai and the Pearl River Delta, sourcing support and supplier coordination for importers in Benin and the sub-region.</p><div class="gc-ports"><span>Shanghai</span><span>Shenzhen / Guangzhou</span></div></div>
</div>
<div style="margin-top:28px">
<div class="gc-k mb-3">Shipping lines calling Cotonou</div>
<div class="gc-lines"><span>Maersk</span><span>MSC</span><span>CMA CGM</span><span>Hapag-Lloyd</span><span>Grimaldi</span><span>PIL</span><span>ONE</span><span>COSCO</span></div>
</div>
</div>
</section>

<section class="py-16 bg-white">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="sp-two">
<div>
<div class="gc-k mb-3">What happens at Cotonou</div>
<h2 class="sp-h2">Four services, one coordinator</h2>
<p class="sp-lead">Your shipment is met at the quay by a team that works at the port every day. You get one contact, in English, from arrival to delivery.</p>
<div class="sp-grid">
<div class="sp-card"><div class="sp-num">1</div><h3>Customs clearing</h3><p>Declaration lodged through our licensed customs-broker partners, duties and taxes itemised before payment, release and exit of the port.</p></div>
<div class="sp-card"><div class="sp-num">2</div><h3>Container destuffing</h3><p>13 tracked steps in 4 phases, with the port, terminal and BESC approvals run in parallel. <a href="/en/container-destuffing-cotonou" style="font-weight:700;text-decoration:underline;color:#0A0A0A">How it works →</a></p></div>
<div class="sp-card"><div class="sp-num">3</div><h3>Vehicle clearing</h3><p>Used and new vehicles, RoRo or in containers: valuation, duties, IM8 declaration and registration support in Benin.</p></div>
<div class="sp-card"><div class="sp-num">4</div><h3>Importer of Record</h3><p>No entity in Benin? We are named consignee, provide the importer credentials and handle compliance end to end. <a href="/en/importer-of-record-benin" style="font-weight:700;text-decoration:underline;color:#0A0A0A">IOR service →</a></p></div>
</div>
</div>
<div class="sp-dark">
<h3>For exporters and forwarders abroad</h3>
<p>Appoint AD TRANS LOGISTICS as your destination agent in Benin. Before the vessel sails we check your documents, confirm the BESC/ECTN requirement and send a landed-cost estimate, so nothing waits on the quay.</p>
<ul>
<li>Pre-arrival document check (B/L, invoice, packing list, certificate of origin)</li>
<li>BESC/ECTN guidance — mandatory for Benin, issued at the port of loading</li>
<li>Duties, taxes and port charges estimated before departure</li>
<li>Consignee / Importer of Record when you have no local entity</li>
<li>Updates by WhatsApp and e-mail in English, tracking link for your customer</li>
<li>Onward delivery to Niger, Burkina Faso, Mali and Nigeria under one contract</li>
</ul>
<a class="sp-btn sp-btn-ghost" style="margin-top:20px" href="''' + MAIL_EN.replace('quote%20request', 'destination%20agent%20in%20Benin') + '''">Become a partner →</a>
</div>
</div>
</div>
</section>

<section class="py-16 bg-g50">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="gc-k mb-3">Where we deliver</div>
<h2 class="sp-h2">From the quay to the final door</h2>
<p class="sp-lead">Cotonou is the shortest sea-to-Sahel route for Niger, Burkina Faso and Mali, and the practical gateway for western Nigeria.</p>
<div class="gc-dest">
<div><b>Benin</b><p>Cotonou, Porto-Novo, Parakou and nationwide delivery. Short-term storage and regrouping at the port.</p></div>
<div><b>Niger</b><p>Bonded transit (T1) Cotonou → Niamey under customs escort via Malanville–Gaya. <a href="/en/niger">Niger corridor →</a></p></div>
<div><b>Burkina Faso</b><p>Transit to Ouagadougou and Bobo-Dioulasso, including fuel and mining-sector cargo.</p></div>
<div><b>Mali</b><p>Transit to Bamako with guarantee and escort organised from Cotonou.</p></div>
<div><b>Nigeria</b><p>Clearing in Cotonou and delivery to Lagos (own warehouse at Alasia, Ojo) and Abuja through Sèmè-Kraké. <a href="/en/nigeria">Nigeria corridor →</a></p></div>
</div>
</div>
</section>

<section class="py-16 bg-white">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="gc-k mb-3">Paying from abroad</div>
<h2 class="sp-h2">Simple, documented, no surprises</h2>
<p class="sp-lead">You receive a pro-forma invoice first. Duties, taxes and port charges are passed through at cost with the official receipts; our fees are shown on a separate line.</p>
<div class="gc-pay">
<div><b>SWIFT bank transfer</b><p>USD or EUR to our corporate account — details on every pro-forma invoice.</p></div>
<div><b>Card payment</b><p>Visa / Mastercard through a secure payment link sent with the invoice.</p></div>
<div><b>Mobile Money</b><p>MTN MoMo, Moov and Celtiis for customers in West Africa.</p></div>
<div><b>On account</b><p>Monthly statement for forwarders and regular shippers after a first shipment.</p></div>
</div>
</div>
</section>

<section class="py-16 bg-g50">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="sp-two">
<div>
<div class="gc-k mb-3">FAQ</div>
<h2 class="sp-h2">Shipping to Cotonou, answered</h2>
''' + faq_html(cov_faq_en) + '''
</div>
<div class="sp-dark">
<h3>Ready to ship through Cotonou?</h3>
<p>Send the B/L or the invoice and the destination. You get a full landed-cost quote and a timeline within 24 business hours.</p>
<a class="sp-btn sp-btn-wa" style="margin-top:20px" href="''' + WA_EN + '''" target="_blank" rel="noopener">WhatsApp +229 01 97 50 05 55</a>
<a class="sp-btn sp-btn-ghost" style="margin-top:10px" href="''' + MAIL_EN + '''">adtranslogistics@hotmail.com</a>
<p style="margin-top:18px;font-size:13px">Also in French: <a href="/couverture-mondiale" style="color:#fff;text-decoration:underline">Couverture mondiale</a></p>
</div>
</div>
</div>
</section>
'''

cov_ld_en = [
    {"@context": "https://schema.org", "@type": "Service", "name": "International freight forwarding to Benin and West Africa via the Port of Cotonou",
     "provider": {"@type": "LocalBusiness", "name": "AD TRANS LOGISTICS", "url": BASE, "telephone": "+2290197500555", "email": "adtranslogistics@hotmail.com",
                  "address": {"@type": "PostalAddress", "addressLocality": "Cotonou", "addressCountry": "BJ"}},
     "serviceType": "Freight forwarding, customs clearing, container destuffing, Importer of Record, bonded transit",
     "areaServed": [{"@type": "Country", "name": n} for n in ("Benin", "Niger", "Burkina Faso", "Mali", "Nigeria")],
     "availableLanguage": ["en", "fr"], "url": BASE + "/en/global-coverage"},
    faq_ld(cov_faq_en)]

build_en('en/global-coverage',
         'Global Coverage — Freight to Benin & West Africa via the Port of Cotonou | AD TRANS LOGISTICS',
         'Ship from North America, Europe, the Gulf and Asia to Cotonou, then onward to Benin, Niger, Burkina Faso, Mali and Nigeria. Customs clearing, container destuffing with live tracking, Importer of Record. Quotes in English within 24 hours.',
         cov_content_en, 'Global coverage', cov_ld_en, fr_alt='couverture-mondiale',
         og_title='Global coverage — one gateway: Cotonou | AD TRANS LOGISTICS')

# ───────────────────────── 2. FR — Couverture mondiale ─────────────────────────
cov_faq_fr = [
    ("Depuis quels ports réceptionnez-vous les marchandises ?",
     "Depuis tout port desservant Cotonou. Nos corridors réguliers : Houston, Baltimore, New York et Savannah en Amérique du Nord ; Anvers, Le Havre, Hambourg et Gdańsk en Europe ; Jebel Ali dans le Golfe ; Shanghai et Shenzhen en Chine. Conteneurs (FCL/LCL), véhicules RoRo et colis hors gabarit sont pris en charge."),
    ("Pouvez-vous être notre importateur de référence (IOR) au Bénin ?",
     "Oui. Si vous n’avez pas d’entité au Bénin, AD TRANS LOGISTICS peut être désigné destinataire sur le connaissement, fournir l’IFU et la carte d’importateur, déposer la déclaration via ses partenaires commissionnaires en douane agréés, régler droits et taxes sur votre pro-forma et livrer le destinataire final."),
    ("Livrez-vous au-delà du Bénin ?",
     "Oui : Cotonou est la porte naturelle du Sahel. Nous organisons le transit sous douane (T1) vers Niamey, Ouagadougou et Bamako, et la livraison routière vers Lagos et Abuja par Sèmè-Kraké."),
    ("Comment un client à l’étranger nous paie-t-il ?",
     "Par virement SWIFT en USD ou EUR sur facture pro-forma, par carte via un lien de paiement sécurisé, ou par Mobile Money pour l’Afrique de l’Ouest. Aucun paiement avant un devis écrit et détaillé."),
    ("Comment suivre une expédition ?",
     "Chaque dépotage de conteneur est suivi en 13 étapes sur la page Suivi, avec un code à 8 caractères envoyé par WhatsApp. Votre client au Bénin peut le suivre aussi. Les dédouanements de véhicules et les dossiers de transit sont mis à jour par votre coordinateur sur WhatsApp et par e-mail."),
    ("De quoi avez-vous besoin pour chiffrer ?",
     "La facture commerciale, la liste de colisage, le projet de connaissement (ou la réservation) et la destination finale. Réponse sous 24 h ouvrées avec un coût rendu complet : fret si nécessaire, droits et taxes, frais portuaires et de terminal, nos honoraires et la livraison."),
]

cov_content_fr = SP_CSS + GC_CSS + '''
<section class="sp-hero bg-white">
<div class="container mx-auto px-6 max-w-[1440px]">
<div style="max-width:860px;">
<div class="tag mb-6"><div class="w-1.5 h-1.5 rounded-full bg-brand"></div>Couverture mondiale · Port de Cotonou</div>
<h1 class="font-heading text-5xl lg:text-[72px] font-bold leading-[1.05] tracking-tight text-brand mb-6">Couverture mondiale.<br/><span class="text-g400 font-medium italic">Une porte d’entrée : Cotonou.</span></h1>
<p class="sp-lead" style="font-size:18px;max-width:720px;">Que votre marchandise parte de Houston, Baltimore, Anvers, Le Havre, Hambourg, Jebel Ali ou Shanghai, AD TRANS LOGISTICS la réceptionne au port de Cotonou, la dédouane et la livre au Bénin et sur les corridors du Sahel : Niger, Burkina Faso, Mali, Nigeria. Un contrat, un coordinateur, un lien de suivi.</p>
<div class="flex flex-col sm:flex-row gap-3">
<a class="sp-btn sp-btn-wa" href="''' + WA_FR + '''" target="_blank" rel="noopener">Devis sur WhatsApp</a>
<a class="sp-btn sp-btn-ghost" href="/demande?service=importation">Soumettre une demande</a>
</div>
<div class="sp-trust"><span>Réponse sous 24 h ouvrées</span><span>Devis en français ou en anglais</span><span>IFU 3202465578499 · RCCM RB/COT/24 B 38537</span></div>
</div>
</div>
</section>

<section class="py-10 bg-white">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="gc-panel">
<img src="/assets/world-coverage-fr.svg" width="1200" height="500" alt="Carte des corridors AD TRANS LOGISTICS : routes maritimes depuis Houston, Baltimore, New York, Savannah, Le Havre, Anvers, Hambourg, Gdańsk, Jebel Ali, Shanghai et Shenzhen vers Cotonou, puis corridors routiers vers Bamako, Ouagadougou, Niamey, Lagos et Abuja" decoding="async" fetchpriority="high"/>
<div class="gc-legend"><span><i class="hub"></i>Hub Cotonou</span><span><i></i>Corridors maritimes vers Cotonou</span><span><i class="road"></i>Route et transit sous douane depuis Cotonou</span></div>
</div>
<div class="gc-stats">
<div class="gc-stat"><b>4 régions</b><small>Amérique du Nord, Europe, Golfe et Asie — conteneurs, RoRo et colis lourds</small></div>
<div class="gc-stat"><b>5 pays</b><small>Livrés depuis Cotonou : Bénin, Niger, Burkina Faso, Mali, Nigeria</small></div>
<div class="gc-stat"><b>13 étapes</b><small>Chaque dépotage de conteneur suivi en direct, étape par étape</small></div>
<div class="gc-stat"><b>24 h</b><small>Devis écrit et détaillé sous un jour ouvré</small></div>
</div>
</div>
</section>

<section class="py-16 bg-g50">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="gc-k mb-3">D’où nous réceptionnons</div>
<h2 class="sp-h2">Les ports d’origine que nous traitons chaque semaine</h2>
<p class="sp-lead">Les compagnies qui touchent Cotonou le relient à tous les grands ports. Voici les corridors que nous connaissons le mieux — demandez-nous toute autre origine.</p>
<div class="gc-region">
<div class="sp-card"><div class="gc-k">Amérique du Nord</div><h3>USA · côtes Est et Golfe</h3><p>Véhicules des enchères Copart et IAAI, en RoRo ou en conteneur, machines et marchandises générales. Grimaldi, ACL et lignes conteneurs.</p><div class="gc-ports"><span>Houston</span><span>Baltimore</span><span>New York / Newark</span><span>Savannah</span></div></div>
<div class="sp-card"><div class="gc-k">Europe</div><h3>Mer du Nord et Baltique</h3><p>Conteneurs FCL/LCL, véhicules RoRo, équipements industriels et colis hors gabarit depuis les grands hubs européens.</p><div class="gc-ports"><span>Anvers</span><span>Le Havre</span><span>Hambourg</span><span>Gdańsk</span></div></div>
<div class="sp-card"><div class="gc-k">Moyen-Orient</div><h3>Golfe</h3><p>Véhicules RoRo depuis Dubaï et groupage depuis Jebel Ali, avec contrôle des documents avant embarquement pour éviter les blocages à l’arrivée.</p><div class="gc-ports"><span>Jebel Ali / Dubaï</span></div></div>
<div class="sp-card"><div class="gc-k">Asie</div><h3>Chine</h3><p>FCL et LCL depuis Shanghai et le delta de la rivière des Perles, appui au sourcing et coordination fournisseurs pour les importateurs du Bénin et de la sous-région.</p><div class="gc-ports"><span>Shanghai</span><span>Shenzhen / Guangzhou</span></div></div>
</div>
<div style="margin-top:28px">
<div class="gc-k mb-3">Compagnies maritimes touchant Cotonou</div>
<div class="gc-lines"><span>Maersk</span><span>MSC</span><span>CMA CGM</span><span>Hapag-Lloyd</span><span>Grimaldi</span><span>PIL</span><span>ONE</span><span>COSCO</span></div>
</div>
</div>
</section>

<section class="py-16 bg-white">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="sp-two">
<div>
<div class="gc-k mb-3">Ce qui se passe à Cotonou</div>
<h2 class="sp-h2">Quatre services, un seul coordinateur</h2>
<p class="sp-lead">Votre expédition est accueillie à quai par une équipe présente au port chaque jour. Un seul interlocuteur, de l’arrivée à la livraison.</p>
<div class="sp-grid">
<div class="sp-card"><div class="sp-num">1</div><h3>Dédouanement</h3><p>Déclaration déposée via nos partenaires commissionnaires agréés, droits et taxes détaillés avant paiement, mainlevée et sortie du port.</p></div>
<div class="sp-card"><div class="sp-num">2</div><h3>Dépotage de conteneur</h3><p>13 étapes en 4 phases, validations Port, Terminal et BESC lancées en parallèle. <a href="/depotage-conteneur-cotonou" style="font-weight:700;text-decoration:underline;color:#0A0A0A">Comment ça marche →</a></p></div>
<div class="sp-card"><div class="sp-num">3</div><h3>Dédouanement de véhicules</h3><p>Occasion ou neuf, RoRo ou conteneur : valeur, droits, déclaration IM8 et appui à l’immatriculation. <a href="/simulateur" style="font-weight:700;text-decoration:underline;color:#0A0A0A">Simuler →</a></p></div>
<div class="sp-card"><div class="sp-num">4</div><h3>Importateur de référence (IOR)</h3><p>Pas d’entité au Bénin ? Nous sommes désignés destinataire, fournissons les références d’importateur et gérons la conformité de bout en bout.</p></div>
</div>
</div>
<div class="sp-dark">
<h3>Pour les exportateurs et transitaires à l’étranger</h3>
<p>Désignez AD TRANS LOGISTICS comme agent de destination au Bénin. Avant le départ du navire, nous vérifions vos documents, confirmons l’obligation de BESC et envoyons une estimation du coût rendu : rien n’attend à quai.</p>
<ul>
<li>Contrôle des documents avant arrivée (BL, facture, liste de colisage, certificat d’origine)</li>
<li>BESC obligatoire pour le Bénin, émis au port d’embarquement</li>
<li>Droits, taxes et frais portuaires estimés avant le départ</li>
<li>Destinataire / importateur de référence si vous n’avez pas d’entité locale</li>
<li>Mises à jour WhatsApp et e-mail, lien de suivi pour votre client</li>
<li>Livraison vers le Niger, le Burkina Faso, le Mali et le Nigeria sous un seul contrat</li>
</ul>
<a class="sp-btn sp-btn-ghost" style="margin-top:20px" href="mailto:adtranslogistics@hotmail.com?subject=Agent%20de%20destination%20%C3%A0%20Cotonou">Devenir partenaire →</a>
</div>
</div>
</div>
</section>

<section class="py-16 bg-g50">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="gc-k mb-3">Où nous livrons</div>
<h2 class="sp-h2">Du quai à la porte du destinataire</h2>
<p class="sp-lead">Cotonou est la route mer-Sahel la plus courte pour le Niger, le Burkina Faso et le Mali, et la porte pratique de l’ouest du Nigeria.</p>
<div class="gc-dest">
<div><b>Bénin</b><p>Cotonou, Porto-Novo, Parakou et tout le territoire. Stockage court et regroupement au port.</p></div>
<div><b>Niger</b><p>Transit sous douane (T1) Cotonou → Niamey sous escorte via Malanville–Gaya. <a href="/transit-niger">Corridor Niger →</a></p></div>
<div><b>Burkina Faso</b><p>Transit vers Ouagadougou et Bobo-Dioulasso, y compris carburant et fret minier. <a href="/transit-burkina">Corridor Burkina →</a></p></div>
<div><b>Mali</b><p>Transit vers Bamako, garantie et escorte organisées depuis Cotonou. <a href="/transit-mali">Corridor Mali →</a></p></div>
<div><b>Nigeria</b><p>Dédouanement à Cotonou et livraison à Lagos (entrepôt à Alasia, Ojo) et Abuja par Sèmè-Kraké. <a href="/transit-nigeria">Corridor Nigeria →</a></p></div>
</div>
</div>
</section>

<section class="py-16 bg-white">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="gc-k mb-3">Paiement depuis l’étranger</div>
<h2 class="sp-h2">Simple, documenté, sans surprise</h2>
<p class="sp-lead">Vous recevez d’abord une facture pro-forma. Droits, taxes et frais portuaires sont refacturés au coût réel avec les reçus officiels ; nos honoraires figurent sur une ligne séparée.</p>
<div class="gc-pay">
<div><b>Virement SWIFT</b><p>USD ou EUR sur notre compte société — coordonnées sur chaque pro-forma.</p></div>
<div><b>Carte bancaire</b><p>Visa / Mastercard via un lien de paiement sécurisé envoyé avec la facture.</p></div>
<div><b>Mobile Money</b><p>MTN MoMo, Moov et Celtiis pour les clients d’Afrique de l’Ouest.</p></div>
<div><b>En compte</b><p>Relevé mensuel pour les transitaires et chargeurs réguliers après une première expédition.</p></div>
</div>
</div>
</section>

<section class="py-16 bg-g50">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="sp-two">
<div>
<div class="gc-k mb-3">FAQ</div>
<h2 class="sp-h2">Expédier vers Cotonou : vos questions</h2>
''' + faq_html(cov_faq_fr) + '''
</div>
<div class="sp-dark">
<h3>Prêt à expédier via Cotonou ?</h3>
<p>Envoyez le connaissement ou la facture et la destination. Vous recevez un devis complet (coût rendu) et un calendrier sous 24 h ouvrées.</p>
<a class="sp-btn sp-btn-wa" style="margin-top:20px" href="''' + WA_FR + '''" target="_blank" rel="noopener">WhatsApp +229 01 97 50 05 55</a>
<a class="sp-btn sp-btn-ghost" style="margin-top:10px" href="mailto:adtranslogistics@hotmail.com?subject=Exp%C3%A9dition%20vers%20Cotonou%20%E2%80%94%20demande%20de%20devis">adtranslogistics@hotmail.com</a>
<p style="margin-top:18px;font-size:13px">In English: <a href="/en/global-coverage" style="color:#fff;text-decoration:underline">Global coverage</a></p>
</div>
</div>
</div>
</section>
'''

cov_ld_fr = [
    {"@context": "https://schema.org", "@type": "Service", "name": "Transit international vers le Bénin et l’Afrique de l’Ouest via le port de Cotonou",
     "provider": {"@type": "LocalBusiness", "name": "AD TRANS LOGISTICS", "url": BASE, "telephone": "+2290197500555", "email": "adtranslogistics@hotmail.com",
                  "address": {"@type": "PostalAddress", "addressLocality": "Cotonou", "addressCountry": "BJ"}},
     "serviceType": "Transitaire, dédouanement, dépotage de conteneurs, importateur de référence, transit sous douane",
     "areaServed": [{"@type": "Country", "name": n} for n in ("Bénin", "Niger", "Burkina Faso", "Mali", "Nigeria")],
     "availableLanguage": ["fr", "en"], "url": BASE + "/couverture-mondiale"},
    faq_ld(cov_faq_fr)]

build_fr('couverture-mondiale',
         'Couverture mondiale : fret vers le Bénin et l’Afrique de l’Ouest via le port de Cotonou | AD TRANS LOGISTICS',
         'Depuis l’Amérique du Nord, l’Europe, le Golfe et l’Asie vers Cotonou, puis vers le Bénin, le Niger, le Burkina Faso, le Mali et le Nigeria. Dédouanement, dépotage suivi en direct, importateur de référence. Devis sous 24 h.',
         None, cov_content_fr, 'Couverture mondiale', cov_ld_fr,
         og_title='Couverture mondiale — une porte d’entrée : Cotonou | AD TRANS LOGISTICS', en_alt='en/global-coverage')

# ───────────────────────── 3. EN — Importer of Record ─────────────────────────
ior_faq = [
    ("What does the Importer of Record service include?",
     "AD TRANS LOGISTICS is named as consignee on the bill of lading, provides its Benin tax ID (IFU) and importer credentials, obtains or validates the BESC/ECTN, lodges the customs declaration through its licensed customs-broker partners, settles duties, taxes and port charges against your pro-forma, and delivers the goods to your customer or project site with the full document pack."),
    ("Who uses it?",
     "Equipment and spare-part suppliers with customers in Benin, Niger, Burkina Faso or Mali; e-commerce and marketplace sellers; NGOs and contractors delivering to project sites; vehicle exporters; and foreign forwarders who need a reliable destination agent at the Port of Cotonou."),
    ("Which goods can you import as IOR?",
     "General cargo, vehicles, machinery, spare parts, IT and telecom equipment, consumer goods and project cargo. Regulated goods (pharmaceuticals, food, chemicals, telecom devices) need the relevant permits — we tell you before shipping. Prohibited goods are declined."),
    ("How are duties and taxes paid?",
     "Benin applies the ECOWAS Common External Tariff (0 to 35 % duty) plus 18 % VAT and statutory levies on the CIF value. We send an itemised estimate before departure and a pro-forma invoice before clearance; you pay by SWIFT or card and receive the official customs receipts with our invoice."),
    ("How long does it take?",
     "With documents in order before arrival, 3 to 5 working days for vehicles and 5 to 7 working days for a container of general cargo, from vessel arrival to release. Transit to Niamey, Ouagadougou or Bamako adds 5 to 10 days depending on the corridor."),
    ("What do you need from us?",
     "Commercial invoice, packing list, bill of lading (draft is fine to quote), certificate of origin where applicable, the final recipient and address, and the HS codes if you have them. We confirm everything in writing before you ship."),
]

ior_content = SP_CSS + GC_CSS + '''
<section class="sp-hero bg-white">
<div class="container mx-auto px-6 max-w-[1440px]">
<div style="max-width:860px;">
<div class="tag mb-6"><div class="w-1.5 h-1.5 rounded-full bg-brand"></div>Importer of Record · Benin &amp; the Sahel corridors</div>
<h1 class="font-heading text-5xl lg:text-[72px] font-bold leading-[1.05] tracking-tight text-brand mb-6">Your Importer of Record<br/><span class="text-g400 font-medium italic">in Benin</span></h1>
<p class="sp-lead" style="font-size:18px;max-width:720px;">Sell and deliver in Benin, Niger, Burkina Faso or Mali without opening a local company. AD TRANS LOGISTICS imports in its own name at the Port of Cotonou, pays duties and taxes on your behalf, and hands the goods to your customer with every receipt.</p>
<div class="flex flex-col sm:flex-row gap-3">
<a class="sp-btn sp-btn-wa" href="''' + WA_EN.replace('a%20shipment%20to%20Cotonou', 'an%20Importer%20of%20Record%20service%20in%20Benin') + '''" target="_blank" rel="noopener">Ask for an IOR quote</a>
<a class="sp-btn sp-btn-ghost" href="/en/global-coverage">See our global coverage</a>
</div>
<div class="sp-trust"><span>Registered freight forwarder at the Port of Cotonou</span><span>IFU 3202465578499 · RCCM RB/COT/24 B 38537</span><span>English &amp; French</span></div>
</div>
</div>
</section>

<section class="py-16 bg-g50">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="gc-k mb-3">What we do as IOR</div>
<h2 class="sp-h2">Compliance handled end to end</h2>
<div class="sp-grid">
<div class="sp-card"><div class="sp-num">1</div><h3>Consignee on the B/L</h3><p>We are named as consignee / notify party, so the shipping line, the port and customs have one accountable local party.</p></div>
<div class="sp-card"><div class="sp-num">2</div><h3>Importer credentials</h3><p>Benin tax ID (IFU) and importer registration used for the declaration — no need for your own entity or bank account in Benin.</p></div>
<div class="sp-card"><div class="sp-num">3</div><h3>BESC / ECTN</h3><p>The electronic cargo tracking note is mandatory for every import into Benin. We guide its issuance at loading and validate it before arrival.</p></div>
<div class="sp-card"><div class="sp-num">4</div><h3>Customs declaration</h3><p>Lodged through our licensed customs-broker partners, with HS classification, valuation and the permits for regulated goods.</p></div>
<div class="sp-card"><div class="sp-num">5</div><h3>Duties &amp; taxes</h3><p>Paid on your behalf against a pro-forma invoice; official customs and port receipts returned to you at cost, no mark-up.</p></div>
<div class="sp-card"><div class="sp-num">6</div><h3>Delivery &amp; documents</h3><p>Handover to your customer in Benin or bonded transit to Niger, Burkina Faso and Mali, then the full document pack for your records.</p></div>
</div>
</div>
</section>

<section class="py-16 bg-white">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="sp-two">
<div>
<div class="gc-k mb-3">How it works</div>
<h2 class="sp-h2">Five steps, written confirmation at each one</h2>
<ol class="gc-steps">
<li><b>Quote</b><p>Send invoice, packing list, draft B/L and destination. Within 24 business hours you receive the landed-cost estimate: duties, taxes, port and terminal charges, our IOR fee and delivery.</p></li>
<li><b>Pre-shipment check</b><p>We confirm HS codes, permits for regulated goods and the BESC/ECTN, and give you the exact consignee and notify details for the bill of lading.</p></li>
<li><b>Arrival &amp; clearance</b><p>Documents are lodged before the vessel berths. Duties and taxes are paid against your pro-forma; you follow the file on WhatsApp and e-mail.</p></li>
<li><b>Delivery</b><p>Release, exit of the port and delivery to the final recipient — or bonded transit to Niamey, Ouagadougou or Bamako under one contract.</p></li>
<li><b>Closing pack</b><p>Customs receipts, delivery note signed by the recipient, our invoice with duties and charges at cost on separate lines.</p></li>
</ol>
</div>
<div class="sp-dark">
<h3>Pricing</h3>
<p>One IOR fee per shipment, quoted in advance, plus duties, taxes and port charges passed through at cost with the official receipts. Ocean freight can be included if you want a single door-to-door price.</p>
<ul>
<li>Written quote before you ship, valid for the stated period</li>
<li>No payment before the pro-forma invoice</li>
<li>SWIFT (USD/EUR), card or Mobile Money</li>
<li>Monthly account available for regular shippers</li>
</ul>
<a class="sp-btn sp-btn-ghost" style="margin-top:20px" href="''' + MAIL_EN.replace('Shipment%20to%20Cotonou%20%E2%80%94%20quote%20request', 'Importer%20of%20Record%20in%20Benin') + '''">E-mail the documents →</a>
</div>
</div>
</div>
</section>

<section class="py-16 bg-g50">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="sp-two">
<div>
<div class="gc-k mb-3">FAQ</div>
<h2 class="sp-h2">Importer of Record in Benin, answered</h2>
''' + faq_html(ior_faq) + '''
</div>
<div class="sp-dark">
<h3>Talk to the team</h3>
<p>Tell us what you ship, where it goes and when it sails. We reply within 24 business hours, in English.</p>
<a class="sp-btn sp-btn-wa" style="margin-top:20px" href="''' + WA_EN.replace('a%20shipment%20to%20Cotonou', 'an%20Importer%20of%20Record%20service%20in%20Benin') + '''" target="_blank" rel="noopener">WhatsApp +229 01 97 50 05 55</a>
<a class="sp-btn sp-btn-ghost" style="margin-top:10px" href="/en/track">Track a container</a>
</div>
</div>
</div>
</section>
'''

ior_ld = [
    {"@context": "https://schema.org", "@type": "Service", "name": "Importer of Record (IOR) in Benin",
     "provider": {"@type": "LocalBusiness", "name": "AD TRANS LOGISTICS", "url": BASE, "telephone": "+2290197500555",
                  "address": {"@type": "PostalAddress", "addressLocality": "Cotonou", "addressCountry": "BJ"}},
     "serviceType": "Importer of Record, customs compliance, consignee services",
     "areaServed": [{"@type": "Country", "name": n} for n in ("Benin", "Niger", "Burkina Faso", "Mali")],
     "availableLanguage": ["en", "fr"], "url": BASE + "/en/importer-of-record-benin"},
    faq_ld(ior_faq)]

build_en('en/importer-of-record-benin',
         'Importer of Record (IOR) in Benin — Ship to West Africa without a local entity | AD TRANS LOGISTICS',
         'AD TRANS LOGISTICS acts as your Importer of Record at the Port of Cotonou: consignee on the B/L, Benin tax ID, BESC/ECTN, customs declaration, duties paid on your behalf, delivery in Benin or transit to Niger, Burkina Faso and Mali.',
         ior_content, 'Importer of Record in Benin', ior_ld, fr_alt=None,
         og_title='Importer of Record in Benin — AD TRANS LOGISTICS')

# ───────────────────────── 4. EN — Container destuffing ─────────────────────────
dep_faq = [
    ("How long does container destuffing take at the Port of Cotonou?",
     "It depends on the shipping line, the speed of the four approvals (Port of Cotonou, Bénin Manutention, Bénin Terminal, BESC) and document readiness. At AD TRANS LOGISTICS the four approvals start in parallel as soon as the customs declaration is lodged, which avoids the days lost in a sequential process. You see every step live on the tracking page."),
    ("Which documents are needed?",
     "The original bill of lading or telex release, the commercial invoice, the packing list, the BESC/ECTN, the importer’s tax ID (IFU) and importer card — or our Importer of Record service if you have none. For a container of vehicles, each vehicle’s title is needed for the IM8 declarations."),
    ("How do I follow my container?",
     "As soon as the file is opened you receive an 8-character tracking code by WhatsApp. On adtranslogistics.com/en/track that code (or your container number + B/L) shows the 13 steps, the current phase, messages from our team and the notification history."),
    ("What do you charge?",
     "A fixed destuffing fee per container plus pass-through charges (port, terminal, handling, BESC) at cost with receipts. Ask for a quote with your B/L — reply within 24 business hours."),
    ("Can my customer in Benin follow the same file?",
     "Yes. The tracking code works for anyone you share it with, in French on /suivi and in English on /en/track. Your customer can also open a client account to see all their containers on one screen."),
]

dep_content = SP_CSS + GC_CSS + '''
<section class="sp-hero bg-white">
<div class="container mx-auto px-6 max-w-[1440px]">
<div style="max-width:860px;">
<div class="tag mb-6"><div class="w-1.5 h-1.5 rounded-full bg-brand"></div>Container destuffing · Port of Cotonou</div>
<h1 class="font-heading text-5xl lg:text-[72px] font-bold leading-[1.05] tracking-tight text-brand mb-6">Container destuffing<br/><span class="text-g400 font-medium italic">tracked step by step</span></h1>
<p class="sp-lead" style="font-size:18px;max-width:720px;">From document exchange to handover of the goods: 13 steps in 4 phases, run by our team at the port and visible to you and your customer in real time. Port, terminal and BESC approvals are launched in parallel to save days.</p>
<div class="flex flex-col sm:flex-row gap-3">
<a class="sp-btn sp-btn-dark" href="/en/track">Track a container</a>
<a class="sp-btn sp-btn-wa" href="''' + WA_EN.replace('a%20shipment%20to%20Cotonou', 'container%20destuffing%20at%20Cotonou') + '''" target="_blank" rel="noopener">Get a destuffing quote</a>
</div>
<div class="sp-trust"><span>WhatsApp notification at every step</span><span>Fixed fee + charges at cost</span><span>Reply within 24 business hours</span></div>
</div>
</div>
</section>

<section class="py-16 bg-g50">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="gc-k mb-3">The process</div>
<h2 class="sp-h2">4 phases, 13 steps, nothing left to guess</h2>
<div class="sp-phases">
<div class="sp-phase"><h3>Documents</h3><ul><li>Document exchange</li><li>Delivery order (BAD)</li><li>Provisional destuffing list</li><li>Transfer request</li><li>Customs declaration of the container</li></ul></div>
<div class="sp-phase par"><h3>Approvals — in parallel</h3><ul><li>Port of Cotonou invoice</li><li>Bénin Manutention invoice</li><li>Bénin Terminal invoice</li><li>BESC / ECTN</li></ul></div>
<div class="sp-phase"><h3>Release</h3><ul><li>Release authorised</li><li>Positioning request</li></ul></div>
<div class="sp-phase"><h3>Destuffing</h3><ul><li>Destuffing sheets</li><li>Deconsolidation &amp; handover of goods</li></ul></div>
</div>
</div>
</section>

<section class="py-16 bg-white">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="sp-two">
<div>
<div class="gc-k mb-3">What you need</div>
<h2 class="sp-h2">Documents to send before arrival</h2>
<div class="sp-doc">
<div>Bill of lading<small>original or telex release</small></div>
<div>Commercial invoice<small>with the packing list</small></div>
<div>BESC / ECTN<small>issued at the port of loading</small></div>
<div>Importer credentials<small>IFU and importer card — or our IOR service</small></div>
<div>Vehicle titles<small>for containers of vehicles (IM8)</small></div>
<div>Final recipient<small>name, phone, delivery address</small></div>
</div>
</div>
<div class="sp-dark">
<h3>Live tracking, in English</h3>
<p>Each file has an 8-character code. Enter it on the tracking page to see the current phase, the steps completed with date and time, messages from the team and the notification history. Share it with your customer — it is the same file.</p>
<a class="sp-btn sp-btn-ghost" style="margin-top:20px" href="/en/track">Open the tracking page →</a>
</div>
</div>
</div>
</section>

<section class="py-16 bg-g50">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="sp-two">
<div>
<div class="gc-k mb-3">FAQ</div>
<h2 class="sp-h2">Container destuffing at Cotonou, answered</h2>
''' + faq_html(dep_faq) + '''
</div>
<div class="sp-dark">
<h3>Send your B/L, get a quote</h3>
<p>Fixed destuffing fee, charges at cost, and a timeline. Reply within 24 business hours.</p>
<a class="sp-btn sp-btn-wa" style="margin-top:20px" href="''' + WA_EN.replace('a%20shipment%20to%20Cotonou', 'container%20destuffing%20at%20Cotonou') + '''" target="_blank" rel="noopener">WhatsApp +229 01 97 50 05 55</a>
<p style="margin-top:18px;font-size:13px">En français : <a href="/depotage-conteneur-cotonou" style="color:#fff;text-decoration:underline">Dépotage de conteneur à Cotonou</a></p>
</div>
</div>
</div>
</section>
'''

dep_ld = [
    {"@context": "https://schema.org", "@type": "Service", "name": "Container destuffing at the Port of Cotonou",
     "provider": {"@type": "LocalBusiness", "name": "AD TRANS LOGISTICS", "url": BASE, "telephone": "+2290197500555",
                  "address": {"@type": "PostalAddress", "addressLocality": "Cotonou", "addressCountry": "BJ"}},
     "serviceType": "Container destuffing, deconsolidation, port logistics", "areaServed": {"@type": "Country", "name": "Benin"},
     "availableLanguage": ["en", "fr"], "url": BASE + "/en/container-destuffing-cotonou"},
    faq_ld(dep_faq)]

build_en('en/container-destuffing-cotonou',
         'Container Destuffing at the Port of Cotonou — 13 steps tracked live | AD TRANS LOGISTICS',
         'Container destuffing (unstuffing) at the Port of Cotonou by AD TRANS LOGISTICS: 13 tracked steps, Port / Terminal / BESC approvals in parallel, WhatsApp notification at every step, tracking in English. Quote within 24 hours.',
         dep_content, 'Container destuffing', dep_ld, fr_alt='depotage-conteneur-cotonou',
         og_title='Container destuffing at Cotonou — tracked step by step | AD TRANS LOGISTICS')

# ───────────────────────── 5. EN — Track ─────────────────────────
suivi = read('suivi.html')
tk_css = suivi[suivi.index('<style>\n.tk-search'):suivi.index('</style>', suivi.index('<style>\n.tk-search')) + len('</style>')]
tk_js = suivi[suivi.index('<script src="/config.js?v=4"></script>'):suivi.index('    <!-- Enregistrement du Service Worker -->')]
for fr, en in [
    ("<h3>Aucun dossier trouvé</h3>", "<h3>No file found</h3>"),
    ("'Vérifiez le code de suivi (8 caractères, sans espace). Si votre conteneur vient d’arriver, notre équipe l’enregistre dès l’échange documentaire.'", "'Check the tracking code (8 characters, no spaces). If your container has just arrived, our team opens the file at the document exchange step.'"),
    ("'Vérifiez le numéro de conteneur et le numéro de connaissement : ils doivent correspondre exactement à votre BL.'", "'Check the container number and the bill of lading number: they must match your B/L exactly.'"),
    ("Besoin d’aide ? <a href=\"https://wa.me/2290197500555?text=${encodeURIComponent('Bonjour AD TRANS LOGISTICS, je ne retrouve pas le suivi de mon conteneur.')}\" target=\"_blank\" rel=\"noopener\">Écrivez-nous sur WhatsApp</a>.", "Need help? <a href=\"https://wa.me/2290197500555?text=${encodeURIComponent('Hello AD TRANS LOGISTICS, I cannot find the tracking of my container.')}\" target=\"_blank\" rel=\"noopener\">Write to us on WhatsApp</a>."),
    ("'Entrez votre code de suivi complet (8 caractères).'", "'Enter your full tracking code (8 characters).'"),
    ("'Indiquez le numéro de conteneur et le numéro de BL.'", "'Enter the container number and the B/L number.'"),
    ("'Recherche en cours…'", "'Searching…'"),
    ("'Le service de suivi est momentanément indisponible. Réessayez dans un instant.'", "'The tracking service is temporarily unavailable. Please try again in a moment.'"),
]:
    assert fr in tk_js, fr[:50]
    tk_js = tk_js.replace(fr, en)
tk_js = tk_js.replace('/assets/depotage.js?v=20261015', '/assets/depotage.js?v=20261016')

track_content = tk_css + '''
<section class="pt-32 pb-12 lg:pt-44 lg:pb-16 bg-white">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="text-center max-w-3xl mx-auto">
<div class="tag mb-6 mx-auto w-fit"><div class="w-1.5 h-1.5 rounded-full bg-brand animate-blink"></div>Destuffing tracker · updated by our team at the port</div>
<h1 class="font-heading text-4xl lg:text-[62px] font-bold leading-[1.08] tracking-tight text-brand mb-6">Where is your container?<br/><span class="text-g400 font-medium italic">13 steps, live</span></h1>
<p class="text-lg lg:text-xl text-g500 leading-relaxed max-w-[600px] mx-auto">Enter the tracking code received by WhatsApp, or your container and bill of lading numbers. Every step completed at the Port of Cotonou appears here immediately.</p>
</div>
</div>
</section>

<section class="py-14 bg-g50" id="track">
<div class="container mx-auto px-6 max-w-5xl">
<div class="tk-search">
  <div class="tk-modes" role="tablist">
    <button class="tk-mode active" id="tk-mode-code" type="button" onclick="tkMode('code')" role="tab">Tracking code</button>
    <button class="tk-mode" id="tk-mode-ref" type="button" onclick="tkMode('ref')" role="tab">Container + B/L</button>
  </div>
  <form class="tk-form" id="tk-form-code" onsubmit="return tkSearch(event,'code')">
    <label class="tk-label" for="tk-code">Tracking code (8 characters)</label>
    <div class="tk-row">
      <input class="tk-input tk-input-code" id="tk-code" inputmode="latin" autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="8" placeholder="E.G. K7M2PQ9D"/>
      <button class="tk-btn" type="submit" id="tk-btn-code">Track <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></button>
    </div>
    <p class="tk-help">The code is in every WhatsApp message from AD TRANS LOGISTICS about your container.</p>
  </form>
  <form class="tk-form hidden" id="tk-form-ref" onsubmit="return tkSearch(event,'ref')">
    <div class="tk-grid">
      <div><label class="tk-label" for="tk-container">Container number</label><input class="tk-input" id="tk-container" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="E.G. MSKU1234567"/></div>
      <div><label class="tk-label" for="tk-bl">Bill of lading (B/L) number</label><input class="tk-input" id="tk-bl" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="E.G. MAEU123456789"/></div>
    </div>
    <div class="tk-row tk-row-end">
      <button class="tk-btn" type="submit" id="tk-btn-ref">Track <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></button>
    </div>
    <p class="tk-help">Both references are on your bill of lading. They are checked together to protect your data.</p>
  </form>
  <div class="tk-status" id="tk-status" aria-live="polite"></div>
</div>
<div id="tk-result" class="tk-result"></div>
<div class="tk-aside">
  <div class="tk-aside-card">
    <div class="tk-aside-k">How it works</div>
    <h3>4 phases, 13 steps, no phone calls</h3>
    <ol class="tk-phases-list">
      <li><b>Documents</b> Document exchange, delivery order, provisional destuffing list, transfer request, customs declaration.</li>
      <li><b>Approvals</b> Port, Bénin Manutention, Bénin Terminal and BESC invoices — processed <em>in parallel</em> to save days.</li>
      <li><b>Release</b> Release authorised, then positioning request for the container.</li>
      <li><b>Destuffing</b> Destuffing sheets, deconsolidation and handover of the goods.</li>
    </ol>
  </div>
  <div class="tk-aside-card tk-aside-dark">
    <div class="tk-aside-k">Shipping to Cotonou?</div>
    <h3>One gateway for Benin and the Sahel</h3>
    <p>Customs clearing, destuffing, Importer of Record and bonded transit to Niger, Burkina Faso, Mali and Nigeria — quotes in English within 24 business hours.</p>
    <a class="tk-btn tk-btn-white" href="/en/global-coverage">See our global coverage</a>
  </div>
</div>
</div>
</section>

<section class="py-20 bg-brand text-white">
<div class="container mx-auto px-6 text-center">
<h2 class="font-heading text-3xl lg:text-4xl font-bold mb-4">Need help with your tracking?</h2>
<p class="text-white/70 text-lg mb-10 max-w-xl mx-auto">Our team answers in English on WhatsApp and by e-mail.</p>
<div class="flex flex-col sm:flex-row justify-center gap-4">
<a class="btn-brand btn-brand-white" href="https://wa.me/2290197500555?text=Hello%20AD%20TRANS%20LOGISTICS%2C%20I%20need%20help%20tracking%20my%20container." target="_blank" rel="noopener">WhatsApp us</a>
<a class="btn-brand bg-white/10 border border-white/20 text-white hover:bg-white/20" href="/en/container-destuffing-cotonou">How destuffing works</a>
</div>
</div>
</section>
'''

build_en('en/track',
         'Track your container at the Port of Cotonou — live destuffing status | AD TRANS LOGISTICS',
         'Enter your tracking code or container + B/L numbers to see the 13 destuffing steps of your container at the Port of Cotonou, updated live by AD TRANS LOGISTICS.',
         track_content, 'Track a container', [], fr_alt='suivi', body_scripts=tk_js,
         og_title='Track your container at Cotonou — AD TRANS LOGISTICS')

# ───────────────────────── 6. Menus / pieds de page EN ─────────────────────────
EN_PAGES = ['en/index.html', 'en/niger.html', 'en/nigeria.html', 'en/global-coverage.html', 'en/importer-of-record-benin.html', 'en/container-destuffing-cotonou.html', 'en/track.html']
DOCS_EN = {
    "<li>&#10003; Facture commerciale</li><li>&#10003; Connaissement (BL) ou LTA</li><li>&#10003; Liste de colisage</li><li>&#10003; Certificat d'origine</li><li>&#10003; Licence / autorisation d'import</li>":
    "<li>&#10003; Commercial invoice</li><li>&#10003; Bill of lading (B/L) or AWB</li><li>&#10003; Packing list</li><li>&#10003; Certificate of origin</li><li>&#10003; Import licence / permit</li>",
    "<li>&#10003; Facture commerciale / Pro-forma</li><li>&#10003; Certificat d'origine</li><li>&#10003; Certificat phytosanitaire</li><li>&#10003; Licence d'exportation</li><li>&#10003; Declaration en douane</li>":
    "<li>&#10003; Commercial / pro-forma invoice</li><li>&#10003; Certificate of origin</li><li>&#10003; Phytosanitary certificate</li><li>&#10003; Export licence</li><li>&#10003; Customs declaration</li>",
    "<li>&#10003; Declaration de transit (T1)</li><li>&#10003; Garantie de transit</li><li>&#10003; Connaissement (BL) ou LTA</li><li>&#10003; Facture commerciale</li><li>&#10003; Certificat d'origine</li>":
    "<li>&#10003; Transit declaration (T1)</li><li>&#10003; Transit guarantee</li><li>&#10003; Bill of lading (B/L) or AWB</li><li>&#10003; Commercial invoice</li><li>&#10003; Certificate of origin</li>",
    "<li>&#10003; Bon a enlever</li><li>&#10003; Connaissement (BL)</li><li>&#10003; Facture commerciale</li><li>&#10003; Liste de colisage</li><li>&#10003; Declaration en douane</li>":
    "<li>&#10003; Delivery order</li><li>&#10003; Bill of lading (B/L)</li><li>&#10003; Commercial invoice</li><li>&#10003; Packing list</li><li>&#10003; Customs declaration</li>",
}
for f in EN_PAGES:
    if not os.path.exists(os.path.join(ROOT, f)):
        continue
    s = read(f); o = s
    s = s.replace('>Dépotage <svg', '>Destuffing <svg')
    for a, b in DOCS_EN.items():
        s = s.replace(a, b)
    # Dropdown Destuffing : liens vers la page service et le suivi EN
    dep_btn = '<a href="/demande?service=depotage" class="block text-center py-2.5 bg-black text-white text-sm font-semibold rounded-lg hover:opacity-85">Submit a request &rarr;</a>'
    if 'href="/en/container-destuffing-cotonou">Container destuffing at Cotonou' not in s and dep_btn in s:
        s = s.replace(dep_btn, '<a class="block px-1 py-2 text-sm font-semibold text-black hover:underline" href="/en/container-destuffing-cotonou">Container destuffing at Cotonou →</a>\n            <a class="block px-1 py-2 text-sm font-semibold text-black hover:underline" href="/en/track">Track a container →</a>\n            ' + dep_btn, 1)
    # Dropdown Importation : lien IOR
    imp_btn = '<a href="/demande?service=importation" class="block text-center py-2.5 bg-black text-white text-sm font-semibold rounded-lg hover:opacity-85">Submit a request &rarr;</a>'
    if 'href="/en/importer-of-record-benin">Importer of Record' not in s[:s.find('<footer')] and imp_btn in s:
        s = s.replace(imp_btn, '<a class="block px-1 py-2 text-sm font-semibold text-black hover:underline" href="/en/importer-of-record-benin">Importer of Record in Benin →</a>\n            ' + imp_btn, 1)
    # Liens de premier niveau : Coverage, Track
    acc = '<li><a class="text-[15px] font-medium text-g500 px-3 py-2 rounded-lg hover:bg-gray-50 hover:text-black transition-colors" href="/connexion">My account</a></li>'
    if 'href="/en/global-coverage">Coverage</a>' not in s and acc in s:
        s = s.replace(acc, '<li><a class="text-[15px] font-medium text-g500 px-3 py-2 rounded-lg hover:bg-gray-50 hover:text-black transition-colors" href="/en/global-coverage">Coverage</a></li>\n    <li><a class="text-[15px] font-medium text-g500 px-3 py-2 rounded-lg hover:bg-gray-50 hover:text-black transition-colors" href="/en/track">Track</a></li>\n    ' + acc, 1)
    # Menu mobile
    mob = '<a class="block p-4 text-base font-medium text-g700 rounded-brand-sm hover:bg-g50" href="/demande?service=depotage" onclick="closeMobile()">Unstuffing</a>'
    if 'href="/en/global-coverage" onclick="closeMobile()"' not in s and mob in s:
        s = s.replace(mob, '<a class="block p-4 text-base font-medium text-g700 rounded-brand-sm hover:bg-g50" href="/en/container-destuffing-cotonou" onclick="closeMobile()">Container destuffing</a>\n<a class="block p-4 text-base font-medium text-g700 rounded-brand-sm hover:bg-g50" href="/en/importer-of-record-benin" onclick="closeMobile()">Importer of Record</a>\n<a class="block p-4 text-base font-medium text-g700 rounded-brand-sm hover:bg-g50" href="/en/global-coverage" onclick="closeMobile()">Global coverage</a>\n<a class="block p-4 text-base font-medium text-g700 rounded-brand-sm hover:bg-g50" href="/en/track" onclick="closeMobile()">Track a container</a>', 1)
    s = s.replace('onclick="closeMobile()">Unstuffing</a>', 'onclick="closeMobile()">Destuffing request</a>')
    s = s.replace('<a class="block p-4 text-base font-medium text-g700 rounded-brand-sm hover:bg-g50" href="/" onclick="closeMobile()">Home</a>', '<a class="block p-4 text-base font-medium text-g700 rounded-brand-sm hover:bg-g50" href="/en" onclick="closeMobile()">Home</a>')
    # Pied de page
    foot = s[s.find('<footer'):]
    f2 = foot.replace('<li><a href="/suivi" class="text-g500 hover:text-brand transition-colors">Real-time tracking</a></li>', '<li><a href="/en/track" class="text-g500 hover:text-brand transition-colors">Real-time tracking</a></li>')
    if 'href="/en/global-coverage"' not in f2:
        f2 = f2.replace('<li><a href="/en" class="text-g500 hover:text-brand transition-colors">Training & Advisory</a></li>',
                        '<li><a href="/en/container-destuffing-cotonou" class="text-g500 hover:text-brand transition-colors">Container destuffing</a></li>\n<li><a href="/en/importer-of-record-benin" class="text-g500 hover:text-brand transition-colors">Importer of Record</a></li>\n<li><a href="/en/global-coverage" class="text-g500 hover:text-brand transition-colors">Global coverage</a></li>', 1)
    s = s[:s.find('<footer')] + f2
    if s != o:
        write(f, s)
print('menus EN OK')

# ───────────────────────── 7. Sections « couverture mondiale » sur les accueils ─────────────────────────
s = read('en/index.html')
if 'id="global-coverage"' not in s:
    sec = '''<section id="global-coverage" class="py-20" style="background:#0A0A0A;">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="text-center mb-10" style="max-width:760px;margin-left:auto;margin-right:auto;">
<div class="tag mb-4" style="color:rgba(255,255,255,.72);"><div class="w-1.5 h-1.5 rounded-full" style="background:#F59E0B;"></div>Global coverage</div>
<h2 class="font-heading font-bold" style="font-size:clamp(1.9rem,4vw,48px);color:#fff;line-height:1.1;letter-spacing:-.02em;margin-bottom:14px;">From the port of loading<br/><span style="color:#A3A3A3;font-weight:500;">to your customer’s door</span></h2>
<p style="color:rgba(255,255,255,.72);font-size:17px;line-height:1.65;">We receive your containers and vehicles from North America, Europe, the Gulf and Asia at the Port of Cotonou, then deliver across Benin and to Niamey, Ouagadougou, Bamako, Lagos and Abuja.</p>
</div>
<img src="/assets/world-coverage-en.svg" width="1200" height="500" alt="World map of AD TRANS LOGISTICS corridors to and from Cotonou" loading="lazy" decoding="async" style="width:100%;height:auto;display:block;"/>
<div class="flex flex-col sm:flex-row gap-4 justify-center" style="margin-top:28px;">
<a class="btn-brand btn-brand-white" href="/en/global-coverage">See our global coverage <span class="material-symbols-outlined !text-sm">arrow_forward</span></a>
<a class="btn-brand bg-white/10 border border-white/20 text-white hover:bg-white/20" href="/en/importer-of-record-benin">Importer of Record in Benin</a>
</div>
</div>
</section>
'''
    anchor = '<section class="py-20 bg-white">\n<div class="container mx-auto px-6 max-w-[1440px]">\n<div class="text-center mb-16">\n<div class="tag mb-4"><div class="w-1.5 h-1.5 rounded-full bg-brand"></div>Why ADTL</div>'
    assert anchor in s, 'ancre accueil EN'
    s = s.replace(anchor, sec + anchor, 1)
    # cartes services : liens vers IOR et dépotage
    s = s.replace('We act as your consignee/IOR in Benin, handle compliance and forward to the final market.</p>',
                  'We act as your consignee/IOR in Benin, handle compliance and forward to the final market. <a href="/en/importer-of-record-benin" style="color:#0A0A0A;font-weight:600;text-decoration:underline;">Importer of Record →</a></p>')
    s = s.replace('Container unstuffing, short-term storage, regrouping and last-mile delivery in Benin and across the sub-region.</p>',
                  'Container destuffing tracked in 13 steps, short-term storage, regrouping and last-mile delivery in Benin and across the sub-region. <a href="/en/container-destuffing-cotonou" style="color:#0A0A0A;font-weight:600;text-decoration:underline;">Destuffing &amp; tracking →</a></p>')
    s = s.replace('<div><div class="font-heading text-3xl font-bold text-brand">2 corridors</div><div class="text-[13px] text-g400 mt-1">Niger &amp; Nigeria, door to door</div></div>',
                  '<div><div class="font-heading text-3xl font-bold text-brand">5 countries</div><div class="text-[13px] text-g400 mt-1">Benin, Niger, Burkina Faso, Mali, Nigeria</div></div>')
    write('en/index.html', s)
    print('accueil EN : section couverture ajoutée')

s = read('index.html')
if 'id="couverture-mondiale"' not in s:
    sec = '''<!-- ═══════════════════════════════════════════════════════════
     COUVERTURE MONDIALE
═══════════════════════════════════════════════════════════ -->
<section id="couverture-mondiale" aria-labelledby="couverture-mondiale-title" style="padding:96px 0;background:var(--dark);">
<div style="max-width:1440px;margin:0 auto;padding:0 24px;">
    <div style="text-align:center;max-width:760px;margin:0 auto 40px;">
        <div class="tag" style="margin-bottom:18px;color:rgba(255,255,255,.72);">Couverture mondiale</div>
        <h2 id="couverture-mondiale-title" style="font-family:'Space Grotesk',sans-serif;font-size:clamp(1.9rem,4vw,48px);font-weight:700;color:var(--white);line-height:1.1;letter-spacing:-.02em;margin-bottom:18px;">Du port de départ<br/><span style="color:var(--gray400);font-weight:500;">à la porte de votre client</span></h2>
        <p style="font-size:17px;color:rgba(255,255,255,.72);line-height:1.65;margin:0;">Nous réceptionnons vos conteneurs et véhicules depuis l’Amérique du Nord, l’Europe, le Golfe et l’Asie au port de Cotonou, puis nous livrons au Bénin et vers Niamey, Ouagadougou, Bamako, Lagos et Abuja.</p>
    </div>
    <img src="/assets/world-coverage-fr.svg" width="1200" height="500" alt="Carte des corridors AD TRANS LOGISTICS vers et depuis Cotonou" loading="lazy" decoding="async" style="width:100%;height:auto;display:block;"/>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:32px;">
        <a href="/couverture-mondiale" class="btn" style="background:#fff;color:#0A0A0A;">Voir notre couverture mondiale <span class="material-symbols-outlined" aria-hidden="true" style="font-size:17px;">arrow_forward</span></a>
        <a href="/en/global-coverage" class="btn" style="background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.25);">In English</a>
    </div>
</div>
</section>

'''
    anchor = '<section style="padding:0;background:var(--white);overflow:hidden;">'
    assert s.count(anchor) == 1, 'ancre accueil FR'
    s = s.replace(anchor, sec + anchor, 1)
    write('index.html', s)
    print('accueil FR : section couverture ajoutée')

# ───────────────────────── 8. FR : hreflang suivi ↔ en/track, pieds de page, lang-suggest, cache ─────────────────────────
s = read('suivi.html')
if 'hreflang="en" href="https://www.adtranslogistics.com/en/track"' not in s:
    s = s.replace('<link rel="canonical" href="https://www.adtranslogistics.com/suivi"/>',
                  '<link rel="canonical" href="https://www.adtranslogistics.com/suivi"/>\n<link rel="alternate" hreflang="fr" href="https://www.adtranslogistics.com/suivi"/>\n<link rel="alternate" hreflang="en" href="https://www.adtranslogistics.com/en/track"/>\n<link rel="alternate" hreflang="x-default" href="https://www.adtranslogistics.com/suivi"/>', 1)
    write('suivi.html', s)

def pages():
    import glob
    return [f for f in glob.glob(os.path.join(ROOT, '**/*.html'), recursive=True) if '/public/' not in f and '/node_modules/' not in f and '/tools/' not in f]
for f in pages():
    rel = os.path.relpath(f, ROOT).replace('\\', '/')
    s = read(rel); o = s
    foot_i = s.find('<footer')
    if foot_i < 0 or rel.startswith('en/'):
        continue
    foot = s[foot_i:]
    if 'href="/couverture-mondiale"' not in foot:
        m = re.search(r'(<li><a ([^>]*)href="/depotage-conteneur-cotonou">Dépotage de conteneurs</a></li>)', foot)
        if m:
            foot = foot.replace(m.group(1), m.group(1) + '\n<li><a %shref="/couverture-mondiale">Couverture mondiale</a></li>' % m.group(2), 1)
        else:
            m = re.search(r'<a([^>]*)href="/depotage-conteneur-cotonou"[^>]*>Dépotage de conteneurs</a>\n', foot)
            if m:
                foot = foot.replace(m.group(0), m.group(0) + '<a%shref="/couverture-mondiale">Couverture mondiale</a>\n' % m.group(1), 1)
        s = s[:foot_i] + foot
    s = s.replace('/assets/depotage.js?v=20261015', '/assets/depotage.js?v=20261016')
    # liens de pied de page sans classe (passe précédente) : même style que les voisins
    foot = s[s.find('<footer'):]
    foot2 = re.sub(r'<li><a href="/(depotage-conteneur-cotonou|couverture-mondiale|a-propos)">', lambda m: '<li><a href="/%s" class="text-g500 hover:text-brand transition-colors">' % m.group(1), foot)
    s = s[:s.find('<footer')] + foot2
    if s != o:
        write(rel, s)
print('pieds de page FR OK')

s = read('assets/lang-suggest.js')
if "'/suivi':'/en/track'" not in s:
    s = s.replace("'/produits-digitaux':'/en-products'}", "'/produits-digitaux':'/en-products','/suivi':'/en/track','/depotage-conteneur-cotonou':'/en/container-destuffing-cotonou','/couverture-mondiale':'/en/global-coverage'}")
    write('assets/lang-suggest.js', s)
    for f in pages():
        rel = os.path.relpath(f, ROOT).replace('\\', '/')
        t = read(rel)
        if '/assets/lang-suggest.js?v=4' in t:
            write(rel, t.replace('/assets/lang-suggest.js?v=4', '/assets/lang-suggest.js?v=5'))

# ───────────────────────── 9. Sitemap ─────────────────────────
sm = read('sitemap.xml')
def url_block(loc, prio, alts):
    b = '  <url>\n    <loc>%s</loc>\n    <lastmod>%s</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>%s</priority>\n' % (loc, today, prio)
    for lang, href in alts:
        b += '    <xhtml:link rel="alternate" hreflang="%s" href="%s"/>\n' % (lang, href)
    return b + '  </url>\n'
NEW = [
    (BASE + '/couverture-mondiale', '0.9', [('fr', BASE + '/couverture-mondiale'), ('en', BASE + '/en/global-coverage')]),
    (BASE + '/en/global-coverage', '0.9', [('fr', BASE + '/couverture-mondiale'), ('en', BASE + '/en/global-coverage')]),
    (BASE + '/en/importer-of-record-benin', '0.8', [('en', BASE + '/en/importer-of-record-benin')]),
    (BASE + '/en/container-destuffing-cotonou', '0.8', [('fr', BASE + '/depotage-conteneur-cotonou'), ('en', BASE + '/en/container-destuffing-cotonou')]),
    (BASE + '/en/track', '0.7', [('fr', BASE + '/suivi'), ('en', BASE + '/en/track')]),
]
for loc, prio, alts in NEW:
    if '<loc>' + loc + '</loc>' not in sm:
        sm = sm.replace('</urlset>', url_block(loc, prio, alts) + '</urlset>')
if 'xmlns:xhtml' not in sm:
    sm = sm.replace('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml"', 1)
for slug in ('', 'en', 'suivi', 'depotage-conteneur-cotonou'):
    sm = re.sub(r'(<loc>%s/%s</loc>\s*<lastmod>)[^<]*' % (re.escape(BASE), re.escape(slug)), lambda m: m.group(1) + today, sm)
write('sitemap.xml', sm)
print('sitemap OK')

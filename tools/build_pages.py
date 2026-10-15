# -*- coding: utf-8 -*-
"""Génère les pages /depotage-conteneur-cotonou et /a-propos à partir du gabarit suivi.html (tête, menu, pied de page).
Usage : python tools/build_pages.py  (depuis la racine du site)"""
import re, io, os, json, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tpl = io.open(os.path.join(ROOT, 'suivi.html'), encoding='utf-8').read().replace('\r\n', '\n')

def build(slug, title, description, h1, content, breadcrumb_name, extra_ld, og_title=None):
    s = tpl
    url = 'https://www.adtranslogistics.com/' + slug
    s = re.sub(r'<title>.*?</title>', '<title>' + html.escape(title, quote=False) + '</title>', s, count=1, flags=re.S)
    s = re.sub(r'<meta content="[^"]*" name="description"/>', '<meta content="' + html.escape(description) + '" name="description"/>', s, count=1)
    s = s.replace('<link rel="canonical" href="https://www.adtranslogistics.com/suivi"/>', '<link rel="canonical" href="' + url + '"/>')
    bc = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.adtranslogistics.com/"},
        {"@type": "ListItem", "position": 2, "name": breadcrumb_name, "item": url}]}
    s = re.sub(r'<script type="application/ld\+json">\{"@context":"https://schema.org","@type":"BreadcrumbList".*?</script>',
               '<script type="application/ld+json">' + json.dumps(bc, ensure_ascii=False) + '</script>\n' +
               '\n'.join('<script type="application/ld+json">' + json.dumps(x, ensure_ascii=False) + '</script>' for x in extra_ld), s, count=1, flags=re.S)
    s = re.sub(r'<meta property="og:title" content="[^"]*"/>', '<meta property="og:title" content="' + html.escape(og_title or title) + '"/>', s, count=1)
    s = re.sub(r'<meta property="og:description" content="[^"]*"/>', '<meta property="og:description" content="' + html.escape(description) + '"/>', s, count=1)
    s = s.replace('<meta property="og:url" content="https://www.adtranslogistics.com/suivi"/>', '<meta property="og:url" content="' + url + '"/>')
    # Contenu principal : du début de la 1re section jusqu'au CTA
    a = s.index('<section class="pt-32 pb-12 lg:pt-44 lg:pb-16 bg-white">')
    b = s.index('<!-- ===================== CTA SECTION ===================== -->')
    s = s[:a] + content + '\n' + s[b:]
    # Retirer le script de suivi (config.js + depotage.js + logique) propre à /suivi
    a = s.index('<script src="/config.js?v=4"></script>')
    b = s.index('    <!-- Enregistrement du Service Worker -->')
    s = s[:a] + s[b:]
    # Lien actif dans le menu : rien à faire. Écriture.
    io.open(os.path.join(ROOT, slug + '.html'), 'w', encoding='utf-8', newline='\n').write(s)
    print('écrit', slug + '.html', len(s))

WA = 'https://wa.me/2290197500555?text='
CSS = '''
<style>
.sp-hero{padding:128px 0 48px}@media(min-width:1024px){.sp-hero{padding:176px 0 64px}}
.sp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
.sp-card{background:#fff;border:1px solid #E5E5E5;border-radius:20px;padding:24px;transition:border-color .2s,transform .2s}
.sp-card:hover{border-color:#0A0A0A;transform:translateY(-2px)}
.sp-card h3{font-family:'Space Grotesk',sans-serif;font-size:18px;font-weight:700;margin:12px 0 8px;letter-spacing:-.01em}
.sp-card p{font-size:14px;color:#525252;line-height:1.6}
.sp-num{width:36px;height:36px;border-radius:12px;background:#0A0A0A;color:#fff;display:flex;align-items:center;justify-content:center;font:700 14px 'Space Grotesk',sans-serif}
.sp-phases{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;counter-reset:ph}
.sp-phase{background:#fff;border:1px solid #E5E5E5;border-radius:20px;padding:22px;position:relative}
.sp-phase::before{counter-increment:ph;content:"Phase " counter(ph);font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#737373}
.sp-phase h3{font-family:'Space Grotesk',sans-serif;font-size:19px;font-weight:700;margin:6px 0 10px}
.sp-phase ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.sp-phase li{font-size:14px;color:#262626;display:flex;gap:8px;align-items:flex-start}
.sp-phase li::before{content:'';width:16px;height:16px;border-radius:50%;background:#0A0A0A;flex:none;margin-top:2px;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E") center/70% no-repeat #0A0A0A;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E") center/70% no-repeat #0A0A0A}
.sp-phase.par{border-style:dashed}
.sp-two{display:grid;grid-template-columns:1.1fr .9fr;gap:24px;align-items:start}
.sp-dark{background:#0A0A0A;color:#fff;border-radius:24px;padding:32px}
.sp-dark h3{font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;margin-bottom:12px}
.sp-dark p,.sp-dark li{color:rgba(255,255,255,.72);font-size:14.5px;line-height:1.65}
.sp-dark ul{padding-left:18px;margin:10px 0 0}
.sp-faq{display:grid;gap:10px}
.sp-faq details{background:#fff;border:1px solid #E5E5E5;border-radius:16px;padding:0}
.sp-faq summary{cursor:pointer;padding:18px 22px;font-weight:700;font-size:15.5px;list-style:none;display:flex;justify-content:space-between;gap:12px;align-items:center}
.sp-faq summary::-webkit-details-marker{display:none}
.sp-faq summary::after{content:'+';font-size:22px;color:#737373;flex:none}
.sp-faq details[open] summary::after{content:'–'}
.sp-faq .a{padding:0 22px 20px;color:#525252;font-size:14.5px;line-height:1.7}
.sp-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:52px;padding:0 24px;border-radius:999px;font-weight:700;font-size:15px;text-decoration:none;transition:all .2s}
.sp-btn-dark{background:#0A0A0A;color:#fff}.sp-btn-dark:hover{background:#262626;transform:translateY(-1px)}
.sp-btn-wa{background:#25D366;color:#fff}.sp-btn-wa:hover{background:#1fb455;transform:translateY(-1px)}
.sp-btn-ghost{background:#fff;color:#0A0A0A;border:1.5px solid #E5E5E5}.sp-btn-ghost:hover{border-color:#0A0A0A}
.sp-trust{display:flex;flex-wrap:wrap;gap:10px 22px;font-size:13px;color:#525252;margin-top:22px}
.sp-trust span{display:inline-flex;align-items:center;gap:6px}
.sp-trust span::before{content:'';width:6px;height:6px;border-radius:50%;background:#0A0A0A}
.sp-h2{font-family:'Space Grotesk',sans-serif;font-size:clamp(26px,3.4vw,38px);font-weight:700;letter-spacing:-.02em;line-height:1.1;margin-bottom:12px}
.sp-lead{font-size:16px;color:#525252;line-height:1.65;max-width:680px;margin-bottom:28px}
.sp-doc{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px}
.sp-doc div{background:#F7F7F7;border-radius:14px;padding:14px 16px;font-size:14px;font-weight:600;display:flex;gap:10px;align-items:center}
.sp-doc div small{display:block;font-weight:500;color:#737373;font-size:12.5px;margin-top:2px}
@media(max-width:860px){.sp-two{grid-template-columns:1fr}.sp-hero{padding-top:112px}}
</style>'''

# ───────────────────────── Page 1 : Dépotage de conteneur à Cotonou ─────────────────────────
dep_faq = [
    ("Combien de temps dure le dépotage d’un conteneur au port de Cotonou ?",
     "Le délai dépend de la compagnie maritime, de la rapidité des validations (Port de Cotonou, Bénin Manutention, Bénin Terminal, BESC) et de la disponibilité des documents. Chez AD TRANS LOGISTICS, les quatre validations sont lancées en parallèle dès la déclaration en douane, ce qui évite les jours perdus d’une procédure en file. Vous suivez chaque étape en direct sur la page Suivi."),
    ("Quels documents faut-il fournir pour un dépotage ?",
     "Le connaissement (BL) original ou télex release, la facture commerciale, la liste de colisage, le BESC (bordereau électronique de suivi des cargaisons), votre IFU et votre carte d’importateur. Pour un conteneur de véhicules, les titres de propriété de chaque véhicule sont nécessaires pour les déclarations IM8."),
    ("Comment suivre l’avancement de mon conteneur ?",
     "Dès l’enregistrement du dossier, vous recevez un code de suivi à 8 caractères par WhatsApp. Sur adtranslogistics.com/suivi, ce code (ou votre numéro de conteneur + BL) affiche les 13 étapes, la phase en cours, les messages de notre équipe et l’historique des notifications. Avec un espace client, tous vos conteneurs apparaissent sur un seul écran."),
    ("Que se passe-t-il si une pièce manque ?",
     "Le dossier passe en statut « Bloqué » avec le motif précis visible sur votre page de suivi, et vous êtes notifié par WhatsApp. Dès réception de la pièce, l’équipe relance l’étape concernée sans repartir de zéro."),
    ("Proposez-vous le dépotage de conteneurs de véhicules ?",
     "Oui. C’est l’une de nos spécialités : conteneurs de véhicules en provenance des États-Unis (Copart, IAAI), d’Europe ou de Dubaï, avec déclarations IM8 par véhicule, transfert de parc et remise des véhicules à leurs propriétaires ou à nos partenaires transitaires."),
    ("Travaillez-vous pour d’autres transitaires et sociétés de fret ?",
     "Oui. AD TRANS LOGISTICS assure le dépotage pour le compte de sociétés de fret et de transitaires partenaires qui souhaitent déléguer la partie portuaire tout en gardant une visibilité complète grâce au suivi en temps réel et aux notifications de leurs propres clients."),
]
dep_content = CSS + '''
<section class="sp-hero bg-white">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="max-w-3xl">
<div class="tag mb-6 w-fit"><div class="w-1.5 h-1.5 rounded-full bg-brand"></div>Dépotage de conteneurs · Port de Cotonou</div>
<h1 class="font-heading text-4xl lg:text-[60px] font-bold leading-[1.08] tracking-tight text-brand mb-6">Dépotage de conteneur à Cotonou,<br/><span class="text-g400 font-medium italic">suivi étape par étape</span></h1>
<p class="text-lg lg:text-xl text-g500 leading-relaxed max-w-[640px]">AD TRANS LOGISTICS prend en charge votre conteneur de l’échange documentaire jusqu’au dégroupage au port de Cotonou : 13 étapes tracées, validations lancées en parallèle, et une notification WhatsApp à chaque étape clé.</p>
<div class="flex flex-wrap gap-3 mt-8">
<a class="sp-btn sp-btn-wa" href="''' + WA + 'Bonjour%20AD%20TRANS%20LOGISTICS%2C%20je%20souhaite%20un%20devis%20pour%20le%20d%C3%A9potage%20d%27un%20conteneur%20%C3%A0%20Cotonou.' + '''" target="_blank" rel="noopener">Devis WhatsApp en 24 h</a>
<a class="sp-btn sp-btn-ghost" href="/suivi">Suivre un conteneur</a>
</div>
<div class="sp-trust"><span>Transitaire enregistré au Port de Cotonou</span><span>IFU 3202465578499 · RCCM RB/COT/24 B 38537</span><span>Clients notifiés à chaque étape</span></div>
</div>
</div>
</section>

<section class="py-16 bg-g50">
<div class="container mx-auto px-6 max-w-[1200px]">
<h2 class="sp-h2">Ce que comprend notre prestation de dépotage</h2>
<p class="sp-lead">Une prise en charge complète au port, pilotée par une équipe dédiée (documentation, douane, validations, positionnement, dégroupage) et visible en direct par vous et vos clients.</p>
<div class="sp-grid">
<div class="sp-card"><div class="sp-num">1</div><h3>Documentation & bon à délivrer</h3><p>Échange documentaire avec la compagnie maritime (Maersk, MSC, CMA CGM, Hapag-Lloyd…), obtention du bon à délivrer, liste prévisionnelle de dépotage et demande de transfert.</p></div>
<div class="sp-card"><div class="sp-num">2</div><h3>Déclaration en douane</h3><p>Déclaration du conteneur (et IM8 par véhicule le cas échéant) sur SYDONIA / GUCE, liquidation et paiement des droits avec justificatifs ligne par ligne.</p></div>
<div class="sp-card"><div class="sp-num">3</div><h3>Validations en parallèle</h3><p>Factures Port Autonome de Cotonou, Bénin Manutention, Bénin Terminal et BESC traitées simultanément pour gagner des jours sur le délai total.</p></div>
<div class="sp-card"><div class="sp-num">4</div><h3>Relâche & positionnement</h3><p>Obtention de la relâche, demande de positionnement du conteneur sur l’aire de dépotage, coordination avec le terminal.</p></div>
<div class="sp-card"><div class="sp-num">5</div><h3>Fiches de dépotage & dégroupage</h3><p>Établissement des fiches, dépotage physique, contrôle des marchandises ou des véhicules, remise au client ou à son transporteur.</p></div>
<div class="sp-card"><div class="sp-num">6</div><h3>Suivi & notifications</h3><p>Code de suivi unique, page de suivi en temps réel, notification WhatsApp à chaque étape clé — pour vous et, si vous le souhaitez, pour votre employé référent.</p></div>
</div>
</div>
</section>

<section class="py-16 bg-white">
<div class="container mx-auto px-6 max-w-[1200px]">
<h2 class="sp-h2">4 phases, 13 étapes, zéro zone d’ombre</h2>
<p class="sp-lead">Chaque étape est horodatée par la personne qui l’a franchie. C’est ce journal que vous consultez sur la page Suivi.</p>
<div class="sp-phases">
<div class="sp-phase"><h3>Documents</h3><ul><li>Échange documentaire</li><li>Bon à délivrer (BAD)</li><li>Liste prévisionnelle de dépotage</li><li>Demande de transfert</li><li>Déclaration en douane</li></ul></div>
<div class="sp-phase par"><h3>Validations <span style="font-size:12px;font-weight:600;color:#737373">· en parallèle</span></h3><ul><li>Facture Port de Cotonou</li><li>Facture Bénin Manutention</li><li>Facture Bénin Terminal</li><li>Validation BESC</li></ul></div>
<div class="sp-phase"><h3>Relâche</h3><ul><li>Relâche autorisée</li><li>Demande de positionnement</li></ul></div>
<div class="sp-phase"><h3>Dépotage</h3><ul><li>Fiches de dépotage</li><li>Dégroupage & remise des marchandises</li></ul></div>
</div>
</div>
</section>

<section class="py-16 bg-g50">
<div class="container mx-auto px-6 max-w-[1200px]">
<div class="sp-two">
<div>
<h2 class="sp-h2">Documents à préparer</h2>
<p class="sp-lead">Envoyez-les sur WhatsApp dès l’annonce d’arrivée du navire : nous ouvrons le dossier avant même l’accostage.</p>
<div class="sp-doc">
<div>Connaissement (BL)<small>Original ou télex release</small></div>
<div>Facture commerciale<small>Au nom de l’importateur</small></div>
<div>Liste de colisage<small>Packing list détaillée</small></div>
<div>BESC<small>Bordereau électronique de suivi des cargaisons</small></div>
<div>IFU & carte d’importateur<small>Du destinataire</small></div>
<div>Titres des véhicules<small>Pour les conteneurs de véhicules (IM8)</small></div>
</div>
</div>
<div class="sp-dark">
<h3>Délais & tarif transparent</h3>
<p>Le tarif est établi sur devis et détaillé poste par poste : dépotage, transport et scanner du conteneur, déclaration et transmission, positionnement, et déclaration IM8 par véhicule. Aucun frais caché : chaque montant vous est justifié.</p>
<ul><li>Devis WhatsApp sous 24 h ouvrées</li><li>Validations lancées en parallèle dès la déclaration</li><li>Notification à chaque étape clé, lien de suivi inclus</li><li>Dépotage pour particuliers, importateurs, sociétés de fret et transitaires partenaires</li></ul>
<a class="sp-btn sp-btn-wa" style="margin-top:20px" href="''' + WA + 'Bonjour%20AD%20TRANS%20LOGISTICS%2C%20je%20souhaite%20un%20devis%20pour%20le%20d%C3%A9potage%20d%27un%20conteneur%20%C3%A0%20Cotonou.' + '''" target="_blank" rel="noopener">Demander un devis</a>
</div>
</div>
</div>
</section>

<section class="py-16 bg-white">
<div class="container mx-auto px-6 max-w-[900px]">
<h2 class="sp-h2">Questions fréquentes sur le dépotage à Cotonou</h2>
<div class="sp-faq" style="margin-top:20px">
''' + '\n'.join('<details><summary>%s</summary><div class="a">%s</div></details>' % (html.escape(q, quote=False), html.escape(a, quote=False)) for q, a in dep_faq) + '''
</div>
</div>
</section>
'''
dep_ld = [
    {"@context": "https://schema.org", "@type": "Service", "name": "Dépotage de conteneur au port de Cotonou", "serviceType": "Dépotage de conteneurs",
     "url": "https://www.adtranslogistics.com/depotage-conteneur-cotonou",
     "description": "Prise en charge complète du dépotage de conteneurs au port de Cotonou : documentation, déclaration en douane, validations Port / Bénin Manutention / Bénin Terminal / BESC, relâche, positionnement, dégroupage, avec suivi en temps réel et notifications WhatsApp.",
     "provider": {"@type": "LocalBusiness", "name": "AD TRANS LOGISTICS", "telephone": "+2290197500555", "url": "https://www.adtranslogistics.com/",
                  "address": {"@type": "PostalAddress", "streetAddress": "Missessin C/6", "addressLocality": "Cotonou", "addressCountry": "BJ"}},
     "areaServed": [{"@type": "Country", "name": "Bénin"}, {"@type": "Country", "name": "Niger"}, {"@type": "Country", "name": "Burkina Faso"}, {"@type": "Country", "name": "Mali"}, {"@type": "Country", "name": "Nigeria"}],
     "availableChannel": {"@type": "ServiceChannel", "serviceUrl": "https://wa.me/2290197500555", "name": "WhatsApp"},
     "offers": {"@type": "Offer", "priceCurrency": "XOF", "description": "Tarif sur devis, détaillé poste par poste"}},
    {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in dep_faq]},
]
build('depotage-conteneur-cotonou',
      'Dépotage de conteneur à Cotonou : transitaire, suivi en temps réel | AD TRANS LOGISTICS',
      'Dépotage de conteneurs au port de Cotonou par AD TRANS LOGISTICS : 13 étapes tracées, validations Port / Manutention / Terminal / BESC en parallèle, notification WhatsApp à chaque étape. Devis en 24 h.',
      None, dep_content, 'Dépotage de conteneur à Cotonou', dep_ld,
      og_title='Dépotage de conteneur à Cotonou — suivi étape par étape | AD TRANS LOGISTICS')

# ───────────────────────── Page 2 : À propos ─────────────────────────
apropos_content = CSS + '''
<section class="sp-hero bg-white">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="max-w-3xl">
<div class="tag mb-6 w-fit"><div class="w-1.5 h-1.5 rounded-full bg-brand"></div>À propos · Transitaire au port de Cotonou</div>
<h1 class="font-heading text-4xl lg:text-[60px] font-bold leading-[1.08] tracking-tight text-brand mb-6">AD TRANS LOGISTICS,<br/><span class="text-g400 font-medium italic">votre transitaire à Cotonou</span></h1>
<p class="text-lg lg:text-xl text-g500 leading-relaxed max-w-[660px]">Société de transit enregistrée au Port Autonome de Cotonou, AD TRANS LOGISTICS accompagne importateurs, entreprises et transitaires partenaires : dédouanement de véhicules et de marchandises, dépotage de conteneurs, transit vers le Niger, le Burkina Faso, le Mali et le Nigeria.</p>
<div class="sp-trust"><span>AD TRANS LOGISTICS SARL · Missessin, Cotonou</span><span>IFU 3202465578499</span><span>RCCM RB/COT/24 B 38537</span><span>Magasin à Lagos (Alasia, Ojo)</span></div>
</div>
</div>
</section>

<section class="py-16 bg-g50">
<div class="container mx-auto px-6 max-w-[1200px]">
<div class="sp-two">
<div>
<h2 class="sp-h2">Une approche différente du transit</h2>
<p class="sp-lead">Nous avons bâti AD TRANS LOGISTICS sur un constat simple : au port, le client ne sait jamais vraiment où en est son dossier. Nous avons donc digitalisé chaque étape — simulateur de droits de douane, suivi de conteneur en temps réel, notifications WhatsApp — pour que la transparence soit la règle, pas l’exception.</p>
<div class="sp-grid">
<div class="sp-card"><h3>Transparence</h3><p>Chaque montant est justifié ligne par ligne : droits, taxes, frais portuaires, prestations. Pas de frais cachés.</p></div>
<div class="sp-card"><h3>Pédagogie</h3><p>Guides, mémos et formations pour comprendre le dédouanement au Bénin et éviter les arnaques du port.</p></div>
<div class="sp-card"><h3>Digitalisation</h3><p>Simulateurs en ligne, suivi en temps réel, espace client : vos dossiers sont accessibles 24 h/24.</p></div>
<div class="sp-card"><h3>Rapidité</h3><p>Validations lancées en parallèle, dossiers ouverts avant l’accostage du navire, réponse WhatsApp sous 24 h.</p></div>
</div>
</div>
<div class="sp-dark">
<h3>Ce que nous faisons</h3>
<ul>
<li><a href="/simulateur" style="color:#fff;text-decoration:underline">Dédouanement de véhicules</a> d’occasion et neufs (USA, Europe, Dubaï, Chine)</li>
<li><a href="/calculateur" style="color:#fff;text-decoration:underline">Dédouanement de marchandises</a> en conteneur et en groupage</li>
<li><a href="/depotage-conteneur-cotonou" style="color:#fff;text-decoration:underline">Dépotage de conteneurs</a> avec suivi en temps réel</li>
<li><a href="/transit-niger" style="color:#fff;text-decoration:underline">Transit Niger</a>, <a href="/transit-burkina" style="color:#fff;text-decoration:underline">Burkina Faso</a>, <a href="/transit-mali" style="color:#fff;text-decoration:underline">Mali</a> et <a href="/transit-nigeria" style="color:#fff;text-decoration:underline">Nigeria</a></li>
<li><a href="/transport-conteneur-vehicules" style="color:#fff;text-decoration:underline">Transport maritime de véhicules</a> en conteneur vers Cotonou</li>
<li><a href="/negoce" style="color:#fff;text-decoration:underline">Négoce de matières premières</a> en Afrique de l’Ouest</li>
<li><a href="/produits-digitaux" style="color:#fff;text-decoration:underline">Formations & guides</a> sur le transit et la douane au Bénin</li>
</ul>
</div>
</div>
</div>
</section>

<section class="py-16 bg-white">
<div class="container mx-auto px-6 max-w-[1200px]">
<h2 class="sp-h2">Comment nous travaillons</h2>
<p class="sp-lead">Un interlocuteur, une procédure écrite, un suivi visible : voilà ce qui fait la différence au port.</p>
<div class="sp-grid">
<div class="sp-card"><div class="sp-num">1</div><h3>Devis clair sous 24 h</h3><p>Vous nous envoyez vos documents sur WhatsApp ; nous répondons avec un devis détaillé et la liste exacte des pièces manquantes.</p></div>
<div class="sp-card"><div class="sp-num">2</div><h3>Dossier ouvert avant l’arrivée</h3><p>Échange documentaire, déclarations et validations sont préparés avant l’accostage pour réduire le temps à quai.</p></div>
<div class="sp-card"><div class="sp-num">3</div><h3>Suivi en direct</h3><p>Chaque étape franchie est horodatée et visible sur votre page de suivi ; vous êtes notifié par WhatsApp aux moments clés.</p></div>
<div class="sp-card"><div class="sp-num">4</div><h3>Remise & justificatifs</h3><p>Marchandises ou véhicules remis avec l’ensemble des quittances, déclarations et justificatifs — rien ne reste en suspens.</p></div>
</div>
</div>
</section>

<section class="py-16 bg-g50">
<div class="container mx-auto px-6 max-w-[1200px]">
<div class="sp-two">
<div>
<h2 class="sp-h2">Nous contacter</h2>
<p class="sp-lead">Siège à Missessin, Cotonou (Bénin) et magasin à Alasia, Ojo (Lagos State, Nigeria). WhatsApp reste le canal le plus rapide.</p>
<div class="sp-doc">
<div>WhatsApp / Téléphone<small><a href="tel:+2290197500555">+229 01 97 50 05 55</a></small></div>
<div>E-mail<small><a href="mailto:adtranslogistics@hotmail.com">adtranslogistics@hotmail.com</a></small></div>
<div>Siège<small>Missessin C/6, Cotonou, Bénin</small></div>
<div>Magasin Nigeria<small>Alasia, Ojo — Lagos State</small></div>
</div>
<div class="flex flex-wrap gap-3 mt-6">
<a class="sp-btn sp-btn-wa" href="''' + WA + 'Bonjour%20AD%20TRANS%20LOGISTICS%2C%20je%20souhaite%20des%20informations%20sur%20vos%20services.' + '''" target="_blank" rel="noopener">Écrire sur WhatsApp</a>
<a class="sp-btn sp-btn-ghost" href="/demande">Soumettre une demande</a>
</div>
</div>
<div class="sp-dark">
<h3>Informations légales</h3>
<ul>
<li>Dénomination : AD TRANS LOGISTICS SARL</li>
<li>Gérant : M. Anthony DURAND</li>
<li>IFU : 3202465578499</li>
<li>RCCM : RB/COT/24 B 38537</li>
<li>Activité : transitaire opérant au Port Autonome de Cotonou</li>
<li><a href="/mentions-legales" style="color:#fff;text-decoration:underline">Mentions légales & CGV</a> · <a href="/confidentialite" style="color:#fff;text-decoration:underline">Confidentialité</a></li>
</ul>
</div>
</div>
</div>
</section>
'''
apropos_ld = [{"@context": "https://schema.org", "@type": "AboutPage", "name": "À propos d’AD TRANS LOGISTICS", "url": "https://www.adtranslogistics.com/a-propos",
               "mainEntity": {"@type": "LocalBusiness", "name": "AD TRANS LOGISTICS", "legalName": "AD TRANS LOGISTICS SARL", "url": "https://www.adtranslogistics.com/", "telephone": "+2290197500555", "email": "adtranslogistics@hotmail.com",
                              "founder": {"@type": "Person", "name": "Anthony Durand", "jobTitle": "Gérant"}, "taxID": "3202465578499", "vatID": "3202465578499",
                              "address": {"@type": "PostalAddress", "streetAddress": "Missessin C/6", "addressLocality": "Cotonou", "addressCountry": "BJ"},
                              "areaServed": ["Bénin", "Niger", "Burkina Faso", "Mali", "Nigeria"], "sameAs": ["https://www.youtube.com/@ADTRANSLOGISTICS-r3x"]}}]
build('a-propos', 'À propos d’AD TRANS LOGISTICS — Transitaire au port de Cotonou (Bénin)',
      'AD TRANS LOGISTICS SARL, transitaire enregistré au Port Autonome de Cotonou : dédouanement de véhicules et marchandises, dépotage de conteneurs, transit Niger, Burkina Faso, Mali, Nigeria. IFU 3202465578499 · RCCM RB/COT/24 B 38537.',
      None, apropos_content, 'À propos', apropos_ld, og_title='AD TRANS LOGISTICS — votre transitaire à Cotonou')

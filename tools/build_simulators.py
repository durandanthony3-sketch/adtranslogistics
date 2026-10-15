# -*- coding: utf-8 -*-
"""Génère /simulateurs (hub), /simulateur-depotage et /estimation-marchandises à partir du gabarit (tools/build_pages.py).
Usage : python tools/build_simulators.py (racine du site)."""
import os, sys, html, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_pages as bp  # réutilise build() et CSS ; régénère aussi les 2 pages existantes (idempotent)

WA = 'https://wa.me/2290197500555?text='
EXTRA_CSS = '''
<style>
.sm-wrap{display:grid;grid-template-columns:1.05fr .95fr;gap:20px;align-items:start}
.sm-form{background:#fff;border:1px solid #E5E5E5;border-radius:24px;padding:26px;box-shadow:0 1px 2px rgba(10,10,10,.04),0 12px 40px -24px rgba(10,10,10,.25)}
.sm-form h2,.sm-res h2{font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;letter-spacing:-.01em;margin-bottom:6px}
.sm-form .sub{font-size:13.5px;color:#6B6B6B;margin-bottom:18px;line-height:1.55}
.sm-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.sm-f{display:flex;flex-direction:column;gap:6px}
.sm-f.full{grid-column:1/-1}
.sm-f label{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#6B6B6B}
.sm-f input,.sm-f select{height:50px;border:1.5px solid #E5E5E5;border-radius:12px;padding:0 14px;font:600 15px 'Instrument Sans',sans-serif;color:#0A0A0A;background:#fff;outline:none}
.sm-f input:focus,.sm-f select:focus{border-color:#0A0A0A;box-shadow:0 0 0 4px rgba(10,10,10,.06)}
.sm-f small{font-size:12px;color:#6B6B6B;font-weight:500;letter-spacing:0;text-transform:none}
.sm-seg{display:flex;background:#F0F0F0;border-radius:12px;padding:4px;gap:4px}
.sm-seg button{flex:1;border:0;background:transparent;padding:10px;border-radius:9px;font:600 14px 'Instrument Sans',sans-serif;color:#6B6B6B;cursor:pointer}
.sm-seg button.on{background:#fff;color:#0A0A0A;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.sm-res{background:#0A0A0A;color:#fff;border-radius:24px;padding:26px;position:sticky;top:96px}
.sm-res h2{color:#fff}
.sm-total{font-family:'Space Grotesk',sans-serif;font-size:40px;font-weight:700;letter-spacing:-.02em;line-height:1;margin:14px 0 4px}
.sm-total small{font-size:14px;color:rgba(255,255,255,.72);font-weight:500;letter-spacing:0;display:block;margin-top:6px}
.sm-lines{list-style:none;margin:18px 0 0;padding:0;display:grid;gap:8px}
.sm-lines li{display:flex;justify-content:space-between;gap:12px;font-size:14px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.1)}
.sm-lines li span:first-child{color:rgba(255,255,255,.78)}
.sm-lines li span:last-child{font-weight:700;white-space:nowrap}
.sm-lines li.sub span:first-child{color:rgba(255,255,255,.55);font-size:13px;padding-left:14px}
.sm-lines li.tot{border-bottom:0;border-top:1px solid rgba(255,255,255,.3);margin-top:4px;padding-top:12px;font-size:15px}
.sm-note{font-size:12.5px;color:rgba(255,255,255,.6);line-height:1.55;margin-top:16px}
.sm-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.sm-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.sm-badge-ok{background:#DCFCE7;color:#166534}.sm-badge-est{background:#FEF3C7;color:#92400E}.sm-badge-devis{background:#F0F0F0;color:#404040}
.hub{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}
.hub a{display:flex;flex-direction:column;gap:10px;background:#fff;border:1px solid #E5E5E5;border-radius:20px;padding:22px;text-decoration:none;color:#0A0A0A;transition:border-color .2s,transform .2s}
.hub a:hover{border-color:#0A0A0A;transform:translateY(-2px)}
.hub h3{font-family:'Space Grotesk',sans-serif;font-size:18px;font-weight:700;letter-spacing:-.01em}
.hub p{font-size:14px;color:#525252;line-height:1.55}
.hub .go{margin-top:auto;font-weight:700;font-size:14px}
@media(max-width:900px){.sm-wrap{grid-template-columns:1fr}.sm-res{position:static}.sm-grid{grid-template-columns:1fr}}
</style>'''

# ───────────────────────── /simulateur-depotage ─────────────────────────
DEP_JS = r'''
<script>
(function(){
  // Grille ADTL (août 2026) — montants indicatifs hors droits et taxes de douane, hors frais compagnie/port.
  const G = { depotage: 650000, transport_scanner: 102000, declaration: 25000, positionnement: 15000, im8: 2500 };
  const el = id => document.getElementById(id);
  const F = n => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' F';
  function calc(){
    const n = Math.max(0, Math.min(60, parseInt(el('d-vehicules').value||'0',10)));
    const cont = parseInt(el('d-conteneurs').value||'1',10) || 1;
    const type = el('d-type').value;
    const lines = [
      ['Dépotage du conteneur', G.depotage*cont],
      ['Transport + scanner du conteneur', G.transport_scanner*cont],
      ['Déclaration + transmission (par dossier)', G.declaration],
      ['Positionnement', G.positionnement*cont],
    ];
    if (n>0) lines.push(['Déclarations IM8 (' + n + ' véhicule' + (n>1?'s':'') + ' × 2 500 F)', G.im8*n]);
    const total = lines.reduce((s,l)=>s+l[1],0);
    el('d-total').innerHTML = F(total) + '<small id="d-sub"></small>';
    el('d-lines').innerHTML = lines.map(l=>'<li><span>'+l[0]+'</span><span>'+F(l[1])+'</span></li>').join('') + '<li class="tot"><span>Total prestation dépotage</span><span>'+F(total)+'</span></li>';
    el('d-sub').textContent = cont + ' conteneur' + (cont>1?'s':'') + ' ' + type + (n ? ' · ' + n + ' véhicule' + (n>1?'s':'') : ' · marchandises');
    const msg = 'Bonjour AD TRANS LOGISTICS, je souhaite confirmer un devis de dépotage : ' + cont + ' conteneur(s) ' + type + (n ? ', ' + n + ' véhicule(s)' : ', marchandises') + '. Estimation site : ' + F(total) + '.';
    el('d-wa').href = 'https://wa.me/2290197500555?text=' + encodeURIComponent(msg);
  }
  ['d-vehicules','d-conteneurs','d-type'].forEach(id => el(id).addEventListener('input', calc));
  calc();
})();
</script>'''
DEP_CONTENT = bp.CSS + EXTRA_CSS + '''
<section class="sp-hero bg-white">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="max-w-3xl">
<div class="tag mb-6 w-fit"><div class="w-1.5 h-1.5 rounded-full bg-brand"></div>Simulateur · Dépotage de conteneur à Cotonou</div>
<h1 class="font-heading text-4xl lg:text-[56px] font-bold leading-[1.08] tracking-tight text-brand mb-5">Combien coûte le dépotage<br/><span class="text-g400 font-medium italic">de votre conteneur ?</span></h1>
<p class="text-lg text-g500 leading-relaxed max-w-[640px]">Estimation immédiate de la prestation AD TRANS LOGISTICS au port de Cotonou, poste par poste. Les droits et taxes de douane des véhicules se simulent séparément.</p>
</div>
</div>
</section>
<section class="py-14 bg-g50">
<div class="container mx-auto px-6 max-w-[1200px]">
<div class="sm-wrap">
<div class="sm-form">
<h2>Votre conteneur</h2>
<p class="sub">Un dossier = un BL. Pour plusieurs conteneurs sur le même BL, indiquez le nombre.</p>
<div class="sm-grid">
<div class="sm-f"><label for="d-type">Type de conteneur</label><select id="d-type"><option>40HC</option><option>40DV</option><option>20DV</option><option>45HC</option></select></div>
<div class="sm-f"><label for="d-conteneurs">Nombre de conteneurs</label><input id="d-conteneurs" type="number" min="1" max="20" value="1"/></div>
<div class="sm-f full"><label for="d-vehicules">Véhicules dans le conteneur</label><input id="d-vehicules" type="number" min="0" max="60" value="4"/><small>0 si marchandises uniquement. Une déclaration IM8 est établie par véhicule.</small></div>
</div>
<div class="sp-doc" style="margin-top:18px">
<div>Documents à envoyer<small>BL, facture, liste de colisage, BESC, IFU, titres des véhicules</small></div>
<div>Délai de réponse<small>Devis confirmé sous 24 h ouvrées sur WhatsApp</small></div>
</div>
</div>
<aside class="sm-res">
<span class="sm-badge sm-badge-est">Estimation indicative</span>
<h2 style="margin-top:12px">Prestation dépotage ADTL</h2>
<div class="sm-total" id="d-total">—<small id="d-sub"></small></div>
<ul class="sm-lines" id="d-lines"></ul>
<p class="sm-note">Montants hors droits et taxes de douane, hors frais de la compagnie maritime (échange documentaire, BAD) et hors frais portuaires et de terminal (THC, magasinage, surestaries), qui sont refacturés sur justificatifs. Grille tarifaire ADTL en vigueur — confirmation écrite sur devis.</p>
<div class="sm-actions">
<a id="d-wa" class="sp-btn sp-btn-wa" href="#" target="_blank" rel="noopener">Confirmer ce devis sur WhatsApp</a>
<a class="sp-btn sp-btn-ghost" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.35)" href="/simulateur">Droits de douane d’un véhicule</a>
</div>
</aside>
</div>
</div>
</section>
<section class="py-14 bg-white">
<div class="container mx-auto px-6 max-w-[900px]">
<h2 class="sp-h2">Ce que couvre cette prestation</h2>
<p class="sp-lead">Les 13 étapes du dépotage, de l’échange documentaire au dégroupage, avec suivi en temps réel et notifications WhatsApp. <a href="/depotage-conteneur-cotonou" style="font-weight:700;text-decoration:underline;color:#0A0A0A">Voir le détail de la prestation →</a></p>
</div>
</section>
''' + DEP_JS

# ───────────────────────── /estimation-marchandises ─────────────────────────
CATS = [
    # (libellé, catégorie TEC, exemples)
    ("Produits de première nécessité (médicaments, livres, riz, lait)", 0, "cat. 0 · 0 %"),
    ("Matières premières, biens d’équipement, machines industrielles", 1, "cat. 1 · 5 %"),
    ("Intrants et produits intermédiaires (pièces, composants, matériaux)", 2, "cat. 2 · 10 %"),
    ("Biens de consommation finale (électroménager, textile, meubles, pneus, électronique)", 3, "cat. 3 · 20 %"),
    ("Biens spécifiques de consommation finale (certains produits alimentaires transformés, boissons)", 4, "cat. 4 · 35 %"),
]
GOODS_JS = r'''
<script>
(function(){
  const DD = [0, .05, .10, .20, .35];
  // Taxes et redevances liquidées sur la valeur en douane (structure GUCE/SYDONIA Bénin) : taux tels que renvoyés par la simulation GUCE.
  const R = { TV: .0085, RS: .01, PCS: .008, PC: .005, PS: .002, RAU: .005, TVA: .18 };
  const el = id => document.getElementById(id);
  const F = n => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' F';
  const FX = { XOF: 1, EUR: 655.957, USD: null, CNY: null, GBP: null };
  function rate(){ const c = el('g-devise').value; if (c==='XOF') return 1; if (c==='EUR') return 655.957; const v = parseFloat(el('g-taux').value); return isFinite(v)&&v>0 ? v : null; }
  function calc(){
    const dev = el('g-devise').value; el('g-taux-wrap').hidden = (dev==='XOF'||dev==='EUR');
    const r = rate(); const val = parseFloat(el('g-valeur').value)||0, fret = parseFloat(el('g-fret').value)||0, assur = parseFloat(el('g-assurance').value)||0;
    const cat = parseInt(el('g-cat').value,10); const ifu = el('g-ifu').value==='oui';
    if (!r || val<=0) { el('g-total').innerHTML = '—<small>Renseignez la valeur et le taux de change</small>'; el('g-lines').innerHTML=''; return; }
    const caf = (val + fret + assur) * r;
    const dd = caf * DD[cat];
    const tv = caf*R.TV, rs = caf*R.RS, pcs = caf*R.PCS, pc = caf*R.PC, ps = caf*R.PS, rau = caf*R.RAU;
    const baseTva = caf + dd + tv + rs + pcs + pc + ps + rau;
    const tva = el('g-tva').value==='oui' ? baseTva * R.TVA : 0;
    const aib = (caf + dd + tv + rs + pcs + pc + ps + rau) * (ifu ? .01 : .05);
    const total = dd + tv + rs + pcs + pc + ps + rau + tva + aib;
    const lines = [
      ['Valeur CAF (valeur + fret + assurance)', caf],
      ['Droit de douane (DD) · ' + (DD[cat]*100) + ' %', dd],
      ['Taxe de voirie (TV) · 0,85 %', tv],
      ['Redevance statistique (RS) · 1 %', rs],
      ['Prélèvement communautaire de solidarité UEMOA (PCS) · 0,8 %', pcs],
      ['Prélèvement communautaire CEDEAO (PC) · 0,5 %', pc],
      ['PS · 0,2 % et RAU · 0,5 %', ps+rau],
      ['TVA · 18 % sur CAF + droits' + (el('g-tva').value==='oui'?'':' (exonérée)'), tva],
      ['Acompte sur impôt sur les bénéfices (AIB) · ' + (ifu?'1 % (IFU)':'5 % (sans IFU)'), aib],
    ];
    el('g-total').innerHTML = F(total) + '<small>Droits et taxes estimés · CAF ' + F(caf) + '</small>';
    el('g-lines').innerHTML = lines.map((l,i)=>'<li'+(i===0?' class="sub"':'')+'><span>'+l[0]+'</span><span>'+F(l[1])+'</span></li>').join('') + '<li class="tot"><span>Total droits et taxes</span><span>'+F(total)+'</span></li><li class="tot" style="border-top:0;padding-top:0"><span>Coût rendu douane (CAF + taxes)</span><span>'+F(caf+total)+'</span></li>';
    const msg = 'Bonjour AD TRANS LOGISTICS, merci de vérifier cette estimation de dédouanement : ' + (el('g-desc').value||'marchandises') + ', origine ' + el('g-origine').value + ', CAF ' + F(caf) + ', ' + el('g-cat').selectedOptions[0].textContent + '. Estimation site : ' + F(total) + ' de droits et taxes.';
    el('g-wa').href = 'https://wa.me/2290197500555?text=' + encodeURIComponent(msg);
  }
  ['g-devise','g-taux','g-valeur','g-fret','g-assurance','g-cat','g-ifu','g-tva','g-desc','g-origine'].forEach(id => el(id).addEventListener('input', calc));
  calc();
})();
</script>'''
GOODS_CONTENT = bp.CSS + EXTRA_CSS + '''
<section class="sp-hero bg-white">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="max-w-3xl">
<div class="tag mb-6 w-fit"><div class="w-1.5 h-1.5 rounded-full bg-brand"></div>Estimation · Droits de douane marchandises au Bénin</div>
<h1 class="font-heading text-4xl lg:text-[56px] font-bold leading-[1.08] tracking-tight text-brand mb-5">Droits et taxes à l’import<br/><span class="text-g400 font-medium italic">en 30 secondes</span></h1>
<p class="text-lg text-g500 leading-relaxed max-w-[640px]">Estimation transparente selon la structure tarifaire en vigueur au Bénin (Tarif Extérieur Commun UEMOA, TVA, prélèvements communautaires, AIB). Pour un montant garanti, notre équipe vérifie le code SH exact et la valeur en douane.</p>
</div>
</div>
</section>
<section class="py-14 bg-g50">
<div class="container mx-auto px-6 max-w-[1200px]">
<div class="sm-wrap">
<div class="sm-form">
<h2>Votre marchandise</h2>
<p class="sub">Choisissez la catégorie tarifaire qui correspond le mieux à vos produits. En cas de doute, prenez la catégorie supérieure : l’estimation sera prudente.</p>
<div class="sm-grid">
<div class="sm-f full"><label for="g-desc">Désignation</label><input id="g-desc" placeholder="Ex. pneus neufs pour voitures, 400 pièces"/></div>
<div class="sm-f full"><label for="g-cat">Catégorie tarifaire (TEC UEMOA)</label><select id="g-cat">''' + ''.join('<option value="%d"%s>%s — %s</option>' % (c, ' selected' if c == 3 else '', html.escape(l), e) for l, c, e in CATS) + '''</select></div>
<div class="sm-f"><label for="g-origine">Pays d’origine</label><select id="g-origine"><option>Chine</option><option>Turquie</option><option>Émirats arabes unis</option><option>Inde</option><option>France</option><option>Allemagne</option><option>Belgique</option><option>Italie</option><option>Espagne</option><option>États-Unis</option><option>Nigeria</option><option>Ghana</option><option>Togo</option><option>Autre</option></select></div>
<div class="sm-f"><label for="g-devise">Devise de la facture</label><select id="g-devise"><option>XOF</option><option>EUR</option><option>USD</option><option>CNY</option><option>GBP</option></select></div>
<div class="sm-f full" id="g-taux-wrap" hidden><label for="g-taux">Taux de change (1 unité = … F CFA)</label><input id="g-taux" type="number" step="0.0001" placeholder="Ex. 560 pour 1 USD"/><small>Taux de change douanier du mois — nous l’appliquons exactement lors de la vérification.</small></div>
<div class="sm-f"><label for="g-valeur">Valeur de la marchandise (FOB)</label><input id="g-valeur" type="number" min="0" placeholder="Ex. 5 000 000"/></div>
<div class="sm-f"><label for="g-fret">Fret jusqu’à Cotonou</label><input id="g-fret" type="number" min="0" placeholder="Ex. 600 000"/></div>
<div class="sm-f"><label for="g-assurance">Assurance</label><input id="g-assurance" type="number" min="0" placeholder="0 si non assuré"/></div>
<div class="sm-f"><label for="g-ifu">Importateur avec IFU ?</label><select id="g-ifu"><option value="oui">Oui — AIB 1 %</option><option value="non">Non — AIB 5 %</option></select></div>
<div class="sm-f full"><label for="g-tva">TVA</label><select id="g-tva"><option value="oui">Marchandise soumise à la TVA (18 %)</option><option value="non">Exonérée de TVA (produits listés : médicaments, livres, certains intrants)</option></select></div>
</div>
</div>
<aside class="sm-res">
<span class="sm-badge sm-badge-est">Estimation indicative</span>
<h2 style="margin-top:12px">Droits et taxes au Bénin</h2>
<div class="sm-total" id="g-total">—</div>
<ul class="sm-lines" id="g-lines"></ul>
<p class="sm-note">Taux appliqués selon la structure de liquidation GUCE/SYDONIA : DD par catégorie du TEC, TV 0,85 %, RS 1 %, PCS 0,8 %, PC 0,5 %, PS 0,2 %, RAU 0,5 %, TVA 18 % sur la valeur CAF majorée des droits, AIB 1 % ou 5 %. Hors taxes spécifiques (accises, TSR), hors frais portuaires, transport et honoraires. Le montant définitif dépend du code SH exact et de la valeur retenue par la douane.</p>
<div class="sm-actions">
<a id="g-wa" class="sp-btn sp-btn-wa" href="#" target="_blank" rel="noopener">Faire vérifier par ADTL (24 h)</a>
<a class="sp-btn sp-btn-ghost" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.35)" href="/calculateur">Simulation GUCE par code SH</a>
</div>
</aside>
</div>
</div>
</section>
''' + GOODS_JS

# ───────────────────────── /simulateurs (hub) ─────────────────────────
HUB_CONTENT = bp.CSS + EXTRA_CSS + '''
<section class="sp-hero bg-white">
<div class="container mx-auto px-6 max-w-[1440px]">
<div class="max-w-3xl">
<div class="tag mb-6 w-fit"><div class="w-1.5 h-1.5 rounded-full bg-brand"></div>Tous les simulateurs AD TRANS LOGISTICS</div>
<h1 class="font-heading text-4xl lg:text-[56px] font-bold leading-[1.08] tracking-tight text-brand mb-5">Simulez avant d’importer</h1>
<p class="text-lg text-g500 leading-relaxed max-w-[640px]">Droits de douane, dépotage, transit, transport : chaque simulateur vous donne un ordre de grandeur immédiat, et notre équipe confirme le montant exact sous 24 h sur WhatsApp.</p>
</div>
</div>
</section>
<section class="py-14 bg-g50">
<div class="container mx-auto px-6 max-w-[1200px]">
<div class="hub">
<a href="/simulateur"><span class="sm-badge sm-badge-ok">Rapport détaillé · 500 F</span><h3>Véhicule d’occasion</h3><p>Droits, TVA, IMF/SESUR et frais annexes à partir de la valeur de référence douanière (1970–2021) ou de votre facture / AVD (2022 et plus). Rapport PDF.</p><span class="go">Simuler →</span></a>
<a href="/estimation-marchandises"><span class="sm-badge sm-badge-est">Estimation immédiate</span><h3>Marchandises à l’import</h3><p>Droits et taxes selon la catégorie tarifaire UEMOA, TVA, prélèvements communautaires et AIB. Vérification du code SH par notre équipe.</p><span class="go">Estimer →</span></a>
<a href="/simulateur-depotage"><span class="sm-badge sm-badge-est">Estimation immédiate</span><h3>Dépotage de conteneur</h3><p>Prestation complète au port de Cotonou : dépotage, transport et scanner, déclaration, positionnement, IM8 par véhicule.</p><span class="go">Estimer →</span></a>
<a href="/calculateur"><span class="sm-badge sm-badge-ok">Simulation GUCE</span><h3>Marchandises par code SH</h3><p>Calcul sur la base du Guichet Unique (GUCE) avec le code SH exact, l’origine et le taux de change officiel. Rapport détaillé payant.</p><span class="go">Ouvrir →</span></a>
<a href="/demande?service=vehicule-neuf"><span class="sm-badge sm-badge-devis">Étude sous 24 h</span><h3>Véhicule neuf ou électrique</h3><p>Régimes 2026 (véhicules neufs, électriques et hybrides) : étude personnalisée sur facture, réponse chiffrée par WhatsApp.</p><span class="go">Demander →</span></a>
<a href="''' + WA + 'Bonjour%20AD%20TRANS%20LOGISTICS%2C%20je%20souhaite%20un%20devis%20de%20transit%20depuis%20Cotonou%20vers%20%3A%20(Niger%20%2F%20Burkina%20%2F%20Mali%20%2F%20Nigeria).%20Marchandise%20%3A%20...%20Conteneur%20ou%20camion%20%3A%20...' + '''" target="_blank" rel="noopener"><span class="sm-badge sm-badge-devis">Devis sous 24 h</span><h3>Transit Niger · Burkina · Mali · Nigeria</h3><p>T1, garantie, escorte et transport par camion selon le corridor. Devis WhatsApp avec délai estimé.</p><span class="go">Demander →</span></a>
<a href="''' + WA + 'Bonjour%20AD%20TRANS%20LOGISTICS%2C%20je%20souhaite%20un%20devis%20de%20transport%20de%20v%C3%A9hicule%20vers%20Cotonou.%20Port%20de%20d%C3%A9part%20%3A%20...%20V%C3%A9hicule%20%3A%20...%20RoRo%20ou%20conteneur%20%3A%20...' + '''" target="_blank" rel="noopener"><span class="sm-badge sm-badge-devis">Devis sous 24 h</span><h3>Transport d’un véhicule vers Cotonou</h3><p>USA (Copart, IAAI), Europe, Dubaï, Chine : RoRo ou conteneur, assurance, délai. Tarif au port de départ.</p><span class="go">Demander →</span></a>
<a href="''' + WA + 'Bonjour%20AD%20TRANS%20LOGISTICS%2C%20je%20souhaite%20le%20co%C3%BBt%20rendu%20complet%20d%27un%20conteneur%20de%20marchandises%20%C3%A0%20Cotonou%20(fret%2C%20douane%2C%20port%2C%20livraison).%20Marchandise%20%3A%20...%20Origine%20%3A%20...%2020%27%20ou%2040%27%20%3A%20...' + '''" target="_blank" rel="noopener"><span class="sm-badge sm-badge-devis">Devis sous 24 h</span><h3>Coût rendu d’un conteneur</h3><p>Fret, douane, frais portuaires et de terminal, magasinage, livraison : le prix de revient complet de votre conteneur.</p><span class="go">Demander →</span></a>
<a href="/suivi"><span class="sm-badge sm-badge-ok">Gratuit</span><h3>Suivi de conteneur</h3><p>Où en est votre dépotage ? 13 étapes suivies en temps réel avec votre code de suivi ou votre numéro de conteneur + BL.</p><span class="go">Suivre →</span></a>
</div>
</div>
</section>
'''

ld_dep = [{"@context": "https://schema.org", "@type": "WebApplication", "name": "Simulateur de dépotage de conteneur à Cotonou", "url": "https://www.adtranslogistics.com/simulateur-depotage", "applicationCategory": "BusinessApplication", "operatingSystem": "Web", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "XOF"}, "provider": {"@type": "Organization", "name": "AD TRANS LOGISTICS"}}]
ld_goods = [{"@context": "https://schema.org", "@type": "WebApplication", "name": "Estimation des droits de douane marchandises au Bénin", "url": "https://www.adtranslogistics.com/estimation-marchandises", "applicationCategory": "BusinessApplication", "operatingSystem": "Web", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "XOF"}, "provider": {"@type": "Organization", "name": "AD TRANS LOGISTICS"}}]
ld_hub = [{"@context": "https://schema.org", "@type": "CollectionPage", "name": "Simulateurs AD TRANS LOGISTICS", "url": "https://www.adtranslogistics.com/simulateurs"}]

bp.build('simulateur-depotage', 'Simulateur de dépotage de conteneur à Cotonou — prix immédiat | AD TRANS LOGISTICS',
         'Estimez en 30 secondes le coût du dépotage de votre conteneur au port de Cotonou : dépotage, transport et scanner, déclaration, positionnement, IM8 par véhicule. Devis confirmé sous 24 h.',
         None, DEP_CONTENT, 'Simulateur dépotage', ld_dep)
bp.build('estimation-marchandises', 'Droits de douane marchandises au Bénin : estimation immédiate | AD TRANS LOGISTICS',
         'Estimez les droits et taxes à l’import au Bénin : droit de douane par catégorie UEMOA, TVA 18 %, prélèvements communautaires, AIB. Vérification du code SH par AD TRANS LOGISTICS sous 24 h.',
         None, GOODS_CONTENT, 'Estimation marchandises', ld_goods)
bp.build('simulateurs', 'Simulateurs douane, dépotage, transit et transport | AD TRANS LOGISTICS',
         'Tous les simulateurs AD TRANS LOGISTICS : droits de douane véhicule et marchandises, dépotage de conteneur, transit Niger / Burkina / Mali / Nigeria, transport de véhicule, coût rendu conteneur.',
         None, HUB_CONTENT, 'Simulateurs', ld_hub)

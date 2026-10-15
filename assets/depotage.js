/* AD TRANS LOGISTICS — Module dépotage (partagé : /suivi, /espace-client, /equipe)
 * Référentiel des 13 étapes en 4 phases + rendu de la carte de suivi.
 * Aucune dépendance : fonctionne avec ou sans Supabase chargé.
 */
(function () {
  'use strict';

  // Langue d'affichage : 'en' sur les pages /en (lang="en") ou si window.ADTL_LANG = 'en' ; français sinon.
  const LANG = String(window.ADTL_LANG || document.documentElement.lang || 'fr').slice(0, 2).toLowerCase() === 'en' ? 'en' : 'fr';
  const T = (fr, en) => (LANG === 'en' ? en : fr);
  const L = o => (LANG === 'en' && o.en ? o.en : o.label);

  const STEPS = [
    { code: 'echange_documentaire',      phase: 1, label: 'Échange documentaire',               en: 'Document exchange' },
    { code: 'bon_a_delivrer',            phase: 1, label: 'Bon à délivrer (BAD)',               en: 'Delivery order (BAD)' },
    { code: 'liste_previsionnelle',      phase: 1, label: 'Liste prévisionnelle de dépotage',   en: 'Provisional destuffing list' },
    { code: 'demande_transfert',         phase: 1, label: 'Demande de transfert',               en: 'Transfer request' },
    { code: 'declaration_douane',        phase: 1, label: 'Déclaration en douane du conteneur', en: 'Customs declaration of the container' },
    { code: 'facture_port',              phase: 2, label: 'Facture Port de Cotonou',   short: 'Port',        en: 'Port of Cotonou invoice' },
    { code: 'facture_benin_manutention', phase: 2, label: 'Facture Bénin Manutention', short: 'Manutention', en: 'Bénin Manutention invoice' },
    { code: 'facture_benin_terminal',    phase: 2, label: 'Facture Bénin Terminal',    short: 'Terminal',    en: 'Bénin Terminal invoice' },
    { code: 'besc',                      phase: 2, label: 'BESC',                      short: 'BESC',        en: 'BESC / ECTN' },
    { code: 'relache',                   phase: 3, label: 'Relâche autorisée',                  en: 'Release authorised' },
    { code: 'positionnement',            phase: 3, label: 'Demande de positionnement',          en: 'Positioning request' },
    { code: 'fiches_depotage',           phase: 4, label: 'Fiches de dépotage',                 en: 'Destuffing sheets' },
    { code: 'degroupage',                phase: 4, label: 'Dégroupage & remise des marchandises', en: 'Deconsolidation & handover of goods' }
  ];
  const PHASES = [
    { n: 1, label: 'Documents',       en: 'Documents',   hint: 'Échange documentaire, BAD, liste prévisionnelle, transfert, déclaration' },
    { n: 2, label: 'Validations',     en: 'Approvals',   hint: 'Port, Bénin Manutention, Bénin Terminal, BESC — en parallèle', parallel: true },
    { n: 3, label: 'Relâche',         en: 'Release',     hint: 'Relâche autorisée, demande de positionnement' },
    { n: 4, label: 'Dépotage',        en: 'Destuffing',  hint: 'Fiches de dépotage, dégroupage et remise' }
  ];
  const STATUS = {
    en_cours: { label: 'En cours',  en: 'In progress', cls: 'dp-st-cours' },
    bloque:   { label: 'Bloqué',    en: 'On hold',     cls: 'dp-st-bloque' },
    termine:  { label: 'Terminé',   en: 'Completed',   cls: 'dp-st-termine' },
    annule:   { label: 'Annulé',    en: 'Cancelled',   cls: 'dp-st-annule' }
  };
  const LINES = ['Maersk', 'MSC', 'CMA CGM', 'Hapag-Lloyd', 'Grimaldi', 'ONE', 'PIL', 'Evergreen', 'COSCO', 'Autre'];
  const TEAM = ['Pascal', 'Michée', 'Rabib', 'Carolive', 'Anthony'];

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (v, withTime) => {
    if (!v) return '—';
    const d = new Date(v); if (isNaN(d)) return '—';
    const o = { day: '2-digit', month: 'short', year: 'numeric' };
    if (withTime) { o.hour = '2-digit'; o.minute = '2-digit'; }
    return d.toLocaleDateString(LANG === 'en' ? 'en-GB' : 'fr-FR', o).replace('.', '');
  };
  const ago = v => {
    if (!v) return '';
    const s = Math.max(0, (Date.now() - new Date(v).getTime()) / 1000);
    if (s < 60) return T('à l’instant', 'just now');
    if (s < 3600) return T('il y a ' + Math.round(s / 60) + ' min', Math.round(s / 60) + ' min ago');
    if (s < 86400) return T('il y a ' + Math.round(s / 3600) + ' h', Math.round(s / 3600) + ' h ago');
    const d = Math.round(s / 86400); return T('il y a ' + d + ' jour' + (d > 1 ? 's' : ''), d + ' day' + (d > 1 ? 's' : '') + ' ago');
  };

  /** Calcule l'avancement : étapes faites, phase courante, pourcentage. */
  function progress(dossier) {
    const done = new Map((dossier.steps || []).map(s => [s.code, s]));
    const perPhase = PHASES.map(p => {
      const list = STEPS.filter(s => s.phase === p.n);
      const ok = list.filter(s => done.has(s.code)).length;
      return { ...p, total: list.length, done: ok, complete: ok === list.length };
    });
    let current = perPhase.find(p => !p.complete)?.n || 4;
    if (dossier.status === 'termine') current = 5;
    const pct = Math.round(done.size / STEPS.length * 100);
    // Prochaine étape attendue (ordre logique, phase 2 en parallèle)
    const next = STEPS.filter(s => !done.has(s.code));
    const nextLabel = next.length ? (next[0].phase === 2 ? T('Validations en cours (', 'Approvals in progress (') + perPhase[1].done + '/4)' : L(next[0])) : T('Conteneur dépoté', 'Container destuffed');
    return { done, perPhase, current, pct, nextLabel, count: done.size };
  }

  function checkIcon() {
    return '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  }

  /** Carte de suivi complète (publique, client ou équipe). opts.compact = version liste. */
  function renderCard(d, opts = {}) {
    const p = progress(d);
    const st = STATUS[d.status] || STATUS.en_cours;
    const phaseBar = p.perPhase.map(ph => {
      const state = ph.complete ? 'done' : (ph.n === p.current ? 'active' : 'todo');
      return `<div class="dp-phase dp-phase-${state}">
        <div class="dp-phase-dot">${ph.complete ? checkIcon() : ph.n}</div>
        <div class="dp-phase-label">${esc(L(ph))}<span>${ph.done}/${ph.total}</span></div>
      </div>`;
    }).join('<div class="dp-phase-line"></div>');

    const timeline = PHASES.map(ph => {
      const list = STEPS.filter(s => s.phase === ph.n);
      const items = list.map(s => {
        const e = p.done.get(s.code);
        const state = e ? 'done' : (ph.n === p.current ? 'pending' : 'todo');
        return `<li class="dp-step dp-step-${state}">
          <span class="dp-step-mark">${e ? checkIcon() : ''}</span>
          <span class="dp-step-body"><span class="dp-step-label">${esc(L(s))}</span>
          <span class="dp-step-meta">${e ? fmtDate(e.done_at, true) + (e.note ? ' · ' + esc(e.note) : '') : (state === 'pending' ? T('En cours', 'In progress') : T('À venir', 'Upcoming'))}</span></span>
        </li>`;
      }).join('');
      const info = p.perPhase[ph.n - 1];
      return `<div class="dp-tl-phase ${info.complete ? 'is-done' : (ph.n === p.current ? 'is-active' : '')}">
        <div class="dp-tl-head"><strong>Phase ${ph.n} · ${esc(L(ph))}</strong><span>${info.done}/${info.total}${ph.parallel ? T(' · en parallèle', ' · in parallel') : ''}</span></div>
        <ul class="dp-steps ${ph.parallel ? 'dp-steps-grid' : ''}">${items}</ul>
      </div>`;
    }).join('');

    const alert = d.status === 'bloque' && d.blocked_reason
      ? `<div class="dp-note dp-note-warn"><strong>${T('Dossier bloqué', 'File on hold')}</strong> ${esc(d.blocked_reason)}</div>` : '';
    const msg = d.client_message ? `<div class="dp-note"><strong>${T('Message d’AD TRANS LOGISTICS', 'Message from AD TRANS LOGISTICS')}</strong> ${esc(d.client_message)}</div>` : '';
    const notifs = (d.notifications || []);
    const lastNotif = notifs[0];

    return `<article class="dp-card ${opts.compact ? 'dp-card-compact' : ''}" data-id="${esc(d.id || '')}">
      <header class="dp-head">
        <div>
          <div class="dp-kicker">${esc(d.reference || T('Dépotage', 'Destuffing'))} · ${T('Code de suivi', 'Tracking code')} <b>${esc(d.tracking_code || '')}</b></div>
          <h3 class="dp-title">${esc(d.container_no)}</h3>
          <div class="dp-sub">${esc(d.container_type || '')}${d.shipping_line ? ' · ' + esc(d.shipping_line) : ''}${d.vessel ? ' · ' + esc(d.vessel) : ''}</div>
        </div>
        <div class="dp-head-right">
          <span class="dp-status ${st.cls}">${L(st)}</span>
          <span class="dp-updated">${T('Mis à jour', 'Updated')} ${ago(d.updated_at)}</span>
        </div>
      </header>
      <div class="dp-progress">
        <div class="dp-progress-top"><span>${p.count}/${STEPS.length} ${T('étapes', 'steps')} · ${p.pct}%</span><span class="dp-next">${T('Prochaine étape : ', 'Next step: ')}<b>${esc(p.nextLabel)}</b></span></div>
        <div class="dp-bar"><div class="dp-bar-fill" style="width:${p.pct}%"></div></div>
        <div class="dp-phases">${phaseBar}</div>
      </div>
      ${alert}${msg}
      <dl class="dp-meta">
        <div><dt>${T('Connaissement (BL)', 'Bill of lading (BL)')}</dt><dd>${esc(d.bl_no || '—')}</dd></div>
        <div><dt>${T('Arrivée navire', 'Vessel arrival')}</dt><dd>${fmtDate(d.eta)}</dd></div>
        <div><dt>${T('Marchandises', 'Cargo')}</dt><dd>${esc(d.cargo || '—')}${d.vehicles_count && !/v[ée]hicule|vehicle/i.test(d.cargo || '') ? ' · ' + d.vehicles_count + T(' véhicule', ' vehicle') + (d.vehicles_count > 1 ? 's' : '') : ''}</dd></div>
        <div><dt>${T('Client', 'Customer')}</dt><dd>${esc(d.client_company || d.client_name || '—')}</dd></div>
        <div><dt>${T('Ouvert le', 'Opened on')}</dt><dd>${fmtDate(d.created_at)}</dd></div>
        <div><dt>Notifications</dt><dd>${notifs.length ? notifs.length + T(' envoyée', ' sent') + (notifs.length > 1 && LANG !== 'en' ? 's' : '') + (lastNotif ? T(' · dernière ', ' · last ') + fmtDate(lastNotif.sent_at) : '') : T('Aucune pour l’instant', 'None yet')}</dd></div>
      </dl>
      ${opts.compact ? '' : `<details class="dp-details" ${opts.open ? 'open' : ''}><summary>${T('Détail des 13 étapes', 'All 13 steps in detail')}</summary><div class="dp-timeline">${timeline}</div></details>`}
    </article>`;
  }

  /** Message WhatsApp pré-rempli pour le client (une étape franchie). */
  function whatsappMessage(d, stepCode) {
    const step = STEPS.find(s => s.code === stepCode);
    const p = progress(d);
    const who = d.notify_name || d.client_name || '';
    const lines = [
      `Bonjour ${who},`.trim(),
      `AD TRANS LOGISTICS vous informe de l’avancement du dépotage du conteneur *${d.container_no}* (BL ${d.bl_no}).`,
      step ? `✅ Étape franchie : *${step.label}* (${fmtDate(new Date(), true)})` : `Statut : ${STATUS[d.status]?.label || ''}`,
      `Avancement : ${p.count}/13 étapes · Prochaine étape : ${p.nextLabel}.`,
      d.client_message ? `ℹ️ ${d.client_message}` : null,
      `Suivi en direct : https://www.adtranslogistics.com/suivi?code=${d.tracking_code}`,
      `— AD TRANS LOGISTICS · +229 01 97 50 05 55`
    ].filter(Boolean);
    return lines.join('\n');
  }
  const waLink = (phone, text) => {
    const digits = String(phone || '').replace(/\D/g, '');
    const intl = digits.startsWith('229') || digits.startsWith('234') || digits.length > 10 ? digits : '229' + digits;
    return 'https://wa.me/' + intl + '?text=' + encodeURIComponent(text);
  };

  const CSS = `
.dp-card{background:#fff;border:1px solid #E5E5E5;border-radius:24px;padding:28px;box-shadow:0 1px 2px rgba(10,10,10,.04),0 12px 40px -24px rgba(10,10,10,.25);font-family:'Instrument Sans',sans-serif;color:#0A0A0A}
.dp-card + .dp-card{margin-top:16px}
.dp-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap}
.dp-kicker{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#737373}
.dp-kicker b{color:#0A0A0A;letter-spacing:.18em}
.dp-title{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:30px;letter-spacing:-.01em;line-height:1.1;margin:6px 0 4px}
.dp-sub{font-size:14px;color:#737373}
.dp-head-right{display:flex;flex-direction:column;align-items:flex-end;gap:6px}
.dp-status{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.04em}
.dp-status::before{content:'';width:7px;height:7px;border-radius:50%;background:currentColor}
.dp-st-cours{background:#0A0A0A;color:#fff}.dp-st-bloque{background:#FEF3C7;color:#92400E}.dp-st-termine{background:#DCFCE7;color:#166534}.dp-st-annule{background:#F0F0F0;color:#737373}
.dp-updated{font-size:12px;color:#A3A3A3}
.dp-progress{margin-top:22px}
.dp-progress-top{display:flex;justify-content:space-between;gap:12px;font-size:13px;color:#525252;flex-wrap:wrap;margin-bottom:8px}
.dp-next b{color:#0A0A0A}
.dp-bar{height:6px;background:#F0F0F0;border-radius:999px;overflow:hidden}
.dp-bar-fill{height:100%;background:#0A0A0A;border-radius:999px;transition:width .6s cubic-bezier(.4,0,.2,1)}
.dp-phases{display:flex;align-items:center;margin-top:18px}
.dp-phase{display:flex;align-items:center;gap:10px;min-width:0}
.dp-phase-dot{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid #E5E5E5;color:#A3A3A3;background:#fff;flex:none}
.dp-phase-label{font-size:12px;font-weight:600;color:#A3A3A3;line-height:1.15;white-space:nowrap}
.dp-phase-label span{display:block;font-weight:500;font-size:11px}
.dp-phase-done .dp-phase-dot{background:#0A0A0A;border-color:#0A0A0A;color:#fff}
.dp-phase-done .dp-phase-label{color:#525252}
.dp-phase-active .dp-phase-dot{border-color:#0A0A0A;color:#0A0A0A;box-shadow:0 0 0 4px rgba(10,10,10,.08);animation:dpPulse 2s infinite}
.dp-phase-active .dp-phase-label{color:#0A0A0A}
.dp-phase-line{flex:1;height:2px;background:#E5E5E5;margin:0 10px;min-width:12px}
@keyframes dpPulse{0%,100%{box-shadow:0 0 0 4px rgba(10,10,10,.08)}50%{box-shadow:0 0 0 7px rgba(10,10,10,.04)}}
.dp-note{margin-top:18px;padding:14px 16px;border-radius:14px;background:#F7F7F7;font-size:14px;color:#262626;line-height:1.5}
.dp-note strong{display:block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#737373;margin-bottom:4px}
.dp-note-warn{background:#FFFBEB;border:1px solid #FDE68A}.dp-note-warn strong{color:#92400E}
.dp-meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px 20px;margin:22px 0 0;padding-top:20px;border-top:1px solid #F0F0F0}
.dp-meta dt{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#A3A3A3;margin-bottom:3px}
.dp-meta dd{font-size:14px;font-weight:600;margin:0;word-break:break-word}
.dp-details{margin-top:18px;border-top:1px solid #F0F0F0;padding-top:14px}
.dp-details summary{cursor:pointer;font-size:13px;font-weight:700;color:#0A0A0A;list-style:none;display:flex;align-items:center;gap:8px}
.dp-details summary::-webkit-details-marker{display:none}
.dp-details summary::before{content:'';width:8px;height:8px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(-45deg);transition:transform .2s;margin-left:2px}
.dp-details[open] summary::before{transform:rotate(45deg)}
.dp-timeline{margin-top:14px;display:grid;gap:14px}
.dp-tl-phase{border:1px solid #F0F0F0;border-radius:16px;padding:14px 16px}
.dp-tl-phase.is-active{border-color:#0A0A0A}
.dp-tl-head{display:flex;justify-content:space-between;font-size:13px;margin-bottom:10px}
.dp-tl-head span{color:#737373}
.dp-steps{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.dp-steps-grid{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.dp-step{display:flex;gap:10px;align-items:flex-start;font-size:14px}
.dp-step-mark{width:20px;height:20px;border-radius:50%;border:1.5px solid #D4D4D4;display:flex;align-items:center;justify-content:center;flex:none;margin-top:1px;color:#fff}
.dp-step-done .dp-step-mark{background:#0A0A0A;border-color:#0A0A0A}
.dp-step-pending .dp-step-mark{border-color:#0A0A0A;border-style:dashed}
.dp-step-todo{color:#A3A3A3}
.dp-step-body{display:flex;flex-direction:column}
.dp-step-label{font-weight:600}
.dp-step-meta{font-size:12px;color:#737373}
.dp-card-compact{padding:20px}.dp-card-compact .dp-title{font-size:22px}.dp-card-compact .dp-meta{display:none}.dp-card-compact .dp-phases{margin-top:12px}
@media(max-width:640px){.dp-card{padding:20px;border-radius:18px}.dp-title{font-size:24px}.dp-phase-label{display:none}.dp-phase-line{margin:0 6px}.dp-head-right{flex-direction:row;align-items:center;gap:10px}.dp-meta{grid-template-columns:1fr 1fr;gap:12px 14px}.dp-progress-top{flex-direction:column;gap:2px}}
`;
  function injectCSS() { if (document.getElementById('dp-css')) return; const s = document.createElement('style'); s.id = 'dp-css'; s.textContent = CSS; document.head.appendChild(s); }

  window.ADTLDepotage = { LANG, STEPS, PHASES, STATUS, LINES, TEAM, esc, fmtDate, ago, progress, renderCard, whatsappMessage, waLink, injectCSS };
})();

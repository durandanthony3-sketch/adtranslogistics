/* ADTL Pay — agrégateur de paiement (KkiaPay : MTN MoMo, Moov, cartes Visa/Mastercard)
 * ────────────────────────────────────────────────────────────────────────────
 * CONFIGURATION (1 minute) :
 * 1. Créez votre compte marchand sur https://kkiapay.me (gratuit, validation rapide)
 * 2. Dans le tableau de bord KkiaPay : Développeurs → Clés API → copiez la
 *    "Clé publique" (mode LIVE).
 * 3. Collez-la ci-dessous à la place de VOTRE_CLE_PUBLIQUE_KKIAPAY.
 *    ⚠ Ne mettez JAMAIS la clé privée/secrète ici (ce fichier est public).
 * Tant que la clé n'est pas configurée, le site bascule automatiquement sur le
 * paiement manuel MTN MoMo + confirmation WhatsApp (flux actuel).
 */
window.ADTL_PAY = {
  publicKey: '0f2a63a0d00490f44afdb59b7e4a4886bbbcb6a2',
  sandbox: false,
  theme: '#0D1B2A',

  configured: function () {
    return !!this.publicKey && this.publicKey.indexOf('VOTRE_CLE') === -1;
  },

  _loading: null,
  _load: function () {
    if (window.openKkiapayWidget) return Promise.resolve();
    if (this._loading) return this._loading;
    this._loading = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = 'https://cdn.kkiapay.me/k.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
    return this._loading;
  },

  /* open(montantXOF, motif, meta{name,email,phone,ref}, onSuccess(txId), onFailure(resp)) */
  open: function (amount, reason, meta, onSuccess, onFailure) {
    var self = this;
    meta = meta || {};
    var fail = function (resp) {
      try {
        self.notifyAdmin({
          _subject: 'ECHEC PAIEMENT KKIAPAY — a relancer',
          Motif: reason || '', Montant: amount + ' F', Reference: meta.ref || '',
          Nom: meta.name || '', Telephone: meta.phone || '', Email: meta.email || ''
        });
      } catch (e) {}
      if (typeof onFailure === 'function') { onFailure(resp); }
      else { alert("Le paiement n'a pas abouti. Utilisez le paiement MTN MoMo manuel ou contactez-nous sur WhatsApp au 01 97 50 05 55."); }
    };
    this._load().then(function () {
      try {
        if (typeof addKkiapayListener === 'function') {
          var okHandler = function (resp) {
            try { removeKkiapayListener && removeKkiapayListener('success', okHandler); } catch (e) {}
            try { removeKkiapayListener && removeKkiapayListener('failed', koHandler); } catch (e) {}
            onSuccess((resp && (resp.transactionId || resp.transaction_id)) || 'tx-' + Date.now());
          };
          var koHandler = function (resp) {
            try { removeKkiapayListener && removeKkiapayListener('success', okHandler); } catch (e) {}
            try { removeKkiapayListener && removeKkiapayListener('failed', koHandler); } catch (e) {}
            fail(resp);
          };
          addKkiapayListener('success', okHandler);
          addKkiapayListener('failed', koHandler);
        }
        openKkiapayWidget({
          amount: amount,
          api_key: self.publicKey,
          key: self.publicKey,
          sandbox: self.sandbox,
          phone: (meta.phone || '').replace(/\D/g, ''),
          name: meta.name || '',
          email: meta.email || '',
          reason: reason || 'Paiement AD TRANS LOGISTICS',
          data: meta.ref || '',
          theme: self.theme,
          callback: ''
        });
      } catch (e) {
        fail(e);
      }
    }).catch(function () {
      fail();
    });
  },

  /* Notification email à ADTL après succès (référence à vérifier dans le dashboard KkiaPay) */
  notifyAdmin: function (payload) {
    try {
      payload = payload || {};
      payload._subject = payload._subject || 'PAIEMENT EN LIGNE CONFIRME — ADTL';
      fetch('https://formsubmit.co/ajax/adtranslogistics@hotmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function () {});
    } catch (e) {}
  }
};

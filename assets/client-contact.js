(function () {
  'use strict';
  const simulator = !!document.getElementById('sim-payer-name');
  const ids = simulator ? ['sim-payer-name', 'sim-payer-firstname', 'sim-payer-phone'] : ['f-nom', 'f-prenom', 'f-tel'];
  const keys = ['lastName', 'firstName', 'phone'];
  const emailId = simulator ? 'sim-payer-email' : 'f-email';
  if (document.getElementById(emailId)) { ids.push(emailId); keys.push('email'); }
  const fields = ids.map(id => document.getElementById(id));
  if (fields.some(field => !field)) return;
  const clean = value => String(value || '').trim().replace(/\s+/g, ' ');
  const nameOK = value => value.length >= 1 && value.length <= 80 && /\p{L}/u.test(value) && /^[\p{L}\p{M} .’'\-]+$/u.test(value);
  const phoneOK = value => /^[+\d ().-]{8,25}$/.test(value) && /^\+?\d{8,15}$/.test(value.replace(/[ ().-]/g, ''));
  function get() { return Object.fromEntries(keys.map((key, i) => [key, key === 'email' ? fields[i].value.trim().toLowerCase() : clean(fields[i].value)])); }
  function validate(showErrors = true) {
    const customer = get();
    const valid = [nameOK(customer.lastName), nameOK(customer.firstName), phoneOK(customer.phone)];
    const messages = ['Renseignez votre nom de famille.', 'Renseignez votre prénom.', 'Renseignez un numéro de téléphone valide, avec l’indicatif du pays si nécessaire.'];
    if (keys.includes('email')) {
      const email = customer.email;
      const local = email.split('@')[0];
      valid.push(email.length <= 254 && local.length <= 64 && !local.startsWith('.') && !local.endsWith('.') && !local.includes('..') && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(email));
      messages.push('Renseignez une adresse e-mail valide pour recevoir votre rapport.');
    }
    fields.forEach((field, i) => {
      field.setCustomValidity(valid[i] ? '' : messages[i]);
      if (showErrors) { field.classList.toggle('input-error', !valid[i]); valid[i] ? field.removeAttribute('aria-invalid') : field.setAttribute('aria-invalid', 'true'); }
    });
    const invalid = valid.indexOf(false);
    if (showErrors && invalid !== -1) { fields[invalid].focus(); fields[invalid].reportValidity(); }
    return invalid === -1;
  }
  function set(customer) {
    if (!customer || typeof customer !== 'object' || Array.isArray(customer)) return;
    keys.forEach((key, i) => {
      fields[i].value = typeof customer[key] === 'string' ? customer[key].replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, key === 'email' ? 254 : i === 2 ? 25 : 80) : '';
      fields[i].setCustomValidity(''); fields[i].removeAttribute('aria-invalid'); fields[i].classList.remove('input-error');
    });
  }
  fields.forEach(field => field.addEventListener('input', () => { field.setCustomValidity(''); field.removeAttribute('aria-invalid'); field.classList.remove('input-error'); }));
  window.ADTLClientContact = { get, validate, set };
})();

'use strict';

// Transactional e-mail for paid simulation reports.
// Provider chosen by configuration, first available wins:
//   - Brevo   : BREVO_API_KEY  (https://api.brevo.com/v3/smtp/email, sender verified in Brevo)
//   - Resend  : RESEND_API_KEY (https://api.resend.com/emails, sender on a verified domain)
//   - none    : no transactional provider → the caller falls back to the legacy formsubmit relay.
// MAIL_FROM optionally overrides the sender: "AD TRANS LOGISTICS <adtranslogistics@hotmail.com>".

const DEFAULT_FROM = { name: 'AD TRANS LOGISTICS', email: 'adtranslogistics@hotmail.com' };
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;

function parseFrom(value) {
  const text = String(value || '').trim();
  if (!text) return DEFAULT_FROM;
  const match = text.match(/^(?:"?([^"<]*)"?\s*)?<([^>]+)>$/);
  if (match) return { name: (match[1] || DEFAULT_FROM.name).trim(), email: match[2].trim().toLowerCase() };
  return /^[^\s@]+@[^\s@]+$/.test(text) ? { name: DEFAULT_FROM.name, email: text.toLowerCase() } : DEFAULT_FROM;
}

function toList(value) {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).map(item => typeof item === 'string' ? { email: item } : item).filter(item => item && item.email);
}

function createMailTransport({ env = process.env, fetch: fetchImpl = globalThis.fetch, timeoutMs = 20000 } = {}) {
  const brevoKey = String(env.BREVO_API_KEY || '').trim();
  const resendKey = String(env.RESEND_API_KEY || '').trim();
  const provider = brevoKey ? 'brevo' : resendKey ? 'resend' : 'none';
  const from = parseFrom(env.MAIL_FROM);

  async function post(url, headers, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers }, body: JSON.stringify(body), signal: controller.signal, redirect: 'error' });
      const text = await response.text();
      if (!response.ok) { const error = new Error('notification_rejected'); error.providerStatus = response.status; error.providerBody = text.slice(0, 300); throw error; }
      try { return JSON.parse(text); } catch { return {}; }
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('notification_timeout');
      throw error;
    } finally { clearTimeout(timer); }
  }

  function checkAttachments(attachments) {
    for (const file of attachments) {
      if (!Buffer.isBuffer(file.content) || !file.filename) throw new Error('invalid_attachment');
      if (file.content.length > MAX_ATTACHMENT_BYTES) throw new Error('attachment_too_large');
    }
  }

  async function send(message) {
    const to = toList(message.to), cc = toList(message.cc), bcc = toList(message.bcc);
    if (!to.length) throw new Error('recipient_required');
    const attachments = message.attachments || [];
    checkAttachments(attachments);
    if (provider === 'brevo') {
      const body = {
        sender: from,
        to, ...(cc.length ? { cc } : {}), ...(bcc.length ? { bcc } : {}),
        replyTo: message.replyTo ? { email: message.replyTo } : from,
        subject: message.subject,
        textContent: message.text,
        ...(message.html ? { htmlContent: message.html } : {}),
        ...(attachments.length ? { attachment: attachments.map(file => ({ name: file.filename, content: file.content.toString('base64') })) } : {})
      };
      const data = await post('https://api.brevo.com/v3/smtp/email', { 'api-key': brevoKey }, body);
      return { provider, id: data.messageId || null };
    }
    if (provider === 'resend') {
      const fmt = list => list.map(item => item.name ? `${item.name} <${item.email}>` : item.email);
      const body = {
        from: `${from.name} <${from.email}>`,
        to: fmt(to), ...(cc.length ? { cc: fmt(cc) } : {}), ...(bcc.length ? { bcc: fmt(bcc) } : {}),
        reply_to: message.replyTo || from.email,
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
        ...(attachments.length ? { attachments: attachments.map(file => ({ filename: file.filename, content: file.content.toString('base64') })) } : {})
      };
      const data = await post('https://api.resend.com/emails', { Authorization: 'Bearer ' + resendKey }, body);
      return { provider, id: data.id || null };
    }
    throw new Error('notification_unavailable');
  }

  return { provider, from, send };
}

module.exports = { createMailTransport, parseFrom };

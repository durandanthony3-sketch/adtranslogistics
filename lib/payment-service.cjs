'use strict';

const crypto = require('node:crypto');
const REPORT_VERSION = '20260923-1';
const CLIENT_EMAIL_VERSION = '20260923-email2';
const { normalizeEmail } = require('./customer-email.cjs');

const PRICE = 500;
// Orders and receipts issued before the price reduction retain their signed amount.
const HISTORICAL_PRICE = 1000;
const CURRENCY = 'XOF';
const COOKIE_NAME = '__Host-adtl_sim_device';
const MAX_BODY_BYTES = 131072;
const MAX_PAYLOAD_BYTES = 65536;
const MAX_TOKEN_CHARS = 90000;
const TOKEN_AAD = Buffer.from('adtl.simulation.payment.v1');

class PaymentError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'PaymentError';
    this.code = code;
    this.status = status;
  }
}

const badRequest = () => new PaymentError('invalid_request', 'La demande est invalide.');
const invalidToken = () => new PaymentError('invalid_token', 'Cette référence ne correspond pas à votre simulation.', 403);
const plainObject = value => Boolean(value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype);
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
function equalText(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const a = Buffer.from(left), b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function onlyKeys(value, keys) {
  if (!plainObject(value) || Object.keys(value).length !== keys.length || keys.some(key => !Object.prototype.hasOwnProperty.call(value, key))) throw badRequest();
}
function safeSnapshot(value) {
  const serialized = JSON.stringify(value);
  if (!serialized || Buffer.byteLength(serialized) > MAX_PAYLOAD_BYTES) throw badRequest();
  return JSON.parse(serialized);
}

function normalizeCustomer(value, requireEmail = false) {
  const hasEmail = plainObject(value) && Object.prototype.hasOwnProperty.call(value, 'email');
  onlyKeys(value, hasEmail ? ['lastName', 'firstName', 'phone', 'email'] : ['lastName', 'firstName', 'phone']);
  const clean = text => typeof text === 'string' ? text.trim().replace(/\s+/g, ' ') : '';
  const customer = { lastName: clean(value.lastName), firstName: clean(value.firstName), phone: clean(value.phone) };
  const nameOK = text => text.length >= 1 && text.length <= 80 && /\p{L}/u.test(text) && /^[\p{L}\p{M} .’'\-]+$/u.test(text);
  if (!nameOK(customer.lastName) || !nameOK(customer.firstName) || !/^[+\d ().-]{8,25}$/.test(customer.phone) || !/^\+?\d{8,15}$/.test(customer.phone.replace(/[ ().-]/g, ''))) {
    throw new PaymentError('invalid_customer', 'Renseignez le nom, le prénom et un numéro de téléphone valide.', 422);
  }
  if (hasEmail || requireEmail) {
    const email = normalizeEmail(value.email);
    if (!email) throw new PaymentError('invalid_email', 'Indiquez une adresse e-mail valide pour recevoir votre rapport. Actualisez la page si le champ e-mail est absent.', 422);
    customer.email = email;
  }
  return customer;
}

function createPaymentService(options = {}) {
  const env = options.env || process.env;
  const fetchImpl = options.fetch || globalThis.fetch;
  const compute = options.compute;
  const product = options.product || 'vehicle';
  const normalizeInput = options.normalizeInput || (value => value);
  const randomBytes = options.randomBytes || crypto.randomBytes;
  const now = options.now || Date.now;
  const timeoutMs = options.timeoutMs || 12000;
  const signingSecret = String(env.ADTL_PAYMENT_SIGNING_SECRET || '');
  const sandboxValid = env.KKIAPAY_SANDBOX === 'true' || env.KKIAPAY_SANDBOX === 'false';
  const sandbox = env.KKIAPAY_SANDBOX === 'true';
  const publicKey = String(env.KKIAPAY_PUBLIC_KEY || '').trim();
  const paymentEnvironment = sandbox ? 'sandbox' : 'live';
  const merchantKeyHash = sha256(publicKey);
  const privateKey = String(env.KKIAPAY_PRIVATE_KEY || '').trim();
  const secretKey = String(env.KKIAPAY_SECRET_KEY || '').trim();
  const enabled = env.PAYMENT_ENABLED === 'true' && sandboxValid && Buffer.byteLength(signingSecret) >= 32 && Boolean(publicKey && privateKey && secretKey);
  const key = crypto.createHash('sha256').update(signingSecret).digest();

  function requireEnabled() {
    if (!enabled) throw new PaymentError('payment_unavailable', 'Le paiement est temporairement indisponible. Réessayez ultérieurement.', 503);
  }
  function requireDevice(device) {
    if (typeof device !== 'string' || !/^[a-f0-9]{64}$/.test(device)) throw invalidToken();
    return sha256(device);
  }
  function seal(payload) {
    const text = JSON.stringify(payload);
    if (Buffer.byteLength(text) > MAX_PAYLOAD_BYTES) throw new PaymentError('simulation_too_large', 'Cette simulation nécessite une étude personnalisée.', 422);
    const iv = randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(TOKEN_AAD);
    const ciphertext = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return ['v1', iv.toString('base64url'), ciphertext.toString('base64url'), cipher.getAuthTag().toString('base64url')].join('.');
  }
  function unseal(token, kind, device) {
    if (Buffer.byteLength(signingSecret) < 32 || !sandboxValid || !publicKey) throw invalidToken();
    const deviceHash = requireDevice(device);
    if (typeof token !== 'string' || token.length > MAX_TOKEN_CHARS) throw invalidToken();
    const parts = token.split('.');
    if (parts.length !== 4 || parts[0] !== 'v1' || parts.slice(1).some(part => !/^[A-Za-z0-9_-]+$/.test(part))) throw invalidToken();
    try {
      const iv = Buffer.from(parts[1], 'base64url');
      const ciphertext = Buffer.from(parts[2], 'base64url');
      const tag = Buffer.from(parts[3], 'base64url');
      if (iv.length !== 12 || tag.length !== 16 || ciphertext.length > MAX_PAYLOAD_BYTES || [iv, ciphertext, tag].some((part, index) => part.toString('base64url') !== parts[index + 1])) throw invalidToken();
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAAD(TOKEN_AAD);
      decipher.setAuthTag(tag);
      const payload = JSON.parse(Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8'));
      if (!plainObject(payload) || payload.v !== 1 || payload.kind !== kind || (payload.product || 'vehicle') !== product || payload.paymentEnvironment !== paymentEnvironment || !equalText(payload.merchantKeyHash, merchantKeyHash) || !equalText(payload.deviceHash, deviceHash) || !/^[a-f0-9]{32}$/.test(payload.orderId) || (payload.amount !== PRICE && payload.amount !== HISTORICAL_PRICE) || payload.currency !== CURRENCY || !plainObject(payload.input) || !plainObject(payload.result)) throw invalidToken();
      if (kind === 'receipt' && (typeof payload.transactionId !== 'string' || !/^[A-Za-z0-9_-]{4,128}$/.test(payload.transactionId))) throw invalidToken();
      if (payload.customer !== undefined) normalizeCustomer(payload.customer);
      return payload;
    } catch (error) {
      throw invalidToken();
    }
  }

  async function verifyProvider(transactionId) {
    const controller = new AbortController();
    let timer;
    const timeout = new Promise((resolve, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new PaymentError('payment_timeout', 'La confirmation du paiement prend du temps. Réessayez avec la même référence.', 504));
      }, timeoutMs);
    });
    try {
      const request = (async () => {
        const response = await fetchImpl((sandbox ? 'https://api-sandbox.kkiapay.me' : 'https://api.kkiapay.me') + '/api/v1/transactions/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': publicKey, 'x-private-key': privateKey, 'x-secret-key': secretKey },
          body: JSON.stringify({ transactionId }),
          signal: controller.signal,
          redirect: 'error'
        });
        if (!response.ok) throw new PaymentError('payment_unconfirmed', 'Le paiement ne peut pas encore être confirmé. Réessayez avec la même référence.', 502);
        const text = await response.text();
        if (Buffer.byteLength(text) > MAX_PAYLOAD_BYTES) throw new Error('provider_response_too_large');
        return JSON.parse(text);
      })();
      return await Promise.race([request, timeout]);
    } catch (error) {
      if (error instanceof PaymentError) throw error;
      throw new PaymentError('payment_unconfirmed', 'Le paiement ne peut pas encore être confirmé. Réessayez avec la même référence.', 502);
    } finally {
      clearTimeout(timer);
    }
  }

  async function notifyPaidReceipt(receipt) {
    // Old notifications had no report attached. Upgrade them on paid recovery.
    if (!receipt.customer || (receipt.notificationStatus === 'sent' && receipt.reportCopyVersion === REPORT_VERSION && (!receipt.customer.email || receipt.clientEmailVersion === CLIENT_EMAIL_VERSION))) return;
    try {
      if (typeof options.notifySubmission !== 'function') throw new Error('notification_unavailable');
      await options.notifySubmission({
        product, orderId: receipt.orderId, createdAt: receipt.createdAt,
        customer: receipt.customer, input: receipt.input, result: receipt.result,
        amount: receipt.amount, currency: receipt.currency,
        transactionId: receipt.transactionId, verifiedAt: receipt.verifiedAt
      });
      receipt.notificationStatus = 'sent';
      receipt.reportCopyVersion = REPORT_VERSION;
      if (receipt.customer.email) receipt.clientEmailVersion = CLIENT_EMAIL_VERSION;
    } catch (error) {
      // Keep the paid result available and retry from its authenticated receipt.
      receipt.notificationStatus = 'pending';
      // Diagnostic only: never log customer data, receipt tokens or payment keys.
      console.error(JSON.stringify({ event:'report_email_failed', product,
        reason:['notification_timeout','notification_rejected','notification_unavailable'].includes(error.message)?error.message:'report_generation_or_delivery_failed',
        ...(Number.isInteger(error.providerStatus)?{providerStatus:error.providerStatus}:{}) }));
    }
  }

  function emailDeliveryStatus(receipt) {
    if (!receipt.customer?.email) return 'missing_email';
    return receipt.notificationStatus === 'sent' && receipt.clientEmailVersion === CLIENT_EMAIL_VERSION ? 'sent' : 'pending';
  }

  return {
    config() { return { enabled, amount: PRICE, currency: CURRENCY, publicKey: enabled ? publicKey : null, sandbox, product, reportCopyVersion: REPORT_VERSION, customerEmailRequired: true, clientEmailVersion: CLIENT_EMAIL_VERSION }; },
    createDevice() { return randomBytes(32).toString('hex'); },
    async quote(body, device) {
      requireEnabled();
      if(product!=='goods')throw new PaymentError('not_found','Action introuvable.',404);
      onlyKeys(body,['input']);
      const deviceHash=requireDevice(device);
      const input=safeSnapshot(await normalizeInput(body.input));
      const result=safeSnapshot(await compute(input));
      const createdAt=new Date(now()).toISOString(), orderId=randomBytes(16).toString('hex');
      const quoteToken=seal({v:1,kind:'quote',product,orderId,deviceHash,paymentEnvironment,merchantKeyHash,amount:PRICE,currency:CURRENCY,createdAt,input,result});
      return {quoteToken,input,description:result.input.description,exchangeRate:result.input.exchangeRate,calculatedAt:result.calculatedAt,amount:PRICE,currency:CURRENCY};
    },
    async order(body, device) {
      requireEnabled();
      onlyKeys(body, product==='goods'?['quoteToken','customer']:['input','customer']);
      const quote=product==='goods'?unseal(body.quoteToken,'quote',device):null;
      if(quote && (!Number.isFinite(Date.parse(quote.createdAt)) || now()-Date.parse(quote.createdAt)>15*60*1000))throw new PaymentError('quote_expired','Le calcul a expiré. Vérifiez à nouveau la simulation avant de payer.',422);
      const customer = normalizeCustomer(body.customer, true);
      if (!quote && (!plainObject(body.input) || Buffer.byteLength(JSON.stringify(body.input)) > 12288)) throw badRequest();
      const deviceHash = requireDevice(device);
      let input, result;
      try {
        input = quote ? quote.input : safeSnapshot(await normalizeInput(body.input));
        result = quote ? quote.result : safeSnapshot(await compute(input));
      } catch (error) {
        if (error instanceof PaymentError) throw error;
        throw new PaymentError('invalid_simulation', 'Vérifiez les informations saisies. Cette simulation ne peut pas encore être chiffrée.', 422);
      }
      if (!plainObject(input) || !plainObject(result)) throw new PaymentError('invalid_simulation', 'Cette simulation nécessite une étude personnalisée.', 422);
      const orderId = quote ? quote.orderId : randomBytes(16).toString('hex');
      const createdAt = new Date(now()).toISOString();
      const orderToken = seal({ v: 1, kind: 'order', product, orderId, deviceHash, paymentEnvironment, merchantKeyHash, amount: PRICE, currency: CURRENCY, createdAt, customer, input, result });
      return { orderId, orderToken, amount: PRICE, currency: CURRENCY, publicKey, sandbox, input, customer };
    },
    async verify(body, device) {
      requireEnabled();
      onlyKeys(body, ['orderToken', 'transactionId']);
      if (typeof body.transactionId !== 'string' || !/^[A-Za-z0-9_-]{4,128}$/.test(body.transactionId)) throw badRequest();
      const order = unseal(body.orderToken, 'order', device);
      const transaction = await verifyProvider(body.transactionId);
      if (!plainObject(transaction) || transaction.status !== 'SUCCESS' || transaction.type !== 'DEBIT' || transaction.amount !== order.amount || (Object.prototype.hasOwnProperty.call(transaction, 'currency') && transaction.currency !== CURRENCY) || transaction.transactionId !== body.transactionId || !equalText(transaction.partnerId, order.orderId)) {
        throw new PaymentError('payment_mismatch', 'Ce paiement ne confirme pas cette simulation. Vérifiez votre référence de transaction.', 402);
      }
      const receipt = { ...order, kind: 'receipt', transactionId: transaction.transactionId,
        verifiedAt: new Date(now()).toISOString(), notificationStatus: order.customer ? 'pending' : 'not_required' };
      // Already-open legacy orders remain payable. Use the verified provider's
      // customer address when that older order did not yet collect an email.
      if (receipt.customer && !receipt.customer.email) {
        const legacyEmail = normalizeEmail(transaction.client?.email);
        if (legacyEmail) receipt.customer = { ...receipt.customer, email: legacyEmail };
      }
      await notifyPaidReceipt(receipt);
      return { receiptToken: seal(receipt), transactionId: receipt.transactionId, amount: receipt.amount, currency: receipt.currency, input: receipt.input, result: receipt.result, notificationStatus: receipt.notificationStatus, emailDeliveryStatus: emailDeliveryStatus(receipt), ...(receipt.customer ? { customer: receipt.customer } : {}) };
    },
    async result(body, device) {
      // Existing paid receipts remain readable if checkout is temporarily disabled.
      if (Buffer.byteLength(signingSecret) < 32 || !sandboxValid || !publicKey) throw new PaymentError('payment_unavailable', 'La récupération est temporairement indisponible.', 503);
      onlyKeys(body, ['receiptToken']);
      const receipt = unseal(body.receiptToken, 'receipt', device);
      const retryNotification = receipt.notificationStatus !== 'sent' || receipt.reportCopyVersion !== REPORT_VERSION || (receipt.customer?.email && receipt.clientEmailVersion !== CLIENT_EMAIL_VERSION);
      await notifyPaidReceipt(receipt);
      return { receiptToken: retryNotification ? seal(receipt) : body.receiptToken, transactionId: receipt.transactionId, amount: receipt.amount, currency: receipt.currency, input: receipt.input, result: receipt.result, emailDeliveryStatus: emailDeliveryStatus(receipt), ...(receipt.notificationStatus ? { notificationStatus: receipt.notificationStatus } : {}), ...(receipt.customer ? { customer: receipt.customer } : {}) };
    },
    async email(body, device) {
      onlyKeys(body, ['receiptToken', 'email']);
      const receipt = unseal(body.receiptToken, 'receipt', device);
      const email = normalizeEmail(body.email);
      if (!email || !receipt.customer) throw new PaymentError('invalid_email', 'Indiquez une adresse e-mail valide pour recevoir votre rapport.', 422);
      receipt.customer = { ...receipt.customer, email };
      receipt.notificationStatus = 'pending';
      receipt.emailAttempt = { nonce:randomBytes(24).toString('hex'), expiresAt:now()+15*60*1000 };
      const report = require('./simulation-report.cjs').createSimulationReport({ ...receipt, product });
      const payload = require('./submission-notification.cjs').submissionPayload({ ...receipt, product });
      payload.Empreinte_PDF_SHA256 = report.sha256;
      return { filename:report.filename, contentBase64:report.bytes.toString('base64'), sha256:report.sha256,
        receiptToken:seal(receipt), email, customer:receipt.customer, notificationStatus:'pending', emailDeliveryStatus:'pending',
        emailSubmission:{ endpoint:'https://formsubmit.co/adtranslogistics@hotmail.com', payload, attempt:receipt.emailAttempt.nonce } };
    },
    async emailConfirm(body, device) {
      onlyKeys(body, ['receiptToken', 'attempt']);
      const receipt = unseal(body.receiptToken, 'receipt', device);
      if (!receipt.emailAttempt || receipt.emailAttempt.expiresAt < now() || !equalText(body.attempt, receipt.emailAttempt.nonce)) throw invalidToken();
      // Records the browser's same-origin provider return, not an inbox delivery receipt.
      receipt.notificationStatus='sent'; receipt.reportCopyVersion=REPORT_VERSION;
      receipt.clientEmailVersion=CLIENT_EMAIL_VERSION; receipt.notificationTransport='browser';
      delete receipt.emailAttempt;
      return { receiptToken:seal(receipt), customer:receipt.customer, email:receipt.customer.email,
        notificationStatus:'sent', emailDeliveryStatus:'sent' };
    },
    async report(body, device) {
      // Reuse result recovery's authentication, including when checkout is disabled.
      const recovered = await this.result(body, device);
      const receipt = unseal(recovered.receiptToken, 'receipt', device);
      const report = require('./simulation-report.cjs').createSimulationReport({ ...receipt, product });
      return { filename: report.filename, contentBase64: report.bytes.toString('base64'), sha256: report.sha256, receiptToken: recovered.receiptToken, notificationStatus: recovered.notificationStatus, emailDeliveryStatus: recovered.emailDeliveryStatus, email: recovered.customer?.email || null };
    }
  };
}

function getHeader(req, name) {
  const value = req.headers && req.headers[name.toLowerCase()];
  return typeof value === 'string' ? value : '';
}
function readDevice(req) {
  const matches = getHeader(req, 'cookie').split(';').map(part => part.trim()).filter(part => part.startsWith(COOKIE_NAME + '='));
  if (matches.length !== 1) return null;
  const value = matches[0].slice(COOKIE_NAME.length + 1);
  return /^[a-f0-9]{64}$/.test(value) ? value : null;
}
async function readBody(req) {
  if (!/^application\/json(?:\s*;|$)/i.test(getHeader(req, 'content-type'))) throw new PaymentError('invalid_content_type', 'Une demande JSON est nécessaire.', 415);
  const declaredLength = getHeader(req, 'content-length');
  if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > MAX_BODY_BYTES)) throw new PaymentError('request_too_large', 'La demande est trop volumineuse.', 413);
  let text;
  if (req.body !== undefined) {
    text = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  } else {
    const chunks = [];
    let length = 0;
    for await (const chunk of req) {
      const part = Buffer.from(chunk);
      length += part.length;
      if (length > MAX_BODY_BYTES) throw new PaymentError('request_too_large', 'La demande est trop volumineuse.', 413);
      chunks.push(part);
    }
    text = Buffer.concat(chunks).toString('utf8');
  }
  if (!text || Buffer.byteLength(text) > MAX_BODY_BYTES) throw new PaymentError('request_too_large', 'La demande est vide ou trop volumineuse.', 413);
  try { return JSON.parse(text); } catch { throw badRequest(); }
}

function createHttpHandler(options = {}) {
  const env = options.env || process.env;
  const service = options.service || createPaymentService(options);
  const allowedOrigins = new Set(['https://www.adtranslogistics.com', 'https://adtranslogistics.com']);
  if (typeof env.VERCEL_URL === 'string' && /^[a-z0-9.-]+\.vercel\.app$/i.test(env.VERCEL_URL)) allowedOrigins.add('https://' + env.VERCEL_URL);
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Vary', 'Origin, Cookie');
    try {
      const method = String(req.method || '').toUpperCase();
      const url = new URL(req.url || '/', 'https://www.adtranslogistics.com');
      const action = url.searchParams.get('action') || 'config';
      const origin = getHeader(req, 'origin');
      if ((origin && !allowedOrigins.has(origin)) || (method !== 'GET' && !origin)) throw new PaymentError('invalid_origin', 'Cette demande doit provenir du site AD TRANS LOGISTICS.', 403);
      if (method === 'GET' && action === 'config') {
        res.statusCode = 200;
        return res.end(JSON.stringify(service.config()));
      }
      if (method !== 'POST') {
        res.setHeader('Allow', 'GET, POST');
        throw new PaymentError('method_not_allowed', 'Méthode non autorisée.', 405);
      }
      if (!['order', 'verify', 'result', 'quote', 'report', 'email', 'emailConfirm'].includes(action)) throw new PaymentError('not_found', 'Action introuvable.', 404);
      const body = await readBody(req);
      let device = readDevice(req);
      if (!device && ['order','quote'].includes(action)) {
        device = service.createDevice();
        res.setHeader('Set-Cookie', `${COOKIE_NAME}=${device}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`);
      }
      const output = await service[action](body, device);
      if (output.emailSubmission) output.emailSubmission.payload._next = origin + '/rapport-envoi-confirme?attempt=' + output.emailSubmission.attempt;
      res.statusCode = 200;
      return res.end(JSON.stringify(output));
    } catch (error) {
      const safe = error instanceof PaymentError ? error : new PaymentError('internal_error', 'Le service est temporairement indisponible.', 500);
      res.statusCode = safe.status;
      return res.end(JSON.stringify({ error: { code: safe.code, message: safe.message } }));
    }
  };
}

module.exports = { createPaymentService, createHttpHandler, PaymentError, COOKIE_NAME, PRICE, CURRENCY, MAX_BODY_BYTES };

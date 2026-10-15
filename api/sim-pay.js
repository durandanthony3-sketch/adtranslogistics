'use strict';

const { createHttpHandler } = require('../lib/payment-service.cjs');
const { createSubmissionNotifier } = require('../lib/submission-notification.cjs');

module.exports = createHttpHandler({
  notifySubmission: createSubmissionNotifier(),
  normalizeInput: input => require('../lib/simulator-engine.cjs').normalizeInput(input),
  compute: input => require('../lib/simulator-engine.cjs').compute(input)
});

// worker/emailWorker.js
/**
 * Email worker: listens on Redis list 'emailQueue' and sends emails.
 * - Requires: ../events/redisClient.js (shared redis client)
 * - Uses Nodemailer for SMTP (SMTP config from .env) with debug logging.
 *
 * How to run:
 *   node worker/emailWorker.js
 *
 * Logs:
 *   - [WORKER] / [EMAIL DEBUG] prefixed logs for easy filtering
 */

require('dotenv').config();
const redisClient = require('../events/redisClient'); // shared client
const nodemailer = require('nodemailer');

const EMAIL_QUEUE = 'emailQueue';

// Build transporter: prefer real SMTP from .env, else fallback to Ethereal for testing
async function buildTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    // Real SMTP provider
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true', // true for port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      logger: true,
      debug: true
    });

    return transporter;
  } else {
    // Ethereal fallback for dev/testing
    console.log('[WORKER] No SMTP settings found in .env — creating Ethereal test account');
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
      logger: true,
      debug: true
    });
    console.log('[WORKER] Ethereal account created:', testAccount.user);
    return transporter;
  }
}

// tiny HTML escape to avoid injection into raw HTML
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// process a single job object
async function processEmailJob(job, transporter) {
  try {
    if (!job || job.type !== 'welcome_email') {
      console.log('[WORKER] Unknown job type - skipping:', job && job.type);
      return;
    }

    const to = job.to;
    const data = job.templateData || {};

    const html = `
      <h2>Welcome, ${escapeHtml(data.firstname || '')}!</h2>
      <p>Your employee ID: <strong>${escapeHtml(data.employeeid || '')}</strong></p>
      <p>We are happy to have you at Sagar Company.</p>
    `;

    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_FROM || 'no-reply@sagar.company',
      to,
      subject: job.subject || 'Welcome to Sagar Company',
      html
    };

    // Debug logs (do not log secrets)
    console.log('\n[EMAIL DEBUG] Sending email');
    console.log('[EMAIL DEBUG] mailOptions:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      htmlPreview: (mailOptions.html || '').slice(0, 400)
    });

    // send and log detailed info
    const info = await transporter.sendMail(mailOptions);

    console.log('[EMAIL DEBUG] sendMail info:', {
      messageId: info.messageId,
      accepted: info.accepted || null,
      rejected: info.rejected || null,
      response: info.response || null,
      envelope: info.envelope || null
    });

    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log('[EMAIL DEBUG] Ethereal preview URL:', preview);

  } catch (err) {
    console.error('[EMAIL ERROR] sendMail failed:', err && (err.stack || err.message) ? (err.stack || err.message) : err);
    // TODO: implement retry/backoff or push job to DLQ
  }
}

async function runWorker() {
  console.log('[WORKER] Email worker starting...');

  const transporter = await buildTransporter();

  // verify transporter - helpful to show auth issues early
  try {
    await transporter.verify();
    console.log('[WORKER] SMTP transporter ready');
  } catch (err) {
    console.warn('[WORKER] transporter.verify() warning:', err && (err.stack || err.message) ? (err.stack || err.message) : err);
    // continue — transporter may still send
  }

  console.log('[WORKER] Waiting for jobs on queue:', EMAIL_QUEUE);

  // robust worker loop
  while (true) {
    try {
      // BLPOP blocks until an element exists. Some redis clients return different shapes,
      // so we handle multiple return formats robustly.
      const res = await redisClient.blPop(EMAIL_QUEUE, 0);

      // DEBUG: log raw result shape
      console.log('[WORKER DEBUG] raw blPop result:', res);

      if (!res) {
        // nothing returned (rare when blocking), continue
        continue;
      }

      let value = null;

      // Case A: classic array [key, value]
      if (Array.isArray(res) && res.length >= 2) {
        value = res[1];
      }
      // Case B: object with possible fields (some redis client versions)
      else if (typeof res === 'object' && res !== null) {
        value = res.element ?? res.value ?? res[1] ?? res.payload ?? null;
        if (!value && Array.isArray(res.result) && res.result.length >= 2) {
          value = res.result[1];
        }
      }
      // Case C: string or buffer
      else if (typeof res === 'string' || Buffer.isBuffer(res)) {
        value = res.toString();
      }

      if (!value) {
        console.warn('[WORKER WARN] Could not extract job value from blPop result, skipping. raw:', res);
        continue;
      }

      if (Buffer.isBuffer(value)) value = value.toString();

      let job;
      try {
        job = JSON.parse(value);
      } catch (parseErr) {
        console.error('[WORKER ERROR] Failed to parse job JSON:', parseErr && parseErr.message ? parseErr.message : parseErr, 'raw value:', value);
        continue;
      }

      console.log('[WORKER] Dequeued job:', job.type, 'for', job.to);
      await processEmailJob(job, transporter);

    } catch (loopErr) {
      console.error('[WORKER] Error in worker loop:', loopErr && (loopErr.stack || loopErr.message) ? (loopErr.stack || loopErr.message) : loopErr);
      // small backoff to avoid tight error-loop
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

runWorker().catch(err => {
  console.error('[WORKER] Fatal error starting worker:', err && (err.stack || err.message) ? (err.stack || err.message) : err);
  process.exit(1);
});

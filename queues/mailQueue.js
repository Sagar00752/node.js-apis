// queues/mailQueue.js
const Queue = require('bull');
const path = require('path');

const mailQueue = new Queue('mailQueue', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
    // password: process.env.REDIS_PASS if needed
  },
  defaultJobOptions: {
    removeOnComplete: { age: 3600 }, // keep completed jobs for 1 hour
    removeOnFail: { age: 86400 },     // keep failed jobs for 24 hours
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
});

// Optional: a function to add a mail job
async function enqueueMail(jobData, opts = {}) {
  // jobData: { employeeId, recipientEmail, subject, html, meta }
  return mailQueue.add(jobData, opts);
}

module.exports = {
  mailQueue,
  enqueueMail
};

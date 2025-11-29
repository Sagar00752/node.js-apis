// queue.js
const redisClient = require('../events/redisClient');
const EMAIL_QUEUE = 'emailQueue';

async function enqueueEmailJob(jobPayload) {
  try {
    await redisClient.rPush(EMAIL_QUEUE, JSON.stringify(jobPayload));
    return true;
  } catch (err) {
    console.error('enqueueEmailJob error:', err && err.message ? err.message : err);
    return false;
  }
}

module.exports = {
    enqueueEmailJob,
};

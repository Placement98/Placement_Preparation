const cron = require('node-cron');
const User = require('../models/User');
const { sendEmail } = require('../utils/mailer');

const BATCH_SIZE = 25;

async function runDailyEmailJob() {
  try {
    const users = await User.find({}, 'email name').lean();

    if (!users.length) {
      console.log('Daily email job: no users found');
      return;
    }

    let sent = 0;
    let failed = 0;

    for (let index = 0; index < users.length; index += BATCH_SIZE) {
      const batch = users.slice(index, index + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(user => sendEmail(user.email, user.name || 'Student'))
      );

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          sent += 1;
        } else {
          failed += 1;
          console.error('Daily email send failed:', result.reason?.message || result.reason);
        }
      });
    }

    console.log(`Daily email job: sent ${sent}, failed ${failed}`);
  } catch (error) {
    console.error('Daily email job error:', error.message || error);
  }
}

function startDailyEmailJob() {
  cron.schedule('0 9 * * *', () => {
    runDailyEmailJob();
  }, {
    timezone: process.env.TZ || 'UTC',
  });

  console.log('Daily email cron scheduled for 09:00');
}

module.exports = {
  startDailyEmailJob,
  runDailyEmailJob,
};

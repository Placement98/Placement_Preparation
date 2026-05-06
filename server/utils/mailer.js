const nodemailer = require('nodemailer');
const config = require('../config/env');

let cachedTransporter;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

  return cachedTransporter;
}

async function sendEmail(to, name) {
  if (!config.email.user || !config.email.pass) {
    throw new Error('Email credentials are not configured');
  }

  const transporter = getTransporter();
  const safeName = name || 'Student';

  const html = `
    <h2>Hello ${safeName}</h2>
    <p>Your new test is ready.</p>
    <a href="https://prepninja.onrender.com">Start Test</a>
  `;

  await transporter.sendMail({
    from: `"PrepNinja" <${config.email.user}>`,
    to,
    subject: '🚀 New Test Available!',
    html,
  });

  return { success: true };
}

module.exports = {
  sendEmail,
};

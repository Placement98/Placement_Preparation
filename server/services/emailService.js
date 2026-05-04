const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: false,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });
};

/**
 * Generate a practice link token
 */
function generatePracticeToken(userId, topic, difficulty) {
  return jwt.sign(
    { userId, topic, difficulty, purpose: 'practice' },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}

/**
 * Verify a practice link token
 */
function verifyPracticeToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
}

/**
 * Send practice link email
 */
async function sendPracticeEmail(userEmail, userName, weakTopics) {
  const transporter = createTransporter();

  const links = weakTopics.map(topic => {
    const token = generatePracticeToken(null, topic, 'medium');
    return {
      topic,
      url: `${config.frontendUrl}/practice?token=${token}&topic=${encodeURIComponent(topic)}`,
    };
  });

  const topicLinksHtml = links.map(l => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b;">
        <span style="color: #f8fafc; font-weight: 500;">${l.topic}</span>
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b;">
        <a href="${l.url}" style="display: inline-block; padding: 8px 20px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">Practice Now →</a>
      </td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #1e293b, #334155); border-radius: 16px; padding: 40px; border: 1px solid #475569;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #f8fafc; margin: 0; font-size: 24px;">🎯 Placement Prep</h1>
            <p style="color: #94a3b8; margin-top: 8px;">Your Personalized Practice Plan</p>
          </div>
          
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6;">
            Hi <strong style="color: #f8fafc;">${userName}</strong>,
          </p>
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6;">
            Based on your recent assessment, we've identified some topics that need more practice. 
            Click the links below to start targeted practice sessions:
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 24px 0; background: #0f172a; border-radius: 12px; overflow: hidden;">
            <thead>
              <tr style="background: #1e293b;">
                <th style="padding: 12px 16px; text-align: left; color: #94a3b8; font-weight: 600; font-size: 13px; text-transform: uppercase;">Topic</th>
                <th style="padding: 12px 16px; text-align: left; color: #94a3b8; font-weight: 600; font-size: 13px; text-transform: uppercase;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${topicLinksHtml}
            </tbody>
          </table>

          <p style="color: #94a3b8; font-size: 14px; text-align: center; margin-top: 32px;">
            These links are valid for 7 days. Keep practicing! 💪
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Placement Prep" <${config.email.user}>`,
      to: userEmail,
      subject: '🎯 Your Personalized Practice Plan is Ready!',
      html: htmlContent,
    });
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Email sending error:', error.message);
    return { success: false, message: 'Failed to send email. Check email configuration.' };
  }
}

module.exports = { sendPracticeEmail, generatePracticeToken, verifyPracticeToken };

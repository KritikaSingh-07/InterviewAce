import Notification from '../models/Notification.js';

/**
 * Creates and persists a system notification for a recipient.
 * @param {Object} params
 * @param {string} params.recipient - userId of the recipient
 * @param {string} params.type - notification type enum value
 * @param {string} params.title - short title
 * @param {string} params.message - body message
 * @param {Object} [params.data] - optional extra data payload
 * @returns {Promise<Object>} the created Notification document
 */
export const createNotification = async ({ recipient, type = 'system', title, message, data = {} }) => {
  if (!recipient || !title || !message) {
    throw new Error('recipient, title and message are required for a notification');
  }

  const notification = await Notification.create({
    recipient,
    type,
    title,
    message,
    data,
  });

  return notification;
};

/**
 * Sends an email alert.
 *
 * NOTE: This is a lightweight stub that logs the alert to the console.
 * To enable real email delivery, configure a provider (e.g. nodemailer with
 * SMTP, Resend, Postmark, etc.) and implement the send logic here. The
 * application will still work without email because system notifications are
 * persisted in the database regardless.
 *
 * @param {Object} params
 * @param {string} params.to - recipient email
 * @param {string} params.subject - email subject
 * @param {string} params.text - plaintext body
 * @param {string} [params.html] - optional HTML body
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  // Early return if email disabled via env flag
  if (process.env.EMAIL_ENABLED === 'false') return;

  // Real email providers would be plugged in here (nodemailer etc.)
  console.log(
    `[EMAIL-STUB] To: ${to} | Subject: ${subject}\n` +
      `Body: ${text}\n` +
      (html ? `HTML: ${html}\n` : '') +
      `Email delivery is currently simulated. Set EMAIL_ENABLED and a provider to send real emails.`
  );

  // Optional placeholder for real implementation:
  // if (process.env.EMAIL_ENABLED === 'true') {
  //   await transporter.sendMail({ from, to, subject, text, html });
  // }
};


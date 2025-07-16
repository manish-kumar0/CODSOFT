const nodemailer = require('nodemailer');
const config = require('../config');

const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  // Define the email options
  const mailOptions = {
    from: `JobBoard <${process.env.SMTP_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  // Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
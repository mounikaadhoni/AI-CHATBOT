const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env variables
dotenv.config();

function getEmailConfig() {
  let emailCfg = {};
  try {
    const configPath = path.join(__dirname, 'server', 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    emailCfg = config.emailNotifications || {};
  } catch (e) {
    console.warn("⚠️ Could not load server/config.json, using environment overrides or defaults.");
  }
  
  return {
    enabled: process.env.EMAIL_ENABLED !== undefined 
      ? (process.env.EMAIL_ENABLED === 'true') 
      : (emailCfg.enabled !== false),
    smtpHost: process.env.SMTP_HOST || emailCfg.smtpHost || 'smtp.resend.com',
    smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : (emailCfg.smtpPort || 587),
    smtpUser: process.env.SMTP_USER || emailCfg.smtpUser || 'resend',
    smtpPass: process.env.SMTP_PASS || emailCfg.smtpPass || '',
    senderEmail: process.env.SENDER_EMAIL || emailCfg.senderEmail || (emailCfg.smtpUser && emailCfg.smtpUser.includes('@') ? emailCfg.smtpUser : 'onboarding@resend.dev'),
    adminEmail: process.env.ADMIN_EMAIL || emailCfg.adminEmail || ''
  };
}

const emailCfg = getEmailConfig();

console.log("--------------------------------------------------");
console.log("🔍 Checking Active SMTP Configurations:");
console.log(`- SMTP Host:    ${emailCfg.smtpHost}`);
console.log(`- SMTP Port:    ${emailCfg.smtpPort}`);
console.log(`- SMTP User:    ${emailCfg.smtpUser}`);
console.log(`- Sender Email: ${emailCfg.senderEmail}`);
console.log(`- Test Target:  ${emailCfg.adminEmail}`);
console.log(`- Pass Configured: ${emailCfg.smtpPass ? 'Yes' : 'No'}`);
console.log("--------------------------------------------------");

if (!emailCfg.smtpPass) {
  console.error("❌ ERROR: SMTP password/API key (smtpPass) is empty. Send will fail.");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: emailCfg.smtpHost,
  port: emailCfg.smtpPort,
  secure: emailCfg.smtpPort === 465,
  auth: { user: emailCfg.smtpUser, pass: emailCfg.smtpPass },
  tls: { rejectUnauthorized: false }
});

console.log("Sending test mail via nodemailer...");
transporter.sendMail({
  from: `"GAdigital Solution Test" <${emailCfg.senderEmail}>`,
  to: emailCfg.adminEmail,
  subject: "Test Welcome Email from Node.js (Active SMTP Config)",
  html: `
    <div style="font-family:Arial,sans-serif;padding:20px;">
      <h2>Test Welcome Email Success!</h2>
      <p>This email verifies that your active SMTP configuration is working correctly.</p>
      <ul>
        <li><b>SMTP Server:</b> ${emailCfg.smtpHost}</li>
        <li><b>Sender Domain:</b> ${emailCfg.senderEmail}</li>
      </ul>
    </div>
  `
}).then(info => {
  console.log("✅ Email sent successfully:", info);
}).catch(err => {
  console.error("❌ Email send failed:", err);
});

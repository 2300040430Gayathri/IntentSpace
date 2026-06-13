const nodemailer = require('nodemailer');

const isEmailConfigured = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return false;
  if (user.includes('your_email') || pass.includes('your_app_password')) return false;
  return true;
};

let transporterInstance = null;

const createTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }
  if (!transporterInstance) {
    transporterInstance = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return transporterInstance;
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  const logOtpFromHtml = () => {
    const otpMatch = html.match(/letter-spacing: 8px[^>]*>(\d{6})</);
    if (otpMatch) {
      console.log('[OTP DEV MODE]');
      console.log(`Email: ${to}`);
      console.log(`OTP: ${otpMatch[1]}`);
    }
  };

  if (!transporter) {
    console.log(`[Email Dev Mode] To: ${to} | Subject: ${subject}`);
    logOtpFromHtml();
    return { success: true, dev: true };
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `IntentSpace <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error('Email send failed:', err.message);
    logOtpFromHtml();
    return { success: true, dev: true };
  }
};

const sendOtpEmail = async (user, otp) => {
  return sendEmail({
    to: user.email,
    subject: 'Your IntentSpace verification code',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px;">
        <h1 style="color: #2563EB;">Verify your email</h1>
        <p>Hi ${user.name},</p>
        <p>Your one-time verification code is:</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2563EB; margin: 24px 0;">${otp}</p>
        <p style="color: #6B7280; font-size: 14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
        <p style="color: #6B7280; font-size: 14px;">Organize. Reflect. Grow.</p>
      </div>
    `,
  });
};

const sendVerificationEmail = async (user, otp) => sendOtpEmail(user, otp);

const sendPasswordResetEmail = async (user, otp) => {
  return sendEmail({
    to: user.email,
    subject: 'Reset your IntentSpace password',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px;">
        <h1 style="color: #2563EB;">Password Reset</h1>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset. Your one-time password reset code is:</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2563EB; margin: 24px 0;">${otp}</p>
        <p style="color: #6B7280; font-size: 14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
        <p style="color: #6B7280; font-size: 14px;">Organize. Reflect. Grow.</p>
      </div>
    `,
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };

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

const sendViaHttp = async ({ to, subject, html }) => {
  if (process.env.RESEND_API_KEY) {
    console.log(`[EMAIL_SERVICE][HTTP] Sending via Resend API...`);
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'IntentSpace <onboarding@resend.dev>',
        to,
        subject,
        html,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Resend API returned status ${response.status}`);
    }
    return { success: true, messageId: data.id };
  }

  if (process.env.SENDGRID_API_KEY) {
    console.log(`[EMAIL_SERVICE][HTTP] Sending via SendGrid API...`);
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || 'noreply@intentspace.app' },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.errors?.[0]?.message || `SendGrid API returned status ${response.status}`);
    }
    return { success: true };
  }

  return null;
};

const sendEmail = async ({ to, subject, html }) => {
  console.log(`[EMAIL_SERVICE] Initiating email send. Recipient: "${to}" | Subject: "${subject}"`);

  // Try sending via HTTP first if HTTP email APIs are configured (bypasses Render SMTP port blocking)
  if (process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY) {
    try {
      const httpResult = await sendViaHttp({ to, subject, html });
      if (httpResult) {
        console.log(`[EMAIL_SERVICE][HTTP_SUCCESS] Email sent successfully via API to: "${to}"`);
        return { success: true };
      }
    } catch (err) {
      console.error(`[EMAIL_SERVICE][HTTP_ERROR] HTTP email API delivery failed. Error: ${err.message}`);
      console.error(`[EMAIL_SERVICE][HTTP_ERROR] Full stack trace:`, err.stack);
      throw err;
    }
  }

  // Fallback to SMTP
  const transporter = createTransporter();
  const logOtpFromHtml = () => {
    const otpMatch = html.match(/letter-spacing: 8px[^>]*>(\d{6})</);
    if (otpMatch) {
      console.log(`[EMAIL_SERVICE][OTP_DEV_FALLBACK] Email: ${to} | OTP: ${otpMatch[1]}`);
    }
  };

  if (!transporter) {
    console.warn(`[EMAIL_SERVICE][WARN] No email transporter or HTTP API key configured. Falling back to Dev Mode.`);
    console.log(`[EMAIL_SERVICE][DEV_MODE] To: ${to} | Subject: ${subject}`);
    logOtpFromHtml();
    return { success: true, dev: true };
  }

  const smtpConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER,
    from: process.env.EMAIL_FROM || `IntentSpace <${process.env.EMAIL_USER}>`
  };
  console.log(`[EMAIL_SERVICE][SMTP_REQUEST] Configuration:`, smtpConfig);

  try {
    console.log(`[EMAIL_SERVICE][SMTP_SEND] Sending mail to: "${to}" via Nodemailer...`);
    const info = await transporter.sendMail({
      from: smtpConfig.from,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL_SERVICE][SMTP_RESPONSE] Success for: "${to}". Message ID: ${info.messageId}`);
    console.log(`[EMAIL_SERVICE][SMTP_RESPONSE] Response details:`, {
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      envelope: info.envelope
    });
    return { success: true };
  } catch (err) {
    console.error(`[EMAIL_SERVICE][SMTP_ERROR] SMTP delivery failed to "${to}". Error message: ${err.message}`);
    console.error(`[EMAIL_SERVICE][SMTP_ERROR] Full stack trace:`, err.stack);
    logOtpFromHtml();
    throw err; // Bubble up the error instead of returning success: true
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

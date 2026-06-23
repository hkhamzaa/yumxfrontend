import nodemailer from 'nodemailer'

// Required env vars:
//   SMTP_USER — Gmail address used to send (e.g. noreply@yumxfastfood.com or a Gmail account)
//   SMTP_PASS — Gmail App Password (NOT the account password).
//               Set up at https://myaccount.google.com/apppasswords after enabling 2FA.

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

function buildOtpHtml(otp: string, context: 'admin' | 'customer'): string {
  const isAdmin = context === 'admin'
  const title = isAdmin ? 'Admin Password Reset' : 'Reset Your Password'
  const subtitle = isAdmin
    ? 'A password reset was requested for the <strong style="color:#E5E2E1;">YUM X admin panel</strong>. If this wasn\'t you, your account may be at risk — change your credentials immediately.'
    : 'A password reset was requested for your <strong style="color:#E5E2E1;">YUM X</strong> account. If this wasn\'t you, you can safely ignore this email.'
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#0A0A0A;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:480px;">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:28px;">
          <p style="margin:0;font-size:26px;font-weight:900;letter-spacing:5px;color:#E5E2E1;line-height:1;">
            YUM&nbsp;<span style="color:#F59E0B;">X</span>
          </p>
          <p style="margin:4px 0 0;font-size:10px;letter-spacing:3px;color:#888888;text-transform:uppercase;">Fast Food</p>
        </td></tr>

        <!-- Card -->
        <tr><td style="background-color:#161616;border:1px solid #262626;border-radius:16px;padding:36px 32px;">

          <!-- Heading -->
          <h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#E5E2E1;">${title}</h1>
          <p style="margin:0 0 28px;font-size:13px;line-height:1.7;color:#C6C6C7;">${subtitle}</p>

          <!-- OTP box -->
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr><td style="background-color:#0A0A0A;border:1px solid #262626;border-radius:12px;padding:24px 20px;text-align:center;">
              <p style="margin:0 0 10px;font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#888888;">One-Time Code</p>
              <p style="margin:0;font-size:42px;font-weight:900;letter-spacing:14px;color:#F59E0B;font-family:Courier,monospace;line-height:1;">${otp}</p>
            </td></tr>
          </table>

          <p style="margin:20px 0 6px;font-size:12px;color:#C6C6C7;text-align:center;">
            Expires in <strong style="color:#E5E2E1;">10 minutes</strong> &bull; Single use only
          </p>
          <p style="margin:0;font-size:11px;color:#888888;text-align:center;">
            Never share this code with anyone.
          </p>

          <!-- Divider -->
          <hr style="border:none;border-top:1px solid #262626;margin:28px 0;">

          ${isAdmin ? `
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr><td style="background-color:#F59E0B18;border:1px solid #F59E0B40;border-radius:10px;padding:14px 16px;">
              <p style="margin:0;font-size:12px;color:#F59E0B;font-weight:600;">Security Notice</p>
              <p style="margin:4px 0 0;font-size:12px;color:#C6C6C7;line-height:1.6;">
                This reset was requested from the admin login page. If you did not request this, log in immediately and review your account security.
              </p>
            </td></tr>
          </table>
          ` : ''}

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:11px;color:#888888;line-height:1.7;">
            &copy; ${year} YUM X Fast Food &bull; This is an automated message — do not reply.<br>
            Lahore, Pakistan
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendContactEmail(opts: {
  to: string
  fromName: string
  fromEmail: string
  message: string
}): Promise<void> {
  const year = new Date().getFullYear()
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>New Contact Message</title></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td align="center" style="padding-bottom:24px;">
          <p style="margin:0;font-size:24px;font-weight:900;letter-spacing:5px;color:#E5E2E1;">YUM&nbsp;<span style="color:#F59E0B;">X</span></p>
        </td></tr>
        <tr><td style="background:#161616;border:1px solid #262626;border-radius:16px;padding:32px;">
          <h2 style="margin:0 0 20px;font-size:18px;font-weight:700;color:#E5E2E1;">New Contact Message</h2>
          <p style="margin:0 0 6px;font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:2px;">From</p>
          <p style="margin:0 0 16px;font-size:14px;color:#E5E2E1;">${opts.fromName} &lt;${opts.fromEmail}&gt;</p>
          <p style="margin:0 0 6px;font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:2px;">Message</p>
          <div style="background:#0A0A0A;border:1px solid #262626;border-radius:10px;padding:16px;">
            <p style="margin:0;font-size:14px;color:#C6C6C7;line-height:1.7;white-space:pre-wrap;">${opts.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>
          <p style="margin:20px 0 0;font-size:12px;color:#888888;">Reply directly to <a href="mailto:${opts.fromEmail}" style="color:#F59E0B;">${opts.fromEmail}</a></p>
        </td></tr>
        <tr><td align="center" style="padding-top:20px;">
          <p style="margin:0;font-size:11px;color:#888888;">&copy; ${year} YUM X Fast Food &bull; Automated notification</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await transporter.sendMail({
    from: `"YUM X Website" <${process.env.SMTP_USER}>`,
    to: opts.to,
    replyTo: `"${opts.fromName}" <${opts.fromEmail}>`,
    subject: `YUM X — New message from ${opts.fromName}`,
    html,
  })
}

export async function sendOtpEmail(
  to: string,
  otp: string,
  context: 'admin' | 'customer',
): Promise<void> {
  const subject =
    context === 'admin'
      ? 'YUM X Admin — Password Reset Code'
      : 'YUM X — Your Password Reset Code'

  await transporter.sendMail({
    from: `"YUM X" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: buildOtpHtml(otp, context),
  })
}

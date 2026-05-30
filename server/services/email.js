const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
})

const sendInviteEmail = async ({ toEmail, orgName, inviterName, inviteLink }) => {
  const mailOptions = {
    from: `"${orgName} via SaaS Dashboard" <${process.env.EMAIL_USER}>`,
    to:  toEmail,
    subject: `You've been invited to join ${orgName}!`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1e1e2e;">You're invited! 🎉</h2>
        <p style="color: #555; font-size: 15px;">
          <strong>${inviterName}</strong> has invited you to join 
          <strong>${orgName}</strong> on SaaS Dashboard.
        </p>
        <a href="${inviteLink}" style="
          display: inline-block;
          margin: 24px 0;
          padding: 12px 28px;
          background: #89b4fa;
          color: #1e1e2e;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
        ">
          Accept Invitation
        </a>
        <p style="color: #888; font-size: 13px;">
          This invite expires in 7 days. If you didn't expect this, ignore this email.
        </p>
      </div>
    `
  }

  await transporter.sendMail(mailOptions)
}

module.exports = { sendInviteEmail }
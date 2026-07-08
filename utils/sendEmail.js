const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    let transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST || process.env.SMTP_HOST,
        port: Number(process.env.MAILTRAP_PORT || process.env.SMTP_PORT || 2525),
        secure: String(process.env.MAILTRAP_SECURE || 'false') === 'true',
        auth: {
            user: process.env.MAILTRAP_USER || process.env.SMTP_EMAIL,
            pass: process.env.MAILTRAP_PASSWORD || process.env.SMTP_PASSWORD
        }
    });

    const message = {
        from: `${process.env.SMTP_FROM_NAME || 'Plush Shop'} <${process.env.SMTP_FROM_EMAIL || process.env.MAILTRAP_FROM_EMAIL || process.env.SMTP_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        html: options.html || `<p>${options.message}</p>`,
        attachments: options.attachments || []
    }

    await transporter.sendMail(message);

}

module.exports = sendEmail;

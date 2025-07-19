const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
host: process.env.SMTP_HOST,
port: process.env.SMTP_PORT,
secure: process.env.SMTP_SECURE === 'true',
auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
},
});

exports.sendEmail = async ({ to, subject, html }) => {
await transporter.sendMail({
    from: `"Naftal HR System" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject,
    html,
});
};
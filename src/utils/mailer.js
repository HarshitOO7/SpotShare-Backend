// utils/mailer.js
import nodemailer from 'nodemailer';

// MED-2: Email address from env var — not hardcoded
const SMTP_USER = process.env.SMTP_USER || 'spotshare3@gmail.com';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: SMTP_USER,
        pass: process.env.NODEMAILER_SMTP_PASS
    }
});

// MED-1: Always sends FROM our address; caller passes replyTo for user's address
// New signature: sendEmail(to, subject, html, replyTo?)
const sendEmail = async (to, subject, html, replyTo = null) => {
    const mailOptions = {
        from: SMTP_USER,
        to,
        subject,
        html,
        ...(replyTo && { replyTo }),
    };
    await transporter.sendMail(mailOptions);
};

export { sendEmail };
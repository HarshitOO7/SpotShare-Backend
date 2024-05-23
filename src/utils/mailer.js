// utils/mailer.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'spotshare3@gmail.com',
        pass: process.env.NODEMAILER_SMTP_PASS
    }
});

const sendEmail = async (from='spotshare3@gmail.com', to, subject, html) => {
    const mailOptions = {
        from,
        to,
        subject,
        html
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

export { sendEmail };
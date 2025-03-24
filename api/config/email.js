import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Configuration du service d'email avec Nodemailer
 */
const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || 'iwomirecovery@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'yxqn mmah lyju fojw'
  }
});

/**
 * Envoie un email
 * @param {string} to - Destinataire
 * @param {string} subject - Sujet de l'email
 * @param {string} text - Contenu texte de l'email
 * @param {string} html - Contenu HTML de l'email (optionnel)
 * @returns {Promise} - Résultat de l'envoi
 */
const sendEmail = async (to, subject, text, html = null) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'iwomirecovery@gmail.com',
    to,
    subject,
    text,
    ...(html && { html })
  };

  return transporter.sendMail(mailOptions);
};

export { transporter, sendEmail };
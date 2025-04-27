import nodemailer, { SentMessageInfo } from 'nodemailer';

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: 'iwomirecovery@gmail.com',
    pass: 'yxqn mmah lyju fojw'
  }
});

/**
 * Service pour l'envoi d'emails
 */
export const emailService = {
  /**
   * Envoie un email de réinitialisation de mot de passe
   * @param email - Adresse email du destinataire
   * @param resetUrl - URL de réinitialisation du mot de passe
   * @returns Promesse contenant le résultat de l'envoi de l'email
   */
  sendPasswordResetEmail: async (email: string, resetUrl: string): Promise<SentMessageInfo> => {
    const mailOptions = {
      from: 'prisojohan2@gmail.com',
      to: email,
      subject: 'Reset Password',
      text: `You are receiving this email because you (or someone else) has requested the reset of the password for your account.\n\n
      Please click on the following link, or paste it into your browser to complete the process:\n\n
      ${resetUrl}\n\n
      If you did not request this, please ignore this email and your password will remain unchanged. This link will expires in 1h\n`
    };

    return transporter.sendMail(mailOptions);
  }
};
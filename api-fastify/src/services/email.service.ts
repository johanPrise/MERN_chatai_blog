import nodemailer from 'nodemailer';

// Configuration du transporteur d'emails
let transporter: nodemailer.Transporter;

/**
 * Initialise le transporteur d'emails
 */
export const initEmailTransporter = (): void => {
  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const secure = process.env.EMAIL_SECURE === 'true';

  if (!host || !user || !pass) {
    console.warn('Configuration email incomplète, les emails ne seront pas envoyés');
    return;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Envoie un email
 */
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<boolean> => {
  try {
    if (!transporter) {
      console.warn('Transporteur email non initialisé, email non envoyé');
      return false;
    }

    const from = process.env.EMAIL_FROM || 'noreply@example.com';

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return false;
  }
};

/**
 * Envoie un email de récupération de mot de passe
 */
export const sendPasswordResetEmail = async (
  to: string,
  token: string
): Promise<boolean> => {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  const subject = 'Réinitialisation de votre mot de passe';
  const html = `
    <h1>Réinitialisation de votre mot de passe</h1>
    <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
    <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
    <p><a href="${resetUrl}">Réinitialiser mon mot de passe</a></p>
    <p>Ce lien est valable pendant 1 heure.</p>
    <p>Si vous n'avez pas demandé la réinitialisation de votre mot de passe, ignorez cet email.</p>
  `;

  return sendEmail(to, subject, html);
};

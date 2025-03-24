import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel from "../models/User.js";
import { sendEmail } from "../config/email.js";
import { JWT_SECRET, RESET_PASSWORD_SECRET } from "../middlewares/auth.js";

// Générer un sel pour le hachage des mots de passe
const salt = bcrypt.genSaltSync(10);

/**
 * Inscription d'un nouvel utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const register = async (req, res) => {
  try {
    const { username, password, email, role } = req.body;
    
    // Validation des entrées
    if (!username || !password || !email) {
      return res.status(400).json({ message: "Username, password et email sont requis" });
    }
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await UserModel.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: "Un utilisateur avec cet email ou ce nom d'utilisateur existe déjà" 
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const userDoc = await UserModel.create({
      username,
      password: hashedPassword,
      email,
      role,
      isAuthorized: role === 'user' // Les utilisateurs normaux sont autorisés par défaut
    });
    
    res.status(201).json({
      id: userDoc._id,
      username: userDoc.username,
      email: userDoc.email,
      role: userDoc.role
    });
  } catch (error) {
    console.error("Erreur d'inscription:", error);
    res.status(500).json({ message: "Erreur serveur lors de l'inscription" });
  }
};

/**
 * Connexion d'un utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username et password requis" });
    }
    
    const userDoc = await UserModel.findOne({ username }).select('+password');
    
    if (!userDoc) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }
    
    const passOk = bcrypt.compareSync(password, userDoc.password);
    
    if (!passOk) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }
    
    const token = jwt.sign(
      { id: userDoc._id, username: userDoc.username },
      JWT_SECRET,
      { expiresIn: '15d' }
    );
    
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : 'localhost',
      maxAge: 15 * 24 * 60 * 60 * 1000 // 15 jours
    }).json({
      id: userDoc._id,
      username: userDoc.username,
      role: userDoc.role
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ message: "Erreur serveur interne" });
  }
};

/**
 * Déconnexion d'un utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    expires: new Date(0)
  }).json({ message: "Déconnexion réussie" });
};

/**
 * Récupère le profil de l'utilisateur connecté
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const getProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select('-password');
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Erreur profil:', error);
    res.status(500).json({ message: "Erreur serveur interne" });
  }
};

/**
 * Initie le processus de réinitialisation de mot de passe
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Email not registered' });
    }

    // Générez un jeton de réinitialisation de mot de passe
    const resetToken = jwt.sign({ userId: user._id }, RESET_PASSWORD_SECRET, { expiresIn: '1h' });

    // Enregistrez le jeton dans la base de données
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
    await user.save();

    // Envoyez un email avec le lien de réinitialisation de mot de passe
    const clientOrigin = process.env.CLIENT_ORIGIN || 'https://mern-chatai-blog.vercel.app';
    const resetUrl = `${clientOrigin}/reset-password/${resetToken}`;
    
    await sendEmail(
      email,
      'Reset Password',
      `You are receiving this email because you (or someone else) has requested the reset of the password for your account.\n\n
       Please click on the following link, or paste it into your browser to complete the process:\n\n
       ${resetUrl}\n\n
       If you did not request this, please ignore this email and your password will remain unchanged. This link will expires in 1h\n`
    );
    
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Réinitialise le mot de passe avec un token
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const resetPassword = async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  try {
    // Vérifiez la validité du jeton
    const decoded = jwt.verify(resetToken, RESET_PASSWORD_SECRET);

    // Recherchez l'utilisateur avec l'ID récupéré à partir du jeton
    const user = await UserModel.findOne({
      _id: decoded.userId,
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hachez le nouveau mot de passe et mettez à jour l'utilisateur
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    if (err.name === 'TokenExpiredError') {
      res.status(400).json({ message: 'Token expired' });
    } else if (err.name === 'JsonWebTokenError') {
      res.status(400).json({ message: 'Invalid token' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

/**
 * Vérifie la validité de la session utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const verifySession = (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    role: req.user.role
  });
};
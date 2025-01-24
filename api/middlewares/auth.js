import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';

const secret = "bj3behrj2o3ierbhj3j2no";


export const cookieOptions = {
    httpOnly: true,
    secure: true, // Doit être TRUE en production
    sameSite: 'none', // Forcer à 'none' pour Vercel
    domain: '.vercel.app', // Domaine parent commun
    path: '/',
    maxAge: 15 * 24 * 60 * 60 * 1000
  };

export const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;
  
  if (!token) return res.status(401).json({ message: 'Non authentifié' });

  try {
    const decoded = jwt.verify(token, secret);
    const user = await UserModel.findById(decoded.id).select('-password');
    
    if (!user) throw new Error('Utilisateur introuvable');
    
    req.user = user;
    next();
  } catch (err) {
    res.clearCookie('token', cookieOptions);
    res.status(401).json({ message: 'Session expirée' });
  }
};


export const authorMiddleware = (req, res, next) => {
  if (!req.user?.isAuthorized) {
    return res.status(403).json({ message: 'Author access required' });
  }
  next();
};

export const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};


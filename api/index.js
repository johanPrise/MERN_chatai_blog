// Importer le framework Express
import express from "express";
// Importer le package nanoid pour la création de jetons
import { nanoid } from 'nanoid';
// Importer le middleware Multer pour la gestion des fichiers
import multer from "multer";
import prompt, { VITE_MONGO_URI } from "../env.js";
// Importer le package Mongoose pour la connexion à MongoDB
import mongoose from "mongoose";
// Importer le package fs pour la gestion du système de fichiers
import fs from "fs";
// Importer le package bcrypt pour le hachage des mots de passe
import bcrypt from "bcrypt";
// Importer le package Client de gradio
import { Client } from "@gradio/client";
import path from "path";
// Importer le package jsonwebtoken pour la génération de jetons d'authentification
import jwt from "jsonwebtoken";
import { fileURLToPath } from 'url';
// Importer le package cors pour la gestion des requêtes cross-origin
import cors from "cors";

// Importer le modèle de données PostModel
import PostModel from "./models/Post.js";

// Importer le modèle de données UserModel
import UserModel from "./models/User.js";

// Importer le middleware cookie-parser pour la gestion des cookies
import cookieParser from "cookie-parser";

// Importer le package body-parser pour la gestion des requêtes HTTP
import bodyParser from 'body-parser';

// Importer le modèle de données ConversationModel
import ConversationModel from './models/Conversation.js';

// Importer le modèle de données CategoryModel
import CategoryModel from './models/categories.js';

// Générer un sel pour le hachage des mots de passe avec bcrypt
const salt = bcrypt.genSaltSync(10);

// Créer une instance d'Express
const app = express();

// Définir une clé secrète pour la signature des jetons d'authentification
const secret = "bj3behrj2o3ierbhj3j2no";
const resetPasswordSecret = "6a51acbeed5589caef8465b83e2bedb346e3c9a512867eff00431e31cb73e469"

// Utiliser le middleware json d'Express pour parser les données JSON entrantes
app.use(express.json());

// Utiliser le middleware cookie-parser pour parser les cookies entrants
app.use(cookieParser());

// Configurer Multer pour stocker les fichiers téléchargés dans le répertoire "uploads/"
const upload = multer({ dest: "uploads/" });

// Se connecter à la base de données MongoDB
mongoose.connect(
    VITE_MONGO_URI);

app.use(bodyParser.json());

//Importer le package nodemailer pour envoyer les emails 
import nodemailer from 'nodemailer'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Configurer le middleware cors pour autoriser les requêtes cross-origin
app.use(bodyParser.json());
app.use(cors({
  origin: "http://localhost:5173" // Autoriser les requêtes depuis le port utilisé par Vite
}));

// Configurez le transporteur de nodemailer pour envoyer des emails
const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Utilisation du service Gmail
  auth: {
    user: 'prisojohan2@gmail.com', // Votre adresse email
    pass: 'faxm gmtm zqfu beqo' // Votre mot de passe (vous devrez le remplacer)
  }
});

// Générer un jeton de réinitialisation de mot de passe avec la nouvelle clé secrète
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Email not registered' });
    }

    // Générez un jeton de réinitialisation de mot de passe avec la nouvelle clé secrète
    const resetToken = jwt.sign({ userId: user._id }, resetPasswordSecret, { expiresIn: '1h' });

    // Enregistrez le jeton dans la base de données
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
    await user.save();

    // Envoyez un email avec le lien de réinitialisation de mot de passe
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    const mailOptions = {
      from: 'prisojohan2@gmail.com',
      to: email,
      subject: 'Reset Password',
      text: `You are receiving this email because you (or someone else) has requested the reset of the password for your account.\n\n
             Please click on the following link, or paste it into your browser to complete the process:\n\n
             ${resetUrl}\n\n
             If you did not request this, please ignore this email and your password will remain unchanged. This link will expires in 1h\n`
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Générer un jeton de réinitialisation de mot de passe avec la nouvelle clé secrète
app.post('/reset-password/:resetToken', async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  try {
    // Vérifiez la validité du jeton avec la nouvelle clé secrète
    const decoded = jwt.verify(resetToken, resetPasswordSecret);

    // Affichez l'ID de l'utilisateur pour vérifier qu'il a une valeur
    console.log('User ID:', decoded.userId);

    // Recherchez l'utilisateur avec l'ID récupéré à partir du jeton
    const user = await UserModel.findOne({
      _id: decoded.userId
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hachez le nouveau mot de passe et mettez à jour l'utilisateur
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
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
});

/**
 * Generates a response from the API based on the provided messages.
 *
 * @param {Array<Object>} messages - An array of message objects.
 * @return {Promise<string>} A promise that resolves to the generated response.
 * @throws {Error} If the response format from the API is invalid.
 */
const generateResponse = async (messages) => {
  const client = await Client.connect("Qwen/Qwen2-72B-Instruct");
  const result = await client.predict("/model_chat_1", {
    query: messages[messages.length - 1].content,
    history: messages.map(msg => [msg.content, msg.sender]),
    system: prompt
  });

  // Log de la réponse brute pour débogage
  console.log("Raw result from API:", result.data);

  // Vérifiez si la réponse contient les données attendues
  if (!result || !result.data) {
    throw new Error("Invalid response format from API");
  }

    const responseArray = result.data[1];
    const lastInteraction = responseArray[responseArray.length - 1];
    const aiResponse = lastInteraction[1]; // Prendre la deuxième phrase du dernier élément

  return aiResponse;
};

// Générer une nouvelle conversation
app.post('/send', async (req, res) => {
  const { input, sessionId } = req.body;
  const newMessage = { sender: "user", content: input, timestamp: new Date() };

  try {
    let conversation = await ConversationModel.findOne({ sessionId });

    if (!conversation) {
      conversation = new ConversationModel({ sessionId: sessionId || nanoid(), messages: [] });
    }

    // Ajoutez temporairement le nouveau message pour générer la réponse
    const tempMessages = [...conversation.messages, newMessage];

    // Obtenez la réponse du modèle
    const aiResponse = await generateResponse(tempMessages);

    // Ajoutez le message de l'utilisateur et la réponse du modèle à la conversation
    const botMessage = { sender: "model", content: aiResponse, timestamp: new Date() };
    conversation.messages.push(newMessage);
    conversation.messages.push(botMessage);

    // Sauvegardez la conversation mise à jour dans la base de données
    await conversation.save();

    // Répondez à l'utilisateur avec la réponse du modèle
    res.json({ response: aiResponse });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to get a response from the AI model." });
  }
});

// Définir une route pour la création d'un nouvel utilisateur
app.post("/register/", async (req, res) => {
  const { username, password, email } = req.body;
  const hashedPassword = await bcrypt.hash(password, salt);
  const userDoc = await UserModel.create({
    username,
    password: hashedPassword,
    email
  });
  res.json(userDoc);
});

// Définir une route pour l'authentification d'un utilisateur
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await UserModel.findOne({ username });
  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    // logged in
    jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
      if (err) throw err;
      res.cookie("token", token,{}).json({
        id: userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json("wrong credentials");
  }
});

// Définir une route pour récupérer les informations de profil de l'utilisateur connecté
app.get("/profile", (req, res) => {
  const { token } = req.cookies;

  // Check if token exists
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Missing token" });
  }

  jwt.verify(token, secret, {}, (err, info) => {
    if (err) {
      // Handle JWT verification errors (e.g., invalid token, expired token)
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
    res.json(info);
  });
});

// Définir une route pour la déconnexion de l'utilisateur
app.post("/logout/", (req, res) => {
  res.cookie("token", "").json("ok");
});

// Définir une route pour la création d'un nouveau post
app.post('/post', upload.single('file'), async (req,res) => {
  const {originalname,path} = req.file;
  const parts = originalname.split('.');
  const ext = parts[parts.length - 1];
  const newPath = path+'.'+ext;
  fs.renameSync(path, newPath);

  const {token} = req.cookies;
  console.log(token)
  jwt.verify(token, secret, {}, async (err,info) => {
    if (err) throw err;
    const {title,summary,content, category, featured} = req.body;
    const postDoc = await PostModel.create({
      title,
      summary,
      content,
      cover:newPath,
      author: info.id,
      category,
      featured: featured || false // Ajout du champ featured
    });
    res.json(postDoc);
  });

});

// Définir une route pour la mise à jour d'un post existant
app.put('/post/:id', async (req, res) => {
     try {
         const { id } = req.params;
         const { title, summary, content } = req.body;
       const updatedPost = await PostModel.findByIdAndUpdate(id, { title, summary, content }, { new: true });
         res.json(updatedPost);

     } catch (error) {
         console.error('Error updating post:', error);
         res.status(500).json({ message: 'Error updating post' });
     }
 });



// Définir une route pour récupérer les 20 derniers posts
app.get('/post', async (req,res) => {
  res.json(
      await PostModel.find()
          .populate('author', ['username'])
          .sort({createdAt: -1})
          .limit(20)
  );
});

// Définir une route pour servir les fichiers statiques du répertoire "uploads/"
app.use("/uploads", express.static("uploads"));

// Définir une route pour servir les fichiers statiques du répertoire "images/"
app.use("/src/components/assets/images", express.static("images"));

// Définir une route pour récupérer un post par son ID
app.get("/post/:id", async (req, res) => {
  const { id } = req.params;
  const postDoc = await PostModel.findById(id);
  res.json(postDoc);
});

// Définir une route pour récupérer un post par son ID avec les informations de l'auteur
app.get("/post/:id", async (req, res) => {
  const { id } = req.params;
  const postDoc = await PostModel.findById(id).populate("author", ["username"]);
  res.json(postDoc);
});

// Définir une route pour supprimer un post par son ID
app.delete('/post/:id', async (req, res) => {
  const { id } = req.params;
  const token = req.cookies.token;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) throw err;
    const postDoc = await PostModel.findById(id);
    if (!postDoc) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (postDoc.author.toString()!== info.id) {
      return res.status(403).json({ message: 'You are not the author of this post' });
    }
          // Tentative de suppression de l'image de couverture
      if (postDoc.cover) {
        // Construire le chemin complet vers l'image
        const imagePath = path.join(__dirname, 'uploads', path.basename(postDoc.cover));
        
        fs.unlink(imagePath, (unlinkError) => {
          if (unlinkError) {
            console.error('Failed to delete image:', unlinkError);
            // On ne renvoie pas d'erreur ici, on continue la suppression du post
          } else {
            console.log('Image successfully deleted');
          }
        });
      }
    await PostModel.findByIdAndDelete(id);
    res.json({ message: 'Post deleted successfully' });
  });
});

// Définir une route pour la création d'une nouvelle catégorie
app.post('/category', async (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err) => {
    if (err) throw err;

    const { name, description } = req.body;

    const categoryDoc = await CategoryModel.create({
      name,
      description,
    });

    res.json(categoryDoc);
  });
});

// Définir une route pour trouver une catégorie
app.get('/category', async (req, res) => {
  try {
    const categories = await CategoryModel.find();
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Définir une route pour trouver une catégorie par son ID
app.get('/category/:categoryId', async (req, res) => {
  try {
      const { categoryId } = req.params;
    const category = await CategoryModel.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Définir une route pour supprimer une catégorie
app.delete('/categories/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await CategoryModel.findByIdAndDelete(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});



// Démarrer le serveur sur le port 4200
app.listen(4200, () => {
  console.log("Serveur en écoute sur le port 4200");
});

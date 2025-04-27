export interface IUser {
    username: string;
    email: string;
    password: string;
    role: 'user' | 'author' | 'admin';
    isAuthorized: boolean;
    createdAt: Date;
    resetPasswordToken?: string | null;
    resetPasswordExpires?: Date | null;
    // Ajoute ici d'autres champs si présents dans le schéma
  }
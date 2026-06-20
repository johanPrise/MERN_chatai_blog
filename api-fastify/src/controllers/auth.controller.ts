import { FastifyRequest, FastifyReply } from 'fastify';
import {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
  ChangePasswordInput
} from '../types/auth.types.js';
import * as AuthService from '../services/auth.service.js';
import { UserRole } from '../types/user.types.js';

export const register = async (
  request: FastifyRequest<{ Body: RegisterInput }>,
  reply: FastifyReply
) => {
  const newUser = await AuthService.registerUser(request.body);
  return reply.status(201).send({
    message: 'Inscription réussie. Veuillez vérifier votre email pour activer votre compte.',
    user: newUser,
  });
};

export const login = async (
  request: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply
) => {
  const user = await AuthService.loginUser(request.body);

  const token = request.server.jwt.sign(
    {
      _id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    },
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );

  reply.setCookie('token', token, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 jours en secondes
  });

  // Le token n'est volontairement PAS renvoyé dans le corps : il vit uniquement
  // dans le cookie httpOnly, hors de portée d'un éventuel XSS côté client.
  return reply.status(200).send({ user });
};

export const verifyEmail = async (
  request: FastifyRequest<{ Params: VerifyEmailInput }>,
  reply: FastifyReply
) => {
  const { token } = request.params as { token: string };
  await AuthService.verifyUserEmail(token);
  return reply.status(200).send({
    message: 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.',
  });
};

export const forgotPassword = async (
  request: FastifyRequest<{ Body: ForgotPasswordInput }>,
  reply: FastifyReply
) => {
  await AuthService.requestPasswordReset(request.body);
  return reply.status(200).send({
    message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
  });
};

export const resetPassword = async (
  request: FastifyRequest<{ Body: ResetPasswordInput }>,
  reply: FastifyReply
) => {
  await AuthService.resetUserPassword(request.body);
  return reply.status(200).send({
    message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
  });
};

export const changePassword = async (
  request: FastifyRequest<{ Body: ChangePasswordInput }>,
  reply: FastifyReply
) => {
  await AuthService.changeUserPassword(request.user._id, request.body);
  return reply.status(200).send({ message: 'Mot de passe changé avec succès' });
};

export const getMe = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const user = await AuthService.getCurrentUser(request.user._id);
  return reply.status(200).send({ user });
};

export const checkAuthorEditorAdmin = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const user = await AuthService.getCurrentUser(request.user._id);
  const isAuthorOrAdmin =
    user.role === UserRole.AUTHOR ||
    user.role === UserRole.EDITOR ||
    user.role === UserRole.ADMIN;
  return reply.status(200).send({ isAuthorOrAdmin });
};

export const checkAdmin = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const user = await AuthService.getCurrentUser(request.user._id);
  return reply.status(200).send({ isAdmin: user.role === UserRole.ADMIN });
};

export const logout = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const token = request.cookies?.token
    ?? request.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (token) {
    const decoded = request.server.jwt.decode<{ exp?: number }>(token);
    const expiresAt = decoded?.exp ?? Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
    await AuthService.logoutUser(token, expiresAt);
  }

  reply.clearCookie('token', { path: '/' });
  return reply.status(200).send({ message: 'Déconnexion réussie' });
};

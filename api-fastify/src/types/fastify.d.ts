import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      _id: string;
      email: string;
      username: string;
      role: string;
    };
    user: {
      _id: string;
      email: string;
      username: string;
      role: string;
    };
  }
}

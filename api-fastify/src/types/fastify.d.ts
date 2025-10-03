import 'fastify';

// Define the user payload interface
interface UserPayload {
  _id: string;
  email: string;
  username: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyBaseLogger {
    error(msg: string, ...args: unknown[]): void;
    error(obj: object, msg?: string, ...args: unknown[]): void;
    warn(msg: string, ...args: unknown[]): void;
    warn(obj: object, msg?: string, ...args: unknown[]): void;
    info(msg: string, ...args: unknown[]): void;
    info(obj: object, msg?: string, ...args: unknown[]): void;
    debug(msg: string, ...args: unknown[]): void;
    debug(obj: object, msg?: string, ...args: unknown[]): void;
    trace(msg: string, ...args: unknown[]): void;
    trace(obj: object, msg?: string, ...args: unknown[]): void;
    fatal(msg: string, ...args: unknown[]): void;
    fatal(obj: object, msg?: string, ...args: unknown[]): void;
  }

  interface FastifyRequest {
    user?: UserPayload;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: UserPayload;
    user: UserPayload;
  }
}

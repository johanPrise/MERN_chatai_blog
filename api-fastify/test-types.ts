// Test file to verify type definitions work correctly
/// <reference path="./src/types/fastify.d.ts" />
import { FastifyRequest, FastifyReply } from 'fastify';

// Test that request.user has the correct type
const testFunction = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
        return reply.status(401).send({ message: 'Unauthorized' });
    }

    // These should all compile without errors
    const userId: string = request.user._id;
    const userEmail: string = request.user.email;
    const userName: string = request.user.username;
    const userRole: string = request.user.role;

    console.log(userId, userEmail, userName, userRole);
};

// Test optional chaining
const testOptional = async (request: FastifyRequest, reply: FastifyReply) => {
    const userRole: string | undefined = request.user?.role;
    console.log(userRole);
};

export { testFunction, testOptional };

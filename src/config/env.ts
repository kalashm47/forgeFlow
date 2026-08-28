import fp from 'fastify-plugin';
import fastifyEnv from '@fastify/env';

const schema = {
  type: 'object' as const,
  required: ['DATABASE_URL'],
  properties: {
    PORT: { type: 'number', default: 3000 },
    NODE_ENV: { type: 'string', default: 'development' },
    DATABASE_URL: { type: 'string' },
    JWT_SECRET: { type: 'string' },
  },
};

export default fp(async (fastify) => {
  await fastify.register(fastifyEnv, { schema, dotenv: true });
});

// Augment Fastify types — src/types/index.d.ts
// declare module 'fastify' {
//   interface FastifyInstance {
//     config: { PORT: number; NODE_ENV: string; DATABASE_URL: string; JWT_SECRET: string };
//   }
// }
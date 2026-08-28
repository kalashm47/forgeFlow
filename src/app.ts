import Fastify from 'fastify';
import autoload from '@fastify/autoload';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  }).withTypeProvider<TypeBoxTypeProvider>();

  // Register plugins (cors, helmet, swagger, env, etc.)
  await app.register(autoload, {
    dir: join(__dirname, 'plugins'),
    forceESM: true,
  });

  // Register routes
  await app.register(autoload, {
    dir: join(__dirname, 'routes'),
    options: { prefix: '/api' },
    forceESM: true,
  });

  return app;
}
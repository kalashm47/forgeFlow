import { PrismaClient } from '@prisma/client';

// cast para adicionar o objeto prisma no objeto global
const globalForPrisma = globalThis as unknown as {prisma: PrismaClient}

export const prisma  = globalForPrisma.prisma || new PrismaClient({
    log: ['query', 'error', 'warn']
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
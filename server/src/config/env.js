import { z } from 'zod';

// server/.env is loaded by Node itself (`--env-file-if-exists=.env` in package.json scripts).
// Real environment variables always win, so Render — which sets them directly and ships no
// .env — starts the same way.

// Fail fast on startup with a readable message instead of a confusing runtime error later.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string({ error: 'MONGODB_URI is required (set it in server/.env)' }).min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z
    .string({ error: 'JWT_SECRET is required (set it in server/.env)' })
    .min(32, 'JWT_SECRET must be at least 32 characters'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  SIGNUP_INVITE_CODE: z.string().default(''),
  MAX_USERS: z.coerce.number().int().positive().default(5),
  ADMIN_EMAIL: z.string().default(''),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:');
  for (const [key, messages] of Object.entries(z.flattenError(parsed.error).fieldErrors)) {
    console.error(`  ${key}: ${messages.join(', ')}`);
  }
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
  adminEmail: parsed.data.ADMIN_EMAIL.trim().toLowerCase(),
  clientOrigins: parsed.data.CLIENT_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean),
};

if (env.COOKIE_SAMESITE === 'none' && !env.isProd) {
  console.warn('COOKIE_SAMESITE=none needs HTTPS; cookies will be rejected on plain http://localhost.');
}

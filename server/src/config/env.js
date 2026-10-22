import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Node 20.6+ can do this with `node --env-file=.env`, but this project runs on Node 18, so the
// file is read here instead. Real environment variables always win, so Render/Vercel — which set
// them directly and ship no .env — behave exactly as before.
// FUTURE: drop this once the runtime is Node >= 20.6 and put --env-file back in package.json.
function loadEnvFile() {
  const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env');
  let raw;
  try {
    raw = readFileSync(file, 'utf8');
  } catch {
    return; // no .env — everything comes from the real environment
  }
  for (const line of raw.split('\n')) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue; // blank line or # comment
    const [, key, rest] = match;
    if (key in process.env) continue; // a real env var is never overwritten
    let value = rest.trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.length > 1 && value.endsWith(quote)) {
      value = value.slice(1, -1);
      if (quote === '"') value = value.replace(/\\n/g, '\n');
    } else {
      value = value.replace(/\s+#.*$/, '').trim(); // trailing comment, not a "#" inside a password
    }
    process.env[key] = value;
  }
}

loadEnvFile();

// Fail fast on startup with a readable message instead of a confusing runtime error later.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
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
  for (const [key, messages] of Object.entries(parsed.error.flatten().fieldErrors)) {
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

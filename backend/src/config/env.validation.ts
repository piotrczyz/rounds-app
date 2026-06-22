import { z } from 'zod';

/**
 * Environment contract for the backend. Validated at startup so the app fails
 * fast with a clear message when a required variable is missing or malformed,
 * rather than erroring deep inside a request.
 *
 * Supabase JWT settings are declared here in Phase 1 but only consumed once the
 * auth boundary lands in Phase 3; they are optional until then so the scaffold
 * boots without a Supabase project configured.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  SUPABASE_JWT_ISSUER: z.string().url().optional(),
  SUPABASE_JWKS_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

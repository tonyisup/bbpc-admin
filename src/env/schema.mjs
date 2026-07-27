// @ts-check
import { z } from "zod";

const sqlBackendSelected =
  process.env.NEXT_PUBLIC_BBPC_BACKEND !== "convex";
const sqlRequiredString = sqlBackendSelected
  ? z.string().min(1)
  : z.string().optional().default("");
const sqlRequiredEmail = sqlBackendSelected
  ? z.string().email()
  : z.string().optional().default("");
const sqlRequiredUrl = sqlBackendSelected
  ? z.string().url()
  : z.string().optional().default("");

/**
 * Specify your server-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 */
export const serverSchema = z.object({
  TMDB_API_KEY: sqlRequiredString,
  DATABASE_URL: sqlRequiredString,
  NODE_ENV: z.enum(["development", "test", "production"]),
  NEXTAUTH_SECRET:
    sqlBackendSelected
      ? process.env.NODE_ENV === "production"
        ? z.string().min(1)
        : z.string().min(1).optional()
      : z.string().optional().default(""),
  NEXTAUTH_URL: sqlBackendSelected
    ? z.preprocess(
        // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
        // Since NextAuth.js automatically uses the VERCEL_URL if present.
        (str) => process.env.VERCEL_URL ?? str,
        // VERCEL_URL doesn't include `https` so it cant be validated as a URL
        process.env.VERCEL ? z.string() : z.string().url()
      )
    : z.string().optional(),
  EMAIL_SERVER_USER: sqlRequiredString,
  EMAIL_SERVER_PASSWORD: sqlRequiredString,
  EMAIL_SERVER_HOST: sqlRequiredString,
  EMAIL_SERVER_PORT: sqlRequiredString,
  EMAIL_FROM: sqlRequiredEmail,
  GOOGLE_CLIENT_ID: sqlRequiredString,
  GOOGLE_CLIENT_SECRET: sqlRequiredString,
  CLERK_SECRET_KEY: z.string().optional(),
  UPLOADTHING_TOKEN: z.string().optional(),
  AUDIO_CHAPTERIZER_WEBHOOK_URL: sqlRequiredUrl,
  PUSHER_APP_ID: sqlRequiredString,
  PUSHER_SECRET: sqlRequiredString,
  AZURE_STORAGE_ACCOUNT_CONNECTION_STRING: sqlRequiredString,
});

/**
 * Specify your client-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 * To expose them to the client, prefix them with `NEXT_PUBLIC_`.
 */
export const clientSchema = z.object({
  NEXT_PUBLIC_BBPC_BACKEND: z.enum(["sql", "convex"]).default("sql"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_CONVEX_URL: z.string().url().optional(),
  NEXT_PUBLIC_PUSHER_KEY: sqlRequiredString,
  NEXT_PUBLIC_PUSHER_CLUSTER: sqlRequiredString,
});

/**
 * You can't destruct `process.env` as a regular object, so you have to do
 * it manually here. This is because Next.js evaluates this at build time,
 * and only used environment variables are included in the build.
 * @type {{ [k in keyof z.infer<typeof clientSchema>]: z.infer<typeof clientSchema>[k] | undefined }}
 */
export const clientEnv = {
  NEXT_PUBLIC_BBPC_BACKEND: /** @type {"sql" | "convex" | undefined} */ (
    process.env.NEXT_PUBLIC_BBPC_BACKEND
  ),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
  NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
};

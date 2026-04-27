function getEnv(name: string, fallback = ""): string {
  const value = process.env[name];
  return value ?? fallback;
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: getEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_KEY: getEnv("SUPABASE_SERVICE_KEY"),
  RESEND_API_KEY: getEnv("RESEND_API_KEY"),
  OPENAI_API_KEY: getEnv("OPENAI_API_KEY"),
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};

export function assertRequiredEnv(names: string[]) {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

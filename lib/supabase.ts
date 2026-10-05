import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }

  return value;
}

const supabaseUrl = requireEnv(
  "EXPO_PUBLIC_SUPABASE_URL",
  process.env.EXPO_PUBLIC_SUPABASE_URL,
);
const supabaseKey = requireEnv(
  "EXPO_PUBLIC_SUPABASE_KEY",
  process.env.EXPO_PUBLIC_SUPABASE_KEY,
);

export const supabase = createClient(supabaseUrl, supabaseKey);

export function createClerkSupabaseClient(
  getToken: () => Promise<string | null>,
) {
  return createClient(supabaseUrl, supabaseKey, {
    async accessToken() {
      return getToken();
    },
  });
}

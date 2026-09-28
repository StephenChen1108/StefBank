export function resolveSupabasePublicKey(publishableKey?: string, anonKey?: string) {
  return publishableKey?.trim() || anonKey?.trim() || null;
}

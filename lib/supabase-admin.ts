import { createClient } from '@supabase/supabase-js'

function env(name: 'SUPABASE_SERVICE_ROLE_KEY'): string
function env(name: 'SUPABASE_URL', fallbackName?: 'NEXT_PUBLIC_SUPABASE_URL'): string
function env(
  name: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY',
  fallbackName?: 'NEXT_PUBLIC_SUPABASE_URL'
): string {
  const value = process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined)
  if (!value) {
    if (fallbackName) {
      throw new Error(`Missing ${name} (or ${fallbackName})`)
    }
    throw new Error(`Missing ${name}`)
  }
  return value
}

export function getSupabaseAdmin() {
  return createClient(env('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

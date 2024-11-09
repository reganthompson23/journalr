import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const createServerSupabaseClient = () => {
  const cookieStore = cookies()
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: { path: string; maxAge: number }) {
        cookieStore.set(name, value, options)
      },
      remove(name: string, options: { path: string }) {
        cookieStore.set(name, '', { ...options, maxAge: 0 })
      },
    },
  })
} 
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

// Browser client with cookie handling
export const supabase = createBrowserClient(supabaseUrl, supabaseKey, {
  cookies: {
    get(name: string) {
      return document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${name}=`))
        ?.split('=')[1]
    },
    set(name: string, value: string, options: { path: string; maxAge: number; domain?: string }) {
      document.cookie = `${name}=${value}; path=${options.path}; max-age=${options.maxAge}${
        options.domain ? `; domain=${options.domain}` : ''
      }`
    },
    remove(name: string, options: { path: string }) {
      document.cookie = `${name}=; path=${options.path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    },
  },
}) 
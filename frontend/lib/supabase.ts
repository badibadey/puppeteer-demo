import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Post = {
  id: string
  external_id: string
  author_name: string
  author_url: string
  content: string
  post_url: string
  screenshot_url: string | null
  matched_keywords: string[]
  category: string
  status: 'new' | 'processing' | 'done' | 'error' | 'processed' | 'rejected'
  scraped_at: string
  human_action_taken: boolean
}

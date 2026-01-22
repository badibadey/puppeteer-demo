'use client'

import { useEffect, useState } from 'react'
import { supabase, type Post } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Search,
  Camera
} from 'lucide-react'
import PostsTable from './PostsTable'
import BotControl from './BotControl'
import StatsCards from './StatsCards'

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    done: 0,
    processing: 0,
    error: 0,
    processed: 0
  })

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('scraped_at', { ascending: false })
        .limit(100)

      if (error) throw error

      setPosts(data || [])
      
      const stats = {
        total: data?.length || 0,
        done: data?.filter(p => p.status === 'done').length || 0,
        processing: data?.filter(p => p.status === 'processing').length || 0,
        error: data?.filter(p => p.status === 'error').length || 0,
        processed: data?.filter(p => p.status === 'processed').length || 0
      }
      setStats(stats)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()

    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          console.log('Realtime update:', payload)
          fetchPosts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Facebook Scraper Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Zarządzaj postami z grup Facebook - automatyczne skanowanie i screenshoty
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Activity className="w-4 h-4 mr-2 animate-pulse" />
            Live
          </Badge>
        </div>

        <StatsCards stats={stats} />

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto">
            <TabsTrigger value="all">
              Wszystkie ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="done">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Gotowe ({stats.done})
            </TabsTrigger>
            <TabsTrigger value="processing">
              <Clock className="w-4 h-4 mr-2" />
              W trakcie ({stats.processing})
            </TabsTrigger>
            <TabsTrigger value="error">
              <AlertCircle className="w-4 h-4 mr-2" />
              Błędy ({stats.error})
            </TabsTrigger>
            <TabsTrigger value="processed">
              Opracowane ({stats.processed})
            </TabsTrigger>
            <TabsTrigger value="bots">
              <Camera className="w-4 h-4 mr-2" />
              Boty
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <PostsTable 
              posts={posts} 
              loading={loading} 
              onRefresh={fetchPosts}
            />
          </TabsContent>

          <TabsContent value="done" className="space-y-4">
            <PostsTable 
              posts={posts.filter(p => p.status === 'done')} 
              loading={loading}
              onRefresh={fetchPosts}
            />
          </TabsContent>

          <TabsContent value="processing" className="space-y-4">
            <PostsTable 
              posts={posts.filter(p => p.status === 'processing')} 
              loading={loading}
              onRefresh={fetchPosts}
            />
          </TabsContent>

          <TabsContent value="error" className="space-y-4">
            <PostsTable 
              posts={posts.filter(p => p.status === 'error')} 
              loading={loading}
              onRefresh={fetchPosts}
            />
          </TabsContent>

          <TabsContent value="processed" className="space-y-4">
            <PostsTable 
              posts={posts.filter(p => p.status === 'processed')} 
              loading={loading}
              onRefresh={fetchPosts}
            />
          </TabsContent>

          <TabsContent value="bots" className="space-y-4">
            <BotControl />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

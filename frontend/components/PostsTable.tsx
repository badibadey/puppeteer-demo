'use client'

import { useState } from 'react'
import { supabase, type Post } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  ExternalLink,
  RefreshCw,
  User,
  Calendar,
  Tag
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'

interface PostsTableProps {
  posts: Post[]
  loading: boolean
  onRefresh: () => void
}

export default function PostsTable({ posts, loading, onRefresh }: PostsTableProps) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const updatePostStatus = async (postId: string, status: Post['status']) => {
    setUpdating(postId)
    try {
      const { error } = await supabase
        .from('posts')
        .update({ 
          status,
          human_action_taken: true 
        })
        .eq('id', postId)

      if (error) throw error
      onRefresh()
    } catch (error) {
      console.error('Error updating post:', error)
    } finally {
      setUpdating(null)
    }
  }

  const getStatusBadge = (status: Post['status']) => {
    const variants: Record<Post['status'], { variant: any; label: string; className?: string }> = {
      new: { variant: 'secondary', label: 'Nowy' },
      processing: { variant: 'default', label: 'Przetwarzanie', className: 'bg-blue-500' },
      done: { variant: 'default', label: 'Gotowy', className: 'bg-green-500' },
      error: { variant: 'destructive', label: 'Błąd' },
      processed: { variant: 'default', label: 'Opracowany', className: 'bg-purple-500' },
      rejected: { variant: 'outline', label: 'Odrzucony' },
    }

    const config = variants[status]
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Eye className="w-12 h-12 mb-4" />
          <p className="text-lg font-medium">Brak postów do wyświetlenia</p>
          <p className="text-sm">Posty pojawią się tutaj automatycznie po zeskanowaniu</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Posty ({posts.length})</CardTitle>
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Odśwież
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Treść</TableHead>
                  <TableHead>Kategoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>{getStatusBadge(post.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{post.author_name}</p>
                          {post.author_url && (
                            <a 
                              href={post.author_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              Profil <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="truncate text-sm">{post.content}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {post.matched_keywords?.slice(0, 3).map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        <Tag className="w-3 h-3 mr-1" />
                        {post.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDistanceToNow(new Date(post.scraped_at), { 
                          addSuffix: true,
                          locale: pl 
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          onClick={() => setSelectedPost(post)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {post.status === 'done' && (
                          <>
                            <Button
                              onClick={() => updatePostStatus(post.id, 'processed')}
                              variant="default"
                              size="sm"
                              disabled={updating === post.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => updatePostStatus(post.id, 'rejected')}
                              variant="destructive"
                              size="sm"
                              disabled={updating === post.id}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Szczegóły posta</DialogTitle>
            <DialogDescription>
              Autor: {selectedPost?.author_name} • {selectedPost?.category}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPost && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Treść:</h4>
                <p className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap">
                  {selectedPost.content}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Słowa kluczowe:</h4>
                <div className="flex gap-2 flex-wrap">
                  {selectedPost.matched_keywords?.map((keyword, idx) => (
                    <Badge key={idx} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedPost.screenshot_url && (
                <div>
                  <h4 className="font-semibold mb-2">Screenshot:</h4>
                  <img 
                    src={selectedPost.screenshot_url} 
                    alt="Post screenshot"
                    className="w-full rounded-lg border"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => window.open(selectedPost.post_url, '_blank')}
                  variant="outline"
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Otwórz na Facebook
                </Button>
                {selectedPost.status === 'done' && (
                  <>
                    <Button
                      onClick={() => {
                        updatePostStatus(selectedPost.id, 'processed')
                        setSelectedPost(null)
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Opracuj
                    </Button>
                    <Button
                      onClick={() => {
                        updatePostStatus(selectedPost.id, 'rejected')
                        setSelectedPost(null)
                      }}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Odrzuć
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

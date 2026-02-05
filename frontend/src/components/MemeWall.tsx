import { useState } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { PostCard } from '@/components/PostCard'
import { Smiley, Image as ImageIcon } from '@phosphor-icons/react'
import type { User, Post } from '@/App'
import { toast } from 'sonner'

interface MemeWallProps {
  user: User
}

export function MemeWall({ user }: MemeWallProps) {
  const [posts, setPosts] = useKV<Post[]>('posts', [])
  const [memeContent, setMemeContent] = useState('')

  const handlePostMeme = async () => {
    if (!memeContent.trim()) {
      toast.error('Please write something for your meme')
      return
    }

    const newMeme: Post = {
      id: `meme_${Date.now()}`,
      userId: user.id,
      content: memeContent,
      type: 'meme',
      party: user.party,
      timestamp: new Date().toISOString(),
      likes: [],
      comments: [],
      tips: [],
      shares: 0
    }

    setPosts(currentPosts => [newMeme, ...(currentPosts || [])])
    setMemeContent('')
    toast.success('Meme posted to the wall!')
  }

  const memes = (posts || []).filter(post => post.type === 'meme')
    .sort((a, b) => {
      const aScore = a.likes.length + a.comments.length + a.tips.length
      const bScore = b.likes.length + b.comments.length + b.tips.length
      return bScore - aScore
    })

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smiley size={24} />
            Meme Wall
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Share political memes and humor! Most engaging memes rise to the top.
          </p>
        </CardHeader>
      </Card>

      {/* Post Meme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Share a Political Meme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Share your political meme or funny observation..."
            value={memeContent}
            onChange={(e) => setMemeContent(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-2">
                <ImageIcon size={16} />
                Upload Image
              </Button>
              <Badge variant="secondary" className="text-xs">
                Type: Meme
              </Badge>
            </div>
            <Button onClick={handlePostMeme} disabled={!memeContent.trim()}>
              Post Meme
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Meme Feed */}
      <div className="space-y-4">
        {memes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Smiley size={48} className="mx-auto mb-4 text-muted-foreground" />
              <div className="text-muted-foreground mb-2">
                No memes yet on the wall
              </div>
              <div className="text-sm text-muted-foreground">
                Be the first to share a political meme!
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-4">
              Showing {memes.length} memes, sorted by engagement
            </div>
            {memes.map((meme) => (
              <PostCard key={meme.id} post={meme} currentUser={user} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
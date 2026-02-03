import { useState, useEffect, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PostCard } from '@/components/PostCard'
import { Hash, TrendUp, MagnifyingGlass } from '@phosphor-icons/react'
import type { User, Post } from '@/App'

interface HashtagFeedProps {
  user: User
}

interface HashtagData {
  tag: string
  count: number
  posts: Post[]
}

export function HashtagFeed({ user }: HashtagFeedProps) {
  const [posts] = useKV<Post[]>('posts', [])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null)

  const extractHashtags = (content: string): string[] => {
    const hashtags = content.match(/#[a-zA-Z0-9_]+/g)
    return hashtags ? hashtags.map(tag => tag.toLowerCase()) : []
  }

  const hashtagData = useMemo(() => {
    const hashtagMap = new Map<string, HashtagData>()
    
    posts?.forEach(post => {
      const hashtags = extractHashtags(post.content)
      hashtags.forEach(hashtag => {
        if (!hashtagMap.has(hashtag)) {
          hashtagMap.set(hashtag, {
            tag: hashtag,
            count: 0,
            posts: []
          })
        }
        const data = hashtagMap.get(hashtag)!
        data.count++
        data.posts.push(post)
      })
    })

    return Array.from(hashtagMap.values()).sort((a, b) => b.count - a.count)
  }, [posts])

  const filteredHashtags = hashtagData.filter(h => 
    h.tag.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedPosts = selectedHashtag 
    ? hashtagData.find(h => h.tag === selectedHashtag)?.posts || []
    : []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Hashtag Explorer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search hashtags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {selectedHashtag ? (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    <Hash className="h-4 w-4 mr-1" />
                    {selectedHashtag.slice(1)}
                  </Badge>
                  <span className="text-muted-foreground">
                    {selectedPosts.length} posts
                  </span>
                </div>
                <button
                  onClick={() => setSelectedHashtag(null)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Back to all hashtags
                </button>
              </div>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            {selectedPosts.map(post => (
              <PostCard key={post.id} post={post} currentUser={user} />
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendUp className="h-5 w-5" />
              Trending Hashtags
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredHashtags.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No hashtags found' : 'No hashtags yet. Start using hashtags in your posts!'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredHashtags.map((hashtag, index) => (
                  <div
                    key={hashtag.tag}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedHashtag(hashtag.tag)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-semibold text-muted-foreground">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-primary" />
                          <span className="font-medium">{hashtag.tag.slice(1)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {hashtag.count} {hashtag.count === 1 ? 'post' : 'posts'}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      View Posts →
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
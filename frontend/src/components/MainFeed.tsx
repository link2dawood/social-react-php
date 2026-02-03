import { useState, useEffect, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { PostCard } from '@/components/PostCard'
import { Camera, Image as ImageIcon, VideoCamera, X } from '@phosphor-icons/react'
import type { User, Post, PoliticalParty } from '@/App'
import { toast } from 'sonner'

interface MainFeedProps {
  user: User
  onHashtagClick?: (hashtag: string) => void
}

export function MainFeed({ user, onHashtagClick }: MainFeedProps) {
  const [posts, setPosts] = useKV<Post[]>('posts', [])
  const [newPostContent, setNewPostContent] = useState('')
  const [postImage, setPostImage] = useState('')
  const [postVideo, setPostVideo] = useState('')
  const [activeTab, setActiveTab] = useState<'republican' | 'democrat' | 'independent'>('republican')
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setPostImage(result)
      setPostVideo('')
      toast.success('Image uploaded!')
    }
    reader.readAsDataURL(file)
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setPostVideo(result)
      setPostImage('')
      toast.success('Video uploaded!')
    }
    reader.readAsDataURL(file)
  }

  const handlePost = async () => {
    if (!newPostContent.trim()) {
      toast.error('Please write something to post')
      return
    }

    const newPost: Post = {
      id: `post_${Date.now()}`,
      userId: user.id,
      content: newPostContent,
      image: postImage || undefined,
      video: postVideo || undefined,
      type: 'post',
      party: user.party,
      timestamp: new Date().toISOString(),
      likes: [],
      comments: [],
      tips: [],
      shares: 0
    }

    setPosts(currentPosts => [newPost, ...(currentPosts || [])])
    setNewPostContent('')
    setPostImage('')
    setPostVideo('')
    toast.success('Post shared!')
  }

  const filteredPosts = (posts || []).filter(post => post.party === activeTab)

  const partyTabs = [
    { value: 'republican', label: 'Republican', color: 'text-republican' },
    { value: 'democrat', label: 'Democrat', color: 'text-democrat' },
    { value: 'independent', label: 'Independent', color: 'text-independent' }
  ]

  return (
    <div className="space-y-6">
      {/* Compose Post */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {user.displayName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm">{user.displayName}</div>
              <div className="text-xs text-muted-foreground">@{user.username}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="What's happening in politics today?"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          
          {postImage && (
            <div className="relative">
              <img src={postImage} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
              <Button 
                size="sm" 
                variant="destructive" 
                className="absolute top-2 right-2 h-8 w-8 p-0" 
                onClick={() => setPostImage('')}
              >
                <X size={16} />
              </Button>
            </div>
          )}
          
          {postVideo && (
            <div className="relative">
              <video src={postVideo} controls className="w-full h-48 rounded-lg" />
              <Button 
                size="sm" 
                variant="destructive" 
                className="absolute top-2 right-2 h-8 w-8 p-0" 
                onClick={() => setPostVideo('')}
              >
                <X size={16} />
              </Button>
            </div>
          )}
          
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoUpload}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => imageInputRef.current?.click()}
                disabled={!!postVideo}
                className="gap-2"
              >
                <ImageIcon size={16} />
                Upload Image
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => videoInputRef.current?.click()}
                disabled={!!postImage}
                className="gap-2"
              >
                <VideoCamera size={16} />
                Upload Video
              </Button>
            </div>
            <Button onClick={handlePost} disabled={!newPostContent.trim()}>
              Post
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Party Feed Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          {partyTabs.map((tab) => (
            <TabsTrigger 
              key={tab.value} 
              value={tab.value}
              className={`${tab.color} data-[state=active]:bg-primary data-[state=active]:text-primary-foreground`}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {partyTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-4">
            {filteredPosts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-muted-foreground">
                    No posts yet in the {tab.label} feed
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Be the first to share your thoughts!
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} currentUser={user} onHashtagClick={onHashtagClick} />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
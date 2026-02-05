import { useState, useRef } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { PostCard } from '@/components/PostCard'
import { Smiley, Image as ImageIcon, X } from '@phosphor-icons/react'
import type { User, Post } from '@/App'
import { toast } from 'sonner'
import { api } from '@/lib/api'

interface MemeWallProps {
  user: User
}

export function MemeWall({ user }: MemeWallProps) {
  const [posts, setPosts] = useKV<Post[]>('posts', [])
  const [memeContent, setMemeContent] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size must be less than 5MB')
        return
      }
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePostMeme = async () => {
    if (!memeContent.trim() && !selectedImage) {
      toast.error('Please write something or upload an image for your meme')
      return
    }

    setIsUploading(true)
    try {
      let mediaUrl = ''
      let mediaType = ''

      // Upload image if selected
      if (selectedImage) {
        const uploadResult = await api.uploadFile(selectedImage)
        mediaUrl = uploadResult.file_url
        mediaType = uploadResult.media_type
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
        shares: 0,
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaType || undefined
      }

      setPosts(currentPosts => [newMeme, ...(currentPosts || [])])
      setMemeContent('')
      handleRemoveImage()
      toast.success('Meme posted to the wall!')
    } catch (error) {
      console.error('Failed to post meme:', error)
      toast.error('Failed to post meme. Please try again.')
    } finally {
      setIsUploading(false)
    }
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

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-64 rounded-lg object-contain w-full"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
              >
                <X size={16} />
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <ImageIcon size={16} />
                Upload Image
              </Button>
              <Badge variant="secondary" className="text-xs">
                Type: Meme
              </Badge>
            </div>
            <Button
              onClick={handlePostMeme}
              disabled={(!memeContent.trim() && !selectedImage) || isUploading}
            >
              {isUploading ? 'Posting...' : 'Post Meme'}
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